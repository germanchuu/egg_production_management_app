# API Contracts: Poultry Farm Production App

**Feature**: 001-poultry-farm-production-app
**Date**: 2026-01-26
**Protocol**: Firebase Firestore + Firebase Functions (REST endpoints for custom operations)

## Overview

This application uses **Firebase Firestore** as the primary backend with **Firebase Functions** for custom auth and sync logic. The API follows a hybrid approach:

- **Firestore SDK**: Direct client SDK access for CRUD operations (with security rules)
- **Firebase Functions**: HTTPS callable functions for invitation system and sync orchestration

---

## Authentication Endpoints (Firebase Functions)

### 1. Create Invitation

**Purpose**: Admin creates invitation link for new user registration.

**Endpoint**: `POST /createInvitation` (Firebase Callable Function)

**Request**:
```typescript
{
  email: string;      // Valid email address
  role: 'admin' | 'user';
}
```

**Response**:
```typescript
{
  invitationId: string;     // UUID
  token: string;            // Secure random token (32 chars)
  invitationLink: string;   // app://invite?token={token}
  expiresAt: string;        // ISO-8601 timestamp (7 days from now)
}
```

**Errors**:
- `PERMISSION_DENIED`: User is not admin
- `ALREADY_EXISTS`: Email already has pending invitation
- `INVALID_ARGUMENT`: Invalid email format

**Security**: Only users with `role: 'admin'` can call this function.

---

### 2. Validate Invitation

**Purpose**: Validate invitation token before user accepts.

**Endpoint**: `POST /validateInvitation` (Firebase Callable Function)

**Request**:
```typescript
{
  token: string;  // Invitation token from link
}
```

**Response**:
```typescript
{
  valid: boolean;
  email?: string;       // If valid
  role?: 'admin' | 'user';
  expiresAt?: string;   // ISO-8601 timestamp
  error?: string;       // If invalid: 'EXPIRED' | 'NOT_FOUND' | 'ALREADY_USED'
}
```

**Errors**:
- `NOT_FOUND`: Token doesn't exist
- `UNAUTHENTICATED`: Public access allowed (no auth required)

**Security**: Publicly accessible (no authentication required).

---

### 3. Accept Invitation

**Purpose**: User accepts invitation and creates account.

**Endpoint**: `POST /acceptInvitation` (Firebase Callable Function)

**Request**:
```typescript
{
  token: string;          // Invitation token
  password: string;       // User's chosen password (min 8 chars)
  displayName: string;    // User's full name
}
```

**Response**:
```typescript
{
  userId: string;              // Created user ID
  email: string;
  role: 'admin' | 'user';
  authToken: string;           // Firebase auth custom token
}
```

**Errors**:
- `INVALID_ARGUMENT`: Invalid token, expired, or already used
- `INVALID_ARGUMENT`: Password doesn't meet requirements
- `ALREADY_EXISTS`: Email already has active account

**Side Effects**:
- Creates Firebase Auth user
- Updates invitation status to 'accepted'
- Creates user document in Firestore `/users/{userId}`

**Security**: Publicly accessible, but validates invitation token.

---

### 4. Resend Invitation

**Purpose**: Admin resends expired invitation by creating new token.

**Endpoint**: `POST /resendInvitation` (Firebase Callable Function)

**Request**:
```typescript
{
  invitationId: string;  // Original invitation ID
}
```

**Response**:
```typescript
{
  newInvitationId: string;
  token: string;
  invitationLink: string;
  expiresAt: string;
}
```

**Errors**:
- `PERMISSION_DENIED`: User is not admin
- `NOT_FOUND`: Invitation doesn't exist
- `FAILED_PRECONDITION`: Invitation not expired or already accepted

**Security**: Only admins can call this function.

---

## Firestore Collections (Direct SDK Access)

All CRUD operations use Firestore SDK directly with security rules enforcing access control.

### Collection: `/users/{userId}`

**Read**:
- Admins: All users
- Users: Own document only

