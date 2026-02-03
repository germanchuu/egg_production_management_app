# Frontend UI/UX Guidelines

**Proyecto:** Gestión de Producción de Huevos
**Última actualización:** 2026-02-01
**Versión:** 1.0.0

---

## 1. Principios de Diseño

### Identidad Visual

- **Diseño moderno pero elegante:** Aplicación formal para gestión avícola
- **Limpieza visual y profesionalismo:** Predominio de espacios en blanco
- **Espaciado equilibrado:** Ni muy compacto ni muy generoso
- **Funcionalidad sobre decoración:** Cada elemento tiene propósito

### Inspiración Visual

Basado en apps modernas y minimalistas que priorizan:

- **Espacio en blanco generoso:** Diseño respirable, no apretado
- **Simplicidad sobre complejidad:** Elementos necesarios, sin decoración excesiva
- **Sombras sutiles:** Profundidad sin ser dramática
- **Tipografía clara:** Sans-serif, jerarquía bien definida
- **Colores con propósito:** Usados para guiar, no para decorar

**Referencias de estilo:**

- Style 2 (Plant App): Limpieza, minimalismo, mucho blanco
- Style 3 (Smart Home): Elegancia, simplicidad, elementos necesarios
- Style 4 (Finance App): Organización clara, jerarquía visual

### Tecnologías Base

- React Native con Expo SDK 54
- NativeWind (Tailwind CSS for React Native)
- React Native Reanimated (vía Moti)
- Lucide React Native (iconografía)
- Safe Area Context

---

## 2. Iconografía

### Librería

**Lucide React Native** (exclusivamente)

- Migración completa desde Ionicons
- Consistencia visual en toda la aplicación

```typescript
import { IconName } from 'lucide-react-native';
```

### Estilos de Íconos

**Mixto según contexto:**

- **Outline (stroke):** Navegación y acciones secundarias
- **Filled:** Estados activos y acciones primarias destacadas

### Tamaños Estándar

```typescript
const iconSizes = {
  inline: 16, // Íconos junto a texto inline
  button: 20, // Íconos en botones
  header: 24, // Íconos en headers y cards
  featured: 32, // Íconos destacados o decorativos
};
```

---

## 3. Animaciones

### Librería

**Moti** (wrapper sobre React Native Reanimated)

### Configuración Base

```typescript
// Animaciones de entrada preferidas
{
  type: 'timing',           // NO usar 'spring'
  duration: 200-300,        // Animaciones rápidas
}
```

### Patrones de Animación

#### 3.1 Entrada de Elementos (Escalonada)

```tsx
<MotiView
  from={{ opacity: 0, translateY: 20 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 250, delay: index * 50 }}
>
  {/* Contenido */}
</MotiView>
```

#### 3.2 Modales y Sheets

```tsx
// Fade + slide hacia arriba
<MotiView
  from={{ opacity: 0, translateY: 30 }}
  animate={{ opacity: 1, translateY: 0 }}
  transition={{ type: 'timing', duration: 250 }}
>
  {/* Modal content */}
</MotiView>
```

#### 3.3 Transiciones entre Tabs

- **NO animaciones** entre cambios de tab
- Transición instantánea para mejor rendimiento

#### 3.4 Microinteracciones

**Botones (al presionar):**

```tsx
<Pressable
  style={({ pressed }) => ({
    opacity: pressed ? 0.7 : 1,
    transform: [{ scale: pressed ? 0.98 : 1 }],
  })}
>
```

**Inputs (al hacer focus):**

```tsx
<MotiView
  animate={{
    borderColor: isFocused ? theme.colors.primary['500'] : theme.colors.gray['300'],
    scale: isFocused ? 1.01 : 1,
  }}
  transition={{ type: 'timing', duration: 200 }}
>
```

**Cards (feedback visual):**

```tsx
// Shadow muy ligero al hacer tap
<Pressable
  style={({ pressed }) => ({
    shadowOpacity: pressed ? 0.12 : 0.08,
    shadowRadius: pressed ? 6 : 4,
  })}
>
```

---

