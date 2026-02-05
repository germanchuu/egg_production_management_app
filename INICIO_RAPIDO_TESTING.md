# 🚀 Inicio Rápido - Testing Manual

## ¿Qué vamos a hacer?

Probar que la sincronización de usuarios funciona correctamente en todos los escenarios:
- ✅ Crear usuarios offline y sincronizar
- ✅ Actualizar usuarios offline y sincronizar
- ✅ Descargar cambios de Firestore
- ✅ Resolver conflictos
- ✅ Autorizar dispositivos

## 🛠️ Nueva Herramienta: Pantalla de Debug

He creado una pantalla especial **"🛠️ Debug / Testing"** que te permite:
- 👤 Ver todos los usuarios en la BD local
- 📋 Ver el estado de la cola de sincronización (sync queue)
- 📝 Ver logs de actividad en tiempo real
- 🔄 Ejecutar sincronización manual
- 🔃 Refrescar datos

## 📱 Paso 1: Iniciar la App

```bash
# En la terminal, en el directorio del proyecto:
npm start
# O:
npx expo start
```

Luego:
1. Escanea el QR code con Expo Go
2. Espera a que la app cargue

## 🎯 Paso 2: Acceder a Debug Screen

1. Abrir el **Drawer** (menú lateral, icono ☰ arriba a la izquierda)
2. Buscar y tap en **"🛠️ Debug / Testing"**
3. Deberías ver 3 tabs:
   - 👤 **Users** - Lista de usuarios en BD local
   - 📋 **Queue** - Cola de sincronización pendiente
   - 📝 **Logs** - Logs de actividad

## ✅ Paso 3: Verificación Inicial

Antes de empezar, verifica que todo funciona:

### En la App:
- [ ] Debug screen abre sin errores
- [ ] Tab "Users" muestra usuarios (puede estar vacío si no hay usuarios)
- [ ] Tab "Queue" carga (puede estar vacío)
- [ ] Tab "Logs" muestra mensajes iniciales
- [ ] Botón "🔄 Sync Now" está visible
- [ ] Botón "🔃 Refresh" está visible

### En Firebase Console:
- [ ] Abrir https://console.firebase.google.com
- [ ] Ir a tu proyecto
- [ ] Firestore Database > Collection `users` existe
- [ ] (Puede estar vacío, está bien)

## 🧪 Paso 4: Primer Test Rápido (5 minutos)

Vamos a hacer un test simple para verificar que todo funciona:

### 4.1 Crear Usuario Online
1. **CON INTERNET CONECTADO**
2. Ir a Drawer > Admin > Usuarios
3. Crear nuevo usuario:
   - Nombre: "Test Rápido"
   - Rol: User
4. Guardar

### 4.2 Verificar en Debug Screen
1. Ir a Debug screen
2. Tab "👤 Users"
3. Deberías ver "Test Rápido" en la lista
4. Anotar el **ID del usuario** (lo necesitarás)

### 4.3 Verificar Sync Queue
1. Tab "📋 Queue"
2. Deberías ver una entrada:
   - **CREATE - users**
   - **Status:** ⏳ Pending (amarillo)

### 4.4 Sincronizar
1. Tap en "🔄 Sync Now"
2. Esperar ~2-3 segundos
3. Tab "📝 Logs" debería mostrar:
   ```
   ✅ Sync completado: 1 uploaded, X downloaded
   ```

### 4.5 Verificar Queue Actualizado
1. Tab "📋 Queue"
2. Tap "🔃 Refresh"
3. La entrada CREATE debería estar:
   - **Status:** ✅ Synced (verde)

### 4.6 Verificar en Firestore
1. Ir a Firebase Console
2. Firestore > Collection `users`
3. Deberías ver el documento "Test Rápido"
4. Verificar que tiene todos los campos correctos

---

## ✅ Si el Test Rápido PASÓ:

**¡Excelente!** Todo está funcionando. Ahora podemos proceder con el testing completo.

