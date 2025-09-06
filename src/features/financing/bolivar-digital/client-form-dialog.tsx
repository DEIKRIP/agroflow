
"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { saveClient, Client } from "@/lib/bolivarDigitalActions";
import Button from "@/components/ui/Button";
import {
  Dialog,
  Content as DialogContent,
  Header as DialogHeader,
  Title as DialogTitle,
  Description as DialogDescription,
  Footer as DialogFooter,
} from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";

type FormState = {
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
};

function SubmitButton({ isSubmitting, isEditing }: { isSubmitting: boolean, isEditing: boolean }) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? (isEditing ? "Guardando..." : "Registrando...") : (isEditing ? "Guardar Cambios" : "Registrar Sujeto Productivo")}
    </Button>
  );
}

interface ClientFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onSuccess?: () => void;
  client: Client | null;
}

export default function ClientFormDialog({ isOpen, setIsOpen, onSuccess, client }: ClientFormDialogProps) {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    error: null,
    success: false,
  });
  
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const isEditing = client !== null;

  const handleSubmit = async (formData: FormData) => {
    try {
      setFormState({ isSubmitting: true, error: null, success: false });
      
      const clientData: Client = {
        id: client?.id,
        fullName: formData.get('fullName') as string,
        cedula: formData.get('cedula') as string,
        rif: formData.get('rif') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string,
        activity: formData.get('activity') as string || 'Producción Agrícola',
      };

      const result = await saveClient(clientData);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: result.message,
        });
        formRef.current?.reset();
        if (onSuccess) onSuccess();
        setIsOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast({
        title: "Error",
        description: error.message || 'Ocurrió un error al guardar el cliente',
        variant: "destructive",
      });
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        error: error.message,
      }));
    }
  };
  
  useEffect(() => {
    if (!isOpen) {
      // Reset form state when dialog closes
      setFormState({ isSubmitting: false, error: null, success: false });
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Sujeto Productivo" : "Registrar Nuevo Sujeto Productivo"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifique los datos del sujeto productivo." : "Complete los datos para registrar un nuevo sujeto productivo comunitario."}
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={handleSubmit} className="space-y-4">
            {isEditing && <input type="hidden" name="id" value={client?.id} />}
            
            <div>
                <Label htmlFor="fullName">Nombre Completo</Label>
                <Input 
                  id="fullName" 
                  name="fullName" 
                  defaultValue={client?.fullName ?? ''} 
                  required 
                  autoComplete="name" 
                  disabled={formState.isSubmitting}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input 
                    id="cedula" 
                    name="cedula" 
                    defaultValue={client?.cedula ?? ''} 
                    required 
                    disabled={formState.isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="rif">RIF</Label>
                  <Input 
                    id="rif" 
                    name="rif" 
                    defaultValue={client?.rif ?? ''} 
                    required 
                    disabled={formState.isSubmitting}
                  />
                </div>
            </div>
            
            <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  type="tel" 
                  defaultValue={client?.phone ?? ''} 
                  required 
                  autoComplete="tel" 
                  disabled={formState.isSubmitting}
                />
            </div>

            <div>
                <Label htmlFor="activity">Actividad Productiva</Label>
                <Input 
                  id="activity" 
                  name="activity" 
                  defaultValue={client?.activity ?? 'Producción Agrícola'} 
                  required 
                  placeholder="Ej: Productor de Maíz" 
                  disabled={formState.isSubmitting}
                />
            </div>

            <div>
                <Label htmlFor="address">Dirección</Label>
                <Textarea 
                  id="address" 
                  name="address" 
                  defaultValue={client?.address ?? ''} 
                  required 
                  autoComplete="street-address" 
                  disabled={formState.isSubmitting}
                />
            </div>
            
            <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsOpen(false)}
                  disabled={formState.isSubmitting}
                >
                  Cancelar
                </Button>
                <SubmitButton 
                  isSubmitting={formState.isSubmitting} 
                  isEditing={isEditing} 
                />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