## 4. Layout y Composición

### 4.1 Estructura de Pantallas

#### Headers

- Fondo blanco/transparente (no colores fuertes)
- Título en `text-textPrimary` con tamaño `text-2xl` (24px)
- Botón hamburguesa en lado izquierdo (solo en tabs, no en auth)
- Línea delgada inferior (`border-b border-gray-200`)
- **Scroll completo:** El título scrollea con el contenido (no header fijo)

```tsx
<ScrollView className="flex-1 bg-background">
  {/* Header integrado al contenido */}
  <View className="px-lg pt-xl pb-md border-b border-gray-200">
    <View className="flex-row items-center">
      <MenuButton /> {/* Solo en (tabs) */}
      <Text className="text-2xl font-bold text-textPrimary ml-md">
        Título de Pantalla
      </Text>
    </View>
  </View>

  {/* Contenido */}
  <View className="px-lg py-md">{/* ... */}</View>
</ScrollView>
```

### 4.2 Espaciado Consistente

- **Padding horizontal:** `px-lg` (16px) en todas las pantallas
- **Padding vertical:** `py-md` (12px) para secciones
- **Spacing entre elementos:** `gap-md` o `gap-lg`
- Usar los tokens de spacing del `tailwind.config.js`

### 4.3 Cards

```tsx
<View className="bg-white rounded-md shadow-sm border border-gray-100 p-md">
  {/* Contenido */}
</View>
```

**Características:**

- Border radius moderado: `rounded-md` (12px) - NO usar `rounded-xl` o `rounded-2xl`
- Shadow MUY sutil: `shadow-sm` preferentemente
- Border ligero opcional: `border-gray-100` o `border-gray-200`
- Padding interno: `p-md` (12px) o `p-lg` (16px)
- Fondo siempre blanco: `bg-white`
- Evitar cards con fondos de color (mantener limpieza visual)

**Inspiración:**

- Similar a Style 2 (Plant App) y Style 3 (Smart Home): cards limpias, blancas, con sombra casi imperceptible
- El contenido dentro de la card es lo que importa, no la card misma

### 4.4 Listas

- **Cards individuales separadas**
- Espaciado entre cards: `gap-md`
- Altura moderada (no muy grandes)
- Sin imágenes/avatares por defecto
- Excepción: lista de usuarios puede tener inicial como "avatar"

```tsx
<ScrollView className="px-lg py-md">
  <View className="gap-md">
    {items.map((item, index) => (
      <MotiView
        key={item.id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 50, duration: 250 }}
      >
        <Pressable
          className="bg-white rounded-md shadow-sm p-md"
          style={({ pressed }) => ({
            shadowOpacity: pressed ? 0.12 : 0.08,
          })}
        >
          {/* Card content */}
        </Pressable>
      </MotiView>
    ))}
  </View>
</ScrollView>
```

---

## 5. Menú Lateral (Drawer)

### Comportamiento

- Overlay oscuro semi-transparente sobre el contenido
- Ancho: 75% de la pantalla
- Animación: slide estándar (de izquierda a derecha)
- Cierre: tap en overlay o botón dentro del drawer

### Contenido

1. **Header del Drawer:**
   - Inicial del usuario como "avatar" (círculo con letra)
   - Nombre del usuario
   - Email o rol

2. **Navegación (Agrupada):**
   - Sección "Navegación" con los tabs:
     - Inicio
     - Producción
     - Lotes
     - Perfil

3. **Otras opciones:**
   - Información de sincronización (cola, elementos sincronizados)
   - Configuraciones
   - Cerrar sesión

### Estructura

