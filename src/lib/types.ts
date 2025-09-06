import { Farmer } from "@/types/farmer";

export interface FarmerWithParcelas extends Farmer {
  parcelas?: any[]; // Reemplaza 'any' con el tipo correcto de parcela si lo tienes
  isLinkedToClient: boolean;
  hasApprovedInspection: boolean;
}

export interface PrefillFinanciamientoData {
  farmerId: string | number;
  farmerName: string;
  // Agrega más campos según sea necesario
  clientId?: string; // usado para precargar el sujeto en el diálogo
}

export interface Notification {
  id: string;
  clientId: string;
  financiamientoId: string;
  type: 'info' | 'warning' | 'success' | 'action_required';
  status: 'read' | 'unread';
  message: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

// Minimal shape required by financing dialogs/components
export interface Financiamiento {
  id: string;
  clientId: string;
  monto: number;
  totalPagado?: number;
  numeroCosechas: number;
  // Campos adicionales usados en los módulos de Bolívar Digital
  estado?: string; // 'Activo' | 'En Seguimiento' | 'Cosechado' | 'Incumplido' | etc.
  proposito?: string;
}

// Cliente de Bolívar Digital (forma mínima usada en la UI)
export interface BolivarDigitalClient {
  id: string;
  fullName: string;
  cedula: string;
  rif?: string;
  // Campos adicionales pueden existir pero no son requeridos por la UI actual
  [key: string]: any;
}

// Pago asociado a un financiamiento (forma mínima usada en la UI)
export interface Pago {
  id: string;
  fecha: string | number | Date; // Se renderiza con new Date(fecha)
  monto: number;
  metodo: string;
  montoRetenido?: number;
  gananciaAgricultor?: number;
}
