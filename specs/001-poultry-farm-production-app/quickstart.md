# Quickstart Guide: Poultry Farm Production App

**Feature**: 001-poultry-farm-production-app
**Date**: 2026-01-26
**Audience**: Developers implementing the feature

## Overview

This guide provides step-by-step instructions to set up the development environment, implement core features, and deploy the poultry farm production management mobile application.

---

## Prerequisites

### Required Tools

- **Node.js**: v20.x or later (LTS recommended)
- **npm**: v10.x or later (comes with Node.js)
- **Expo CLI**: Installed globally via `npm install -g expo-cli`
- **Git**: For version control
- **Code Editor**: VS Code recommended (with ESLint/Prettier extensions)

### Optional Tools

- **iOS Simulator**: Xcode (macOS only) for iOS development
- **Android Emulator**: Android Studio for Android development
- **Physical Devices**: iOS/Android devices for testing (recommended)

### Firebase Setup

1. Create Firebase project at https://console.firebase.google.com
2. Enable **Authentication** (Email/Password provider)
3. Enable **Firestore Database** (production mode → apply security rules later)
4. Enable **Cloud Functions** (Blaze plan required for HTTP callable functions)
5. Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

---

## Project Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd gestion_produccion_huevos_app
git checkout 001-poultry-farm-production-app
```

### 2. Install Dependencies

```bash
npm install
```

**Key Dependencies** (auto-installed):
```json
{
  "expo": "~54.0.0",
  "expo-router": "^4.0.0",
  "expo-sqlite": "^15.0.0",
  "expo-secure-store": "^14.0.0",
  "@react-native-community/netinfo": "^11.0.0",
  "react-hook-form": "^7.66.0",
  "@hookform/resolvers": "^3.0.0",
  "zod": "^3.24.0",
  "nativewind": "^4.0.0",
  "firebase": "^11.0.0",
  "react-native-firebase": "^21.0.0"
}
```

### 3. Configure Firebase

**Install Firebase dependencies**:
```bash
npx expo install firebase
npm install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore
```

**Create `src/core/config/firebase.ts`**:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
```

**Create `.env` file** (root directory):
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Add `.env` to `.gitignore`**:
```bash
echo ".env" >> .gitignore
```

### 4. Configure NativeWind

**Create `tailwind.config.ts`** (root directory):
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/app/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
        },
        secondary: {
          500: '#ff9800',
          600: '#fb8c00',
        },
        error: {
          500: '#f44336',
        },
        warning: {
          500: '#ff9800',
        },
        success: {
          500: '#4caf50',
        },
      },
      fontSize: {
        'input': '18px',  // Large for field use
      },
      spacing: {
        'touch': '48px',  // Min touch target (Constitution III)
      },
    },
  },
  plugins: [],
};

export default config;
```

**Update `babel.config.js`**:
```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

### 5. Set Up SQLite Database

**Create `src/shared/database/schema.ts`**:
```typescript
import * as SQLite from 'expo-sqlite';

export async function initializeDatabase() {
  const db = await SQLite.openDatabaseAsync('poultry_production.db');

  // Enable foreign keys
  await db.execAsync('PRAGMA foreign_keys = ON;');

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      created_at TEXT NOT NULL,
      last_login_at TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      invitation_id TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chicken_houses (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS chicken_lots (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      chicken_house_id TEXT NOT NULL,
      purchase_date TEXT NOT NULL,
      initial_hen_count INTEGER NOT NULL CHECK(initial_hen_count > 0),
      live_hen_count INTEGER NOT NULL CHECK(live_hen_count >= 0),
      age_weeks INTEGER NOT NULL CHECK(age_weeks > 0),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (chicken_house_id) REFERENCES chicken_houses(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS production_records (
      id TEXT PRIMARY KEY,
      lot_id TEXT NOT NULL,
      date TEXT NOT NULL,
      eggs_collected INTEGER NOT NULL CHECK(eggs_collected >= 0),
      recorded_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lot_id) REFERENCES chicken_lots(id),
      FOREIGN KEY (recorded_by) REFERENCES users(id),
      UNIQUE(lot_id, date)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
      local_timestamp TEXT NOT NULL,
      synced_at TEXT,
      retry_count INTEGER NOT NULL DEFAULT 0,
      error TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sync_pending ON sync_queue(synced_at) WHERE synced_at IS NULL;
  `);

  return db;
}
```

**Initialize database in `src/app/_layout.tsx`**:
```typescript
import { useEffect } from 'react';
import { initializeDatabase } from '@/shared/database/schema';