```tsx
<Drawer>
  {/* Header */}
  <View className="bg-primary-500 px-xl py-2xl">
    <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-md">
      <Text className="text-2xl font-bold text-white">
        {userName.charAt(0).toUpperCase()}
      </Text>
    </View>
    <Text className="text-lg font-bold text-white">{userName}</Text>
    <Text className="text-sm text-white/80">{userEmail}</Text>
  </View>

  {/* Navegación */}
  <View className="py-md">
    <Text className="px-xl py-sm text-xs font-semibold text-textTertiary">
      NAVEGACIÓN
    </Text>
    <DrawerItem icon={Home} label="Inicio" />
    <DrawerItem icon={Egg} label="Producción" />
    <DrawerItem icon={Grid} label="Lotes" />
    <DrawerItem icon={User} label="Perfil" />
  </View>

  {/* Otras opciones */}
  <View className="border-t border-gray-200 py-md">
    <DrawerItem icon={RefreshCw} label="Sincronización" />
    <DrawerItem icon={Settings} label="Configuración" />
  </View>

  {/* Footer */}
  <View className="border-t border-gray-200 p-xl">
    <Button variant="danger" icon={LogOut}>
      Cerrar Sesión
    </Button>
  </View>
</Drawer>
```

### Overlay

```tsx
backgroundColor: 'rgba(0, 0, 0, 0.5)'; // Semi-transparente, no muy oscuro
```

---

## 6. Componentes

### 6.1 Botones

**Variantes:** `primary | secondary | danger`

```tsx
<Button
  variant="primary"
  icon={Plus} // Preferentemente con ícono
  iconPosition="left"
  onPress={handlePress}
  loading={isLoading}
  disabled={isDisabled}
>
  Texto del Botón
</Button>
```

**Características:**

- Border radius moderado: `rounded-md`
- Altura mínima: 48dp (touch target)
- Haptic feedback al presionar
- Animación: scale + opacity al presionar
- Ícono recomendado (no obligatorio)

**Ubicación de Acciones:**

- **NO usar FAB (Floating Action Button)**
- Botones de acción dentro del contenido
- Deben resaltar visualmente (usar `variant="primary"`)

### 6.2 Inputs

```tsx
<View className="gap-xs">
  {/* Label fijo arriba */}
  <Text className="text-sm font-medium text-textSecondary">
    Etiqueta del Campo
  </Text>

  {/* Input con borde visible */}
  <MotiView
    animate={{
      borderColor: isFocused
        ? theme.colors.primary['500']
        : theme.colors.gray['300'],
    }}
    transition={{ type: 'timing', duration: 200 }}
    className="flex-row items-center border rounded-md px-md py-sm"
  >
    {/* Ícono dentro del input */}
    <Mail size={20} color={theme.colors.gray['400']} />

    <TextInput
      className="flex-1 ml-sm text-base text-textPrimary"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  </MotiView>
</View>
```

**Características:**

- Border visible (no solo bottom border)
- Labels fijos arriba (no floating)
- Íconos dentro del input (contextuales)
- Animación de borde al hacer focus
- Placeholder en `text-textTertiary`

### 6.3 Headers

Ya cubierto en sección 4.1

**Resumen:**

- Fondo blanco/transparente
- Sin colores fuertes
- Línea delgada inferior
- Botón hamburguesa (solo tabs)
- Scrolleable

### 6.4 Avatar/Inicial de Usuario

Usado en listas de usuarios y en el drawer:

```tsx
// Avatar con inicial
<View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
  <Text className="text-base font-semibold text-textPrimary-700">
    {userName.charAt(0).toUpperCase()}
  </Text>
</View>;

// Tamaños según contexto
const avatarSizes = {
  small: 'w-8 h-8', // 32px - Lista de usuarios
  medium: 'w-10 h-10', // 40px - Header, cards
  large: 'w-16 h-16', // 64px - Drawer header, perfil
};
```

**Características:**

- Siempre circular: `rounded-full`
- Fondo suave de color primary: `bg-primary-100` o `bg-primary-200`
- Letra en color más oscuro: `text-textPrimary-700`
- NO usar imágenes, solo iniciales
- Inspiración: Style 3 (Smart Home App) - avatar simple y funcional

### 6.5 Hamburger Menu Button

```tsx
<Pressable
  className="w-10 h-10 items-center justify-center"
  onPress={openDrawer}
  style={({ pressed }) => ({
    opacity: pressed ? 0.6 : 1,
  })}
>
  <Menu size={24} color={theme.colors.gray['700']} />
</Pressable>
```

