
"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  generateScheduleAction,
  type FormActionState,
} from "@/lib/bolivarDigitalActions";
import Button from "@/components/ui/Button";
import {
  Dialog,
  Content as DialogContent,
  Description as DialogDescription,
  Header as DialogHeader,
  Title as DialogTitle,
  Trigger as DialogTrigger,
  Footer as DialogFooter,
  Close as DialogClose,
} from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import Select from "@/components/ui/Select";
import type { Financiamiento } from "@/lib/types";

type GenerateScheduleDialogProps = { financiamiento: Financiamiento };

export default function GenerateScheduleDialog({ financiamiento }: GenerateScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<FormActionState | null>(generateScheduleAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isPending || !state) return;
    if (state.success) {
      toast({ title: "Éxito", description: state.message || "Cronograma generado" });
      setOpen(false);
      formRef.current?.reset();
    } else {
      toast({ title: "Error", description: state.message || "No se pudo generar", variant: "destructive" });
    }
  }, [state, isPending, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Generar Cronograma</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generar Cronograma</DialogTitle>
          <DialogDescription>Configure los parámetros para el cronograma de pagos.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="financiamientoId" value={String(financiamiento.id || "")} />
          <div>
            <Label htmlFor="harvestValue">Valor esperado de cosecha (Bs.)</Label>
            <Input id="harvestValue" name="harvestValue" type="number" step="0.01" required />
            {state?.errors?.harvestValue && (
              <p className="text-sm text-destructive mt-1">{state.errors.harvestValue}</p>
            )}
          </div>
          <div>
            <Label htmlFor="frequency">Frecuencia</Label>
            <Select
              id="frequency"
              name="frequency"
              required
              options={[
                { value: "Mensual", label: "Mensual" },
                { value: "Trimestral", label: "Trimestral" },
                { value: "Al final", label: "Al final" },
              ]}
              placeholder="Seleccione una frecuencia..."
            />
            {state?.errors?.frequency && <p className="text-sm text-destructive mt-1">{state.errors.frequency}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Generando..." : "Generar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}