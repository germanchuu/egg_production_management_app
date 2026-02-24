# Granja Avícola San Vicente de Paúl

Mobile application for poultry farm egg production management. Built with Expo (React Native) and Firebase.

## Features

- **Daily egg production recording** with offline support and auto-sync
- **Chicken house & lot management** with live hen count tracking
- **Mortality recording** with automatic hen count updates and audit logging for events >10%
- **Feed management** — batch preparation and per-lot feeding records
- **Health & biosecurity events** — vaccination and disinfection tracking
- **Invitation-based authentication** — secure, deep-link driven user onboarding
- **Offline-first** — all data saved locally in SQLite, synced to Firebase Firestore when online

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54 + React Native |
| Language | TypeScript 5.x |
| Styling | NativeWind (Tailwind CSS) |
| Navigation | Expo Router + React Navigation Material Top Tabs |
| Local DB | expo-sqlite |
| Backend | Firebase Firestore + Firebase Auth |
| State/Forms | React Hook Form + Zod |
| Secure storage | expo-secure-store |
| Charts | react-native-gifted-charts |

## Prerequisites

- **Node.js** 22.x
- **npm** 10.x
- **Expo CLI** — `npm install -g expo-cli`
- **EAS CLI** — `npm install -g eas-cli` (for builds)
- A Firebase project with Firestore and Authentication enabled
- Android Studio or Xcode for local device testing

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd gestion_produccion_huevos_app  # nombre del directorio en disco (no cambiado)
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in your Firebase project values in `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

### 4. Deploy Firestore security rules

```bash
firebase deploy --only firestore:rules
```

### 5. Deploy Firebase Cloud Functions

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

## Running the App

```bash
# Start Expo development server
npm start

# Start on Android emulator
npm run android

# Start on iOS simulator
npm run ios

# Start in web browser (limited functionality)
npm run web
```

## Testing

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run CI checks (coverage + lint)
npm run test:ci

# Lint the codebase
npm run lint
```

### E2E Tests (Detox)

E2E tests require additional setup. See `e2e/README.md` for Detox configuration instructions.

```bash
# Build E2E test binary (iOS)
npm run test:e2e:build

# Run E2E tests (iOS)
npm run test:e2e

# Android E2E
npm run test:e2e:build:android
npm run test:e2e:android
```

## Project Structure

```
src/
├── app/                         # Expo Router file-based routing
│   ├── (auth)/                  # Invitation acceptance flow
│   └── (tabs)/                  # Main tab navigation
├── core/
│   ├── config/                  # Firebase init, env validation
│   └── theme/                   # Design tokens
├── features/
│   ├── auth/                    # Authentication (invitation flow, session)
│   ├── facilities/              # Chicken houses and lots management
│   ├── feeding/                 # Feed batches and feeding records
│   ├── health-biosecurity/      # Health and biosecurity events
│   ├── mortality/               # Mortality recording
│   └── production/              # Egg production recording
└── shared/
    ├── components/              # Reusable UI components
    ├── database/                # SQLite schema, repositories
    ├── hooks/                   # Shared hooks (useNetInfo, useSync)
    ├── sync/                    # Sync queue, conflict resolver, audit service
    ├── types/                   # Shared TypeScript entities
    └── utils/                   # Date, ID, validation utilities

tests/
├── unit/                        # Unit tests by feature
├── integration/                 # Integration tests (offline, sync, audit)
├── fixtures/                    # Test data
└── utils/                       # Test database helpers

e2e/                             # Detox E2E tests (skeleton — requires setup)
```

## Building for Production

### Android APK

```bash
eas build --platform android --profile production
```

### iOS (requires Apple Developer account)

```bash
eas build --platform ios --profile production
```

### OTA Updates

```bash
eas update --channel production --message "Description of update"
```

## Authentication Flow

1. **Admin creates a user** in the app → user is saved as `pending`
2. **Admin generates an invitation deep link** and shares via WhatsApp/SMS
3. **User opens the deep link** → app opens showing "Esta es una invitación para: [name]"
4. **User accepts** → device is authorized, session cached in `expo-secure-store`
5. **Subsequent launches** use cached session — works fully offline

## Offline Support

All data is saved to SQLite immediately. When connectivity is restored:
- Pending writes are uploaded to Firestore (batch sync)
- Remote changes from other devices are downloaded
- Conflicts resolved via Last-Write-Wins (LWW) based on `updatedAt` timestamps

## Security

- Firestore rules enforce role-based access (admin vs user)
- Invitation tokens are one-time use
- User revocation is permanent and clears all authorized devices
- Audit logs track critical operations: user creation, invitation acceptance, lot deletion, mortality >10%
- Auth tokens stored in `expo-secure-store` (encrypted at rest)

## License

Private — All rights reserved.
