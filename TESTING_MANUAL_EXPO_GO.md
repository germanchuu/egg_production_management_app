# Testing Manual con Expo Go - Sincronización de Usuarios

**Fecha de Inicio:** 2026-02-05
**Plataforma:** Expo Go
**Estado:** En Progreso

---

## 🎯 Objetivo

Verificar el flujo completo de sincronización de usuarios usando la **Pantalla de Debug** integrada en la app.

---

## 📱 Preparación

### 1. Iniciar App
```bash
# Asegurarse de estar en el directorio del proyecto
cd "D:\Proyectos\Personales\Aplicación Huevos\gestion_produccion_huevos_app"

# Iniciar Expo
npm start
# o
npx expo start
```

### 2. Abrir Pantalla de Debug
- [ ] Abrir app en Expo Go
- [ ] Abrir Drawer (menú lateral)
- [ ] Navegar a "🛠️ Debug / Testing"
- [ ] Verificar que se muestran las 3 tabs: Users, Queue, Logs

### 3. Firebase Console
- [ ] Abrir https://console.firebase.google.com
- [ ] Seleccionar proyecto
- [ ] Ir a Firestore Database
- [ ] Abrir colección `users`

### 4. Control de Red
- [ ] **iOS:** Settings > Wi-Fi > Desactivar + Settings > Cellular > Desactivar
- [ ] **Android:** Settings > Conexiones > Modo Avión > Activar

---

## 🧪 Escenario 1: CREATE User (Offline → Online)

### Objetivo
Usuario creado offline se sincroniza a Firestore cuando vuelve online.

### 1.1 Preparación Offline
- [ ] Activar **Modo Avión** en el dispositivo
- [ ] En app, ir a Drawer > Admin > Usuarios
- [ ] Verificar lista actual de usuarios

### 1.2 Crear Usuario
- [ ] Tap en botón "+" o "Crear Usuario"
- [ ] Ingresar datos:
  - **Display Name:** `Test Usuario 001`
  - **Role:** User / Empleado
- [ ] Guardar

**Resultado Esperado:**
- [ ] Usuario aparece en lista inmediatamente
- [ ] No hay errores visibles

### 1.3 Verificar en Debug Screen

**Tab "Users":**
- [ ] Ir a Debug screen
- [ ] Tab "👤 Users"
- [ ] Buscar "Test Usuario 001"
- [ ] Verificar campos:
  ```
  ✓ Display Name: Test Usuario 001
  ✓ Role: user (o rol seleccionado)
  ✓ Status: pending
  ✓ Active: ✅
  ✓ Authorized Devices: 0
  ✓ Created: [timestamp actual]
  ✓ Updated: [timestamp actual]
  ```
- [ ] **Anotar ID del usuario:** `________________________`

**Tab "📋 Queue":**
- [ ] Ir a tab "Queue"
- [ ] Buscar entrada para el usuario creado
- [ ] Verificar:
  ```
  ✓ Operation: CREATE - users
  ✓ Status: ⏳ Pending (no synced)
  ✓ Entity ID: [ID del usuario]
  ✓ Created: [timestamp]
  ```

**Tab "📝 Logs":**
- [ ] Ir a tab "Logs"
- [ ] Verificar mensajes:
  ```
  ✓ "✅ Usuarios cargados: X"
  ✓ "✅ Sync queue cargado: X items"
  ```

### 1.4 Sincronización Online

- [ ] **Desactivar Modo Avión**
- [ ] Esperar a que el dispositivo se conecte a Internet
- [ ] En Debug screen, tap en "🔄 Sync Now"
- [ ] Observar logs en tiempo real

**Logs Esperados:**
```
[HH:MM:SS] 🔄 Iniciando sincronización...
[HH:MM:SS] ✅ Sync completado: 1 uploaded, X downloaded
```

### 1.5 Verificar Sync Completado

**Tab "Queue" (después de sync):**
- [ ] Refresh la pantalla
- [ ] Buscar la entrada CREATE del usuario
- [ ] Verificar:
  ```
  ✓ Status: ✅ Synced (verde)
  ✓ Synced: [timestamp]
  ```

### 1.6 Verificar en Firestore Console

- [ ] Ir a Firebase Console > Firestore > Collection `users`
- [ ] Buscar documento con ID del usuario
- [ ] Verificar campos:
  ```json
  {
    "id": "[UUID]",
    "displayName": "Test Usuario 001",
    "role": "user",
    "authStatus": "pending",
    "authorizedDevices": [],
    "isActive": true,
    "createdAt": "2026-02-05T...",
    "updatedAt": "2026-02-05T..."
  }
  ```

### ✅ Resultado Escenario 1
- [ ] **PASÓ** - Usuario sincronizado correctamente
- [ ] **FALLÓ** - Problema: _________________________

---

## 🧪 Escenario 2: UPDATE User (Offline → Online)

### Objetivo
Actualización de usuario offline se sincroniza a Firestore.

### 2.1 Preparación
- [ ] **Activar Modo Avión**
- [ ] Ir a Admin > Usuarios
- [ ] Seleccionar "Test Usuario 001"

