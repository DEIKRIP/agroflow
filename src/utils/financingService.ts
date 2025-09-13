import { supabase } from "@/lib/supabase";

export type FinancingRow = {
  id: string;
  farmer_id: string;
  parcel_id: string;
  requested_amount: number | null;
  approved_amount: number | null;
  status: string | null;
  purpose: string | null;
  created_at: string;
};

export async function listFinancings(): Promise<FinancingRow[]> {
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
      created_at
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data || []) as FinancingRow[];
}

// Single-query version with relations (farmer and parcel)
export async function listFinancingsWithRelations() {
  const { data, error } = await supabase
    .from('financing')
    .select(`
      id,
      purpose,
      status,
      requested_amount,
      approved_amount,
      created_at,
      farmer:farmer_id (
        id,
        full_name,
        cedula,
        phone
      ),
      parcel:parcel_id (
        id,
        name,
        crop_type,
        surface_area
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export type FinancingWithFarmer = FinancingRow & {
  farmer_name?: string | null;
};

export async function listFinancingsWithFarmer(): Promise<FinancingWithFarmer[]> {
  const rows = await listFinancings();
  const farmerIds = Array.from(new Set(rows.map(r => r.farmer_id).filter(Boolean)));
  let namesById = new Map<string, string>();
  if (farmerIds.length) {
    const { data: farmers, error } = await supabase
      .from('farmers')
      .select('id, full_name')
      .in('id', farmerIds);
    if (error) throw error;
    for (const f of farmers || []) {
      // prefer full_name; fallback to id as string
      namesById.set(String(f.id), (f as any).full_name || String(f.id));
    }
  }

  return rows.map(r => ({
    ...r,
    farmer_name: namesById.get(String(r.farmer_id)) || null,
  }));
}