Continúa con el archivo: **`TESTING_MANUAL_EXPO_GO.md`**

Allí encontrarás:
- 6 escenarios detallados
- Checklist paso a paso
- Qué verificar en cada punto
- Cómo interpretar resultados

---

## ❌ Si el Test Rápido FALLÓ:

### Problema 1: Debug screen no abre
**Error:** "Cannot find module" o similar
**Solución:**
```bash
# Reinstalar dependencias
npm install
# Reiniciar Expo
npm start -- --clear
```

### Problema 2: Sync no funciona
**Síntomas:** "🔄 Sync Now" no hace nada o da error
**Verificar:**
- [ ] Internet conectado
- [ ] Firebase configurado correctamente
- [ ] Ver logs en terminal de Expo
- [ ] Ver tab "📝 Logs" en Debug screen

**Logs de Error Comunes:**
```
❌ Error en sync: [PERMISSION_DENIED]
→ Verificar reglas de Firestore

❌ Error en sync: [NETWORK_ERROR]
→ Verificar conexión a Internet

❌ Error en sync: [APP_NOT_INITIALIZED]
→ Verificar configuración de Firebase
```

### Problema 3: Queue no actualiza después de sync
**Verificar:**
1. Tab "📝 Logs" - ¿hay mensajes de error?
2. Firebase Console - ¿se creó el documento?
3. Tap "🔃 Refresh" en Debug screen
4. Si el documento existe en Firestore pero queue sigue "Pending":
   - Posible bug en `markSynced()`
   - Ver logs en terminal

### Problema 4: Usuario no aparece en Tab "Users"
**Verificar:**
1. Ir a Admin > Usuarios - ¿está en la lista?
2. Tap "🔃 Refresh" en Debug screen
3. Ver logs: ¿hay errores al cargar?

---

## 📋 Checklist Pre-Testing

Antes de comenzar el testing completo, verifica:

- [ ] App corre sin errores
- [ ] Debug screen accesible
- [ ] Firebase Console accesible
- [ ] Puedes activar/desactivar Modo Avión en tu dispositivo
- [ ] Test rápido PASÓ

## 🎯 Próximo Paso

Si todo está OK, continúa con:
→ **`TESTING_MANUAL_EXPO_GO.md`**

Comenzarás con:
- **Escenario 1:** CREATE User (Offline → Online)

---

## 💡 Tips Útiles

### Ver Logs en Tiempo Real
- Los logs aparecen en la terminal donde corre `npm start`
- También en Debug screen > Tab "📝 Logs"

### Forzar Refresh
- Pull-to-refresh funciona en Debug screen
- Botón "🔃 Refresh" recarga todo

### Limpiar Estado
- Debug screen > Tab "📋 Queue" > "🗑️ Limpiar"
- Útil si necesitas empezar de cero

### Firebase Console Atajo
- Guarda el link directo a tu colección `users`
- Será más rápido verificar

---

## ❓ Preguntas Frecuentes

**P: ¿Necesito acceso root o ADB?**
R: No, todo se hace desde la pantalla de Debug dentro de la app.

**P: ¿Funciona en iOS y Android?**
R: Sí, la pantalla de Debug funciona en ambos.

**P: ¿Puedo usar esto en producción?**
R: No, es solo para desarrollo. Deberías ocultarla o eliminarla en builds de producción.

**P: ¿Los datos son reales?**
R: Sí, estás viendo y modificando datos reales en SQLite y Firestore.

---

## 🆘 Si Necesitas Ayuda

1. Captura screenshot del error en Debug screen
2. Copia los logs de la tab "📝 Logs"
3. Anota qué estabas haciendo cuando falló
4. Revisa Firebase Console para ver estado remoto

---

**¿Listo para comenzar?**

✅ Test rápido completado → Ir a `TESTING_MANUAL_EXPO_GO.md`
❌ Test rápido falló → Revisar sección "Si el Test Rápido FALLÓ"
