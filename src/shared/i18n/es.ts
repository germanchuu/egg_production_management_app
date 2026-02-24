/**
 * Spanish (es) language strings (T159)
 *
 * Primary language for the Poultry Farm Production Management App.
 * All user-facing text should reference these constants for consistency.
 *
 * Organization: grouped by domain/feature.
 */

// ── Common ────────────────────────────────────────────────────────────────────

export const common = {
  save: 'Guardar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  delete: 'Eliminar',
  edit: 'Editar',
  create: 'Crear',
  back: 'Volver',
  close: 'Cerrar',
  retry: 'Reintentar',
  loading: 'Cargando...',
  saving: 'Guardando...',
  search: 'Buscar',
  filter: 'Filtrar',
  all: 'Todos',
  active: 'Activos',
  noData: 'Sin datos',
  required: 'Requerido',
  optional: 'Opcional',
  yes: 'Sí',
  no: 'No',
  today: 'Hoy',
  date: 'Fecha',
  notes: 'Notas',
  share: 'Compartir',
  select: 'Seleccionar',
  selectOption: 'Seleccionar...',
} as const;

// ── Navigation ────────────────────────────────────────────────────────────────

export const navigation = {
  home: 'Inicio',
  production: 'Producción',
  lots: 'Lotes',
  feeding: 'Alimentación',
  health: 'Salud',
  biosecurity: 'Bioseguridad',
  profile: 'Perfil',
  admin: 'Administración',
  users: 'Usuarios',
  houses: 'Galpones',
} as const;

// ── Auth ──────────────────────────────────────────────────────────────────────

export const auth = {
  login: 'Iniciar sesión',
  logout: 'Cerrar sesión',
  invitation: 'Invitación',
  invitationFor: 'Esta es una invitación para:',
  acceptInvitation: 'Aceptar invitación',
  declineInvitation: 'Rechazar invitación',
  invitationPending: 'Invitación pendiente',
  invitationAccepted: 'Invitación aceptada',
  invitationExpired: 'Invitación vencida',
  sessionActive: 'Sesión activa',
  sessionExpired: 'Sesión vencida',
  accessDenied: 'Acceso denegado',
  generateInvitation: 'Generar invitación',
  regenerateInvitation: 'Regenerar invitación',
  revokeAccess: 'Revocar acceso',
  userStatus: {
    pending: 'Pendiente',
    authenticated: 'Autenticado',
    revoked: 'Revocado',
  },
  adminLabel: 'Administrador',
  userLabel: 'Usuario',
  waitingInvitation: 'Esperando invitación',
  waitingInvitationDesc:
    'Contacta al administrador para recibir tu invitación de acceso.',
} as const;

// ── Lots ──────────────────────────────────────────────────────────────────────

export const lots = {
  title: 'Lotes',
  createLot: 'Crear Lote',
  editLot: 'Editar Lote',
  lotDetails: 'Detalles del Lote',
  lotName: 'Nombre del Lote',
  purchaseDate: 'Fecha de Compra',
  initialHenCount: 'Cantidad Inicial de Gallinas',
  liveHenCount: 'Gallinas Vivas',
  ageWeeks: 'Edad (semanas)',
  house: 'Galpón',
  selectHouse: 'Seleccionar galpón',
  activeOnly: 'Solo activos',
  noActiveLots: 'No hay lotes activos',
  noActiveLotsSub: 'Todos los lotes tienen 0 gallinas vivas',
  noLots: 'No hay lotes registrados',
  noLotsSub: 'Crea tu primer lote para comenzar',
  totalMortality: 'Mortalidad Total',
  mortalityRate: 'Tasa de Mortalidad',
  currentAge: 'Edad Actual',
  weeks: 'semanas',
  hens: 'gallinas',
} as const;

// ── Houses ────────────────────────────────────────────────────────────────────

export const houses = {
  title: 'Galpones',
  createHouse: 'Crear Galpón',
  editHouse: 'Editar Galpón',
  houseName: 'Nombre del Galpón',
  description: 'Descripción',
  noHouses: 'No hay galpones registrados',
  noHousesSub: 'Crea el primer galpón para comenzar',
} as const;

// ── Production ────────────────────────────────────────────────────────────────

export const production = {
  title: 'Registro de Producción',
  recordProduction: 'Registrar Producción',
  eggsCollected: 'Huevos Recolectados',
  eggsPerHen: 'Huevos por Gallina',
  dailyEggsPerHen: 'Huevos/gallina (hoy)',
  lifetimeEggsPerHen: 'Huevos/gallina (total)',
  recentRecords: 'Registros Recientes',
  productionHistory: 'Historial de Producción',
  noRecords: 'No hay registros de producción',
  selectLot: 'Seleccionar lote',
  eggs: 'huevos',
  egg: 'huevo',
  dailyTotal: 'Total del día',
  sanityWarning: 'La cantidad de huevos es alta para este lote. ¿Estás seguro?',
} as const;

