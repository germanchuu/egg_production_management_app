# Tareas Pendientes - Próxima Sesión

Fecha de última actualización: 2026-01-28

## Estado Actual

✅ **Completado hasta ahora:**
- Fase 1: Infraestructura de testing completa (Jest, Detox, mocks, utilities, builders)
- Fase 2: Tests para código existente (49/62 tests pasando - 79%)
- Tarea T018: Reglas de seguridad de Firebase (firestore.rules)
- Todo commitado y pusheado al repositorio remoto

## Tareas Inmediatas para Próxima Sesión

### 1. Desplegar Reglas de Firebase a Producción

**Prioridad: ALTA**

El archivo `firestore.rules` fue creado pero necesita ser desplegado a Firebase para que las reglas de seguridad tomen efecto en el servidor.

**Pasos:**
```bash
# 1. Asegurarse de tener Firebase CLI instalado
npm install -g firebase-tools

# 2. Login a Firebase (si no estás autenticado)
firebase login

# 3. Inicializar Firebase en el proyecto (si no está inicializado)
firebase init firestore
# Seleccionar: Use existing project
# Firestore rules file: firestore.rules (ya existe)
# Firestore indexes file: firestore.indexes.json (crear si no existe)

# 4. Desplegar solo las reglas de Firestore
firebase deploy --only firestore:rules
```

**Validación:**
- Verificar en Firebase Console que las reglas están activas
- Probar que usuarios sin autenticación no pueden acceder a las colecciones
- Probar que usuarios autenticados solo pueden acceder según su rol

**Archivos involucrados:**
- `firestore.rules` - Reglas de seguridad creadas en T018
- `firebase.json` - Configuración de Firebase (se crea con `firebase init`)
- `.firebaserc` - Proyecto de Firebase (se crea con `firebase init`)

**Documentación de referencia:**
- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/cli

---

### 2. Continuar con Fase 3: Test-Driven Development

**Prioridad: ALTA**

Implementar las features pendientes (~85% del código) usando TDD estricto según el plan documentado.

**Orden de implementación recomendado:**

#### 2.1 Infraestructura de Sincronización (Base para todo)
**Tareas:** T019-T023

Implementar antes que nada porque todas las features dependen de la sincronización offline.

**Tests a crear primero (TDD):**
```
tests/unit/shared/sync/SyncQueue.test.ts
tests/unit/shared/sync/ConflictResolver.test.ts
tests/unit/shared/sync/SyncService.test.ts
```

**Código a implementar después:**
```
src/shared/sync/SyncQueue.ts
src/shared/sync/ConflictResolver.ts
src/shared/sync/SyncService.ts
```

**Criterios de aceptación:**
- SyncQueue maneja cola de operaciones pendientes (CREATE, UPDATE, DELETE)
- ConflictResolver implementa estrategia Last-Write-Wins
- SyncService sincroniza en lotes y maneja errores de red
- Tests cubren casos edge: conflictos, errores de red, timeouts

#### 2.2 US3: Authentication (T164)
**¿Por qué primero?** Necesitamos autenticación para probar las demás features.

**Tests de integración a crear primero:**
```
tests/integration/auth/auth.integration.test.ts
```

**Servicios a implementar:**
```
src/features/auth/services/AuthService.ts
src/features/auth/services/InvitationService.ts
src/features/auth/models/User.ts
src/features/auth/models/Invitation.ts
```

**Acceptance Scenarios a cubrir:**
- Admin crea invitación en <2 min (SC-006)
- Usuario acepta invitación y activa cuenta
- Acceso offline con sesión cacheada <3s (SC-010)
- Invitación expira después de 7 días

#### 2.3 US2: Facilities Management (T163)
**Tests de integración a crear primero:**
```
tests/integration/facilities/facilities.integration.test.ts
```

**Servicios a implementar:**
```
src/features/facilities/services/FacilityService.ts
src/features/mortality/services/MortalityService.ts
src/features/facilities/models/ChickenHouse.ts
src/features/facilities/models/ChickenLot.ts
```

**Acceptance Scenarios a cubrir:**
- Admin crea galpón
- Admin crea lote con datos iniciales
- Actualización de gallinas vivas cuando se registra mortalidad <10s (SC-002)
- Prevención de mortalidad > gallinas vivas

#### 2.4 US1: Production Recording (T162)
**Tests de integración a crear primero:**
```
tests/integration/production/production.integration.test.ts
```

**Servicios a implementar:**
```
src/features/production/services/ProductionService.ts
src/features/production/models/ProductionRecord.ts
```

**Acceptance Scenarios a cubrir:**
- Usuario registra producción diaria
- Métricas actualizadas después de guardar
- Datos guardados offline y marcados para sync
- Vista de producción carga en <5s (SC-001)

