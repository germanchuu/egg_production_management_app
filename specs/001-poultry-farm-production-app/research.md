# Research: Poultry Farm Production App Technology Stack

**Feature**: 001-poultry-farm-production-app
**Date**: 2026-01-26
**Status**: Complete

## Overview

This document consolidates research findings for the technology stack, architecture patterns, and implementation strategies for the offline-first poultry farm egg production management mobile application.

---

## 1. Mobile Framework & Core Technology Stack

### Decision

**React Native with Expo SDK 54** using TypeScript, with the following core dependencies:

- **Expo SDK 54** - Framework and tooling platform
- **Expo Router** - File-based routing and navigation
- **NativeWind v4** - Tailwind CSS for React Native styling
- **TypeScript 5.x** - Type safety and development experience

### Rationale

**Why Expo over bare React Native or native development:**

1. **Offline-First Development Velocity**: Expo provides pre-built modules (expo-sqlite, expo-secure-store, @react-native-community/netinfo) that are battle-tested for offline scenarios, saving weeks of native module integration work.

2. **Bundle Size Optimization**: Expo SDK 54 supports tree-shaking and modular architecture, keeping app size well below the 50MB constraint (typical Expo apps: 20-30MB).

3. **Performance Targets Met**: Expo apps routinely achieve <100ms UI response times and <2s cold start times on devices with 2GB RAM when properly optimized.

4. **Over-The-Air Updates**: EAS Update enables bug fixes and feature updates without app store approval, critical for agricultural operations that can't afford downtime during planting/harvest seasons.

5. **Cross-Platform Consistency**: Single codebase for iOS (13+) and Android (8.0+/API 26+) reduces maintenance burden for small farm operations.

**Why Expo Router over React Navigation:**

1. **File-Based Routing**: Matches Constitution III (Simplicity-First) by making navigation structure explicit and discoverable through filesystem.
2. **Deep Linking**: Built-in support for invitation link handling (User Story 3 requirement).
3. **Type Safety**: Automatic TypeScript route typing reduces navigation bugs.

**Why NativeWind over styled-components/emotion:**

1. **Tailwind CSS Familiarity**: Global standard reduces onboarding time for new developers.
2. **Design System Consistency**: `tailwind.config.ts` centralizes theme (colors, spacing, typography) ensuring UI consistency.
3. **Performance**: Compile-time style generation (no runtime style object creation).
4. **Responsive Design**: Built-in breakpoints for tablet support.

### Alternatives Considered

**Flutter**:
- **Rejected Reason**: Dart language learning curve, smaller ecosystem for offline-first libraries compared to React Native/Firebase integration.
- **Performance**: Comparable UI performance, but React Native + Firebase provides better offline sync patterns with Firestore.

**Native (Swift + Kotlin)**:
- **Rejected Reason**: Double development effort (2 codebases), longer time to market, harder to maintain for small farm operations.
- **Performance**: Best native performance, but unnecessary for CRUD operations and forms.

**React Native (Bare Workflow)**:
- **Rejected Reason**: Requires manual native module linking, slower iteration, no OTA updates without custom infrastructure.
- **When to Reconsider**: If custom native modules needed (not anticipated for this project).

---

## 2. Form Management & Validation

### Decision

**React Hook Form v7.66+** with **Zod v3.24+** schema validation via **@hookform/resolvers**.

### Rationale

1. **Performance**: Uncontrolled components minimize re-renders, critical for <100ms UI response target (Constitution requirement).

2. **Offline-First Compatibility**: Form state is entirely local, no network dependency. Validation runs synchronously on-device.

3. **Type Safety**: Zod schemas generate TypeScript types automatically, ensuring form data matches database models.

4. **Validation Reuse**: Same Zod schemas validate data locally (form submission) and server-side (Firebase Functions), ensuring consistency.

5. **Developer Experience**:
   - Simple API: `useForm()`, `register()`, `handleSubmit()`
   - Built-in error handling aligns with Constitution III (plain language error messages)
   - DevTools support for debugging

### Implementation Pattern

