import { supabase } from "@/lib/supabase";

// Financing rows used in Payments page
export async function listActiveFinancingsWithFarmerName() {
  // Adjust the statuses if your table uses specific enums
  const { data, error } = await supabase
    .from("financing")
    .select(`
      id,
      farmer_id,
      parcel_id,
      requested_amount,
      approved_amount,
      status,
      purpose,
      created_at,
      farmer:farmer_id ( id, full_name )
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []).map((row: any) => ({
    id: row.id,
    purpose: row.purpose,
    status: row.status,
    monto: row.requested_amount ?? row.approved_amount ?? 0,
    totalPagado: 0, // can be computed from payments if needed
    clientName: row.farmer?.full_name || row.farmer_id,
  }));
}

// Payment ledger with details. Tries to join; falls back to manual mapping if join not available
export async function listPaymentsWithDetails() {
  // First try a single query with joins if a payments table exists
  const main = await supabase
    .from("payments")
    .select(`
      id,
      financing_id,
      farmer_id,
      fecha:created_at,
      monto:amount,
      metodo:method,
      montoRetenido:retained_amount,
      gananciaAgricultor:farmer_gain,
      financing:financing_id ( id, purpose ),
      farmer:farmer_id ( id, full_name )
    `)
    .order("created_at", { ascending: false });

  if (!main.error && Array.isArray(main.data)) {
    return (main.data || []).map((r: any) => ({
      id: r.id,
      fecha: r.fecha,
      monto: r.monto,
      metodo: r.metodo,
      montoRetenido: r.montoRetenido ?? 0,
      gananciaAgricultor: r.gananciaAgricultor ?? 0,
      clientName: r.farmer?.full_name || r.farmer_id,
      proposito: r.financing?.purpose || r.financing_id,
    }));
  }

  // Fallback plan: try a generic shape (snake_case), then enrich via lookups
  const { data: raw, error } = await supabase
    .from("payments")
    .select("id, financing_id, farmer_id, created_at, amount, method, retained_amount, farmer_gain")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const rows = raw || [];
  const farmerIds = Array.from(new Set(rows.map((r: any) => r.farmer_id).filter(Boolean)));
  const financingIds = Array.from(new Set(rows.map((r: any) => r.financing_id).filter(Boolean)));

  const [farmersRes, financingsRes] = await Promise.all([
    farmerIds.length
      ? supabase.from("farmers").select("id, full_name").in("id", farmerIds)
      : Promise.resolve({ data: [], error: null } as any),
    financingIds.length
      ? supabase.from("financing").select("id, purpose").in("id", financingIds)
      : Promise.resolve({ data: [], error: null } as any),
  ]);
  if (farmersRes.error) throw farmersRes.error;
  if (financingsRes.error) throw financingsRes.error;

  const nameByFarmer = new Map<string, string>();
  for (const f of farmersRes.data || []) nameByFarmer.set(String(f.id), (f as any).full_name || String(f.id));
  const purposeByFin = new Map<string, string>();
  for (const f of financingsRes.data || []) purposeByFin.set(String(f.id), (f as any).purpose || String(f.id));

  return rows.map((r: any) => ({
    id: r.id,
    fecha: r.created_at,
    monto: r.amount,
    metodo: r.method,
    montoRetenido: r.retained_amount ?? 0,
    gananciaAgricultor: r.farmer_gain ?? 0,
    clientName: nameByFarmer.get(String(r.farmer_id)) || r.farmer_id,
    proposito: purposeByFin.get(String(r.financing_id)) || r.financing_id,
  }));
}

// Totals by financing: sum(amount), sum(retained_amount), sum(farmer_gain)
export async function getPaymentsTotalsByFinancing(financingIds: string[]) {
  const ids = (financingIds || []).filter(Boolean);
  if (!ids.length) return {} as Record<string, { totalPagado: number; totalRetenido: number; totalGananciaAgricultor: number }>;

  const { data, error } = await supabase
    .from("payments")
    .select("financing_id, amount, retained_amount, farmer_gain")
    .in("financing_id", ids);
  if (error) throw error;

  const grouped: Record<string, { totalPagado: number; totalRetenido: number; totalGananciaAgricultor: number }> = {};
  for (const p of data || []) {
    const key = (p as any).financing_id as string;
    if (!grouped[key]) grouped[key] = { totalPagado: 0, totalRetenido: 0, totalGananciaAgricultor: 0 };
    grouped[key].totalPagado += Number((p as any).amount || 0);
    grouped[key].totalRetenido += Number((p as any).retained_amount || 0);
    grouped[key].totalGananciaAgricultor += Number((p as any).farmer_gain || 0);
  }
  return grouped;
}

// Search farmers and include their active financings
export async function searchClientsWithActiveFinancings(term: string) {
  const q = term.trim();
  if (!q) return [] as any[];

  const { data: farmers, error } = await supabase
    .from("farmers")
    .select("id, full_name, cedula")
    .or(`full_name.ilike.%${q}%,cedula.ilike.%${q}%`)
    .limit(10);
  if (error) throw error;

  const farmerIds = (farmers || []).map((f) => f.id);
  if (farmerIds.length === 0) return [];

  const { data: fins, error: fErr } = await supabase
    .from("financing")
    .select("id, farmer_id, purpose, status, requested_amount, approved_amount")
    .in("farmer_id", farmerIds);
  if (fErr) throw fErr;

  const finsByFarmer = new Map<string, any[]>();
  for (const f of fins || []) {
    const list = finsByFarmer.get(String((f as any).farmer_id)) || [];
    list.push({
      id: (f as any).id,
      proposito: (f as any).purpose,
      estado: (f as any).status,
      monto: (f as any).requested_amount ?? (f as any).approved_amount ?? 0,
      totalPagado: 0,
    });
    finsByFarmer.set(String((f as any).farmer_id), list);
  }

  return (farmers || []).map((f: any) => ({
    id: f.id,
    fullName: f.full_name,
    cedula: f.cedula,
    rif: undefined,
    financiamientos: finsByFarmer.get(String(f.id)) || [],
  }));
}