**Write**:
- Admins: Can update `displayName`, `isActive`
- Users: Can update own `displayName`, `lastLoginAt`

**Security Rule**:
```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId ||
                 request.auth.token.role == 'admin';
  allow update: if (request.auth.uid == userId &&
                    request.resource.data.diff(resource.data).affectedKeys()
                      .hasOnly(['displayName', 'lastLoginAt'])) ||
                   request.auth.token.role == 'admin';
}
```

---

### Collection: `/chickenHouses/{houseId}`

**Read**: All authenticated users

**Write**: Admins only

**Security Rule**:
```javascript
match /chickenHouses/{houseId} {
  allow read: if request.auth != null;
  allow create, update, delete: if request.auth.token.role == 'admin';
}
```

---

### Collection: `/chickenLots/{lotId}`

**Read**: All authenticated users

**Write**: Admins only (users cannot create/delete lots)

**Security Rule**:
```javascript
match /chickenLots/{lotId} {
  allow read: if request.auth != null;
  allow create, delete: if request.auth.token.role == 'admin';
  allow update: if request.auth != null &&
                   request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['liveHenCount', 'updatedAt']); // Auto-updated by mortality
}
```

---

### Collection: `/productionRecords/{recordId}`

**Read**: All authenticated users

**Create**: All authenticated users

**Update/Delete**: Record creator or admin

**Security Rule**:
```javascript
match /productionRecords/{recordId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null &&
                   request.resource.data.recordedBy == request.auth.uid &&
                   request.resource.data.date <= request.time; // No future dates
  allow update, delete: if request.auth.uid == resource.data.recordedBy ||
                           request.auth.token.role == 'admin';
}
```

---

### Collection: `/mortalityRecords/{recordId}`

**Read**: All authenticated users

**Create**: All authenticated users (triggers lot update via Cloud Function)

**Update/Delete**: Record creator or admin

**Security Rule**:
```javascript
match /mortalityRecords/{recordId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null &&
                   request.resource.data.recordedBy == request.auth.uid &&
                   request.resource.data.date <= request.time;
  allow update, delete: if request.auth.uid == resource.data.recordedBy ||
                           request.auth.token.role == 'admin';
}
```

**Cloud Function Trigger**:
```typescript
// Firestore trigger: onMortalityRecordCreated
exports.onMortalityRecordCreated = functions.firestore
  .document('mortalityRecords/{recordId}')
  .onCreate(async (snap, context) => {
    const mortality = snap.data();
    const lotRef = admin.firestore().doc(`chickenLots/${mortality.lotId}`);

    return admin.firestore().runTransaction(async (transaction) => {
      const lot = await transaction.get(lotRef);
      const newLiveCount = lot.data().liveHenCount - mortality.hensDied;

      // Validation
      if (newLiveCount < 0) {
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Mortality exceeds live hen count'
        );
      }

      // Update lot
      transaction.update(lotRef, {
        liveHenCount: newLiveCount,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Create audit log if >10% threshold
      if (mortality.hensDied > lot.data().liveHenCount * 0.10) {
        // Audit logging logic
      }
    });
  });
```

---

### Collection: `/feedBatches/{batchId}`

**Read**: All authenticated users

**Create**: All authenticated users

**Update/Delete**: Batch creator or admin

**Security Rule**:
```javascript
match /feedBatches/{batchId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null &&
                   request.resource.data.preparedBy == request.auth.uid;
  allow update, delete: if request.auth.uid == resource.data.preparedBy ||
                           request.auth.token.role == 'admin';
}
```

---

### Collection: `/feedingRecords/{recordId}`

**Read**: All authenticated users

**Create**: All authenticated users

**Update/Delete**: Record creator or admin

**Security Rule**: (Same pattern as production records)

---

### Collection: `/healthEvents/{eventId}`

**Read**: All authenticated users

**Create**: All authenticated users

**Update/Delete**: Event creator or admin

**Security Rule**: (Same pattern as production records)

---

