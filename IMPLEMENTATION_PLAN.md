# Plan de Implementación - Egg Production Management App

**Fecha**: 2026-01-29
**Estado Actual**: Fase 2 (Foundational) - 27% Completado
**Próximo Hito**: Completar Fase 2 para desbloquear User Stories

---

## 📊 Análisis del Estado Actual

### ✅ Completado (Fase 1 + Parcial Fase 2)

**Fase 1: Setup (T001-T012)** - ✅ 100% COMPLETADO
- Proyecto Expo inicializado con TypeScript
- Dependencies instaladas (expo-router, nativewind, Firebase, etc.)
- Estructura de directorios creada
- ESLint, Prettier configurados
- Path aliases (@/*) configurados

**Fase 2: Foundational (Parcial)** - ✅ 27% (6/22 tareas)
- ✅ T013: SQLite schema (schema.ts) - 100% coverage
- ✅ T014: Database initialization (SQLiteDatabase.ts) - Implementado parcialmente
- ✅ T015: Database singleton (index.ts)
- ✅ T016: TypeScript entities (entities.ts) - 100% coverage
- ✅ T017: Firebase config (firebase.ts) - 78% coverage
- ✅ T018: Firestore security rules (firestore.rules)

**Testing Infrastructure** - ✅ COMPLETA
- Jest + ts-jest configurado
- Detox para E2E
- better-sqlite3 mock para tests reales
- Test utilities (testDatabase.ts, fixtures, builders)
- **62/62 tests pasando** ✅

---

## 🚧 Tareas Pendientes Críticas (BLOQUEADORAS)

### Fase 2: Foundational - Tareas Restantes (16 tareas)

**CRÍTICO**: Estas tareas BLOQUEAN todas las User Stories (US1-US5)

#### Grupo 1: Core Infrastructure (Prioridad MÁXIMA) 🔴

| Tarea | Descripción | Archivo | Bloqueador Para |
|-------|-------------|---------|-----------------|
| **T019** | Environment variables loader | `src/core/config/env.ts` | Validación de config |
| **T020** | SyncQueue service | `src/shared/sync/SyncQueue.ts` | Offline-first |
| **T021** | ConflictResolver (LWW) | `src/shared/sync/ConflictResolver.ts` | Sync |
| **T022** | SyncService | `src/shared/sync/SyncService.ts` | Sync completo |
| **T023** | useNetInfo hook | `src/shared/hooks/useNetInfo.ts` | Network detection |
| **T024** | useSync hook | `src/shared/hooks/useSync.ts` | Sync status UI |

**Impacto**: Sin estas tareas, NO hay offline-first ni sync → **MVP imposible**

#### Grupo 2: Shared Utilities (Prioridad ALTA) 🟡

| Tarea | Descripción | Archivo | Bloqueador Para |
|-------|-------------|---------|-----------------|
| **T029** | Validation schemas (Zod) | `src/shared/utils/validation.ts` | Form validation |
| **T030** | Date utilities | `src/shared/utils/date.ts` | Date formatting |
| **T031** | ID generation (UUID) | `src/shared/utils/id.ts` | Entity creation |

**Impacto**: Sin estas, NO hay validación de forms → UX pobre

#### Grupo 3: Shared UI Components (Prioridad ALTA) 🟡

| Tarea | Descripción | Archivo | Bloqueador Para |
|-------|-------------|---------|-----------------|
| **T025** | FormInput component | `src/shared/components/FormInput.tsx` | Todos los forms |
| **T026** | DatePicker component | `src/shared/components/DatePicker.tsx` | Fecha inputs |
| **T027** | Button component | `src/shared/components/Button.tsx` | Todas las acciones |
| **T028** | SyncStatusIndicator | `src/shared/components/SyncStatusIndicator.tsx` | Sync feedback |

**Impacto**: Sin estas, NO hay UI reutilizable → Duplicación de código

#### Grupo 4: App Navigation (Prioridad MEDIA) 🟢

| Tarea | Descripción | Archivo | Bloqueador Para |
|-------|-------------|---------|-----------------|
| **T032** | Root layout | `src/app/_layout.tsx` | App routing |
| **T033** | Tabs layout | `src/app/(tabs)/_layout.tsx` | Main navigation |
| **T034** | Auth layout | `src/app/(auth)/_layout.tsx` | Login flows |

**Impacto**: Sin estas, NO hay navegación → App no usable

---

## 🎯 Plan de Ejecución: Fase 2 Completion

### Estrategia: TDD + Parallel Execution

#### Sprint 1: Core Infrastructure (2-3 días) 🔴

**Objetivo**: Implementar sync infrastructure con TDD estricto

**Orden de ejecución**:

1. **T019: Environment variables loader** (30 min)
   ```bash
   # Tests primero
   tests/unit/core/config/env.test.ts
   # Implementación
   src/core/config/env.ts
   ```
   - RED: Test que valida env vars requeridas
   - GREEN: Implementar loader y validator
   - REFACTOR: Añadir mensajes de error claros

2. **T029-T031: Utilities** (PARALELO - 2 horas)
   ```bash
   # Tests primero (paralelo)
   tests/unit/shared/utils/validation.test.ts
   tests/unit/shared/utils/date.test.ts
   tests/unit/shared/utils/id.test.ts

   # Implementación (paralelo)
   src/shared/utils/validation.ts
   src/shared/utils/date.ts
   src/shared/utils/id.ts
   ```
   - RED: Tests para Zod schemas, date functions, UUID gen
   - GREEN: Implementar utilities
   - REFACTOR: Optimizar y documentar

3. **T020-T024: Sync Infrastructure** (SECUENCIAL TDD - 1 día)
   ```bash
   # Orden de implementación
   tests/unit/shared/sync/SyncQueue.test.ts → src/shared/sync/SyncQueue.ts
   tests/unit/shared/sync/ConflictResolver.test.ts → src/shared/sync/ConflictResolver.ts
   tests/unit/shared/sync/SyncService.test.ts → src/shared/sync/SyncService.ts
   tests/unit/shared/hooks/useNetInfo.test.ts → src/shared/hooks/useNetInfo.ts
   tests/unit/shared/hooks/useSync.test.ts → src/shared/hooks/useSync.ts
   ```

   **Casos de test críticos**:
   - SyncQueue: enqueue, dequeue, pending operations
   - ConflictResolver: LWW logic, timestamp comparison
   - SyncService: batch sync, error handling, retry logic
   - useNetInfo: network state changes
   - useSync: sync triggers, status updates

**Checkpoint Sprint 1**: Sync infrastructure completa con tests pasando

---

#### Sprint 2: UI Components (1 día) 🟡

**Objetivo**: Componentes reutilizables con accessibility

**Orden de ejecución** (PARALELO):

```bash
# Tests primero (paralelo)
tests/unit/shared/components/FormInput.test.tsx
tests/unit/shared/components/DatePicker.test.tsx
tests/unit/shared/components/Button.test.tsx
tests/unit/shared/components/SyncStatusIndicator.test.tsx

# Implementación (paralelo)
src/shared/components/FormInput.tsx
src/shared/components/DatePicker.tsx
src/shared/components/Button.tsx
src/shared/components/SyncStatusIndicator.tsx
```

**Casos de test críticos**:
- FormInput: validation errors, numeric keyboard, 48dp touch target
- DatePicker: no future dates, native picker integration
- Button: haptic feedback, loading state, disabled state
- SyncStatusIndicator: 4 states (synced/pending/syncing/failed)

**Checkpoint Sprint 2**: Shared UI lista para features

---

#### Sprint 3: App Navigation (4 horas) 🟢

**Objetivo**: Estructura de navegación funcional

**Orden de ejecución** (SECUENCIAL):

```bash
# Implementación + integration tests
src/app/_layout.tsx → tests/integration/app/root-layout.test.tsx
src/app/(tabs)/_layout.tsx → tests/integration/app/tabs-navigation.test.tsx
src/app/(auth)/_layout.tsx → tests/integration/app/auth-flow.test.tsx
```

**Casos de test críticos**:
- Root layout: database initialization on mount
- Tabs layout: navigation entre tabs
- Auth layout: redirect cuando no autenticado

**Checkpoint Sprint 3**: ✅ **FASE 2 COMPLETA** → User Stories desbloqueadas

---

## 🚀 Post-Fase 2: User Story Implementation

Una vez completada Fase 2, seguir orden del tasks.md:

### Fase 3: US3 - Authentication (T035-T054) - 1 semana
- Invitation-based auth
- Offline session caching
- Firebase Functions (createInvitation, acceptInvitation)

### Fase 4: US2 - Facilities (T055-T077) - 1 semana
- Chicken houses y lots
- Mortality tracking con automatic hen count update

### Fase 5: US1 - Production (T078-T098) - 1 semana
- Daily egg production (≤3 taps)
- Metrics (eggs/hen, lifetime production)

**→ MVP READY después de Fase 5**

### Fase 6: Sync Completion (T099-T117) - 3 días
- Batch sync (500 records)
- Firestore listeners
- Cloud Functions triggers

### Fases 7-9: Features adicionales + Polish
- US4: Feed Management
- US5: Health & Biosecurity
- Performance optimization, E2E tests, deployment

---

## 📋 Checklist de Ejecución

### Pre-Ejecución
- [ ] Actualizar PENDING_TASKS.md con este plan
- [ ] Confirmar Firebase project configurado
- [ ] Verificar que 62/62 tests pasan
- [ ] Crear branch feature/phase-2-completion

### Sprint 1: Core Infrastructure
- [ ] T019: env.ts (TDD)
- [ ] T029: validation.ts (TDD)
- [ ] T030: date.ts (TDD)
- [ ] T031: id.ts (TDD)
- [ ] T020: SyncQueue.ts (TDD)
- [ ] T021: ConflictResolver.ts (TDD)
- [ ] T022: SyncService.ts (TDD)
- [ ] T023: useNetInfo.ts (TDD)
- [ ] T024: useSync.ts (TDD)
- [ ] Commit: "feat(foundation): implement sync infrastructure (T019-T024, T029-T031)"

### Sprint 2: UI Components
- [ ] T025: FormInput.tsx (TDD)
- [ ] T026: DatePicker.tsx (TDD)
- [ ] T027: Button.tsx (TDD)
- [ ] T028: SyncStatusIndicator.tsx (TDD)
- [ ] Commit: "feat(ui): add shared components (T025-T028)"

### Sprint 3: Navigation
- [ ] T032: _layout.tsx (root)
- [ ] T033: (tabs)/_layout.tsx
- [ ] T034: (auth)/_layout.tsx
- [ ] Commit: "feat(navigation): implement app layouts (T032-T034)"

### Post-Fase 2
- [ ] Ejecutar `npm test` → Verificar todos los tests pasan
- [ ] Ejecutar `npm run lint` → Sin errores
- [ ] Actualizar tasks.md marcando T019-T034 como [x]
- [ ] Merge a main branch
- [ ] Tag: `v0.2.0-foundation-complete`
- [ ] **LISTO PARA FASE 3** ✅

---

## 🔧 Comandos de Desarrollo

### TDD Workflow (Ciclo Red-Green-Refactor)

```bash
# 1. RED - Escribir test primero
npm run test:watch  # Ver test fallar (RED)

# 2. GREEN - Implementar código mínimo
# Editar archivo de implementación
npm run test:watch  # Ver test pasar (GREEN)

# 3. REFACTOR - Mejorar código
# Refactorizar manteniendo tests verdes

# 4. COMMIT
git add .
git commit -m "feat(scope): implement X (TYYY)"
```

### Testing Commands

```bash
npm test                      # Todos los tests
npm run test:watch           # Watch mode (TDD)
npm run test:coverage        # Coverage report
npm run test:unit            # Solo unit tests
npm run lint                 # ESLint check
npm run lint:fix             # Auto-fix linting
```

---

## 📊 Métricas de Éxito

### Fase 2 Completa cuando:
- ✅ Todas las tareas T019-T034 marcadas como [x]
- ✅ Tests coverage >80% en shared/sync/, shared/utils/, shared/components/
- ✅ Todos los tests pasan (target: 100+ tests)
- ✅ No errores de ESLint
- ✅ App inicia sin crashes
- ✅ Navegación funcional entre layouts

### MVP Ready (Post-Fase 5) cuando:
- ✅ User puede crear cuenta vía invitation
- ✅ Admin puede crear house y lot
- ✅ User puede registrar producción diaria (≤3 taps)
- ✅ App funciona 100% offline
- ✅ Sync automático cuando online
- ✅ Tests E2E pasan workflow completo

---

## 🎯 Uso de `/speckit.implement`

**Cuándo usar**: Después de este análisis, para ejecutar las tareas sistemáticamente

**Ejemplo de uso**:
```bash
# En Claude Code CLI
/speckit.implement
```

El comando:
1. Lee tasks.md y encuentra tareas pendientes
2. Implementa siguiendo metodología TDD
3. Ejecuta tests después de cada tarea
4. Hace commits automáticos cuando tests pasan

**Configuración recomendada**:
- Empezar con T019 (env.ts) como prueba
- Si funciona bien, continuar con T020-T024 (sync)
- Revisar código generado antes de merge

---

## 📝 Notas Importantes

### Principios de Implementación
1. **TDD Estricto**: SIEMPRE tests ANTES del código
2. **No Skip Tests**: Nunca usar `.skip()` o `xit()`
3. **Aislamiento**: Tests independientes, no dependen del orden
4. **Cleanup**: Siempre `afterEach` para limpiar recursos
5. **Coverage != Calidad**: Apuntar a >80% pero con tests significativos

### Decisiones Arquitectónicas
- **Offline-first**: Local SQLite como source of truth
- **Sync**: Last-Write-Wins (LWW) basado en timestamps
- **Validation**: Zod schemas en frontend + Firebase rules en backend
- **UI**: NativeWind (Tailwind) + React Hook Form
- **State**: React Context para auth, React Query para server state (futuro)

### Riesgos Identificados
1. **Sync Complexity**: LWW puede perder edits concurrentes
   - Mitigación: Timestamps precisos + audit log
2. **Offline Storage**: SQLite puede crecer mucho
   - Mitigación: Purge policy para datos antiguos (>6 meses)
3. **Network Flakiness**: Sync puede fallar frecuentemente
   - Mitigación: Retry logic + exponential backoff

---

## 📚 Referencias

- **Tasks completas**: `specs/001-poultry-farm-production-app/tasks.md`
- **Data model**: `specs/001-poultry-farm-production-app/artifacts/data-model.md`
- **Testing summary**: `TESTING_SUMMARY.md`
- **Firebase rules**: `firestore.rules`
- **Constitution**: Ver comments en tasks.md

---

**Última actualización**: 2026-01-29
**Próxima revisión**: Después de completar Fase 2
**Responsable**: Development Team