```typescript
// Example: Production record form validation
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const productionSchema = z.object({
  lotId: z.string().uuid(),
  date: z.date().max(new Date(), 'Cannot record future production'),
  eggsCollected: z.number().int().positive().max(100000),
});

type ProductionFormData = z.infer<typeof productionSchema>;

function ProductionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<ProductionFormData>({
    resolver: zodResolver(productionSchema),
    defaultValues: {
      date: new Date(), // Smart default (FR-UX-002)
      lotId: getRecentLotId(), // Most recently used lot
    },
  });

  const onSubmit = async (data: ProductionFormData) => {
    await productionService.recordProduction(data);
  };

  return (
    // Form UI with validation errors
  );
}
```

### Alternatives Considered

**Formik**:
- **Rejected Reason**: Controlled components cause more re-renders, slower performance. Larger bundle size. Less TypeScript-friendly.

**Manual State Management**:
- **Rejected Reason**: Reinventing the wheel, error-prone, no validation reuse.

---

## 3. Offline Storage & Synchronization

### Decision

**expo-sqlite (SQLite)** for local storage with **Firebase Firestore** for backend sync, using **incremental delta sync with timestamp-based change tracking** and **Last-Write-Wins (LWW)** conflict resolution.

### Rationale

**Why expo-sqlite (SQLite):**

1. **Proven Offline-First**: SQLite is the gold standard for mobile offline storage, used by WhatsApp, Signal, and major enterprise apps.

2. **Performance**: Handles 365 days of production records per lot (target: 10-20 lots × 365 records = ~7,300 records) with sub-millisecond query times.

3. **ACID Transactions**: Ensures data integrity for critical operations (mortality updates that modify live hen counts).

4. **Storage Efficiency**: Typical yearly data volume: ~20MB (production, feeding, mortality, events), well within device constraints.

5. **Expo Integration**: `expo-sqlite` provides modern async/await API, TypeScript support, and works on both iOS and Android.

**Why Firebase Firestore for Sync:**

1. **Real-Time Sync**: Firestore's listener-based architecture enables automatic background sync when connectivity returns (FR-OFFLINE-005).

2. **Offline Persistence**: Built-in offline cache complements SQLite, providing fallback queries during sync.

3. **Scalable Queries**: Firestore indexes support efficient queries (e.g., "get all records for lot X created after timestamp Y").

4. **Security Rules**: Declarative access control (e.g., only admins can create lots, users can only modify their own records).

5. **Incremental Sync**: Firestore listeners automatically deliver only changed documents, not full dataset.

### Sync Architecture

**Timestamp-Based Delta Sync Strategy:**

1. **Local Write**: User creates/updates record → SQLite write → Sync queue entry created with `localTimestamp`.

2. **Sync Detection**: `@react-native-community/netinfo` detects connectivity → Trigger sync process.

3. **Upload Phase**:
   - Query sync queue for unsent changes
   - Batch upload to Firestore (up to 500 writes per batch)
   - Include `deviceId`, `userId`, `localTimestamp` in each document

4. **Download Phase**:
   - Firestore listener queries: `where('updatedAt', '>', lastSyncTimestamp)`
   - Download only new/changed documents since last sync
   - Apply LWW conflict resolution if local and remote timestamps differ

5. **Conflict Resolution (LWW)**:
   ```typescript
   function resolveConflict(local, remote) {
     if (local.localTimestamp > remote.serverTimestamp) {
       // Local write is newer, re-upload to server
       return { winner: local, action: 'reupload' };
     } else {
       // Remote write is newer, overwrite local
       return { winner: remote, action: 'overwrite_local' };
     }
   }
   ```

6. **Update Sync Status**:
   - Mark synced records in queue with `syncedAt` timestamp
   - Update UI sync indicator: `synced` (green checkmark)

### Sync Queue Schema

```sql
CREATE TABLE sync_queue (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'production_record', 'mortality_record', etc.
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
  local_timestamp INTEGER NOT NULL,
  synced_at INTEGER,
  retry_count INTEGER DEFAULT 0,
  error TEXT
);

CREATE INDEX idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;
```

### Performance Targets

- **Sync Time**: <5 seconds for 50 records (typical daily volume)
- **Bandwidth**: ~100KB for daily sync (compressed JSON)
- **Battery Impact**: Batch syncs every 5 minutes or on app resume, not continuous polling

### Alternatives Considered

