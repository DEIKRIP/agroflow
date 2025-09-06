
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { PlusCircle, User, Edit, Archive, ArrowRightCircle } from "lucide-react";
import ClientFormDialog from "./client-form-dialog";
import { useToast } from "@/hooks/use-toast";
import { deleteClientAction } from "@/lib/bolivarDigitalActions";
import { supabase } from "@/lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import type { BolivarDigitalClient, PrefillFinanciamientoData } from "@/lib/types";

type HistorialParcela = {
    parcelaId: string;
    estimacionId: string;
    montoTotalEstimado: number;
    linkedAt: string;
}

type Client = BolivarDigitalClient & {
    historialParcelas?: HistorialParcela[];
}

const ClientCard = ({ client, onEdit, onCreateFinanciamiento }: { client: Client; onEdit: (client: Client) => void; onCreateFinanciamiento: (data: PrefillFinanciamientoData) => void; }) => {
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteClientAction(client.id);
        if (result.success) {
            toast({ title: "Éxito", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
        setIsDeleting(false);
        setIsAlertOpen(false);
    };

    const handleCreateFinanciamiento = () => {
        // Pass only the client ID. The form will handle fetching the correct parcelas.
        onCreateFinanciamiento({
            clientId: client.id,
        });
    }

    const totalEstimado = client.historialParcelas?.reduce((sum, item) => sum + item.montoTotalEstimado, 0) ?? 0;
    const canCreateFinanciamiento = totalEstimado > 0;

    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {client.fullName}
                </CardTitle>
                <div className="flex items-center gap-2">
                     <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Archive className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro de eliminar?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente al sujeto productivo y todos sus datos asociados.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2 flex-grow">
                <p><strong>Cédula:</strong> {client.cedula}</p>
                <p><strong>RIF:</strong> {client.rif}</p>
                <p><strong>Teléfono:</strong> {client.phone}</p>
                <p><strong>Actividad:</strong> {client.activity}</p>
                 <p><strong>Dirección:</strong> {client.address}</p>
            </CardContent>
            <CardFooter>
                 <Button className="w-full h-auto p-0" onClick={handleCreateFinanciamiento} disabled={!canCreateFinanciamiento} variant="secondary">
                     <div className="w-full p-3 bg-muted/50 rounded-md flex items-center justify-between text-foreground">
                        <span className="font-semibold flex items-center gap-2">Total a Financiar</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">Bs. {totalEstimado.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                          {canCreateFinanciamiento && <ArrowRightCircle className="h-5 w-5 text-primary"/>}
                        </div>
                    </div>
                 </Button>
            </CardFooter>
        </Card>
    );
};

export default function ClientsModule({ onCreateFinanciamiento }: { onCreateFinanciamiento: (data: PrefillFinanciamientoData) => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('bolivarDigitalClients')
          .select('*');

        if (error) throw error;

        setClients(data || []);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching clients:', err);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar los clientes',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  };

  const handleClientFormSuccess = () => {
    // Recargar la lista de clientes después de un cambio exitoso
    supabase
      .from('bolivarDigitalClients')
      .select('*')
      .then(({ data, error }) => {
        if (error) throw error;
        setClients(data || []);
        setIsClientFormOpen(false);
        setEditingClient(null);
        toast({ title: "Cliente guardado exitosamente" });
      })
      .catch(err => {
        console.error('Error reloading clients:', err);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar la lista de clientes',
          variant: 'destructive',
        });
      });
  };

  if (loading) return <div>Cargando clientes...</div>;
  if (error) return <div>Error cargando clientes: {error.message}</div>;

  const handleAddNew = () => {
    setEditingClient(null);
    setIsClientFormOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  };

  return (
    <div className="p-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-foreground">Gestión de Sujetos Productivos</h3>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Añadir Sujeto Productivo
        </Button>
      </div>

      {loading && <p>Cargando...</p>}
      {error && <p className="text-destructive">Error: {error.message}</p>}

      {!loading && clients.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No hay sujetos productivos registrados</h3>
          <p className="mt-1 text-sm text-muted-foreground">Empiece por añadir su primer sujeto productivo comunitario.</p>
          <div className="mt-6">
            <Button onClick={handleAddNew}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Sujeto Productivo
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onEdit={handleEdit} 
              onCreateFinanciamiento={onCreateFinanciamiento} 
            />
          ))}
        </div>
      )}

      <ClientFormDialog 
        isOpen={isClientFormOpen} 
        setIsOpen={setIsClientFormOpen}
        onSuccess={handleClientFormSuccess}
        client={editingClient}
      />
    </div>
  );
}
