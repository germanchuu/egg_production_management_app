# Tasks: Poultry Farm Egg Production Management Mobile App

**Input**: Design documents from `/specs/001-poultry-farm-production-app/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-endpoints.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Tech Stack**: React Native + Expo SDK 54 + TypeScript + NativeWind + React Hook Form + Zod + expo-sqlite + Firebase + expo-secure-store

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US5)
- Include exact file paths in descriptions

## Path Conventions

Per Constitution II (Feature-Based Organization):

- Feature code: `src/features/[feature-name]/models/`, `src/features/[feature-name]/services/`, `src/features/[feature-name]/components/`, `src/features/[feature-name]/screens/`
- Shared code: `src/shared/database/`, `src/shared/sync/`, `src/shared/components/`, `src/shared/hooks/`, `src/shared/utils/`
- Core app: `src/core/config/`, `src/core/theme/`
- Routing: `src/app/` (Expo Router file-based routing)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Initialize Expo project with TypeScript template in root directory
- [x] T002 Install core dependencies: expo-router, nativewind, react-hook-form, @hookform/resolvers, zod, @react-native-community/netinfo, expo-sqlite, expo-secure-store
- [x] T003 [P] Install Firebase dependencies: firebase (JS SDK - compatible with Expo managed workflow)
- [x] T004 [P] Configure NativeWind in babel.config.js and create tailwind.config.ts with theme (colors, spacing, typography)
- [x] T005 [P] Configure ESLint and Prettier in .eslintrc.js and .prettierrc
- [x] T006 [P] Create .env.example file with Firebase config placeholders (EXPO*PUBLIC_FIREBASE*\*)
- [x] T007 Create src/ directory structure: features/, shared/, core/, app/
- [x] T008 [P] Create feature directories: src/features/auth/, src/features/facilities/, src/features/production/, src/features/mortality/, src/features/feeding/, src/features/health-biosecurity/ (each with models/, services/, components/, screens/ subdirectories)
- [x] T009 [P] Create shared directories: src/shared/database/, src/shared/sync/, src/shared/components/, src/shared/hooks/, src/shared/utils/, src/shared/types/
- [x] T010 [P] Create core directories: src/core/config/, src/core/theme/
- [x] T011 Configure TypeScript paths in tsconfig.json for @/_ alias mapping to src/_
- [x] T012 [P] Add .gitignore entries: .env, node_modules/, .expo/, dist/

**Checkpoint**: Project structure and tooling configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database & Storage

- [x] T013 Create SQLite schema initialization in src/shared/database/schema.ts with all tables (users, invitations, chicken_houses, chicken_lots, production_records, mortality_records, feed_batches, feeding_records, health_events, biosecurity_events, sync_queue, audit_log_local)
- [x] T014 Implement database initialization function in src/shared/database/SQLiteDatabase.ts to open database and run schema migrations
- [x] T015 Create database connection singleton in src/shared/database/index.ts
- [x] T016 [P] Create shared TypeScript types in src/shared/types/entities.ts for all entities (User, Invitation, ChickenHouse, ChickenLot, ProductionRecord, MortalityRecord, FeedBatch, FeedingRecord, LotEvent)

### Firebase Configuration

- [x] T017 [P] Create Firebase config initialization in src/core/config/firebase.ts with app initialization, auth, and firestore exports
- [x] T018 [P] Create Firebase security rules in firestore.rules file for all collections
- [x] T019 [P] Create environment variables loader in src/core/config/env.ts to validate EXPO*PUBLIC_FIREBASE*\* variables

### Sync Infrastructure

- [x] T020 Create SyncQueue service in src/shared/sync/SyncQueue.ts to manage local sync queue (insert, query pending, mark synced)
- [x] T021 Create ConflictResolver in src/shared/sync/ConflictResolver.ts implementing Last-Write-Wins (LWW) based on timestamp comparison
- [x] T022 Create SyncService in src/shared/sync/SyncService.ts with batch sync logic (upload pending changes, download updates, apply conflict resolution)
- [x] T023 [P] Create network detection hook in src/shared/hooks/useNetInfo.ts using @react-native-community/netinfo
- [x] T024 [P] Create sync status hook in src/shared/hooks/useSync.ts to trigger sync on connectivity and provide sync status (synced/pending/syncing/failed)

### Shared UI Components (Constitution III: Simplicity-First)

- [x] T025 [P] Create FormInput component in src/shared/components/FormInput.tsx with numeric keyboard support and 48dp touch target
- [x] T026 [P] Create DatePicker component in src/shared/components/DatePicker.tsx with native date picker integration
- [x] T027 [P] Create Button component in src/shared/components/Button.tsx with large touch targets (min 48dp) and haptic feedback
- [x] T028 [P] Create SyncStatusIndicator component in src/shared/components/SyncStatusIndicator.tsx showing synced/pending/syncing/failed states with icons

### Shared Utilities

- [x] T029 [P] Create validation schemas in src/shared/utils/validation.ts with Zod schemas for date (no future), positive integers, decimals, UUID
- [x] T030 [P] Create date utilities in src/shared/utils/date.ts for date formatting, week calculations, and ISO-8601 conversions
- [x] T031 [P] Create ID generation utility in src/shared/utils/id.ts using UUID v4

### App Layout & Navigation

- [x] T032 Create root layout in src/app/\_layout.tsx with database initialization on mount
- [x] T033 Create tabs layout in src/app/(tabs)/\_layout.tsx for main navigation (Home, Production, Lots, Profile)
- [x] T034 [P] Create auth layout in src/app/(auth)/\_layout.tsx for invitation acceptance flow

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 3 - Invitation-Based Authentication (Priority: P1) 🔐

**Goal**: Implement secure invitation-based authentication with offline session caching

**Independent Test**: Admin creates invitation → User accepts → User logs in → Offline access works → Background validation when online

### Models & Services

- [x] T035 [P] [US3] Create User model in src/features/auth/models/User.ts with TypeScript interface matching data-model.md
- [x] T036 [P] [US3] Create Invitation model in src/features/auth/models/Invitation.ts with status transitions (pending → accepted/expired)
- [x] T037 [US3] Create AuthService in src/features/auth/services/AuthService.ts with methods: acceptInvitation(), logout(), validateSession(), getStoredSession(), storeSession(), revokeUser() using expo-secure-store
- [x] T038 [US3] Create InvitationService in src/features/auth/services/InvitationService.ts with methods: generateDeepLink(), validateInvitationToken(), acceptInvitation(), regenerateInvitation()
- [x] T039 [US3] Implement session caching in AuthService using expo-secure-store for session persistence
- [x] T040 [US3] Implement background session validation in AuthService when online BEFORE any sync (validate authStatus != 'revoked' AND device in authorizedDevices, show "Access Denied" if revoked)
- [x] T040a [US3] Implement user revocation in AuthService.revokeUser() (set authStatus='revoked', clear authorizedDevices array, audit log)

### Firebase Functions

- [x] T041 [P] [US3] Create generateInvitation Firebase Function in functions/src/auth/generateInvitation.ts (admin only, generates token for user, saves to Firestore, returns deep link, prevents invitations for revoked users)
- [x] T042 [P] [US3] Create validateInvitation Firebase Function in functions/src/auth/validateInvitation.ts (public, checks token validity, expiry, user not revoked, and returns user info)
- [x] T043 [P] [US3] Create acceptInvitation Firebase Function in functions/src/auth/acceptInvitation.ts (marks user as authenticated, updates user document, invalidates invitation token, prevents acceptance if user is revoked)
- [x] T044 [P] [US3] Create regenerateInvitation Firebase Function in functions/src/auth/regenerateInvitation.ts (admin only, creates new invitation token for pending users, prevents regeneration for revoked users)
- [x] T044a [P] [US3] Create revokeUser Firebase Function in functions/src/auth/revokeUser.ts (admin only, sets authStatus='revoked', clears authorizedDevices, creates audit log, prevents revocation of other admins)

### UI Components & Screens

- [x] T045 [P] [US3] Create InvitationConfirmation component in src/features/auth/components/InvitationConfirmation.tsx showing "Esta es una invitación para: [user_name]" with accept button
- [x] T046 [US3] Create invitation acceptance screen in src/app/(auth)/invite/[token].tsx that validates deep link token and shows confirmation component
- [x] T047 [P] [US3] Create user management screen in src/app/(tabs)/admin/users.tsx (admin only) showing user list with authentication status (pending, authenticated, revoked), generate invitation button, and revoke user button (disabled for already revoked users)
- [x] T048 [US3] Implement deep link generation in InvitationService for Custom URL Scheme (myapp://invite/[token])
- [x] T049 [US3] Implement native share sheet integration for sharing invitation deep links (WhatsApp, SMS, etc.)
- [x] T050 [US3] Add auth state management using React Context in src/features/auth/contexts/AuthContext.tsx to track current user and auth status

### Integration & Validation

- [x] T051 [US3] Add validation for 7-day invitation expiry in InvitationService
- [x] T052 [US3] Add audit logging for user creation and invitation acceptance in src/shared/sync/AuditService.ts
- [x] T053 [US3] Test offline app access with cached session (SC-010: <3s app launch offline)
- [ ] T054 [US3] Test background session validation when online BEFORE any sync operations
- [ ] T054a [US3] Test user revocation flow: admin revokes user → user goes online → session validation fails → "Access Denied" shown → user cannot access app
- [ ] T054b [US3] Test revocation is permanent: revoked user cannot be re-enabled, cannot accept new invitations

**Checkpoint**: Authentication system complete and independently testable

---

## Phase 4: User Story 2 - Chicken Lot and Facility Management (Priority: P1) 🏠

**Goal**: Enable administrators to register chicken houses and lots, track live hen counts with automatic mortality updates

**Independent Test**: Admin creates house → Admin creates lot with initial hen count → Record mortality → Verify automatic hen count update → Offline sync verification

### Models & Services

- [x] T055 [P] [US2] Create ChickenHouse model in src/features/facilities/models/ChickenHouse.ts with TypeScript interface
- [x] T056 [P] [US2] Create ChickenLot model in src/features/facilities/models/ChickenLot.ts with computed fields (currentAgeWeeks, totalMortality, mortalityRate)
- [x] T057 [P] [US2] Create MortalityRecord model in src/features/mortality/models/MortalityRecord.ts
- [x] T058 [US2] Create FacilityService in src/features/facilities/services/FacilityService.ts with methods: createHouse(), listHouses(), createLot(), listLots(), getLotDetails(), updateLiveHenCount()
- [x] T059 [US2] Create MortalityService in src/features/mortality/services/MortalityService.ts with methods: recordMortality(), getMortalityHistory() (includes transaction to update lot live_hen_count)
- [x] T060 [US2] Implement SQLite transaction in MortalityService to ensure atomic mortality record creation + lot update
- [x] T061 [US2] Add sync queue integration in FacilityService and MortalityService to enqueue all CREATE/UPDATE operations

### Validation & Business Logic

- [x] T062 [P] [US2] Create validation schema in src/features/facilities/utils/validation.ts for chicken house (name required, unique) and lot (purchase date not future, initial hen count > 0)
- [x] T063 [P] [US2] Create validation schema in src/features/mortality/utils/validation.ts (hensDied > 0, hensDied <= currentLiveHenCount)
- [x] T064 [US2] Implement edge case handling: prevent mortality if hensDied > liveHenCount, show validation error (FR-020)
- [x] T065 [US2] Implement audit logging for lot creation/deletion and mortality >10% threshold in MortalityService

### UI Components & Screens

- [x] T066 [P] [US2] Create HouseForm component in src/features/facilities/components/HouseForm.tsx with name and description inputs
- [x] T067 [P] [US2] Create LotForm component in src/features/facilities/components/LotForm.tsx with house selector, purchase date picker, hen count input, age input
- [x] T068 [P] [US2] Create LotCard component in src/features/facilities/components/LotCard.tsx displaying lot name, house, live hens, age
- [x] T069 [P] [US2] Create MortalityForm component in src/features/mortality/components/MortalityForm.tsx with lot selector, date picker, mortality count input
- [x] T070 [US2] Create chicken houses list screen in src/app/(tabs)/admin/houses.tsx (admin only) with create house button
- [x] T071 [US2] Create lots list screen in src/app/(tabs)/lots.tsx showing all active lots with live hen counts
- [x] T072 [US2] Create lot details screen in src/app/(tabs)/lots/[lotId].tsx displaying lot info, current age, mortality history, production summary
- [x] T073 [US2] Create mortality entry screen in src/app/(tabs)/mortality/index.tsx with form and recent entries list

### Integration & Validation

- [x] T074 [US2] Test automatic live hen count update when mortality recorded (SC-002: <10s to see update)
- [x] T075 [US2] Test offline lot creation and mortality recording with sync queue
- [x] T076 [US2] Test edge case: mortality exceeds live hen count (should reject)
- [x] T077 [US2] Test edge case: lot with zero live hens (should prevent new production/feeding records)

**Checkpoint**: Facility and lot management complete and independently testable

---

## Phase 5: User Story 1 - Daily Egg Production Recording (Priority: P1) 🥚 MVP

**Goal**: Enable users to record daily egg production with ≤3 taps, view metrics (eggs per hen), work fully offline

**Independent Test**: User selects lot → Enters eggs collected → Saves → Views updated metrics (daily eggs/hen, lifetime eggs/hen) → Offline sync verification

### Models & Services

- [x] T078 [P] [US1] Create ProductionRecord model in src/features/production/models/ProductionRecord.ts with computed field eggsPerHen
- [x] T079 [US1] Create ProductionService in src/features/production/services/ProductionService.ts with methods: recordProduction(), getProductionHistory(), calculateLifetimeEggsPerHen(), getRecentLot()
- [x] T080 [US1] Implement smart defaults in ProductionService: getRecentLot() returns most recently used lot ID from localStorage
- [x] T081 [US1] Implement metrics calculation: daily eggs/hen = eggs / liveHenCount, lifetime eggs/hen = SUM(eggs) / initialHenCount
- [x] T082 [US1] Add sync queue integration in ProductionService to enqueue CREATE/UPDATE operations

### Validation & Business Logic

- [x] T083 [P] [US1] Create validation schema in src/features/production/utils/validation.ts (date not future, eggsCollected >= 0, lotId exists, unique lot+date per day)
- [x] T084 [US1] Implement edge case handling: prevent future dates (FR-017), prevent production for lots with liveHenCount = 0
- [x] T085 [US1] Add sanity check warning (not blocking) if eggsCollected > liveHenCount \* 2

### UI Components & Screens (Constitution III: ≤3 taps)

- [x] T086 [P] [US1] Create ProductionEntryForm component in src/features/production/components/ProductionEntryForm.tsx with lot selector (defaulted to recent), date picker (defaulted to today), numeric input for eggs
- [x] T087 [P] [US1] Create ProductionHistoryList component in src/features/production/components/ProductionHistoryList.tsx showing chronological records with dates, eggs, eggs/hen
- [x] T088 [P] [US1] Create ProductionMetricsCard component in src/features/production/components/ProductionMetricsCard.tsx displaying daily eggs/hen and lifetime eggs/hen
- [x] T089 [US1] Create production entry screen in src/app/(tabs)/production.tsx with form at top (≤3 taps: lot, eggs, save) and recent entries below
- [x] T090 [US1] Add production history to lot details screen (integrate with T072)

### Performance & UX

- [x] T091 [US1] Optimize form for <100ms UI response (FR-UX-003) using React Hook Form uncontrolled components
- [x] T092 [US1] Ensure numeric keyboard opens automatically for egg count input (FR-UX-005)
- [ ] T093 [US1] Test 3-tap workflow: tap lot dropdown (default selected), tap egg input, tap save (SC-001: <30s total time)

### Integration & Validation

- [x] T094 [US1] Test production recording offline and sync when online
- [ ] T095 [US1] Test metrics calculation accuracy (daily and lifetime eggs/hen)
- [ ] T096 [US1] Test smart defaults (current date, recent lot pre-selected)
- [ ] T097 [US1] Test edge case: future date rejection
- [ ] T098 [US1] Test edge case: production for lot with zero hens (should prevent)

**Checkpoint**: Production tracking complete - MVP READY (US1 + US2 + US3 deliver core value)

---

## Phase 6: Sync Implementation (Complete Sync Service)

**Goal**: Complete end-to-end sync with automatic conflict resolution, visual status feedback

**Depends on**: At least US1, US2, US3 complete (data to sync)

### Sync Logic Completion

- [ ] T099 Implement batch upload in SyncService.batchSync() to upload up to 500 records per batch from sync queue
- [ ] T100 Implement incremental download in SyncService.downloadUpdates() querying Firestore for changes since lastSyncTimestamp
- [ ] T101 Implement LWW conflict resolution in ConflictResolver for all entity types (compare localTimestamp vs serverTimestamp)
- [ ] T102 Add automatic sync trigger on connectivity restoration using useNetInfo hook
- [ ] T103 [P] Add manual sync trigger in app header (pull-to-refresh gesture on home screen)
- [ ] T104 Implement sync retry logic with exponential backoff for failed syncs (max 3 retries)
- [ ] T105 Update SyncStatusIndicator to show real-time sync status based on useSync hook state

### Firebase Firestore Listeners

- [ ] T106 [P] Create Firestore listener for users collection in src/shared/sync/listeners/usersListener.ts
- [ ] T107 [P] Create Firestore listener for chicken_lots collection in src/shared/sync/listeners/lotsListener.ts
- [ ] T108 [P] Create Firestore listener for production_records collection in src/shared/sync/listeners/productionListener.ts
- [ ] T109 [P] Create Firestore listener for mortality_records collection in src/shared/sync/listeners/mortalityListener.ts

### Cloud Functions for Server-Side Logic

- [ ] T110 Create onMortalityRecordCreated Firestore trigger in functions/src/mortality/onMortalityRecordCreated.ts to update lot liveHenCount atomically on server
- [ ] T111 [P] Create batchSync Firebase Function in functions/src/sync/batchSync.ts to handle batch uploads from clients
- [ ] T112 Add audit logging in Cloud Functions for critical operations (lot creation, mortality >10%)

### Integration & Validation

- [ ] T113 Test offline changes sync when connectivity returns (SC-003: <30s for 50 records)
- [ ] T114 Test LWW conflict resolution: two users edit same record offline, last write wins on sync
- [ ] T115 Test sync status indicator updates (synced → pending → syncing → synced)
- [ ] T116 Test sync retry logic on network failure
- [ ] T117 Test SC-009: 100% automatic conflict resolution without user intervention

**Checkpoint**: Sync system complete and battle-tested with offline scenarios

---

## Phase 7: User Story 4 - Feed Management and Recording (Priority: P2) 🌾

**Goal**: Track feed batches and daily feeding per lot, calculate feed per hen metrics

**Independent Test**: Register feed batch → Record daily feeding for lot → View feed consumption history and metrics

### Models & Services

- [ ] T118 [P] [US4] Create FeedBatch model in src/features/feeding/models/FeedBatch.ts with computed field remainingQuantityKg
- [ ] T119 [P] [US4] Create FeedingRecord model in src/features/feeding/models/FeedingRecord.ts with computed field feedPerHen
- [ ] T120 [US4] Create FeedingService in src/features/feeding/services/FeedingService.ts with methods: createFeedBatch(), listFeedBatches(), recordFeeding(), getFeedingHistory(), calculateTotalFeedConsumed(), calculateAverageFeedPerHen()
- [ ] T121 [US4] Add sync queue integration in FeedingService

### Validation & Business Logic

- [ ] T122 [P] [US4] Create validation schema in src/features/feeding/utils/validation.ts (preparationDate not future, quantityKg > 0, quantityFedKg > 0)
- [ ] T123 [US4] Implement edge case handling: warn if quantityFedKg > batch.remainingQuantityKg (not blocking, just warning)

### UI Components & Screens

- [ ] T124 [P] [US4] Create FeedBatchForm component in src/features/feeding/components/FeedBatchForm.tsx with batch name, date picker, quantity input (decimal, 2 places)
- [ ] T125 [P] [US4] Create FeedingForm component in src/features/feeding/components/FeedingForm.tsx with lot selector, feed batch selector, date picker, quantity fed input
- [ ] T126 [P] [US4] Create FeedingHistoryList component in src/features/feeding/components/FeedingHistoryList.tsx showing feeding records with dates, batches, quantities
- [ ] T127 [US4] Create feed batches screen in src/app/(tabs)/feeding/batches.tsx with create batch button and batch list
- [ ] T128 [US4] Create feeding entry screen in src/app/(tabs)/feeding/index.tsx with form and recent entries
- [ ] T129 [US4] Add feeding metrics to lot details screen: total feed consumed, average feed/hen

### Integration & Validation

- [ ] T130 [US4] Test offline feed batch registration and feeding recording with sync
- [ ] T131 [US4] Test metrics calculation (total consumed, average per hen)
- [ ] T132 [US4] Test edge case: feeding quantity exceeds batch remaining (should warn)

**Checkpoint**: Feed management complete and independently testable

---

## Phase 8: User Story 5 - Health & Biosecurity Event Tracking (Priority: P2) 💉

**Goal**: Record health events (vaccinations) and biosecurity events (disinfection) with optional notes

**Independent Test**: Record health event with product name and notes → Record biosecurity event → View event history

### Models & Services

- [ ] T133 [P] [US5] Create HealthEvent model in src/features/health-biosecurity/models/HealthEvent.ts with eventType enum (vaccination)
- [ ] T134 [P] [US5] Create BiosecurityEvent model in src/features/health-biosecurity/models/BiosecurityEvent.ts with eventType enum (disinfection)
- [ ] T135 [US5] Create EventService in src/features/health-biosecurity/services/EventService.ts with methods: recordHealthEvent(), recordBiosecurityEvent(), getEventHistory()
- [ ] T136 [US5] Add sync queue integration in EventService

### Validation & Business Logic

- [ ] T137 [P] [US5] Create validation schema in src/features/health-biosecurity/utils/validation.ts (eventDate not future, productName required, notes max 2000 chars)

### UI Components & Screens

- [ ] T138 [P] [US5] Create HealthEventForm component in src/features/health-biosecurity/components/HealthEventForm.tsx with lot selector, date picker, product name input, notes textarea (multi-line)
- [ ] T139 [P] [US5] Create BiosecurityEventForm component in src/features/health-biosecurity/components/BiosecurityEventForm.tsx (same fields as health event)
- [ ] T140 [P] [US5] Create EventHistoryList component in src/features/health-biosecurity/components/EventHistoryList.tsx showing chronological events with type, date, product, notes
- [ ] T141 [US5] Create health events screen in src/app/(tabs)/health/index.tsx with vaccination form and event history
- [ ] T142 [US5] Create biosecurity events screen in src/app/(tabs)/biosecurity/index.tsx with disinfection form and event history
- [ ] T143 [US5] Add event history to lot details screen showing all health and biosecurity events

### Integration & Validation

- [ ] T144 [US5] Test offline event recording with sync
- [ ] T145 [US5] Test multi-line notes support
- [ ] T146 [US5] Test event history display in chronological order

**Checkpoint**: Health and biosecurity tracking complete and independently testable

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Performance Optimization

- [ ] T147 [P] Profile production entry screen with React DevTools Profiler to verify <100ms UI response (SC-001, FR-UX-003)
- [ ] T148 [P] Profile sync service with 50 records to verify <5s sync time (SC-003)
- [ ] T149 [P] Profile app launch time to verify <2s cold start (Constitution performance goal)
- [ ] T150 Optimize SQLite queries with proper indexes (verified via EXPLAIN QUERY PLAN)
- [ ] T151 [P] Test app on physical device with 2GB RAM for responsiveness

### Bundle Size & Memory

- [ ] T152 Run `npx expo export --dump-sourcemap` to check bundle size (<50MB target)
- [ ] T153 [P] Tree-shake unused Firebase modules to reduce bundle size
- [ ] T154 [P] Enable Hermes JavaScript engine for faster startup and lower memory usage

### Error Handling & UX

- [ ] T155 [P] Add plain language error messages throughout the app (Constitution III)
- [ ] T156 [P] Add loading states and skeleton screens for all async operations
- [ ] T157 [P] Add haptic feedback on button presses (Constitution III: optimized for field use)
- [ ] T158 Implement error boundary component in src/shared/components/ErrorBoundary.tsx to catch React errors gracefully

### Accessibility & Localization

- [ ] T159 [P] Add Spanish language strings in src/shared/i18n/es.ts (app primary language per assumption 5)
- [ ] T160 [P] Ensure all interactive elements have accessible labels for screen readers
- [ ] T161 [P] Test font scaling support for users with vision impairments

### Testing & Documentation

- [ ] T162 [P] Create integration test for User Story 1 acceptance scenarios in src/features/production/tests/production.integration.test.ts using React Native Testing Library
- [ ] T163 [P] Create integration test for User Story 2 acceptance scenarios in src/features/facilities/tests/facilities.integration.test.ts
- [ ] T164 [P] Create integration test for User Story 3 acceptance scenarios in src/features/auth/tests/auth.integration.test.ts
- [ ] T165 [P] Create E2E test for offline workflow using Detox: record production offline → go online → verify sync in e2e/offlineSync.test.ts
- [ ] T166 [P] Create E2E test for invitation acceptance flow using Detox in e2e/invitation.test.ts
- [ ] T167 Run quickstart.md validation: verify all setup steps work on fresh clone
- [ ] T168 [P] Update README.md with project overview, setup instructions, and run commands

### Security & Audit

- [ ] T169 [P] Review Firestore security rules to ensure proper access control (admin vs user permissions)
- [ ] T170 [P] Audit expo-secure-store implementation to verify auth tokens are encrypted at rest
- [ ] T171 Test audit logging for critical operations (invitation creation, lot creation/deletion, mortality >10%)

### Deployment Preparation

- [ ] T172 Configure EAS Build for iOS in eas.json with production profile
- [ ] T173 Configure EAS Build for Android in eas.json with production profile
- [ ] T174 [P] Configure EAS Update for OTA updates in eas.json
- [ ] T175 Create app.json with correct bundle identifier, version, splash screen, and icon
- [ ] T176 [P] Generate app icons and splash screens using Expo asset tools

**Checkpoint**: App polished, tested, and ready for production deployment

---

## Phase 10: Future Enhancements (Post-MVP)

**Goal**: Enhance offline-first capabilities with true background synchronization

**Context**: Current `useSync` hook only works while app is open. This phase adds background sync for automatic synchronization even when app is closed or in background, completing the offline-first experience.

### Background Synchronization

- [ ] T177 Install expo-background-fetch dependency for background task management
- [ ] T178 Create BackgroundSyncService in src/shared/sync/BackgroundSyncService.ts implementing background sync logic
- [ ] T179 Create registerBackgroundSync in src/shared/sync/registerBackgroundSync.ts to register and configure background task
- [ ] T180 Configure iOS background permissions in app.json and Info.plist
- [ ] T181 Configure Android background permissions and behavior in app.json and AndroidManifest.xml
- [ ] T182 Implement WiFi-only sync preference to conserve mobile data
- [ ] T183 Add optional push notifications for sync completion status
- [ ] T184 Create tests for background sync scenarios (app closed, background, poor connectivity)
- [ ] T185 Update documentation with background sync setup and configuration guide

**Dependencies**: Requires Phase 2 (Sync infrastructure) and Phase 6 (Sync completion) fully implemented

**Estimated Effort**: 1-2 days

**Checkpoint**: Background sync works reliably with app closed, minimizes battery/data usage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phases 3-5)**: All depend on Foundational phase completion
  - **US3 (Auth)** should complete first (blocks user access)
  - **US2 (Facilities)** should complete second (blocks production/feeding/events)
  - **US1 (Production)** can start after US2 (needs lots to exist)
  - **US4 (Feeding)** can start after US2 (needs lots to exist)
  - **US5 (Health/Biosecurity)** can start after US2 (needs lots to exist)
- **Sync Completion (Phase 6)**: Depends on at least US1+US2+US3 having data to sync
- **Polish (Phase 9)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US3 (Auth)**: Foundation only - independent
- **US2 (Facilities)**: Foundation + US3 (needs authenticated users)
- **US1 (Production)**: Foundation + US3 + US2 (needs lots to record production)
- **US4 (Feeding)**: Foundation + US3 + US2 (needs lots to record feeding)
- **US5 (Health/Biosecurity)**: Foundation + US3 + US2 (needs lots to record events)

### Recommended Execution Order

1. **Phase 1: Setup** (T001-T012)
2. **Phase 2: Foundational** (T013-T034) ← **CRITICAL BLOCKER**
3. **Phase 3: US3 (Auth)** (T035-T054)
4. **Phase 4: US2 (Facilities)** (T055-T077)
5. **Phase 5: US1 (Production)** (T078-T098) ← **MVP READY after this**
6. **Phase 6: Sync Completion** (T099-T117)
7. **Phase 7: US4 (Feeding)** (T118-T132)
8. **Phase 8: US5 (Health/Biosecurity)** (T133-T146)
9. **Phase 9: Polish** (T147-T176)

### Parallel Opportunities

**Within Setup (Phase 1)**:

- T003, T004, T005, T006, T008, T009, T010, T012 can all run in parallel

**Within Foundational (Phase 2)**:

- After T013-T016 complete: T017-T019 (Firebase), T025-T028 (UI components), T029-T031 (utilities) can run in parallel
- T020-T024 (sync infrastructure) can run in parallel after database is ready

**Within User Stories**:

- Models within a story can be parallelized (e.g., T035-T036, T055-T057, T118-T119, T133-T134)
- Firebase Functions can be parallelized (e.g., T041-T044)
- UI components can be parallelized (e.g., T045-T046, T066-T069, T124-T126)

**Across User Stories** (after Foundational complete):

- US1, US4, US5 can be developed in parallel by different team members (all depend only on US2+US3)

**Within Polish (Phase 9)**:

- Most polish tasks are independent and can run in parallel

---

## Parallel Example: User Story 1 (Production)

```bash
# Launch all models together:
Task T078: "Create ProductionRecord model"
# No blocking - can start immediately

