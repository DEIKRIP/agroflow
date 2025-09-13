import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import parcelService from "@/utils/parcelService";
import inspectionService from "@/utils/inspectionService";

const DEMO = String(import.meta.env.VITE_DEMO_MODE || '').toLowerCase() === 'true';

export type DashboardMetrics = {
  financingApprovedTotal: number; // total approved amount (Bs)
  activeParcelsCount: number;
  pendingInspectionsCount: number;
  nextPaymentAmount: number; // amount of the next scheduled payment
  nextPaymentSubtitle: string; // e.g., "Próximo: 15 Ago" or "Sin fecha"
};

const initial: DashboardMetrics = {
  financingApprovedTotal: 0,
  activeParcelsCount: 0,
  pendingInspectionsCount: 0,
  nextPaymentAmount: 0,
  nextPaymentSubtitle: "Sin fecha",
};

function formatNextPaymentSubtitle(dateStr?: string | null) {
  if (!dateStr) return "Sin fecha";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sin fecha";
  const f = new Intl.DateTimeFormat("es-VE", { day: "2-digit", month: "short" }).format(d);
  return `Próximo: ${f}`;
}

export function useDashboardMetrics() {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchFinancingApprovedTotal(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from("financing")
        .select("approved_amount, status");
      if (error) throw error;
      let total = 0;
      for (const row of data || []) {
        const s = String((row as any).status || "").toLowerCase();
        if (s === "approved") total += Number((row as any).approved_amount || 0);
      }
      return total;
    } catch (e) {
      console.error("metrics financing error", e);
      return 0;
    }
  }

  async function fetchActiveParcelsCount(): Promise<number> {
    // Alineado con el módulo de parcelas
    if (DEMO) {
      try {
        const res = await parcelService.getParcels();
        if (res?.success) return (res.data || []).length;
      } catch (_) {}
      return 0;
    }
    // Producción: usar tabla 'parcels'
    try {
      const res = await supabase.from('parcels').select('id', { count: 'exact', head: true });
      if ((res as any).error) throw (res as any).error;
      return (res as any).count || 0;
    } catch (_) {
      return 0;
    }
  }

  async function fetchPendingInspectionsCount(): Promise<number> {
    // Alineado con el módulo de inspecciones: contar estados pendientes/programados
    const isPending = (s: string) => {
      const v = s.toLowerCase();
      return v === 'pendiente' || v === 'programada' || v === 'pending' || v === 'scheduled' || v === 'programmed';
    };
    if (DEMO) {
      try {
        const res = await inspectionService.getInspections();
        if (res?.success) return (res.data || []).filter((i: any) => isPending(String(i?.status || i?.estado || ''))).length;
      } catch (_) {}
      return 0;
    }
    try {
      // Usar misma normalización que InspectionQueue para evitar desalineaciones
      const res = await supabase
        .from('inspections')
        .select('id, status, scheduled_at')
        .order('created_at', { ascending: false });
      if (res.error) throw res.error;
      const rows = res.data || [];
      const normalize = (s?: string | null) => {
        const v = String(s || '').toLowerCase();
        if (v === 'pendiente' || v === 'pending') return 'pending';
        if (v === 'programada' || v === 'scheduled' || v === 'en_progreso' || v === 'in_progress') return 'scheduled';
        if (v === 'completada' || v === 'completed') return 'completed';
        if (v === 'cancelada' || v === 'cancelled') return 'cancelled';
        return 'pending'; // default conservador
      };
      const count = rows.filter((r: any) => normalize(r?.status) === 'pending').length;
      return count;
    } catch (_) {
      return 0;
    }
  }

  async function fetchNextPayment(): Promise<{ amount: number; dueDate: string | null }> {
    // This project doesn't have payment_schedule. Return 0 by default.
    return { amount: 0, dueDate: null };
  }

  const loadAll = async () => {
    setError(null);
    setLoading(true);
    try {
      const [finTotal, parcels, insp, nextPay] = await Promise.all([
        fetchFinancingApprovedTotal(),
        fetchActiveParcelsCount(),
        fetchPendingInspectionsCount(),
        fetchNextPayment(),
      ]);
      setMetrics({
        financingApprovedTotal: finTotal,
        activeParcelsCount: parcels,
        pendingInspectionsCount: insp,
        nextPaymentAmount: nextPay.amount,
        nextPaymentSubtitle: formatNextPaymentSubtitle(nextPay.dueDate),
      });
    } catch (e: any) {
      setError(e?.message || "Error cargando métricas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    if (DEMO) {
      // En modo demo, refrescar periódicamente para reflejar cambios en memoria
      const id = setInterval(loadAll, 10000);
      return () => clearInterval(id);
    }
    const channel = supabase
      .channel("dashboard-metrics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "financing" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "payments" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parcels" },
        () => loadAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "inspections" },
        () => loadAll()
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch (_) {}
    };
  }, []);

  const formatted = useMemo(() => {
    // Use custom BD prefix instead of VES currency symbol (Bs.S)
    const numberFmt = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 0 });
    return {
      financingValueStr: `BD. ${numberFmt.format(metrics.financingApprovedTotal)}`,
      nextPaymentValueStr: `BD. ${numberFmt.format(metrics.nextPaymentAmount)}`,
    };
  }, [metrics]);

  return { metrics, loading, error, reload: loadAll, formatted };
}
