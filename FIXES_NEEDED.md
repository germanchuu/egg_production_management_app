# Problemas Identificados y Soluciones

## 🔴 PROBLEMA #1: App crashea en producción (CRÍTICO)

### Causa
Falta la dependencia `expo-font` requerida por `@expo/vector-icons`.

### Solución
```bash
npx expo install expo-font
```

Luego rebuild:
```bash
eas build --profile production --platform android
```

---

## 🔴 PROBLEMA #2: Usuarios desaparecen progresivamente de la lista

### Diagnóstico Necesario
El código del repository no tiene filtros que puedan causar esto. Necesito investigar más.

**Preguntas para el usuario:**
1. ¿Cuántos usuarios ves la primera vez que haces login?
2. ¿Cuántos usuarios desaparecen cada vez?
3. ¿Los usuarios que desaparecen tienen algo en común? (rol, status, etc.)
4. ¿Haces sync después de login?
5. ¿Ves algún error en los logs de la consola?

**Posibles causas:**
- Problema en la sincronización que sobrescribe datos
- Error en el mapeo de datos de Firestore a SQLite
- Problema con la tabla `users` en SQLite (constraint violations)

**Solución temporal:**
Agregar logging para diagnosticar:

```typescript
// En useUserManagement.ts línea 17
const allUsers = await service.listAllUsers();
console.log('[DEBUG] Usuarios cargados desde SQLite:', allUsers.length);
console.log('[DEBUG] IDs de usuarios:', allUsers.map(u => u.id));
setUsers(allUsers);
```

---

## 🔴 PROBLEMA #3: Usuario autenticado puede ver pantalla de invitación

### Causa
La pantalla `invite/[token].tsx` no valida si ya hay una sesión activa.

### Solución
Modificar `src/app/(auth)/invite/[token].tsx` para detectar usuario autenticado.

---

## 🔴 PROBLEMA #4: InvitationConfirmation usa alert

### Causa
Usa `alert()` nativo en lugar de Toast component.

### Solución
Reemplazar `alert()` con componente Toast.

---

## Estado de las tareas

- [ ] Instalar expo-font y rebuild (CRÍTICO)
- [ ] Diagnosticar problema de usuarios desapareciendo
- [ ] Agregar validación de sesión en pantalla de invitación
- [ ] Reemplazar alert con Toast en InvitationConfirmation