### 2.2 Editar Usuario Offline
- [ ] Modificar:
  - **Display Name:** `Test Usuario Modificado`
  - **Role:** Admin (cambiar a diferente rol)
- [ ] Guardar cambios

**Resultado Esperado:**
- [ ] Cambios reflejados en lista inmediatamente

### 2.3 Verificar en Debug Screen

**Tab "Users":**
- [ ] Verificar usuario actualizado:
  ```
  ✓ Display Name: Test Usuario Modificado
  ✓ Role: admin (nuevo rol)
  ✓ Updated: [timestamp más reciente]
  ```

**Tab "Queue":**
- [ ] Nueva entrada:
  ```
  ✓ Operation: UPDATE - users
  ✓ Status: ⏳ Pending
  ✓ Entity ID: [ID del usuario]
  ```

### 2.4 Sincronizar
- [ ] **Desactivar Modo Avión**
- [ ] Debug screen > "🔄 Sync Now"
- [ ] Verificar logs: `✅ Sync completado: 1 uploaded`

### 2.5 Verificar Queue
- [ ] Entrada UPDATE marcada como ✅ Synced

### 2.6 Verificar Firestore
- [ ] Firebase Console > Documento del usuario
- [ ] Verificar:
  ```
  ✓ displayName: "Test Usuario Modificado"
  ✓ role: "admin"
  ✓ updatedAt: [timestamp actualizado]
  ```

### ✅ Resultado Escenario 2
- [ ] **PASÓ** - Update sincronizado correctamente
- [ ] **FALLÓ** - Problema: _________________________

---

## 🧪 Escenario 3: Authorized Device Flow

### Objetivo
Verificar que el login autoriza dispositivos correctamente.

### 3.1 Preparación
- [ ] **Activar Modo Avión**
- [ ] Cerrar sesión (si está logged in)
- [ ] Tener listo el usuario "Test Usuario Modificado" (estado: pending o authenticated)

### 3.2 Login como Usuario
- [ ] Hacer login con el usuario de prueba
- [ ] (El login llamará a `addAuthorizedDevice()` automáticamente)

### 3.3 Verificar en Debug Screen

**Tab "Users":**
- [ ] Buscar el usuario
- [ ] Verificar:
  ```
  ✓ Status: authenticated (cambió de pending)
  ✓ Authorized Devices: 1
  ✓ • [Device Name] (ID truncado)
  ✓ Updated: [timestamp actualizado]
  ```

**Tab "Queue":**
- [ ] Nueva entrada UPDATE para el usuario

### 3.4 Sincronizar
- [ ] **Desactivar Modo Avión**
- [ ] Sync Now
- [ ] Verificar logs exitosos

### 3.5 Verificar Firestore
- [ ] Firebase Console > Documento del usuario
- [ ] Verificar:
  ```javascript
  authorizedDevices: [
    {
      deviceId: "xxx",
      deviceName: "xxx",
      authorizedAt: "2026-02-05T..."
    }
  ]
  authStatus: "authenticated"
  ```

### ✅ Resultado Escenario 3
- [ ] **PASÓ** - Device autorizado correctamente
- [ ] **FALLÓ** - Problema: _________________________

---

## 🧪 Escenario 4: Download Updates (Firestore → Local)

### Objetivo
Cambios en Firestore se descargan y aplican localmente.

### 4.1 Modificar en Firestore
- [ ] Ir a Firebase Console > Firestore > `users`
- [ ] Seleccionar "Test Usuario Modificado"
- [ ] **Editar campo:**
  - `displayName`: `"Modificado desde Firestore"`
  - `updatedAt`: [timestamp actual ISO 8601]
- [ ] Guardar en Firestore

**Timestamp del cambio:** `________________________`

### 4.2 Sincronizar en App
- [ ] Asegurarse de tener conexión
- [ ] Debug screen > "🔄 Sync Now"
- [ ] Observar logs:
  ```
  ✅ Sync completado: 0 uploaded, X downloaded
  ```

### 4.3 Verificar en Debug Screen

**Tab "Users":**
- [ ] Tap "🔃 Refresh"
- [ ] Buscar usuario
- [ ] Verificar:
  ```
  ✓ Display Name: Modificado desde Firestore
  ✓ Updated: [timestamp de Firestore]
  ```

### 4.4 Verificar UI
- [ ] Ir a Admin > Usuarios
- [ ] Verificar que lista muestra "Modificado desde Firestore"

### ✅ Resultado Escenario 4
- [ ] **PASÓ** - Download funcionó correctamente
- [ ] **FALLÓ** - Problema: _________________________

---

## 🧪 Escenario 5: Conflict Resolution (LWW)

### Objetivo
Verificar estrategia Last Write Wins en conflictos.

### 5.1 Crear Conflicto

**Paso A - Modificación Local (Offline):**
- [ ] **Activar Modo Avión**
- [ ] Editar "Modificado desde Firestore":
  - Display Name: `"Cambio Local"`