**Características:**

- Tamaño: 24px (ícono)
- Color: gris oscuro `gray-700` (no negro puro)
- Ubicación: esquina superior izquierda
- Touch target: 40x40px mínimo
- Animación sutil al presionar (opacity)
- Inspiración: Style 3 - hamburger menu discreto pero visible

---

## 7. Estados y Feedback

### 7.1 Loading States

**Preferencia:** Skeleton Loaders (inline)

```tsx
// Skeleton para card
<View className="bg-white rounded-md shadow-sm p-md">
  <View className="h-4 bg-gray-200 rounded w-3/4 mb-sm" />
  <View className="h-4 bg-gray-200 rounded w-1/2" />
</View>

// NO usar overlay de loading completo
// Usar ActivityIndicator solo para botones
```

### 7.2 Empty States

```tsx
<View className="flex-1 items-center justify-center px-xl py-2xl">
  {/* Ícono semi-grande */}
  <IconName size={64} color={theme.colors.gray['400']} />

  {/* Texto formal */}
  <Text className="text-lg font-semibold text-textPrimary mt-lg text-center">
    No hay elementos disponibles
  </Text>
  <Text className="text-sm text-textSecondary mt-sm text-center">
    Los elementos aparecerán aquí cuando estén disponibles.
  </Text>
</View>
```

### 7.3 Error States

**Método:** Toast/Snackbar (NO modales de alert)

```tsx
// Toast de error
<Toast
  type="error"
  message="Error al guardar los datos"
  icon={AlertCircle}
/>

// Toast de warning
<Toast
  type="warning"
  message="Algunos datos no se sincronizaron"
  icon={AlertTriangle}
/>
```

**Colores:**

- Error: `bg-error` (rojo)
- Warning: `bg-warning` (amarillo/naranja)
- Success: `bg-success` (verde)
- Info: `bg-info` (cyan)

---

## 8. Tipografía

### 8.1 Jerarquía y Pesos

```typescript
{
  // Títulos de pantalla
  screenTitle: 'text-2xl font-bold text-textPrimary',

  // Dashboard (si necesita más jerarquía)
  dashboardTitle: 'text-3xl font-bold text-textPrimary',

  // Subtítulos
  subtitle: 'text-lg font-semibold text-textPrimary',

  // Texto normal
  body: 'text-base font-normal text-textPrimary',

  // Texto secundario/metadata
  secondary: 'text-sm font-normal text-textSecondary',

  // Texto terciario
  tertiary: 'text-xs font-normal text-textTertiary',
}
```

### 8.2 Guía de Pesos

- **Bold (`font-bold`):** Títulos principales
- **Semibold (`font-semibold`):** Subtítulos y énfasis
- **Medium (`font-medium`):** Texto destacado
- **Normal (`font-normal`):** Texto normal

### 8.3 Colores de Texto

