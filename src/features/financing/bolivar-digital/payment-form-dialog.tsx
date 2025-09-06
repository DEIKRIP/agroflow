"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { addPaymentAction, type FormActionState } from "@/lib/bolivarDigitalActions";
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

function SubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "Registrando..." : "Registrar Pago"}</Button>;
}

type PaymentFormDialogProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  financiamiento: Financiamiento;
  clientName: string;
};

export default function PaymentFormDialog({ isOpen, setIsOpen, financiamiento, clientName }: PaymentFormDialogProps) {
  const [state, formAction, isPending] = useActionState<FormActionState | null>(addPaymentAction, null);
  const [metodo, setMetodo] = useState<string | undefined>("Efectivo");
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const saldoPendiente = (financiamiento.monto || 0) - (financiamiento.totalPagado ?? 0);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
      setMetodo("Efectivo");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isPending || !state) return;
    if (state.success) {
      toast({ title: "Éxito", description: state.message || "Pago registrado" });
      setIsOpen(false);
    } else {
      toast({ title: "Error", description: state.message || "No se pudo registrar el pago", variant: "destructive" });
    }
  }, [state, isPending, toast, setIsOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago de Cosecha</DialogTitle>
          <DialogDescription>
            Registrar el ingreso de una venta de cosecha para <strong>{clientName}</strong>. El sistema aplicará la retención correspondiente al crédito.
            <div className="flex justify-between text-sm mt-2 font-medium">
              <span>Monto del crédito: <span className="text-foreground">Bs. {(financiamiento.monto || 0).toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span></span>
              <span>Saldo Pendiente: <span className="text-primary">Bs. {saldoPendiente.toLocaleString("es-VE", { minimumFractionDigits: 2 })}</span></span>
            </div>
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={String(financiamiento.clientId || "")} />
          <input type="hidden" name="financiamientoId" value={String(financiamiento.id || "")} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha">Fecha del Pago</Label>
              <Input id="fecha" name="fecha" type="date" required defaultValue={new Date().toISOString().split("T")[0]} />
              {state?.errors?.fecha && <p className="text-sm text-destructive mt-1">{state.errors.fecha}</p>}
            </div>
            <div>
              <Label htmlFor="monto">Monto Total Venta (Bs.)</Label>
              <Input id="monto" name="monto" type="number" step="0.01" required placeholder="Total de la venta" />
              {state?.errors?.monto && <p className="text-sm text-destructive mt-1">{state.errors.monto}</p>}
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
            {state?.errors?.metodo && <p className="text-sm text-destructive mt-1">{state.errors.metodo}</p>}
          </div>

          <div>
            <Label htmlFor="referenciaCosecha">Referencia Cosecha (Opcional)</Label>
            <Textarea id="referenciaCosecha" name="referenciaCosecha" placeholder="Ej: Cosecha de Maíz ciclo invierno 2024" />
            {state?.errors?.referenciaCosecha && (
              <p className="text-sm text-destructive mt-1">{state.errors.referenciaCosecha}</p>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}