#### 2.5 E2E Tests (T165, T166)
**Tests E2E a crear:**
```
tests/e2e/offlineSync.e2e.test.ts       # T165
tests/e2e/invitation.e2e.test.ts        # T166
```

**Workflows a cubrir:**
- Workflow completo offline con sync <30s
- Aceptación de invitación y primer login
- Registro de producción end-to-end
- Actualización de mortalidad end-to-end

#### 2.6 Performance Tests (T147-T151)
**Tests de performance a crear:**
```
tests/performance/uiResponse.perf.test.ts          # T147
tests/performance/syncPerformance.perf.test.ts     # T148
tests/performance/coldStart.perf.test.ts           # T149
tests/performance/sqliteQueries.perf.test.ts       # T150
tests/performance/devicePerformance.perf.test.ts   # T151
```

**Métricas a verificar:**
- UI response time <100ms (SC-004)
- Sync de 50 records <5s (SC-003)
- Cold start <2s (SC-007)
- Queries optimizadas con índices
- Performance en dispositivos de gama baja

---

## Metodología TDD para Fase 3

**Ciclo Red-Green-Refactor para cada feature:**

1. **RED**: Escribir test de integración primero (basado en acceptance scenarios)
2. **RED**: Escribir unit tests para building blocks
3. **GREEN**: Implementar código mínimo para pasar tests
4. **REFACTOR**: Mejorar código manteniendo tests verdes
5. **COMMIT**: Commit cuando tests pasen

**Ejemplo para SyncQueue:**

```bash
# 1. RED - Escribir test primero
# Crear tests/unit/shared/sync/SyncQueue.test.ts
npm run test:watch  # Ver test fallar

# 2. GREEN - Implementar código mínimo
# Crear src/shared/sync/SyncQueue.ts
npm run test:watch  # Ver test pasar

# 3. REFACTOR - Mejorar código
# Refactorizar manteniendo tests verdes

# 4. COMMIT
git add .
git commit -m "feat(sync): implement SyncQueue with pending operations (T019)"
```

---

## Criterios de Éxito para Fase 3

Al finalizar Fase 3, debes tener:

- [ ] Todos los tests pasan sin errores
- [ ] Coverage global >80%
- [ ] Coverage de database layer >90%
- [ ] Coverage de services >85%
- [ ] Todos los acceptance scenarios (US1-US5) cubiertos
- [ ] Todos los success criteria (SC-001 a SC-010) verificados
- [ ] Performance tests pasan las métricas definidas
- [ ] E2E tests cubren workflows críticos
- [ ] CI/CD pipeline ejecuta y pasa todos los tests

---

## Comandos de Referencia

```bash
# Tests
npm test                      # Todos los tests
npm run test:watch           # Watch mode
npm run test:coverage        # Con coverage report
npm run test:unit            # Solo unit tests
npm run test:integration     # Solo integration tests
npm run test:performance     # Solo performance tests
npm run test:e2e             # E2E tests (iOS)

# Firebase
firebase login               # Autenticarse
firebase init firestore      # Inicializar Firestore
firebase deploy --only firestore:rules  # Desplegar reglas

# Git
git status                   # Ver estado
git add .                    # Agregar cambios
git commit -m "mensaje"      # Commit
git push                     # Push a remoto
```

---

## Problemas Conocidos a Resolver

### Mocks a Mejorar
Algunos tests están fallando (13/62) por problemas de configuración de mocks, no por bugs en el código:

1. **Firebase tests** (6 fallos):
   - Mejorar estrategia de mocking para Firebase initialization
   - Archivo: `tests/unit/core/config/firebase.test.ts`

2. **SQLiteDatabase tests** (7 fallos):
   - Mejorar mock de expo-sqlite para operaciones de database
   - Archivo: `tests/unit/shared/database/SQLiteDatabase.test.ts`

**Acción:** Resolver estos mocks antes de continuar con Fase 3 para tener base sólida.

---

## Notas Importantes

- **TDD Estricto**: Para features nuevas, SIEMPRE escribir tests ANTES del código
- **No Skip Tests**: Nunca usar `.skip()` o `xit()` en producción
- **Aislamiento**: Cada test debe ser independiente
- **Cleanup**: Siempre limpiar recursos en `afterEach`
- **Performance**: Mantener tests rápidos (<5 min para unit+integration)
- **Coverage != Calidad**: 100% coverage no garantiza calidad, pero <80% es insuficiente

---

## Referencias

- **Plan completo**: `C:\Users\Daniel\.claude\plans\enumerated-questing-curry.md`
- **Testing summary**: `TESTING_SUMMARY.md`
- **Tasks list**: `specs/001-poultry-farm-production-app/tasks.md`
- **Data model**: `specs/001-poultry-farm-production-app/artifacts/data-model.md`
- **Firebase rules**: `firestore.rules`