- **text-textPrimary:** Texto principal (gray-900 #212121)
- **text-textSecondary:** Texto secundario/metadata (gray-600 #616161)
- **text-textTertiary:** Texto terciario/disabled (gray-500 #9E9E9E)
- **text-textInverse:** Texto sobre fondos oscuros (white)

---

## 9. Paleta de Colores y Uso

### Filosofía de Color

- **Menos es más:** Usar color con propósito, no para decorar
- **Blanco predominante:** Fondo principal siempre blanco/claro
- **Color para guiar:** Destacar acciones importantes, estados, categorías
- **No saturation overload:** Colores vibrantes pero no estridentes

**Inspiración de los mockups:**

- Style 2 (Plant App): Uso muy moderado de verde, predomina el blanco
- Style 3 (Smart Home): Blanco como base, color solo en elementos interactivos
- Style 4 (Finance App): Gradiente en header pero contenido sobre blanco

### 9.1 Primary (Cyan #0097A7)

**Uso:**

- Botones principales de acción
- Enlaces importantes
- Indicadores de estado activo/seleccionado
- Tabs activos en el drawer
- Elementos interactivos principales
- Bordes de inputs en focus
- **NO usar en fondos grandes** (solo en elementos específicos)

```tsx
<Button variant="primary">Guardar</Button>
<View className="border-2 border-primary-500" /> {/* En focus */}
<Text className="text-textPrimary-500">Enlace</Text>
```

### 9.2 Secondary (Purple #8E24AA)

**Uso:**

- Elementos destacados pero no acción primaria
- Badges/pills de información importante
- Categorías o etiquetas especiales
- Acentos visuales en cards especiales

```tsx
<View className="bg-secondary-500 px-md py-xs rounded-full">
  <Text className="text-white text-xs">Premium</Text>
</View>
```

### 9.3 Accent (Amber #FFB300)

**Uso:**

- Llamadas de atención (warnings que no son error)
- Elementos promocionales o destacados temporalmente
- Notificaciones importantes
- Badges de "nuevo" o "pendiente"

```tsx
<View className="bg-accent-500/20 p-md rounded-md">
  <Text className="text-accent-700">Acción pendiente</Text>
</View>
```

### 9.4 Colores Semánticos

**Success (Green #66BB6A):**

- Confirmaciones exitosas
- Estados positivos
- Sincronización completada

**Warning (Orange #FFA726):**

- Advertencias
- Atención requerida
- Estados intermedios

**Error (Red #DC2626):**

- Errores y fallos
- Acciones destructivas
- Estados críticos

**Info (Cyan #0097A7):**

- Información general
- Tooltips
- Mensajes informativos

---

## 10. Safe Area

### Implementación

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

// Usar en layouts principales
<SafeAreaView edges={['top', 'bottom']} className="flex-1">
  {/* Contenido */}
</SafeAreaView>

// O solo top/bottom según necesidad
<SafeAreaView edges={['top']} className="flex-1 bg-background">
  <ScrollView>
    {/* Contenido */}
  </ScrollView>
</SafeAreaView>
```

**Reglas:**

- **Siempre** usar SafeAreaView en layouts raíz
- Especificar edges según contexto (top, bottom, left, right)
- Para modales: considerar solo 'top' si tiene overlay completo

---

## 11. Temas

### 11.1 Theme Mode

- **Solo modo claro** (light theme)
- NO implementar dark mode
- Fondo base: `#FFFFFF`
- Fondo secundario: `#F5F5F5`

### 11.2 Acceso al Theme

```typescript
import { theme } from '@/core/theme';

// Usar en componentes que no soportan className
<Tab.Navigator
  screenOptions={{
    tabBarActiveTintColor: theme.colors.primary['500'],
    headerStyle: {
      backgroundColor: theme.colors.background.DEFAULT,
    },
  }}
>
```

---

## 12. Patrones de Implementación

### 12.1 Pantalla Típica

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View, Text, Pressable } from 'react-native';
import { MotiView } from 'moti';
import { IconName } from 'lucide-react-native';
import { Button } from '@/shared/components';

export default function ExampleScreen() {
  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="px-lg pt-xl pb-md border-b border-gray-200">
          <View className="flex-row items-center">
            <MenuButton />
            <Text className="text-2xl font-bold text-textPrimary ml-md">
              Título de Pantalla
            </Text>
          </View>
        </View>

        {/* Contenido */}
        <View className="px-lg py-md">
          {/* Acción principal */}
          <Button variant="primary" icon={Plus} className="mb-lg">
            Agregar Registro
          </Button>

          {/* Lista de Cards */}
          <View className="gap-md">
            {items.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 250,
                  delay: index * 50,
                }}
              >
                <Pressable
                  className="bg-white rounded-md shadow-sm border border-gray-100 p-md"
                  style={({ pressed }) => ({
                    shadowOpacity: pressed ? 0.12 : 0.08,
                  })}
                  onPress={() => handleItemPress(item)}
                >
                  <View className="flex-row items-center gap-md">
                    <IconName size={24} color={theme.colors.primary['500']} />
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-textPrimary">
                        {item.title}
                      </Text>
                      <Text className="text-sm text-textSecondary mt-xs">
                        {item.description}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              </MotiView>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
```

### 12.2 Card Component

```tsx
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  animationDelay?: number;
}

export function Card({ children, onPress, animationDelay = 0 }: CardProps) {
  const Component = onPress ? Pressable : View;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250, delay: animationDelay }}
    >
      <Component
        className="bg-white rounded-md shadow-sm border border-gray-100 p-md"
        style={
          onPress
            ? ({ pressed }) => ({
                shadowOpacity: pressed ? 0.12 : 0.08,
              })
            : undefined
        }
        onPress={onPress}
      >
        {children}
      </Component>
    </MotiView>
  );
}
```

### 12.3 Modal/Sheet

```tsx
<Modal
  visible={visible}
  transparent
  animationType="none"
  onRequestClose={onClose}
>
  {/* Overlay */}
  <Pressable className="flex-1 bg-black/50" onPress={onClose}>
    {/* Modal Content */}
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 250 }}
      className="bg-white rounded-t-2xl mt-auto"
    >
      <View className="p-xl">{/* Content */}</View>
    </MotiView>
  </Pressable>