- [ ] Guardar (NO sincronizar)
- [ ] En Debug > Users, verificar: `"Cambio Local"`
- [ ] **Anotar timestamp local:** `________________________`

**Paso B - Modificación Remota (Firestore):**
- [ ] En Firestore Console, editar MISMO usuario:
  - `displayName`: `"Cambio Remoto"`
  - `updatedAt`: [timestamp 5 minutos DESPUÉS del local]
- [ ] Guardar
- [ ] **Anotar timestamp remoto:** `________________________`

### 5.2 Sincronizar
- [ ] **Desactivar Modo Avión**
- [ ] Debug screen > "🔄 Sync Now"
- [ ] **Observar logs atentamente**

**Logs Esperados:**
```
🔄 Iniciando sincronización...
✅ Sync completado: 1 uploaded, X downloaded
[Posible log de conflicto si está implementado]
```

### 5.3 Verificar Resultado

**Tab "Users":**
- [ ] Refresh
- [ ] Verificar usuario
- [ ] **Resultado esperado (LWW):**
  ```
  ✓ Display Name: "Cambio Remoto" (gana el remoto por timestamp más reciente)
  ✓ Updated: [timestamp remoto]
  ```

### ✅ Resultado Escenario 5
- [ ] **PASÓ** - LWW funcionó (remoto ganó)
- [ ] **PASÓ** - LWW funcionó (local ganó, timestamp local era más reciente)
- [ ] **FALLÓ** - Problema: _________________________

---

## 🧪 Escenario 6: Validaciones

### 6.1 Display Name Único
- [ ] Ir a Admin > Usuarios > Crear Usuario
- [ ] Intentar crear: `"Modificado desde Firestore"` (nombre existente)
- [ ] **Verificar:** Error "Ya existe un usuario con ese nombre"

**Resultado:** ☐ PASÓ / ☐ FALLÓ

### 6.2 Usuario sin Authorized Devices
- [ ] Crear nuevo usuario
- [ ] Debug screen > Tab Users
- [ ] Verificar: `Authorized Devices: 0`
- [ ] Sync
- [ ] Firestore: verificar `authorizedDevices: []`

**Resultado:** ☐ PASÓ / ☐ FALLÓ

### 6.3 Múltiples Dispositivos (Opcional)
Si tienes múltiples dispositivos o puedes simular:
- [ ] Login desde 2-3 dispositivos diferentes
- [ ] Debug screen: verificar lista de dispositivos
- [ ] Firestore: verificar array con múltiples elementos

**Resultado:** ☐ PASÓ / ☐ FALLÓ / ☐ NO APLICABLE

---

## 📊 Resumen de Resultados

| Escenario | Estado | Notas |
|-----------|--------|-------|
| 1. CREATE Offline → Online | ☐ ✅ / ☐ ❌ | |
| 2. UPDATE Offline → Online | ☐ ✅ / ☐ ❌ | |
| 3. Authorized Device Flow | ☐ ✅ / ☐ ❌ | |
| 4. Download Updates | ☐ ✅ / ☐ ❌ | |
| 5. Conflict Resolution (LWW) | ☐ ✅ / ☐ ❌ | |
| 6. Validaciones | ☐ ✅ / ☐ ❌ | |

---

## 🐛 Issues Encontrados

### Issue #1
**Escenario:** _______________________
**Descripción:** _____________________
**Logs capturados:**
```
[Pegar logs de Debug screen > Tab Logs]
```

**Screenshots:** [Si es posible]

---

## 💡 Tips para Testing

### Ver Logs en Tiempo Real
1. Mantener abierta la terminal donde corre Expo
2. Los `console.log` aparecerán ahí
3. También se pueden ver en la Debug screen > Tab Logs

### Limpiar Estado para Re-testing
- [ ] Debug screen > Tab Queue > "🗑️ Limpiar" (limpia sync queue)
- [ ] Debug screen > Tab Logs > "🗑️ Limpiar" (limpia logs de UI)
- [ ] Si necesario, eliminar usuarios de prueba manualmente

### Forzar Estado Offline
- iOS: Centro de Control > Modo Avión
- Android: Deslizar hacia abajo > Modo Avión

### Verificar Conexión
- La app debería mostrar algún indicador de conexión
- Si no sincroniza, verificar permisos de Firebase

---

## ✅ Conclusión

**Fecha de Finalización:** __________

**Estado General:**
- [ ] ✅ Todos los escenarios pasaron
- [ ] ⚠️ Algunos escenarios fallaron (ver Issues)
- [ ] ⏸️ Testing incompleto

**Observaciones:**
```
[Notas finales sobre el testing]
```

**Próximos Pasos:**
- [ ] Resolver issues encontrados
- [ ] Re-testing de escenarios fallidos
- [ ] Testing en dispositivo iOS (si solo se probó Android, o viceversa)
- [ ] Performance testing con más usuarios

---

## 📞 Soporte

Si encuentras problemas durante el testing:
1. Captura logs de Debug screen
2. Captura screenshot del error
3. Anota pasos exactos para reproducir
4. Revisa Firebase Console para verificar estado remoto