// ── Mortality ─────────────────────────────────────────────────────────────────

export const mortality = {
  title: 'Registro de Bajas',
  recordMortality: 'Registrar Bajas',
  hensDied: 'Gallinas Fallecidas',
  mortalityHistory: 'Historial de Bajas',
  noRecords: 'No hay registros de bajas',
  recentRecords: 'Registros Recientes',
  highMortalityAlert: 'Alta mortalidad detectada (>10%). Revisa el lote.',
} as const;

// ── Feeding ───────────────────────────────────────────────────────────────────

export const feeding = {
  title: 'Alimentación',
  recordFeeding: 'Registrar Alimentación',
  feedBatches: 'Lotes de Alimento',
  createBatch: 'Crear Lote de Alimento',
  batchName: 'Nombre del Lote',
  preparationDate: 'Fecha de Preparación',
  quantityKg: 'Cantidad (kg)',
  quantityFedKg: 'Cantidad Suministrada (kg)',
  remainingKg: 'Disponible (kg)',
  feedPerHen: 'Alimento por Gallina',
  totalConsumed: 'Total Consumido',
  avgFeedPerHen: 'Promedio Alimento/Gallina',
  feedHistory: 'Historial de Alimentación',
  noBatches: 'Sin lotes de alimento',
  noBatchesSub: 'Registra el primer lote usando el botón de arriba',
  noRecords: 'No hay registros de alimentación',
  newBatch: 'Nuevo Lote de Alimento',
  registerNewBatch: 'Registrar nuevo lote de alimento',
  selectBatch: 'Seleccionar lote de alimento',
  exhausted: 'Agotado',
  tabRecord: 'Registro',
  tabBatches: 'Lotes',
} as const;

// ── Health ────────────────────────────────────────────────────────────────────

export const health = {
  title: 'Salud & Bioseguridad',
  healthTab: 'Salud',
  biosecurityTab: 'Bioseguridad',
  recordVaccination: 'Registrar Vacunación',
  recordDisinfection: 'Registrar Desinfección',
  productName: 'Nombre del Producto',
  eventDate: 'Fecha del Evento',
  eventHistory: 'Historial de Eventos',
  vaccination: 'Vacunación',
  disinfection: 'Desinfección',
  noHealthEvents: 'No hay vacunaciones registradas',
  noBiosecurityEvents: 'No hay desinfecciones registradas',
  healthSubtitle: 'Vacunaciones del plantel',
  biosecuritySubtitle: 'Desinfecciones del plantel',
  subtitleAll: 'Vacunaciones y desinfecciones del plantel',
} as const;

// ── Sync ──────────────────────────────────────────────────────────────────────

export const sync = {
  synced: 'Sincronizado',
  pending: 'Pendiente',
  syncing: 'Sincronizando...',
  failed: 'Error de sincronización',
  noConnection: 'Sin conexión',
  lastSync: 'Última sincronización',
  syncNow: 'Sincronizar ahora',
} as const;

// ── Profile ───────────────────────────────────────────────────────────────────

export const profile = {
  title: 'Perfil',
  role: 'Rol',
  lastAccess: 'Último acceso',
  device: 'Dispositivo',
  version: 'Versión',
  logout: 'Cerrar sesión',
  logoutConfirm: '¿Cerrar sesión?',
  logoutConfirmSub:
    'Los datos locales se conservarán. Necesitarás una invitación para volver a ingresar.',
} as const;

// ── Validation ────────────────────────────────────────────────────────────────

export const validation = {
  required: 'Este campo es requerido.',
  futureDateNotAllowed: 'La fecha no puede ser en el futuro.',
  mustBePositive: 'El valor debe ser mayor a cero.',
  mustBeNonNegative: 'El valor no puede ser negativo.',
  exceedsLiveHens: 'La cantidad supera las gallinas vivas en el lote.',
  maxNotesLength: 'Las notas no pueden superar 2000 caracteres.',
  invalidDate: 'Fecha inválida.',
  duplicateRecord: 'Ya existe un registro para esta fecha y lote.',
} as const;

// ── Default export ────────────────────────────────────────────────────────────

const es = {
  common,
  navigation,
  auth,
  lots,
  houses,
  production,
  mortality,
  feeding,
  health,
  sync,
  profile,
  validation,
} as const;

export default es;
