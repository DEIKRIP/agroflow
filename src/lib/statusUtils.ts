// Centralized status normalization and helpers
// This utility maps different variants (language/casing) to a canonical set
// of statuses used across the app, especially for inspections and financings.

export type CanonicalInspectionStatus =
  | 'pendiente'
  | 'programada'
  | 'en_progreso'
  | 'aprobada'
  | 'completada'
  | 'rechazada'
  | 'cancelada';

// Variants mapping for inspection statuses coming from different modules
const inspectionStatusMap: Record<string, CanonicalInspectionStatus> = {
  // pending
  pending: 'pendiente',
  pendiente: 'pendiente',
  // scheduled
  scheduled: 'programada',
  programada: 'programada',
  // in progress
  in_progress: 'en_progreso',
  'en progreso': 'en_progreso',
  en_progreso: 'en_progreso',
  // approved / completed
  approved: 'aprobada',
  aprobada: 'aprobada',
  completed: 'completada',
  completada: 'completada',
  // rejected / cancelled
  rejected: 'rechazada',
  rechazada: 'rechazada',
  cancelled: 'cancelada',
  cancelada: 'cancelada',
};

export function normalizeInspectionStatus(input?: string | null): CanonicalInspectionStatus | undefined {
  if (!input) return undefined;
  const key = String(input).trim().toLowerCase();
  return inspectionStatusMap[key];
}

export function isActiveInspectionStatus(status?: string | null): boolean {
  const s = normalizeInspectionStatus(status);
  return s === 'pendiente' || s === 'programada' || s === 'en_progreso';
}

export function isTerminalInspectionStatus(status?: string | null): boolean {
  const s = normalizeInspectionStatus(status);
  return s === 'aprobada' || s === 'completada' || s === 'rechazada' || s === 'cancelada';
}

// Financing workflow states can also be centralized if needed later
export type CanonicalFinancingStatus =
  | 'solicitud'
  | 'verificacion_garantia'
  | 'operativo_instalado'
  | 'cosechado'
  | 'pagado'
  | 'incumplido'
  | 'en_seguimiento'
  | 'pendiente_aprobacion'
  | 'aprobado'
  | 'rechazado';
