# Testing Manual - Sincronización de Usuarios

**Fecha de Inicio:** 2026-02-05
**Estado:** En Progreso

---

## 🎯 Objetivo
Verificar que el flujo completo de sincronización de usuarios funciona correctamente:
- CREATE offline → sync → Firestore
- UPDATE offline → sync → Firestore
- Authorized Device flow
- Download updates Firestore → Local
- Conflict Resolution

---

## 📝 Pre-requisitos

### Herramientas Necesarias
- [ ] App ejecutándose en emulador/dispositivo
- [ ] Firebase Console abierta (https://console.firebase.google.com)
- [ ] Herramienta para inspeccionar SQLite (DB Browser, ADB, etc.)
- [ ] Control de conexión de red (modo avión o Network conditions)

### Base de Datos
- **Ruta DB Local:** Verificar en logs de app o usar ADB
- **Firestore:** Collection `users` en Firebase Console

### Comandos Útiles
```bash
# Ver schema de tabla users
adb shell "run-as com.yourapp cat /data/data/com.yourapp/databases/app.db" | sqlite3 ".schema users"

# Ver todos los usuarios
adb shell "run-as com.yourapp cat /data/data/com.yourapp/databases/app.db" | sqlite3 "SELECT * FROM users;"

# Ver sync queue
adb shell "run-as com.yourapp cat /data/data/com.yourapp/databases/app.db" | sqlite3 "SELECT * FROM sync_queue WHERE entity_type = 'users';"

# Limpiar sync queue (si necesario)
adb shell "run-as com.yourapp cat /data/data/com.yourapp/databases/app.db" | sqlite3 "DELETE FROM sync_queue WHERE entity_type = 'users';"
```

---

## 🧪 Escenario 1: CREATE User (Offline → Online)

### Objetivo
Verificar que un usuario creado offline se sincroniza correctamente a Firestore cuando la app vuelve online.

### Pasos

#### 1.1 Setup
- [ ] Desconectar red (activar modo avión en dispositivo/emulador)
- [ ] Abrir app y navegar a `/admin/users`
- [ ] Verificar que la app está offline (verificar indicador UI si existe)

#### 1.2 Crear Usuario Offline
- [ ] Tap en botón "Crear Usuario" o similar
- [ ] Ingresar datos:
  - **Display Name:** "Usuario Test 001"
  - **Role:** "User" (o "Empleado")
- [ ] Guardar usuario
- [ ] **Verificar:** Usuario aparece en lista local inmediatamente
- [ ] **Anotar:** ID del usuario creado (visible en logs o UI)

**Usuario ID creado:** `_________________`

#### 1.3 Verificar Base de Datos Local

Ejecutar queries o revisar con DB Browser:

```sql
-- Verificar registro en tabla users
SELECT * FROM users WHERE display_name = 'Usuario Test 001';
```

**Checklist de campos:**
- [ ] `id`: UUID presente
- [ ] `display_name`: "Usuario Test 001"
- [ ] `role`: "user" (o el valor correspondiente)
- [ ] `auth_status`: "pending"
- [ ] `authorized_devices`: "[]" (array vacío como string JSON)
- [ ] `is_active`: 1
- [ ] `invitation_id`: NULL
- [ ] `created_at`: timestamp ISO 8601
- [ ] `updated_at`: timestamp ISO 8601

```sql
-- Verificar entrada en sync_queue
SELECT * FROM sync_queue WHERE entity_type = 'users' AND operation = 'CREATE';
```

**Checklist sync_queue:**
- [ ] `entity_type`: "users"
- [ ] `entity_id`: [mismo ID del usuario]
- [ ] `operation`: "CREATE"
- [ ] `synced`: 0 (no sincronizado)
- [ ] `created_at`: timestamp

#### 1.4 Sincronización
- [ ] Conectar red (desactivar modo avión)
- [ ] En la app, hacer pull-to-refresh en lista de usuarios
- [ ] **Observar:** Loading indicator durante sync
- [ ] **Observar logs:** Verificar mensajes de sync en consola

**Logs esperados:**
```
[SyncService] Starting sync...
[SyncService] Uploading pending changes...
[SyncService] Uploaded 1 changes
[SyncService] Downloading updates...
[SyncService] Sync completed
```

#### 1.5 Verificar Sync Queue Actualizado

```sql
-- Verificar que entrada está marcada como sincronizada
SELECT * FROM sync_queue WHERE entity_type = 'users' AND entity_id = '[USER_ID]';
```

- [ ] `synced`: 1 (marcado como sincronizado)
- [ ] `synced_at`: timestamp actualizado

#### 1.6 Verificar Firestore

1. [ ] Abrir Firebase Console → Firestore Database
2. [ ] Navegar a collection `users`
3. [ ] Buscar documento con ID del usuario creado

**Checklist de campos en Firestore:**
- [ ] `id`: [UUID del usuario]
- [ ] `displayName`: "Usuario Test 001"
- [ ] `role`: "user"
- [ ] `authStatus`: "pending"
- [ ] `authorizedDevices`: [] (array vacío)
- [ ] `isActive`: true
- [ ] `invitationId`: no existe o undefined
- [ ] `createdAt`: timestamp string ISO 8601
- [ ] `updatedAt`: timestamp string ISO 8601

#### 1.7 Resultado
- [ ] ✅ PASÓ: Usuario sincronizado correctamente
- [ ] ❌ FALLÓ: [Describir problema]

**Notas:**
```
[Espacio para anotaciones sobre este escenario]
```

---

## 🧪 Escenario 2: UPDATE User (Offline → Online)

### Objetivo
Verificar que las actualizaciones de un usuario offline se sincronizan a Firestore.

### Pasos

#### 2.1 Setup
- [ ] Desconectar red (modo avión)
- [ ] En lista de usuarios, seleccionar "Usuario Test 001" (o el usuario creado en Escenario 1)
- [ ] Abrir pantalla de edición

#### 2.2 Editar Usuario Offline
- [ ] Modificar datos:
  - **Display Name:** "Usuario Modificado 001"
  - **Role:** Cambiar a "Admin" (o "Administrador")
- [ ] Guardar cambios
- [ ] **Verificar:** Cambios reflejados en lista inmediatamente

#### 2.3 Verificar Base de Datos Local

```sql
-- Verificar actualización en tabla users
SELECT display_name, role, updated_at
FROM users
WHERE id = '[USER_ID]';
```

**Checklist:**
- [ ] `display_name`: "Usuario Modificado 001"
- [ ] `role`: "admin" (o valor correspondiente)
- [ ] `updated_at`: timestamp actualizado (más reciente que antes)

```sql
-- Verificar nueva entrada en sync_queue
SELECT * FROM sync_queue
WHERE entity_type = 'users'
  AND entity_id = '[USER_ID]'
  AND operation = 'UPDATE'
  AND synced = 0;
```

**Checklist sync_queue:**
- [ ] Nueva entrada con operation = "UPDATE"
- [ ] `synced`: 0

#### 2.4 Sincronización
- [ ] Conectar red
- [ ] Pull-to-refresh en lista
- [ ] **Observar:** Sync completado sin errores

#### 2.5 Verificar Sync Queue
- [ ] Entrada UPDATE marcada como `synced = 1`

#### 2.6 Verificar Firestore
1. [ ] Abrir documento del usuario en Firestore Console
2. [ ] Verificar campos actualizados:
   - [ ] `displayName`: "Usuario Modificado 001"
   - [ ] `role`: "admin"
   - [ ] `updatedAt`: timestamp actualizado

#### 2.7 Resultado
- [ ] ✅ PASÓ: Actualización sincronizada correctamente
- [ ] ❌ FALLÓ: [Describir problema]

**Notas:**
```
[Espacio para anotaciones]
```

---

## 🧪 Escenario 3: Authorized Device Flow

### Objetivo
Verificar que el flujo de autorización de dispositivo funciona y sincroniza correctamente.

### Pasos

#### 3.1 Setup
- [ ] Desconectar red (modo avión)
- [ ] Identificar usuario en estado "pending" (puede ser el creado en Escenario 1)
- [ ] Preparar para hacer login como ese usuario

#### 3.2 Login con Usuario Pendiente
- [ ] Hacer login con el usuario pendiente
- [ ] **Observar:** App llama a `addAuthorizedDevice()`
- [ ] **Verificar:** Login exitoso (si las validaciones lo permiten)

**Device ID generado:** `_________________`

#### 3.3 Verificar Base de Datos Local

```sql
-- Verificar authorized_devices actualizado
SELECT authorized_devices, auth_status
FROM users
WHERE id = '[USER_ID]';
```

**Checklist:**
- [ ] `authorized_devices`: JSON con 1 dispositivo
  ```json
  [{"deviceId":"xxx","deviceName":"xxx","authorizedAt":"xxx"}]
  ```
- [ ] `auth_status`: "authenticated" (cambió de "pending")

```sql
-- Verificar sync queue
SELECT * FROM sync_queue
WHERE entity_type = 'users'
  AND entity_id = '[USER_ID]'
  AND operation = 'UPDATE'
  AND synced = 0;
```

- [ ] Nueva entrada UPDATE en queue

#### 3.4 Sincronización
- [ ] Conectar red
- [ ] Trigger sync (automático o manual)

#### 3.5 Verificar Firestore
1. [ ] Abrir documento del usuario en Firestore
2. [ ] Verificar:
   - [ ] `authorizedDevices`: Array con 1 elemento
     ```javascript
     [{
       deviceId: "xxx",
       deviceName: "xxx",
       authorizedAt: "2026-02-05T..."
     }]
     ```
   - [ ] `authStatus`: "authenticated"

#### 3.6 Resultado
- [ ] ✅ PASÓ: Device autorizado y sincronizado
- [ ] ❌ FALLÓ: [Describir problema]

**Notas:**
```
[Espacio para anotaciones]
```

---

## 🧪 Escenario 4: Download Updates (Firestore → Local)

### Objetivo
Verificar que los cambios realizados directamente en Firestore se descargan a la app.

### Pasos

#### 4.1 Modificar en Firestore Console
- [ ] Abrir Firestore Console → Collection `users`
- [ ] Seleccionar documento "Usuario Modificado 001"
- [ ] Editar campo `displayName`:
  - **Nuevo valor:** "Modificado desde Firestore"
- [ ] Editar campo `updatedAt`:
  - **Nuevo valor:** Timestamp actual (ISO 8601)
- [ ] Guardar cambios en Firestore

**Timestamp del cambio remoto:** `_________________`

#### 4.2 Sincronización en App
- [ ] En la app, hacer pull-to-refresh
- [ ] **Observar:** Download en progreso

#### 4.3 Verificar Base de Datos Local

```sql
-- Verificar que el cambio se descargó
SELECT display_name, updated_at
FROM users
WHERE id = '[USER_ID]';
```

**Checklist:**
- [ ] `display_name`: "Modificado desde Firestore"
- [ ] `updated_at`: timestamp del cambio remoto

#### 4.4 Verificar UI
- [ ] Lista de usuarios muestra "Modificado desde Firestore"
- [ ] Refresh visual completado

#### 4.5 Resultado
- [ ] ✅ PASÓ: Cambios remotos descargados correctamente
- [ ] ❌ FALLÓ: [Describir problema]

**Notas:**
```
[Espacio para anotaciones]
```

---

## 🧪 Escenario 5: Conflict Resolution (LWW)

### Objetivo
Verificar que la estrategia Last Write Wins (LWW) resuelve conflictos correctamente.

### Pasos

#### 5.1 Crear Conflicto

**Modificación Local (Offline):**
- [ ] Desconectar red (modo avión)
- [ ] Editar "Usuario Modificado 001":
  - **Display Name:** "Cambio Local"
- [ ] Guardar (NO sincronizar todavía)
- [ ] **Anotar timestamp local:** `_________________`

**Modificación Remota (Firestore):**
- [ ] En Firestore Console, editar MISMO usuario:
  - **displayName:** "Cambio Remoto"
  - **updatedAt:** Timestamp 5 minutos DESPUÉS del local
- [ ] Guardar en Firestore
- [ ] **Anotar timestamp remoto:** `_________________`

#### 5.2 Sincronización
- [ ] Conectar red en app
- [ ] Trigger sync
- [ ] **Observar logs:** Mensajes de conflicto

**Logs esperados:**
```
[ConflictResolver] Conflict detected for users/[ID]
[ConflictResolver] Local timestamp: [timestamp local]
[ConflictResolver] Remote timestamp: [timestamp remoto]
[ConflictResolver] Winner: remote (LWW)
```

#### 5.3 Verificar Resolución

```sql
-- Verificar valor final en local
SELECT display_name, updated_at
FROM users
WHERE id = '[USER_ID]';
```

**Checklist (esperado: remoto gana por tener timestamp más reciente):**
- [ ] `display_name`: "Cambio Remoto"
- [ ] `updated_at`: timestamp remoto

#### 5.4 Resultado
- [ ] ✅ PASÓ: Conflicto resuelto correctamente (LWW)
- [ ] ❌ FALLÓ: [Describir problema]

**Notas:**
```
[Espacio para anotaciones]
```

---

## 🧪 Escenario 6: Casos Edge

### 6.1 Usuario sin authorizedDevices

**Test:**
- [ ] Crear nuevo usuario
- [ ] Verificar `authorized_devices = "[]"` en SQLite
- [ ] Sync a Firestore
- [ ] Verificar `authorizedDevices = []` en Firestore

**Resultado:** ☐ PASÓ / ☐ FALLÓ

### 6.2 Usuario con Múltiples Dispositivos

**Test:**
- [ ] Agregar 2-3 dispositivos a un usuario (simular múltiples logins)
- [ ] Verificar array en SQLite: `[{...}, {...}, {...}]`
- [ ] Sync a Firestore
- [ ] Verificar array completo en Firestore

**Resultado:** ☐ PASÓ / ☐ FALLÓ

### 6.3 Campos Opcionales Null/Undefined

**Test:**
- [ ] Crear usuario sin `invitationId`
- [ ] Verificar `invitation_id = NULL` en SQLite
- [ ] Verificar campo ausente o undefined en Firestore
- [ ] Usuario sin `lastAccessAt` maneja correctamente

**Resultado:** ☐ PASÓ / ☐ FALLÓ

### 6.4 Validación: Display Name Único

**Test:**
- [ ] Crear usuario "Juan Pérez"
- [ ] Intentar crear otro usuario "Juan Pérez"
- [ ] Verificar error: "Ya existe un usuario con ese nombre"

**Resultado:** ☐ PASÓ / ☐ FALLÓ

---

## 📊 Resumen de Resultados

| Escenario | Estado | Notas |
|-----------|--------|-------|
| 1. CREATE Offline → Online | ☐ PASÓ / ☐ FALLÓ | |
| 2. UPDATE Offline → Online | ☐ PASÓ / ☐ FALLÓ | |
| 3. Authorized Device Flow | ☐ PASÓ / ☐ FALLÓ | |
| 4. Download Updates | ☐ PASÓ / ☐ FALLÓ | |
| 5. Conflict Resolution | ☐ PASÓ / ☐ FALLÓ | |
| 6. Casos Edge | ☐ PASÓ / ☐ FALLÓ | |

---

## 🐛 Issues Encontrados

### Issue #1
**Escenario:** [Número de escenario]
**Descripción:** [Qué falló]
**Pasos para reproducir:**
1.
2.
3.

**Comportamiento esperado:**
[Qué debería pasar]

**Comportamiento actual:**
[Qué está pasando]

**Logs:**
```
[Logs relevantes]
```

---

## ✅ Conclusiones Finales

**Fecha de Finalización:** __________

**Estado General:**
- ☐ Todos los escenarios pasaron
- ☐ Algunos escenarios fallaron (ver Issues)
- ☐ Testing incompleto

**Próximos Pasos:**
- [ ] Resolver issues encontrados
- [ ] Re-testing de escenarios que fallaron
- [ ] Testing en dispositivo real (no solo emulador)
- [ ] Performance testing con múltiples usuarios

**Firma de Aprobación:**
- Testing realizado por: __________
- Fecha: __________