export default function RootLayout() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  // ... rest of layout
}
```

---

## Feature Implementation Order

Follow this sequence to implement user stories according to priority:

### Phase 1: Core Infrastructure (Week 1)

**Tasks**:
1. Set up Expo Router file structure (`src/app/`)
2. Implement SQLite database schema and migrations
3. Create Firebase authentication service
4. Implement offline session caching with expo-secure-store
5. Set up sync service skeleton (NetInfo integration)

**Acceptance**:
- App launches successfully on iOS/Android
- SQLite database initializes with schema
- Firebase auth connects successfully

---

### Phase 2: User Story 3 - Authentication (Week 1-2)

**Tasks**:
1. Implement invitation creation (admin function)
2. Build invitation acceptance flow
3. Create login screen with offline session support
4. Implement background token validation
5. Add role-based navigation (admin vs user screens)

**Files to Create**:
- `src/features/auth/services/AuthService.ts`
- `src/features/auth/components/LoginForm.tsx`
- `src/app/(auth)/login.tsx`
- `src/app/(auth)/invite/[token].tsx`

**Acceptance Criteria**: User Story 3 acceptance scenarios pass.

---

### Phase 3: User Story 2 - Facilities & Lots (Week 2-3)

**Tasks**:
1. Build chicken house registration (admin only)
2. Build chicken lot creation (admin only)
3. Implement lot listing with live hen counts
4. Add lot detail view

**Files to Create**:
- `src/features/facilities/services/FacilityService.ts`
- `src/features/facilities/components/HouseForm.tsx`
- `src/features/facilities/components/LotForm.tsx`
- `src/app/(tabs)/lots.tsx`

**Acceptance Criteria**: User Story 2 acceptance scenarios pass.

---

### Phase 4: User Story 1 - Production Tracking (Week 3-4)

**Tasks**:
1. Build production entry form (≤3 taps: select lot, enter eggs, save)
2. Implement smart defaults (current date, recent lot)
3. Add production history view
4. Calculate and display eggs per hen metrics
5. Implement offline data persistence

**Files to Create**:
- `src/features/production/services/ProductionService.ts`
- `src/features/production/components/ProductionEntryForm.tsx`
- `src/app/(tabs)/production.tsx`

**Acceptance Criteria**: User Story 1 acceptance scenarios pass, SC-001 (<30s entry time).

---

### Phase 5: Mortality Tracking (Week 4)

**Tasks**:
1. Build mortality entry form
2. Implement automatic live hen count update (transaction)
3. Add validation (cannot exceed current hen count)
4. Trigger audit log for >10% mortality threshold

**Files to Create**:
- `src/features/mortality/services/MortalityService.ts`
- `src/features/mortality/components/MortalityForm.tsx`

**Acceptance Criteria**: SC-002 (<10s to record and see updated hen count).

---

### Phase 6: Sync Implementation (Week 5)

**Tasks**:
1. Implement sync queue (write to queue on CREATE/UPDATE/DELETE)
2. Build batch sync service (upload offline changes)
3. Implement LWW conflict resolution
4. Add sync status indicator (header component)
5. Implement automatic sync on connectivity restoration

**Files to Create**:
- `src/shared/sync/SyncService.ts`
- `src/shared/sync/SyncQueue.ts`
- `src/shared/sync/ConflictResolver.ts`
- `src/shared/components/SyncStatusIndicator.tsx`

**Acceptance Criteria**: SC-003 (sync in <30s), SC-009 (100% automatic conflict resolution).

---

### Phase 7: User Story 4 - Feed Management (Week 6)

**Tasks**:
1. Build feed batch registration form
2. Build daily feeding entry form
3. Calculate and display feed per hen metrics

**Files to Create**:
- `src/features/feeding/services/FeedingService.ts`
- `src/features/feeding/components/FeedBatchForm.tsx`
- `src/features/feeding/components/FeedingForm.tsx`

**Acceptance Criteria**: User Story 4 acceptance scenarios pass.

---

### Phase 8: User Story 5 - Health & Biosecurity (Week 7)

**Tasks**:
1. Build health event entry form (vaccinations)
2. Build biosecurity event entry form (disinfection)
3. Add event history view with notes

**Files to Create**:
- `src/features/health-biosecurity/services/EventService.ts`
- `src/features/health-biosecurity/components/HealthEventForm.tsx`
- `src/features/health-biosecurity/components/BiosecurityEventForm.tsx`

**Acceptance Criteria**: User Story 5 acceptance scenarios pass.

---

### Phase 9: Testing & Polish (Week 8)

**Tasks**:
1. Write integration tests for all user stories
2. Write E2E tests (Detox) for offline workflows
3. Performance profiling (<100ms UI response)
4. Manual device testing (2GB RAM devices)
5. UI/UX polish (large touch targets, error messages)

**Acceptance Criteria**: All 10 success criteria (SC-001 through SC-010) pass.

---

## Development Workflow

### Running the App

**Start Expo development server**:
```bash
npm start
```

**Run on specific platform**:
```bash
npm run ios      # iOS simulator
npm run android  # Android emulator
```

**Run on physical device**:
1. Install "Expo Go" app on device
2. Scan QR code from terminal

### Code Quality

**Linting**:
```bash
npm run lint
```

**Type checking**:
```bash
npm run type-check
```

**Format code**:
```bash
npm run format
```

### Testing

**Unit/Integration tests**:
```bash
npm test
```

**E2E tests** (Detox):
```bash
npm run test:e2e
```

**Test coverage**:
```bash
npm run test:coverage
```

---

## Deployment

### Build for Production

**Install EAS CLI**:
```bash
npm install -g eas-cli
```

**Configure EAS**:
```bash
eas build:configure
```

**Build iOS**:
```bash
eas build --platform ios
```

**Build Android**:
```bash
eas build --platform android
```

### Over-The-Air Updates

**Publish update**:
```bash
eas update --branch production --message "Bug fixes"
```

**Rollback update**:
```bash
eas update --branch production --republish
```

---

## Debugging Tips

### Offline Sync Issues

1. Check NetInfo status: `NetInfo.fetch().then(console.log)`
2. Inspect sync queue: `SELECT * FROM sync_queue WHERE synced_at IS NULL`
3. Check Firebase console for failed writes
4. Enable debug logging: `firestore.setLogLevel('debug')`

### Authentication Issues

1. Verify Firebase credentials in `.env`
2. Check expo-secure-store: `SecureStore.getItemAsync('authToken')`
3. Test invitation link: `app://invite?token=test123`
4. Check Firebase Auth console for user status

### Performance Issues

1. Profile with React DevTools: `npx react-devtools`
2. Check SQLite query times: Add timing logs
3. Monitor bundle size: `npx expo export --dump-sourcemap`
4. Test on low-end device (2GB RAM)

---

## Key Resources

- **Expo Docs**: https://docs.expo.dev
- **Expo Router**: https://expo.github.io/router
- **Firebase Docs**: https://firebase.google.com/docs
- **NativeWind**: https://nativewind.dev
- **React Hook Form**: https://react-hook-form.com
- **Zod**: https://zod.dev

---

## Next Steps

1. **Review plan.md**: Ensure all technical decisions align
2. **Review data-model.md**: Understand entity relationships
3. **Review contracts/api-endpoints.md**: Understand API structure
4. **Start with Phase 1**: Set up infrastructure before feature work
5. **Follow Constitution**: Offline-first, feature-based organization, simplicity-first UX

---

## Support

For questions or issues during implementation:
1. Check this quickstart guide
2. Review feature specification (`spec.md`)
3. Review research findings (`research.md`)
4. Consult data model (`data-model.md`)
5. Review API contracts (`contracts/api-endpoints.md`)