**WatermelonDB**:
- **Rejected Reason**: While WatermelonDB is excellent for complex apps, it adds 500KB+ to bundle size and introduces ORM complexity unnecessary for this project's simple schema (10 entities). Direct SQLite + Firebase provides more control and smaller footprint.
- **When to Reconsider**: If app grows to >50 entities or requires complex multi-table reactive queries.

**PouchDB/CouchDB**:
- **Rejected Reason**: CouchDB requires self-hosted server (Firebase is managed). PouchDB bundle size (~400KB) is heavy. Less mobile ecosystem support than Firebase.

**Full Sync (Download Entire Dataset Each Time)**:
- **Rejected Reason**: Wastes bandwidth, slow on poor connections, doesn't scale beyond 1 year of data.

**CRDT (Conflict-Free Replicated Data Types)**:
- **Rejected Reason**: Overkill for agricultural data. LWW is sufficient since production records are immutable (append-only) and updates are rare. CRDTs add complexity and bundle size.

---

## 4. Authentication & Security

### Decision

**Firebase Authentication** for user management and invitation system, with **expo-secure-store** for encrypted local credential storage.

### Rationale

**Why Firebase Authentication:**

1. **Invitation-Based Flow**: Firebase supports custom token generation, perfect for invitation link → account activation workflow (User Story 3).

2. **Offline Session Management**: Firebase persists auth tokens locally, enabling offline access after first login (FR-003).

3. **Background Validation**: Firebase SDK automatically refreshes tokens when online, meeting FR-004 requirement.

4. **Role-Based Access**: Custom claims (e.g., `role: 'admin'`) integrate with Firestore security rules.

5. **Security**: Industry-standard JWT tokens, automatic token refresh, built-in brute-force protection.

**Why expo-secure-store:**

1. **Encrypted Storage**: Uses iOS Keychain and Android Keystore for hardware-backed encryption of auth tokens.

2. **Persistence**: Tokens survive app restarts, enabling instant offline access (SC-010: <3s offline app launch).

3. **Simple API**: `SecureStore.setItemAsync('authToken', token)` / `getItemAsync('authToken')`.

### Authentication Flow

**Invitation Workflow:**

1. Admin creates invitation → Firebase Function generates custom token with email + role
2. Invitation link: `app://invite?token={customToken}`
3. User opens link → App validates token → User sets password → Firebase creates account
4. Auth token stored in expo-secure-store for offline access
5. Invitation marked as `accepted` in Firestore

**Offline Access:**

1. App launch → Check expo-secure-store for cached auth token
2. If found → Validate token expiry locally → Grant offline access
3. If online → Background refresh token via Firebase SDK
4. If token invalid → Prompt re-authentication

### Security Considerations

- **7-Day Invitation Expiry**: Custom tokens include `exp` claim set to 7 days (FR-007)
- **Secure Token Storage**: expo-secure-store prevents token extraction even on rooted devices
- **No Sensitive Data in SQLite**: Only auth tokens in secure storage, user data in SQLite is unencrypted (acceptable for farm data)

### Alternatives Considered

**Supabase Auth**:
- **Rejected Reason**: Less mature React Native SDK, no Expo-specific optimizations. Firebase has better offline-first mobile support.

**Custom JWT + Backend**:
- **Rejected Reason**: Reinventing auth (token refresh, security, password reset) is error-prone. Firebase handles this out-of-box.

---

## 5. Network Connectivity Detection

### Decision

**@react-native-community/netinfo** for connectivity monitoring.

### Rationale

1. **Real-Time Updates**: Event-based API detects connectivity changes instantly (WiFi ↔ cellular ↔ offline).

2. **Connection Quality**: Provides `isInternetReachable` (not just network connection), preventing false sync triggers.

3. **Cross-Platform**: Works identically on iOS and Android with native performance.

4. **Battery Efficient**: Native listeners, no polling required.

### Implementation Pattern

```typescript
import NetInfo from '@react-native-community/netinfo';

// Sync trigger on connectivity restoration
NetInfo.addEventListener(state => {
  if (state.isConnected && state.isInternetReachable) {
    syncService.triggerSync(); // Auto-sync offline changes (FR-OFFLINE-005)
  }
});
```