</Modal>
```

### 12.4 Lista con Avatares

```tsx
// Para lista de usuarios o registros con inicial
{
  items.map((item, index) => (
    <MotiView
      key={item.id}
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 50, duration: 250 }}
    >
      <Pressable
        className="bg-white rounded-md shadow-sm p-md mb-md"
        style={({ pressed }) => ({
          shadowOpacity: pressed ? 0.12 : 0.08,
        })}
      >
        <View className="flex-row items-center gap-md">
          {/* Avatar con inicial */}
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
            <Text className="text-base font-semibold text-textPrimary-700">
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          {/* Contenido */}
          <View className="flex-1">
            <Text className="text-base font-semibold text-textPrimary">
              {item.name}
            </Text>
            <Text className="text-sm text-textSecondary mt-xs">
              {item.detail}
            </Text>
          </View>

          {/* Ícono o acción (opcional) */}
          <ChevronRight size={20} color={theme.colors.gray['400']} />
        </View>
      </Pressable>
    </MotiView>
  ));
}
```

### 12.5 Dashboard Stats

```tsx
// Sección de estadísticas rápidas
<View className="flex-row gap-md mb-lg">
  {/* Stat card */}
  <View className="flex-1 bg-white rounded-md shadow-sm p-md">
    <View className="flex-row items-center gap-sm mb-xs">
      <View className="w-8 h-8 rounded-full bg-success/20 items-center justify-center">
        <TrendingUp size={16} color={theme.colors.success.DEFAULT} />
      </View>
      <Text className="text-xs text-textSecondary">Producción</Text>
    </View>
    <Text className="text-2xl font-bold text-textPrimary">1,245</Text>
    <Text className="text-xs text-textTertiary mt-xs">Esta semana</Text>
  </View>

  {/* Otra stat card */}
  <View className="flex-1 bg-white rounded-md shadow-sm p-md">
    {/* Similar structure */}
  </View>
