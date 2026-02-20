/**
 * Centralized plain-language Spanish error messages (T155)
 *
 * All user-facing error messages should come from here to ensure
 * consistency and plain language throughout the app.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export const AuthErrors = {
  NOT_AUTHENTICATED: 'Debes iniciar sesión para continuar.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Vuelve a iniciar sesión.',
  ACCESS_DENIED: 'Acceso denegado. Contacta al administrador.',
  INVITATION_INVALID: 'Esta invitación no es válida.',
  INVITATION_EXPIRED: 'Esta invitación ha vencido. Solicita una nueva.',
  INVITATION_ALREADY_USED: 'Esta invitación ya fue utilizada.',
  USER_REVOKED: 'Tu acceso ha sido revocado. Contacta al administrador.',
  LOAD_FAILED: 'No se pudo cargar la información de usuario.',
} as const;

// ── Lots ──────────────────────────────────────────────────────────────────────

export const LotErrors = {
  LOAD_FAILED: 'No se pudieron cargar los lotes.',
  CREATE_FAILED: 'No se pudo crear el lote. Intenta de nuevo.',
  UPDATE_FAILED: 'No se pudo actualizar el lote. Intenta de nuevo.',
  NOT_FOUND: 'El lote no existe o fue eliminado.',
  NO_HENS: 'Este lote no tiene gallinas vivas. No se pueden registrar datos.',
  NO_ACTIVE_LOTS: 'No hay lotes activos. Crea un lote primero.',
  REQUIRES_HOUSE: 'Primero debes crear un galpón.',
} as const;

// ── Houses ────────────────────────────────────────────────────────────────────

export const HouseErrors = {
  LOAD_FAILED: 'No se pudieron cargar los galpones.',
  CREATE_FAILED: 'No se pudo crear el galpón. Intenta de nuevo.',
  UPDATE_FAILED: 'No se pudo actualizar el galpón. Intenta de nuevo.',
  NAME_TAKEN: 'Ya existe un galpón con ese nombre.',
} as const;

// ── Production ────────────────────────────────────────────────────────────────

export const ProductionErrors = {
  LOAD_FAILED: 'No se pudo cargar el historial de producción.',
  RECORD_FAILED: 'No se pudo registrar la producción. Intenta de nuevo.',
  FUTURE_DATE: 'La fecha no puede ser en el futuro.',
  NEGATIVE_EGGS: 'La cantidad de huevos no puede ser negativa.',
  LOT_NO_HENS: 'El lote no tiene gallinas vivas actualmente.',
  HIGH_EGG_COUNT:
    'La cantidad de huevos es muy alta para este lote. ¿Estás seguro?',
} as const;

// ── Mortality ─────────────────────────────────────────────────────────────────

export const MortalityErrors = {
  LOAD_FAILED: 'No se pudo cargar el historial de mortalidad.',
  RECORD_FAILED: 'No se pudo registrar la mortalidad. Intenta de nuevo.',
  EXCEEDS_LIVE_COUNT:
    'La cantidad de bajas supera las gallinas vivas en este lote.',
  FUTURE_DATE: 'La fecha no puede ser en el futuro.',
  ZERO_HENS: 'La cantidad de bajas debe ser mayor a cero.',
} as const;

// ── Feeding ───────────────────────────────────────────────────────────────────

export const FeedingErrors = {
  LOAD_FAILED: 'No se pudo cargar el historial de alimentación.',
  BATCH_CREATE_FAILED: 'No se pudo crear el lote de alimento. Intenta de nuevo.',
  RECORD_FAILED: 'No se pudo registrar la alimentación. Intenta de nuevo.',
  EXCEEDS_BATCH:
    'La cantidad supera el stock disponible en este lote de alimento.',
  NO_BATCHES: 'No hay lotes de alimento disponibles. Crea uno primero.',
} as const;

// ── Health & Biosecurity ──────────────────────────────────────────────────────

export const HealthErrors = {
  LOAD_FAILED: 'No se pudo cargar el historial de eventos.',
  HEALTH_RECORD_FAILED:
    'No se pudo registrar la vacunación. Intenta de nuevo.',
  BIOSECURITY_RECORD_FAILED:
    'No se pudo registrar la desinfección. Intenta de nuevo.',
  FUTURE_DATE: 'La fecha no puede ser en el futuro.',
} as const;

// ── Sync ──────────────────────────────────────────────────────────────────────

export const SyncErrors = {
  SYNC_FAILED: 'Error al sincronizar. Los datos se guardarán localmente.',
  NO_CONNECTION: 'Sin conexión. Los cambios se sincronizarán cuando haya internet.',
  UPLOAD_FAILED: 'No se pudieron enviar algunos cambios al servidor.',
  DOWNLOAD_FAILED: 'No se pudieron descargar los últimos cambios.',
} as const;

// ── Generic ───────────────────────────────────────────────────────────────────

export const GenericErrors = {
  UNEXPECTED: 'Ocurrió un error inesperado. Intenta de nuevo.',
  LOAD_FAILED: 'No se pudo cargar la información.',
  SAVE_FAILED: 'No se pudo guardar. Intenta de nuevo.',
  NETWORK: 'Error de conexión. Verifica tu internet.',
  DB_INIT: 'No se pudo inicializar la base de datos. Reinicia la aplicación.',
} as const;

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Returns a plain language message for an unknown error.
 * Falls back to the generic unexpected error if message is not useful.
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    // Avoid exposing raw DB/network stack traces to users
    const msg = error.message.toLowerCase();
    if (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('timeout')
    ) {
      return GenericErrors.NETWORK;
    }
    if (msg.includes('database') || msg.includes('sqlite')) {
      return GenericErrors.SAVE_FAILED;
    }
  }
  return GenericErrors.UNEXPECTED;
}