### Alternatives Considered

**Manual Ping Checks**:
- **Rejected Reason**: Wasteful battery usage, slower response, false positives (connected to WiFi but no internet).

---

## 6. UI Component Library & Styling

### Decision

**NativeWind v4** (Tailwind CSS) for styling with **custom components** built in-house rather than a full UI library.

### Rationale

1. **Tailwind Config Centralization**: All design tokens (colors, fonts, spacing) in `tailwind.config.ts` ensures consistency (Constitution III).

2. **No Over-Abstraction**: Pre-built UI libraries (React Native Paper, NativeBase) add 300-500KB and include unused components. Custom components tailored to agricultural workflows are lighter and simpler.

3. **Large Touch Targets**: Custom components ensure 48x48dp minimum (Constitution III: optimized for field use).

4. **Accessibility**: Direct control over ARIA labels, font scaling, color contrast.

5. **Performance**: No runtime style calculation, compile-time generation.

### Component Examples

- **Input Fields**: Numeric keyboards for egg counts (FR-UX-005)
- **Date Pickers**: Native date selectors (FR-UX-005)
- **Buttons**: Large, high-contrast, with haptic feedback
- **Sync Indicator**: Custom header component showing sync status (FR-OFFLINE-003)

### Alternatives Considered

**React Native Paper**:
- **Rejected Reason**: Material Design not optimized for agricultural field use (small buttons, complex navigation). Bundle size impact.

**NativeBase**:
- **Rejected Reason**: Similar to Paper, adds unnecessary complexity and components.

---

## 7. Audit Trail Implementation

### Decision

Implement audit logging for:

1. **User invitation creation and acceptance** (admin actions, security compliance)
2. **Chicken lot creation and deletion** (structural changes affecting all users)
3. **Mortality recording above 10% threshold** (potential data error or health crisis)
4. **Administrative data corrections** (if override feature added later)

**Do NOT audit** routine operational data (daily production, feeding, health events) to maintain simplicity and performance.

### Rationale

**Business Justification:**

- **Data Integrity**: Production metrics (eggs per hen) are core KPIs. Audit trails prevent manipulation.
- **Accountability**: Multi-user offline system needs attribution for training and dispute resolution.
- **Anomaly Detection**: Audit timestamps enable detection of backdated entries or bulk corrections.

**Compliance Justification:**

- **Food Safety**: Traceability for health events (vaccinations) and biosecurity (disinfectants).
- **Legal Protection**: Documented procedures for disease outbreak investigations.

**Performance Trade-Off:**

- Auditing every production record would add 50KB/day (27 records × 2KB). Over 7 years = 140MB.
- Selective audit (only critical ops) reduces to ~20MB over 7 years.

### Audit Log Design

**Local Audit Table (SQLite):**

```sql
CREATE TABLE audit_log_local (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation_type TEXT NOT NULL, -- CREATE, UPDATE, DELETE
  timestamp TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  synced INTEGER DEFAULT 0
);
```

**Server Audit Collection (Firestore):**

```javascript
// Firestore document structure
{
  id: 'uuid',
  entityType: 'chicken_lot',
  entityId: 'lot-123',
  operationType: 'CREATE',
  timestamp: Timestamp,
  userId: 'user-456',
  deviceId: 'device-789',
  oldValues: null,
  newValues: { initialHenCount: 5000, purchaseDate: '2026-01-15', ... }
}
```

**Retention Policy:**

- Critical operations (lot creation, mortality, user management): **7 years**
- Health/biosecurity events: **3 years active + 2 years archived**

### Alternatives Considered

**Audit Everything**:
- **Rejected Reason**: Performance impact, storage bloat, violates Constitution III (simplicity).

**No Auditing**:
- **Rejected Reason**: Violates Constitution IV (data integrity requirement).

---

## 8. Testing Strategy

### Decision

**Jest** + **React Native Testing Library** for unit/integration tests, **Detox** for end-to-end tests.

### Rationale

1. **Jest**: Standard for React Native, integrated with Expo, fast execution.

2. **React Native Testing Library**: Encourages testing user behavior (not implementation details), aligns with acceptance scenarios.

3. **Detox**: Gray-box E2E testing on real iOS/Android simulators, catches offline sync bugs.

