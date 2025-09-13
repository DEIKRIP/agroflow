"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentsTotalsByFinancing } from "@/utils/paymentsService";
import { supabase } from "@/lib/supabase";

// Small badge to visualize financing status
function StatusBadge({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();
  let cls = "bg-gray-100 text-gray-800";
  let text = status || "N/A";
  if (s === "approved") {
    cls = "bg-green-100 text-green-800";
    text = "Aprobado";
  } else if (s === "rejected") {
    cls = "bg-red-100 text-red-800";
    text = "Rechazado";
  } else if (s === "pending") {
    cls = "bg-yellow-100 text-yellow-800";
    text = "Pendiente";
  }
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{text}</span>;
}

export default function FinanciamientosModule() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // Direct query to Supabase for approved financings with joins
        const { data, error } = await supabase
          .from("financing")
          .select(`
            id,
            requested_amount,
            approved_amount,
            status,
            purpose,
            created_at,
            approved_at,
            farmer:farmer_id ( id, full_name ),
            parcel:parcel_id ( id, name )
          `)
          .eq("status", "approved")
          .order("created_at", { ascending: false });
        if (error) throw error;

        const rows = (data || []) as any[];
        // compute totals per financing from payments
        const totals = await getPaymentsTotalsByFinancing(rows.map((f) => f.id));
        const enriched = rows.map((f) => {
          const t = totals[f.id] || { totalPagado: 0 } as any;
          const approvedAmount = Number(f.approved_amount || 0);
          const totalPagado = Number(t.totalPagado || 0);
          const saldoPendiente = Math.max(0, approvedAmount - totalPagado);
          return { ...f, totalPagado, saldoPendiente };
        });
        setItems(enriched);
      } catch (e: unknown) {
        console.error("Error cargando financiamientos:", e instanceof Error ? e.message : e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Financiamientos</CardTitle>
          <CardDescription>Registros desde la tabla financing en Supabase. Mostrando solo Aprobados.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay financiamientos registrados.</p>
          )}
          {!loading && items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground border-b">
                    <th className="py-2 pr-3">Agricultor</th>
                    <th className="py-2 pr-3">Parcela</th>
                    <th className="py-2 pr-3">Solicitado</th>
                    <th className="py-2 pr-3">Aprobado</th>
                    <th className="py-2 pr-3">Pagado</th>
                    <th className="py-2 pr-3">Pendiente</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Fecha Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((f) => {
                    const farmerName = f?.farmer?.full_name || f?.farmer?.nombre_completo || f?.farmer_id;
                    const parcelName = f?.parcel?.name || f?.parcel_id || "—";
                    const solicitado = Number(f.requested_amount || 0);
                    const aprobado = Number(f.approved_amount || 0);
                    const pagado = Number(f.totalPagado || 0);
                    const pendiente = Math.max(0, aprobado - pagado);
                    const aprobadoFmt = `BD. ${aprobado.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
                    const solicitadoFmt = `BD. ${solicitado.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
                    const pagadoFmt = `BD. ${pagado.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
                    const pendienteFmt = `BD. ${pendiente.toLocaleString("es-VE", { minimumFractionDigits: 2 })}`;
                    const approvedAt = f.approved_at ? new Date(f.approved_at).toLocaleDateString() : (f.created_at ? new Date(f.created_at).toLocaleDateString() : "—");
                    return (
                      <tr key={f.id} className="border-b last:border-0">
                        <td className="py-2 pr-3 font-medium text-green-700">{farmerName}</td>
                        <td className="py-2 pr-3">{parcelName}</td>
                        <td className="py-2 pr-3">{solicitadoFmt}</td>
                        <td className="py-2 pr-3 text-green-700">{aprobadoFmt}</td>
                        <td className="py-2 pr-3 text-green-700">{pagadoFmt}</td>
                        <td className={`py-2 pr-3 ${pendiente > 0 ? "text-red-600" : "text-green-700"}`}>{pendienteFmt}</td>
                        <td className="py-2 pr-3"><StatusBadge status={f.status} /></td>
                        <td className="py-2 pr-3">{approvedAt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}