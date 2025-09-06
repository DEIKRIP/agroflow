"use client";

import { useEffect, useRef, useState, useActionState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addFinanciamientoAction, getClientsList, getApprovedParcelas,type FormActionState,
} from "@/lib/bolivarDigitalActions";
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
import { Textarea } from "@/components/ui/Textarea";

type FinanciamientoFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ClientLite = { id: string; fullName: string; cedula?: string; rif?: string };
type ParcelaLite = { id: string; name: string; montoTotalEstimado?: number };

export default function FinanciamientoFormDialog({ open, onOpenChange }: FinanciamientoFormDialogProps) {
  const [state, formAction, isPending] = useActionState<FormActionState | null>(addFinanciamientoAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const [clients, setClients] = useState<ClientLite[]>([]);
  const [clientId, setClientId] = useState<string | undefined>(undefined);

  const [parcelas, setParcelas] = useState<ParcelaLite[]>([]);
  const [parcelaId, setParcelaId] = useState<string | undefined>(undefined);

  const [proposito, setProposito] = useState<string>("");
  const [monto, setMonto] = useState<string>("");
  const [tasa, setTasa] = useState<string>("");
  const [numeroCosechas, setNumeroCosechas] = useState<string>("");

  // Load clients once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await getClientsList();
        if (!cancelled) setClients(list as ClientLite[]);
      } catch (e) {
        console.error("Error cargando sujetos:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load parcelas when client changes
  useEffect(() => {
    if (!clientId) {
      setParcelas([]);
      setParcelaId(undefined);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await getApprovedParcelas(clientId);
        if (!cancelled) setParcelas(list as ParcelaLite[]);
      } catch (e) {
        console.error("Error cargando parcelas:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setClientId(undefined);
      setParcelaId(undefined);
      setProposito("");
      setMonto("");
      setTasa("");
      setNumeroCosechas("");
    }
  }, [open]);

  // Handle action results
  useEffect(() => {
    if (isPending) return;
    if (!state) return;

    if (state.success) {
      toast({ title: "Éxito", description: state.message || "Financiamiento registrado" });
      onOpenChange(false);
    } else {
      toast({
        title: "Error",
        description: state.message || "No se pudo registrar el financiamiento",
        variant: "destructive",
      });
    }
  }, [state, isPending, toast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Financiamiento</DialogTitle>
          <DialogDescription>
            Complete los campos para registrar un nuevo crédito de Bolívar Digital.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="clientId">Sujeto</Label>
            <Select
              id="clientId"
              name="clientId"
              required
              value={clientId}
              onChange={(v: string | undefined) => setClientId(v)}
              placeholder="Seleccione un sujeto..."
              options={clients.map((c) => ({
                value: c.id,
                label: `${c.fullName}${c.cedula ? ` - ${c.cedula}` : ""}`,
              }))}
            />
            {state?.errors?.clientId && <p className="text-sm text-destructive mt-1">{state.errors.clientId}</p>}
          </div>

          <div>
            <Label htmlFor="parcelaId">Parcela</Label>
            <Select
              id="parcelaId"
              name="parcelaId"
              required
              value={parcelaId}
              onChange={(v: string | undefined) => setParcelaId(v)}
              placeholder="Seleccione una parcela..."
              options={parcelas.map((p) => ({
                value: p.id,
                label: p.montoTotalEstimado
                  ? `${p.name} (Estimado: Bs. ${p.montoTotalEstimado.toLocaleString("es-VE")})`
                  : p.name,
              }))}
              disabled={!clientId}
            />
            {state?.errors?.parcelaId && <p className="text-sm text-destructive mt-1">{state.errors.parcelaId}</p>}
          </div>

          <div>
            <Label htmlFor="proposito">Propósito</Label>
            <Textarea
              id="proposito"
              name="proposito"
              placeholder="Descripción del propósito del crédito"
              value={proposito}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setProposito(e.target.value)}
              required
            />
            {state?.errors?.proposito && <p className="text-sm text-destructive mt-1">{state.errors.proposito}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="monto">Monto (Bs.)</Label>
              <Input
                id="monto"
                name="monto"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={monto}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMonto(e.target.value)}
                required
              />
              {state?.errors?.monto && <p className="text-sm text-destructive mt-1">{state.errors.monto}</p>}
            </div>
            <div>
              <Label htmlFor="tasa">Tasa (%)</Label>
              <Input
                id="tasa"
                name="tasa"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={tasa}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTasa(e.target.value)}
                required
              />
              {state?.errors?.tasa && <p className="text-sm text-destructive mt-1">{state.errors.tasa}</p>}
            </div>
            <div>
              <Label htmlFor="numeroCosechas"># Cosechas</Label>
              <Input
                id="numeroCosechas"
                name="numeroCosechas"
                type="number"
                min={1}
                step="1"
                placeholder="1"
                value={numeroCosechas}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumeroCosechas(e.target.value)}
                required
              />
              {state?.errors?.numeroCosechas && (
                <p className="text-sm text-destructive mt-1">{state.errors.numeroCosechas}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Registrar Financiamiento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
