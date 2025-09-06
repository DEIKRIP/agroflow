"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";
import Input from "@/components/ui/Input";
import { listActiveFinanciamientosWithClient } from "@/lib/bolivarDigitalActions";
import type { Financiamiento } from "@/lib/types";
import GenerateScheduleDialog from "./generate-schedule-dialog";

export default function FinanciamientosModule() {
  const [loading, setLoading] = useState(true);
  const [financiamientos, setFinanciamientos] = useState<(Financiamiento & { clientName?: string })[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listActiveFinanciamientosWithClient();
        if (!cancelled) setFinanciamientos(data as any);
      } catch (e) {
        console.error("Error cargando financiamientos:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = financiamientos.filter((f) => {
    if (!filter.trim()) return true;
    const name = (f.clientName || "").toLowerCase();
    const proposito = (f.proposito || "").toLowerCase();
    return name.includes(filter.toLowerCase()) || proposito.includes(filter.toLowerCase());
  });

  return (
    <div className="p-2 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Financiamientos</CardTitle>
          <CardDescription>Listado de créditos activos y en seguimiento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={filter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFilter(e.target.value)}
              placeholder="Filtrar por sujeto o propósito"
            />
            <Button onClick={() => setFilter("")} variant="secondary">Limpiar</Button>
          </div>

          {loading && <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>}

          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay resultados.</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2">
              {filtered.map((f) => (
                <Card key={String(f.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{f.proposito || "Sin propósito"}</CardTitle>
                    <CardDescription>Sujeto: {f.clientName || "Desconocido"}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="flex justify-between">
                      <span>Monto: <strong>Bs. {(f.monto || 0).toLocaleString("es-VE")}</strong></span>
                      <span>Pagado: <strong className="text-green-600">Bs. {(f.totalPagado || 0).toLocaleString("es-VE")}</strong></span>
                      <span className="text-muted-foreground">{f.estado}</span>
                    </div>
                    <div className="mt-3">
                      <GenerateScheduleDialog financiamiento={f as Financiamiento} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}