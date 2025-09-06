
"use client";

import { useEffect, useRef, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { registerQualityControlAction } from "@/app/qualityControlActions";
import Button from "@/components/ui/Button";
import { Dialog, Content as DialogContent, Description as DialogDescription, Header as DialogHeader, Title as DialogTitle, Trigger as DialogTrigger, Footer as DialogFooter, Close as DialogClose } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck } from "lucide-react";
import { Textarea } from "@/components/ui/Textarea";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Guardando..." : "Guardar Control de Calidad"}
    </Button>
  );
}

export default function QualityControlDialog({ farmerId, parcelaId }: { farmerId: string, parcelaId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(registerQualityControlAction, null);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      toast({
        title: "Éxito",
        description: state.message,
      });
      setOpen(false);
    } else if (state?.success === false) {
      toast({
        title: "Error",
        description: state.message || "Ocurrió un error al registrar.",
        variant: "destructive",
      });
    }
  }, [state, toast, setOpen]);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <ShieldCheck className="mr-2 h-4 w-4" />
          Registrar Control de Calidad
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Control de Calidad del Producto</DialogTitle>
          <DialogDescription>
            Registre el resultado de la inspección de calidad del producto final antes de su comercialización.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <input type="hidden" name="farmerId" value={farmerId} />
          <input type="hidden" name="parcelaId" value={parcelaId} />
          
           <div>
            <Label htmlFor="date">Fecha de Control</Label>
            <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
            {state?.errors?.date && <p className="text-sm text-destructive mt-1">{state.errors.date}</p>}
          </div>

          <div>
            <Label htmlFor="inspectorName">Nombre del Inspector</Label>
            <Input id="inspectorName" name="inspectorName" required />
            {state?.errors?.inspectorName && <p className="text-sm text-destructive mt-1">{state.errors.inspectorName}</p>}
          </div>

          <div>
            <Label htmlFor="result">Resultado</Label>
            <RadioGroup id="result" name="result" defaultValue="Aprobado" className="mt-2 flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Aprobado" id="result-aprobado" />
                <Label htmlFor="result-aprobado" className="font-normal">Aprobado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Rechazado" id="result-rechazado" />
                <Label htmlFor="result-rechazado" className="font-normal">Rechazado</Label>
              </div>
            </RadioGroup>
             {state?.errors?.result && <p className="text-sm text-destructive mt-1">{state.errors.result}</p>}
          </div>
          
          <div>
            <Label htmlFor="observations">Observaciones</Label>
            <Textarea id="observations" name="observations" required />
            {state?.errors?.observations && <p className="text-sm text-destructive mt-1">{state.errors.observations}</p>}
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