### Collection: `/biosecurityEvents/{eventId}`

**Read**: All authenticated users

**Create**: All authenticated users

**Update/Delete**: Event creator or admin

**Security Rule**: (Same pattern as production records)

---

## Sync Orchestration (Firebase Functions)

### 5. Batch Sync

**Purpose**: Batch upload offline changes and receive incremental updates.

**Endpoint**: `POST /batchSync` (Firebase Callable Function)

**Request**:
```typescript
{
  changes: Array<{
    entityType: string;      // 'productionRecords', 'mortalityRecords', etc.
    entityId: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
    data: object;            // Entity data
    localTimestamp: string;  // ISO-8601 client timestamp
  }>;
  lastSyncTimestamp: string;  // ISO-8601 timestamp of last successful sync
  deviceId: string;
}
```

**Response**:
```typescript
{
  uploadedCount: number;
  conflictsResolved: number;
  updates: Array<{
    entityType: string;
    entityId: string;
    data: object;
    serverTimestamp: string;
    operation: 'CREATE' | 'UPDATE' | 'DELETE';
  }>;
  newSyncTimestamp: string;  // Client should store for next sync
}
```

**Logic**:
1. Validate user authentication
2. For each change:
   - Check if server has newer version (compare timestamps)
   - Apply LWW conflict resolution
   - Write to Firestore if client wins or no conflict
3. Query Firestore for updates since `lastSyncTimestamp`
4. Return incremental updates to client

**Errors**:
- `UNAUTHENTICATED`: No auth token
- `INVALID_ARGUMENT`: Malformed request
- `RESOURCE_EXHAUSTED`: Too many changes (>500), split into batches

**Security**: Authenticated users only, can only sync own records (except admins).

---

## Data Transfer Objects (DTOs)

### ProductionRecordDTO

```typescript
interface ProductionRecordDTO {
  id: string;
  lotId: string;
  date: string;           // ISO-8601 date
  eggsCollected: number;
  recordedBy: string;
  createdAt: string;      // ISO-8601 timestamp
  updatedAt: string;
}
```

### MortalityRecordDTO

```typescript
interface MortalityRecordDTO {
  id: string;
  lotId: string;
  date: string;
  hensDied: number;
  recordedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### ChickenLotDTO

```typescript
interface ChickenLotDTO {
  id: string;
  name: string;
  chickenHouseId: string;
  purchaseDate: string;
  initialHenCount: number;
  liveHenCount: number;
  ageWeeks: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

*(Similar DTOs for other entities...)*

---

## Error Codes

| Code | Description | User Action |
|------|-------------|-------------|
| `UNAUTHENTICATED` | No auth token or expired | Re-login required |
| `PERMISSION_DENIED` | Insufficient permissions | Contact admin |
| `NOT_FOUND` | Resource doesn't exist | Check ID or create new |
| `ALREADY_EXISTS` | Duplicate resource | Use existing or modify |
| `INVALID_ARGUMENT` | Validation failed | Fix input data |
| `FAILED_PRECONDITION` | Business rule violation | Check constraints |
| `RESOURCE_EXHAUSTED` | Rate limit or quota | Retry with backoff |
| `UNAVAILABLE` | Service temporarily down | Retry automatically |

---

## Rate Limiting

- **Invitation Creation**: Max 50 per admin per day
- **Sync Requests**: Max 1000 per user per day
- **Firestore Reads**: Max 50,000 per day per user (Firestore default)
- **Firestore Writes**: Max 20,000 per day per user (Firestore default)

---

## Performance Targets

- **Sync Latency**: <5 seconds for 50 records (SC-003)
- **Read Latency**: <500ms for single document read
- **Write Latency**: <1 second for single document write
- **Batch Sync**: <10 seconds for 500 records

---

## Next Steps

1. Implement Firebase Functions in `functions/` directory
2. Deploy Firestore security rules from `firestore.rules`
3. Create TypeScript client SDK wrappers for Firestore collections
4. Implement sync service with conflict resolution logic
