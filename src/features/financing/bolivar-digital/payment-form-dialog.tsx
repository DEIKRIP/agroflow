"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import {
  Dialog,
  Content as DialogContent,
  Description as DialogDescription,
  Header as DialogHeader,
  Title as DialogTitle,
  Footer as DialogFooter,
  Close as DialogClose,
} from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import type { Financiamiento } from "@/lib/types";
import { Textarea } from "@/components/ui/Textarea";

type LocalFormState = {
  success: boolean;
  error: string | null;
  isSubmitting: boolean;
};

type PaymentFormDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  financiamiento: Financiamiento;
  clientName: string;
};

export default function PaymentFormDialog({ isOpen, setIsOpen, financiamiento, clientName }: PaymentFormDialogProps) {
  const [formState, setFormState] = useState<LocalFormState>({ success: false, error: null, isSubmitting: false });
  const [metodo, setMetodo] = useState<string | undefined>("Efectivo");
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const saldoPendiente = (financiamiento.monto || 0) - (financiamiento.totalPagado ?? 0);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setMetodo("Efectivo");
      setFormState({ success: false, error: null, isSubmitting: false });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const fecha = String(fd.get("fecha") || "");
    const monto = Number(fd.get("monto") || 0);
    const metodoValue = String(fd.get("metodo") || metodo || "Efectivo");
    const referenciaCosecha = String(fd.get("referenciaCosecha") || "");
    const clientId = String(fd.get("clientId") || "");
    const financiamientoId = String(fd.get("financiamientoId") || "");

    setFormState({ success: false, error: null, isSubmitting: true });
    try {
      // Insert into payments ledger
      const { error } = await supabase.from("payments").insert([
        {
          financing_id: financiamientoId || financiamiento.id,
          farmer_id: clientId || (financiamiento as any).farmer_id || financiamiento.clientId,
          created_at: new Date(fecha).toISOString(),
          amount: monto,
          method: metodoValue,
          notes: referenciaCosecha || null,
        },
      ]);
      if (error) throw error;

      setFormState({ success: true, error: null, isSubmitting: false });
      toast({ title: "Éxito", description: "Pago registrado" });
      setIsOpen(false);
    } catch (err: any) {
      console.error("Error registrando pago:", err);
      setFormState({ success: false, error: err?.message || "Error al registrar pago", isSubmitting: false });
      toast({ title: "Error", description: err?.message || "No se pudo registrar el pago", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago de Cosecha</DialogTitle>
          <DialogDescription>
            Registrar el ingreso de una venta de cosecha para <strong>{clientName}</strong>. El sistema aplicará la retención correspondiente al crédito.
            <div className="flex justify-between text-sm mt-2 font-medium">
              <span>Monto del crédito: <span className="text-foreground">BD. {(financiamiento.monto || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span></span>
              <span>Saldo Pendiente: <span className="text-primary">BD. {saldoPendiente.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span></span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="clientId" value={String(financiamiento.clientId || "")} />
          <input type="hidden" name="financiamientoId" value={String(financiamiento.id || "")} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha del Pago</Label>
              <Input id="fecha" name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <Label htmlFor="monto">Monto Total Venta (BD.)</Label>
              <Input id="monto" name="monto" type="number" step="0.01" required placeholder="Total de la venta" />
            </div>
          </div>

          <div>
            <Label htmlFor="metodo">Método de Pago</Label>
            <Select
              id="metodo"
              name="metodo"
              required
              value={metodo}
              onChange={(v: string | undefined) => setMetodo(v)}
              placeholder="Seleccione un método..."
              options={[
                { value: "Efectivo", label: "Efectivo" },
                { value: "Transferencia", label: "Transferencia" },
                { value: "Patria", label: "Patria" },
                { value: "Otro", label: "Otro" },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="referenciaCosecha">Referencia Cosecha (Opcional)</Label>
            <Textarea id="referenciaCosecha" name="referenciaCosecha" placeholder="Ej: Cosecha de Maíz ciclo invierno 2024" />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Registrando..." : "Registrar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}