### Test Coverage Targets

**Integration Tests (per Constitution V):**

- Each user story's primary scenario (5 tests minimum)
- Offline-to-online sync conflicts (LWW scenarios)
- Form validation edge cases (future dates, negative counts)

**Component Tests:**

- Production entry form (3-tap workflow)
- Mortality entry (automatic hen count update)
- Sync status indicator

**E2E Tests (Detox):**

- Full offline workflow: Record production → Go offline → Record more → Go online → Verify sync
- Invitation acceptance flow

### Performance Testing

- **Manual Device Testing**: Test on physical devices with 2GB RAM before release (Constitution V)
- **Profiling**: React DevTools Profiler to verify <100ms UI response

---

## 9. Project Structure Refinement

### Decision

Feature-based architecture with Expo Router file-based routing:

```
src/
├── app/                            # Expo Router pages
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── invite/[token].tsx      # Invitation acceptance
│   ├── (tabs)/                     # Main app tabs
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Home/Dashboard
│   │   ├── production.tsx
│   │   ├── lots.tsx
│   │   └── profile.tsx
│   └── _layout.tsx
├── features/
│   ├── auth/
│   │   ├── services/AuthService.ts
│   │   ├── models/User.ts
│   │   └── components/LoginForm.tsx
│   ├── production/
│   │   ├── services/ProductionService.ts
│   │   ├── models/ProductionRecord.ts
│   │   └── components/ProductionEntryForm.tsx
│   ├── facilities/
│   ├── mortality/
│   ├── feeding/
│   └── health-biosecurity/
├── shared/
│   ├── database/
│   │   ├── SQLiteDatabase.ts       # expo-sqlite wrapper
│   │   ├── schema.ts               # Table definitions
│   │   └── migrations/
│   ├── sync/
│   │   ├── SyncService.ts          # Firebase Firestore sync
│   │   ├── SyncQueue.ts
│   │   └── ConflictResolver.ts
│   ├── components/
│   │   ├── SyncStatusIndicator.tsx
│   │   ├── FormInput.tsx
│   │   └── DatePicker.tsx
│   ├── hooks/
│   │   ├── useNetInfo.ts
│   │   └── useSync.ts
│   └── utils/
│       ├── validation.ts           # Zod schemas
│       └── date.ts
└── core/
    ├── config/
    │   ├── firebase.ts
    │   └── constants.ts
    └── theme/
        └── tailwind.config.ts      # NativeWind configuration
```

### Rationale

- **Expo Router Integration**: `app/` directory replaces traditional navigation config, simplifying deep linking for invitations.
- **Feature Isolation**: Each feature is self-contained, aligning with Constitution II.
- **Shared Infrastructure**: Database, sync, and UI components are centralized for reuse.

---

## 10. Development Workflow & Tooling

### Decision

- **Package Manager**: npm (comes with Node.js, simpler than yarn/pnpm for small teams)
- **Linting**: ESLint + Prettier (enforce code consistency)
- **Type Checking**: `tsc --noEmit` in pre-commit hook
- **Version Control**: Git with feature branches (following Specify workflow)
- **CI/CD**: EAS Build (Expo Application Services) for iOS/Android builds
- **OTA Updates**: EAS Update for instant bug fixes

### Development Commands

```json
{
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "test": "jest",
    "test:e2e": "detox test",
    "lint": "eslint . --ext .ts,.tsx",
    "type-check": "tsc --noEmit",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios"
  }
}
```

---

## Summary

This research establishes a comprehensive, offline-first technology stack for the poultry farm production app:

- **Frontend**: React Native + Expo SDK 54 + TypeScript + Expo Router + NativeWind
- **Forms**: React Hook Form + Zod
- **Storage**: expo-sqlite (SQLite) for local, Firebase Firestore for sync
- **Auth**: Firebase Authentication + expo-secure-store
- **Connectivity**: @react-native-community/netinfo
- **Testing**: Jest + React Native Testing Library + Detox

All decisions align with Constitution principles (offline-first, feature-based organization, simplicity-first UX, data integrity, testing quality) and meet functional requirements from the spec.

**Next Phase**: Design data models and API contracts (Phase 1).