# After models complete, launch services:
Task T079: "Create ProductionService"
Task T080: "Implement smart defaults"
Task T081: "Implement metrics calculation"
# All use ProductionRecord model, so must wait for T078

# Launch UI components in parallel:
Task T086: "Create ProductionEntryForm component"
Task T087: "Create ProductionHistoryList component"
Task T088: "Create ProductionMetricsCard component"
# All UI components independent, can run together

# After services + components complete, integrate screens:
Task T089: "Create production entry screen"
Task T090: "Add production history to lot details"
# Both need services and components ready
```

---

## Implementation Strategy

### MVP First (Recommended for quickest value delivery)

**Minimum Viable Product = US3 (Auth) + US2 (Facilities) + US1 (Production)**

1. Complete Phase 1: Setup (T001-T012)
2. Complete Phase 2: Foundational (T013-T034) ← **CRITICAL**
3. Complete Phase 3: US3 Auth (T035-T054)
4. Complete Phase 4: US2 Facilities (T055-T077)
5. Complete Phase 5: US1 Production (T078-T098)
6. Complete Phase 6: Sync Completion (T099-T117)
7. **STOP and VALIDATE**: Test core workflow end-to-end
8. Deploy MVP to production or demo to stakeholders

**MVP Delivers**:

- ✅ Secure invitation-based authentication
- ✅ Offline-first session management
- ✅ Chicken house and lot registration
- ✅ Daily egg production recording (≤3 taps)
- ✅ Automatic mortality tracking with hen count updates
- ✅ Production metrics (eggs per hen, lifetime production)
- ✅ Full offline support with automatic sync
- ✅ Conflict resolution (Last-Write-Wins)

### Incremental Delivery (Recommended for continuous value)

1. **Foundation** (Phases 1-2) → Infrastructure ready
2. **MVP** (Phases 3-5 + Phase 6) → Test independently → Deploy/Demo
3. **Feed Management** (Phase 7) → Test independently → Deploy/Demo
4. **Health/Biosecurity** (Phase 8) → Test independently → Deploy/Demo
5. **Polish** (Phase 9) → Final deployment

Each increment adds value without breaking previous functionality.

---

## Summary

- **Total Tasks**: 176
- **Setup**: 12 tasks
- **Foundational**: 22 tasks (CRITICAL BLOCKER)
- **US3 (Auth)**: 20 tasks
- **US2 (Facilities)**: 23 tasks
- **US1 (Production)**: 21 tasks (MVP COMPLETE)
- **Sync Completion**: 19 tasks
- **US4 (Feeding)**: 15 tasks
- **US5 (Health/Biosecurity)**: 14 tasks
- **Polish**: 30 tasks

**Parallel Opportunities**: 52 tasks marked [P] can run in parallel with other tasks

**Independent Testing**: Each user story (US1-US5) can be tested independently per acceptance scenarios

**MVP Scope**: Phases 1-6 (134 tasks) deliver fully functional offline-first production tracking system

**Format Validation**: ✅ All 176 tasks follow checklist format: `- [ ] [ID] [P?] [Story?] Description with file path`

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability and independent delivery
- **Constitution Alignment**: All tasks respect offline-first (Constitution I), feature-based organization (Constitution II), simplicity-first UX (Constitution III), data integrity (Constitution IV), and testing quality (Constitution V)
- **Commit Strategy**: Commit after each task or logical group of related tasks
- **Checkpoint Validation**: Stop at each checkpoint to validate story works independently before proceeding
- **Avoid**: Vague tasks, same-file conflicts, cross-story dependencies that break independence