</View>
```

---

## 13. Checklist de Implementación UI

Al implementar cualquier pantalla o componente, verificar:

- [ ] Usa SafeAreaView con edges apropiados
- [ ] Header con fondo blanco y línea inferior
- [ ] Botón hamburguesa en tabs (no en auth)
- [ ] Título usa `text-2xl font-bold text-textPrimary`
- [ ] Padding horizontal `px-lg` consistente
- [ ] Cards con `rounded-md` y `shadow-sm`
- [ ] Íconos de Lucide React Native
- [ ] Animaciones de entrada escalonadas (`delay: index * 50`)
- [ ] Animaciones tipo 'timing', 200-300ms
- [ ] Botones con haptic feedback
- [ ] Inputs con border visible y label fijo
- [ ] Microinteracciones en pressables
- [ ] Skeleton loaders para loading states
- [ ] Empty states con ícono + texto formal
- [ ] Errors con toast (no modales)
- [ ] Tipografía según jerarquía (bold/semibold/medium)
- [ ] Colores semánticos correctos
- [ ] Espaciado `gap-md` o `gap-lg` entre elementos
- [ ] Acciones como botones en contenido (no FAB)

---

## 14. Anti-Patrones (Evitar)

### ❌ Fondos de color en toda la pantalla

- Mantener fondo blanco como base
- Color solo en headers específicos (drawer) o elementos puntuales

### ❌ Sombras exageradas

- Evitar shadows tipo `shadow-lg` o `shadow-xl`
- Máximo `shadow` o `shadow-sm`
- La sombra debe ser casi imperceptible

### ❌ Bordes muy redondeados

- NO usar `rounded-2xl` o `rounded-3xl` para cards
- Mantener `rounded-md` o máximo `rounded-lg`
- Excepción: avatares y badges pueden ser `rounded-full`

### ❌ Sobrecarga de color

- No usar múltiples colores primarios en una sola pantalla
- El color debe guiar, no decorar
- Predominio del blanco y grises

### ❌ Headers con gradientes fuertes

- Headers limpios, fondo blanco
- Sin colores fuertes pegados arriba
- Línea delgada para separación

### ❌ Animaciones exageradas

- NO spring animations (rebote)
- NO duraciones > 400ms
- NO animaciones múltiples simultáneas que distraigan

### ❌ Tipografía inconsistente

- No mezclar weights sin propósito
- No usar más de 2-3 tamaños en una pantalla
- No text-center sin razón (left-align por defecto)

### ❌ Touch targets pequeños

- Mínimo 48dp para botones y elementos interactivos
- No iconos < 20px en elementos clicables

### ❌ Cards muy grandes o muy apretadas

- Balance entre contenido y espaciado
- No llenar toda la pantalla con una card
- Separación `gap-md` entre cards

### ❌ Íconos decorativos sin propósito

- Cada ícono debe tener función/significado
- No añadir íconos "porque se ve bonito"

---

## 15. Recursos y Referencias

### Documentación

- [NativeWind v4 Docs](https://www.nativewind.dev/)
- [Moti Docs](https://moti.fyi/)
- [Lucide React Native](https://lucide.dev/guide/packages/lucide-react-native)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)

### Archivos de Configuración

- `tailwind.config.js` - Paleta de colores, spacing, typography
- `src/core/theme/index.ts` - Theme tokens para uso en JS
- `global.css` - Tailwind directives

### Componentes Base

- `src/shared/components/Button.tsx`
- `src/shared/components/FormInput.tsx`
- `src/shared/components/SplashScreen.tsx`

---

## 16. Guía Visual Rápida

### Cuando tengas dudas, pregúntate:

1. **¿Está limpio?** - Mucho espacio en blanco, no apretado
2. **¿Es necesario?** - Cada elemento tiene propósito
3. **¿Es sutil?** - Sombras, colores, animaciones no son exageradas
4. **¿Es consistente?** - Sigue los patrones establecidos
5. **¿Es elegante?** - Se ve profesional, no llamativo

### Regla de oro

> "Si se ve muy llamativo, probablemente está mal. Si se ve aburrido, probablemente está bien. Si se ve aburrido PERO funcional y claro, está perfecto."

### Mantra de diseño

- **Blanco es tu amigo** - No temas al espacio vacío
- **Gris antes que color** - Usa grises para jerarquía, color para énfasis
- **Simple sobre complejo** - Menos elementos, mejor diseño
- **Funcional sobre decorativo** - Cada pixel tiene propósito

### Inspiración visual aplicada

- **Style 2 (Plant App):** Limpieza, minimalismo, mucho blanco
- **Style 3 (Smart Home):** Elegancia, simplicidad, elementos necesarios
- **Style 4 (Finance App):** Organización clara, jerarquía visual
- Combinar estas influencias con nuestra paleta de colores (cyan/purple/amber)
- **Resultado:** Moderno, elegante, profesional

---

## Notas Finales

Este documento debe ser consultado en **CADA tarea de UI**. Cualquier desviación de estos lineamientos debe ser justificada y documentada.

La consistencia visual es clave para una aplicación profesional y elegante.

---

**Versión:** 1.0.0
**Última actualización:** 2026-02-01
