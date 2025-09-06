import { supabase } from './supabase';

export interface Client {
  id?: string;
  fullName: string;
  cedula: string;
  rif: string;
  phone: string;
  address: string;
  activity: string;
}

export interface ActionResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export const deleteClientAction = async (clientId: string): Promise<ActionResponse> => {
  try {
    const { error } = await supabase
      .from('bolivarDigitalClients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente eliminado exitosamente',
    };
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    return {
      success: false,
      message: 'Error al eliminar el cliente',
      error: error.message,
    };
  }
};

// State shape used by client-side forms via useActionState
export type FormActionState = {
  success: boolean;
  message?: string;
  errors?: Record<string, string>;
};

// ---- Query helpers (Supabase) ----
export async function getClientsList() {
  const { data, error } = await supabase
    .from('bolivarDigitalClients')
    .select('id, fullName, cedula, rif')
    .order('fullName', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function getApprovedParcelas(clientId: string) {
  // 1) Obtener farmerId del cliente
  const { data: client, error: clientErr } = await supabase
    .from('bolivarDigitalClients')
    .select('farmerId')
    .eq('id', clientId)
    .single();
  if (clientErr) throw clientErr;
  if (!client?.farmerId) return [];

  // 2) Parcelas vinculadas al farmer con bandera isLinkedToClient
  const { data: parcelas, error: parcelasErr } = await supabase
    .from('parcelas')
    .select('id, name')
    .eq('farmerId', client.farmerId)
    .eq('isLinkedToClient', true);
  if (parcelasErr) throw parcelasErr;
  if (!parcelas?.length) return [];

  // 3) Para cada parcela, verificar que tenga inspección aprobada y estimación
  const results: Array<{ id: string; name: string; montoTotalEstimado?: number } | null> = [];
  for (const p of parcelas) {
    const { data: insp, error: inspErr } = await supabase
      .from('inspections')
      .select('id')
      .eq('parcelaId', p.id)
      .eq('status', 'Aprobada')
      .limit(1)
      .maybeSingle();
    if (inspErr) throw inspErr;
    if (!insp) {
      results.push(null);
      continue;
    }

    const { data: estim, error: estimErr } = await supabase
      .from('estimaciones')
      .select('montoTotalEstimado')
      .eq('parcelaId', p.id)
      .limit(1)
      .maybeSingle();
    if (estimErr) throw estimErr;
    if (!estim) {
      results.push(null);
      continue;
    }

    results.push({ id: p.id, name: p.name, montoTotalEstimado: estim.montoTotalEstimado });
  }

  return results.filter(Boolean) as Array<{ id: string; name: string; montoTotalEstimado?: number }>;
}

// Active financings with client basic info
export async function listActiveFinanciamientosWithClient() {
  const estados = ['Activo', 'En Seguimiento', 'Cosechado', 'Incumplido'];
  const { data, error } = await supabase
    .from('bolivarDigitalFinanciamientos')
    .select('id, clientId, parcelaId, monto, totalPagado, estado, proposito, numeroCosechas')
    .in('estado', estados)
    .order('id', { ascending: false });
  if (error) throw error;

  // Map client names
  const clientIds = Array.from(new Set((data || []).map((f: any) => f.clientId).filter(Boolean)));
  let clientsById = new Map<string, { fullName: string }>();
  if (clientIds.length > 0) {
    const { data: clients, error: cErr } = await supabase
      .from('bolivarDigitalClients')
      .select('id, fullName')
      .in('id', clientIds);
    if (cErr) throw cErr;
    for (const c of clients || []) clientsById.set(c.id, { fullName: c.fullName });
  }

  return (data || []).map((f: any) => ({ ...f, clientName: clientsById.get(f.clientId)?.fullName }));
}

// Payments history with joined details
export async function listPagosWithDetails() {
  const { data: pagos, error } = await supabase
    .from('bolivarDigitalPayments')
    .select('id, clientId, financiamientoId, fecha, monto, montoRetenido, gananciaAgricultor, metodo')
    .order('fecha', { ascending: false });
  if (error) throw error;

  const clientIds = Array.from(new Set((pagos || []).map((p: any) => p.clientId).filter(Boolean)));
  const financiamientoIds = Array.from(new Set((pagos || []).map((p: any) => p.financiamientoId).filter(Boolean)));

  const [clientsRes, finsRes] = await Promise.all([
    clientIds.length ? supabase.from('bolivarDigitalClients').select('id, fullName').in('id', clientIds) : Promise.resolve({ data: [], error: null } as any),
    financiamientoIds.length ? supabase.from('bolivarDigitalFinanciamientos').select('id, proposito').in('id', financiamientoIds) : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (clientsRes.error) throw clientsRes.error;
  if (finsRes.error) throw finsRes.error;

  const clientsById = new Map<string, { fullName: string }>();
  for (const c of clientsRes.data || []) clientsById.set(c.id, { fullName: c.fullName });
  const finsById = new Map<string, { proposito: string }>();
  for (const f of finsRes.data || []) finsById.set(f.id, { proposito: f.proposito });

  return (pagos || []).map((p: any) => ({
    ...p,
    clientName: clientsById.get(p.clientId)?.fullName || 'Desconocido',
    proposito: finsById.get(p.financiamientoId)?.proposito || 'N/A',
  }));
}

// Search clients by name or cedula and include their active financings
export async function searchClientsWithActiveFinanciamientos(term: string) {
  const q = term.trim();
  if (!q) return [] as any[];

  // Basic filters; for better performance create indexes in Supabase and use ilike
  const [byName, byCedula] = await Promise.all([
    supabase.from('bolivarDigitalClients').select('id, fullName, cedula, rif').ilike('fullName', `%${q}%`).limit(5),
    supabase.from('bolivarDigitalClients').select('id, fullName, cedula, rif').ilike('cedula', `%${q}%`).limit(5),
  ]);
  if (byName.error) throw byName.error;
  if (byCedula.error) throw byCedula.error;
  const clientsMap = new Map<string, any>();
  for (const c of byName.data || []) clientsMap.set(c.id, c);
  for (const c of byCedula.data || []) clientsMap.set(c.id, c);
  const uniqueClients = Array.from(clientsMap.values());

  if (uniqueClients.length === 0) return [];

  const estados = ['Activo', 'En Seguimiento', 'Cosechado', 'Incumplido'];
  const clientIds = uniqueClients.map(c => c.id);
  const { data: fins, error: finsErr } = await supabase
    .from('bolivarDigitalFinanciamientos')
    .select('id, clientId, monto, totalPagado, estado, proposito, numeroCosechas')
    .in('clientId', clientIds)
    .in('estado', estados);
  if (finsErr) throw finsErr;

  const finsByClient = new Map<string, any[]>();
  for (const f of fins || []) {
    if (!finsByClient.has(f.clientId)) finsByClient.set(f.clientId, []);
    finsByClient.get(f.clientId)!.push(f);
  }

  return uniqueClients.map(c => ({ ...c, financiamientos: finsByClient.get(c.id) || [] }));
}

// Action to add/register a financiamiento
export async function addFinanciamientoAction(
  _prevState: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  try {
    const clientId = String(formData.get('clientId') || '');
    const parcelaId = String(formData.get('parcelaId') || '');
    const montoStr = String(formData.get('monto') || '');
    const tasaStr = String(formData.get('tasa') || '');
    const numeroCosechasStr = String(formData.get('numeroCosechas') || '');
    const proposito = String(formData.get('proposito') || '');

    const errors: Record<string, string> = {};
    if (!clientId) errors.clientId = 'Seleccione un sujeto';
    if (!parcelaId) errors.parcelaId = 'Seleccione una parcela';
    const monto = Number(montoStr);
    if (!montoStr || isNaN(monto) || monto <= 0) errors.monto = 'Ingrese un monto válido';
    const tasa = Number(tasaStr);
    if (!tasaStr || isNaN(tasa) || tasa <= 0) errors.tasa = 'Ingrese una tasa válida';
    const numeroCosechas = Number(numeroCosechasStr);
    if (!numeroCosechasStr || isNaN(numeroCosechas) || numeroCosechas <= 0) errors.numeroCosechas = 'Ingrese un número válido';
    if (!proposito) errors.proposito = 'Ingrese el propósito';

    if (Object.keys(errors).length > 0) {
      return { success: false, message: 'Revise los campos', errors };
    }

    // Persist in Supabase (adjust table/columns to your schema)
    const { error } = await supabase.from('bolivarDigitalFinanciamientos').insert({
      clientId,
      parcelaId,
      monto,
      tasa,
      numeroCosechas,
      proposito,
      estado: 'Activo',
      totalPagado: 0,
      createdAt: new Date().toISOString(),
    });

    if (error) throw error;

    return { success: true, message: 'Financiamiento registrado correctamente' };
  } catch (e: any) {
    console.error('addFinanciamientoAction error', e);
    return { success: false, message: 'No se pudo registrar el financiamiento' };
  }
}

// Action to add/register a payment for a financiamiento
// This is a client-friendly wrapper used with useActionState in the UI
export async function addPaymentAction(
  _prevState: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  try {
    const clientId = String(formData.get('clientId') || '');
    const financiamientoId = String(formData.get('financiamientoId') || '');
    const fecha = String(formData.get('fecha') || '');
    const montoStr = String(formData.get('monto') || '');
    const metodo = String(formData.get('metodo') || '');
    const referenciaCosecha = String(formData.get('referenciaCosecha') || '');

    const errors: Record<string, string> = {};
    if (!fecha) errors.fecha = 'La fecha es requerida';
    const monto = Number(montoStr);
    if (!montoStr || isNaN(monto) || monto <= 0) errors.monto = 'Ingrese un monto válido';
    if (!metodo) errors.metodo = 'Seleccione un método de pago';
    if (!clientId) errors.clientId = 'Falta clientId';
    if (!financiamientoId) errors.financiamientoId = 'Falta financiamientoId';

    if (Object.keys(errors).length > 0) {
      return { success: false, message: 'Revise los campos', errors };
    }

    // Persist using Supabase (simplified example; adjust table/columns to your schema)
    const { error } = await supabase.from('bolivarDigitalPayments').insert({
      clientId,
      financiamientoId,
      fecha,
      monto,
      metodo,
      referenciaCosecha: referenciaCosecha || null,
      createdAt: new Date().toISOString(),
    });

    if (error) throw error;

    return { success: true, message: 'Pago registrado correctamente' };
  } catch (e: any) {
    console.error('addPaymentAction error', e);
    return { success: false, message: 'No se pudo registrar el pago' };
  }
}

// Simple stubs for financiamiento actions to let UI work
export async function updateFinanciamientoStatusAction(
  _clientId: string,
  _financiamientoId: string,
  _from: string,
  to: string
): Promise<ActionResponse> {
  // TODO: implement Supabase update
  return { success: true, message: `Estado actualizado a ${to}` };
}

export async function approveFinanciamientoAction(
  _clientId: string,
  _financiamientoId: string
): Promise<ActionResponse> {
  // TODO: implement Supabase approval
  return { success: true, message: 'Financiamiento aprobado' };
}

export async function deleteFinanciamientoAction(
  _clientId: string,
  _financiamientoId: string
): Promise<ActionResponse> {
  // TODO: implement Supabase delete
  return { success: true, message: 'Financiamiento eliminado' };
}

export async function generateScheduleAction(
  _prevState: FormActionState | null,
  formData: FormData
): Promise<FormActionState> {
  // Minimal validation and success response
  const harvestValue = Number(formData.get('harvestValue') || '');
  const frequency = String(formData.get('frequency') || '');
  const errors: Record<string, string> = {};
  if (!harvestValue || isNaN(harvestValue) || harvestValue <= 0) errors.harvestValue = 'Ingrese un valor válido';
  if (!frequency) errors.frequency = 'Seleccione una frecuencia';
  if (Object.keys(errors).length) return { success: false, message: 'Revise los campos', errors };
  // TODO: persist schedule rows in Supabase
  return { success: true, message: 'Cronograma generado' };
}

export const saveClient = async (clientData: any): Promise<ActionResponse> => {
  try {
    const { data, error } = await supabase
      .from('bolivarDigitalClients')
      .upsert([clientData], { onConflict: 'id' });

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente guardado exitosamente',
      data: data?.[0],
    };
  } catch (error: any) {
    console.error('Error al guardar cliente:', error);
    return {
      success: false,
      message: 'Error al guardar el cliente',
      error: error.message,
    };
  }
};

export const getClientById = async (clientId: string): Promise<ActionResponse> => {
  try {
    const { data, error } = await supabase
      .from('bolivarDigitalClients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Cliente obtenido exitosamente',
      data,
    };
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    return {
      success: false,
      message: 'Error al obtener el cliente',
      error: error.message,
    };
  }
};
