
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Briefcase, CreditCard, AreaChart, Bell, User, Wrench } from "lucide-react";
import {
  Dialog,
  Trigger as DialogTrigger,
  Header as DialogHeader,
  Title as DialogTitle,
  Description as DialogDescription,
  Content as DialogContent,
  Close as DialogClose,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea
} from "@/components/ui";

// Función para manejar la carga de módulos con manejo de errores
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<any> }>) =>
  React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error('Error al cargar el módulo:', error);
      return {
        default: () => (
          <div className="p-4 text-red-600">
            Error al cargar el módulo. Por favor, recarga la página.
          </div>
        ),
      };
    }
  });

// Importar módulos con lazy loading y manejo de errores
const ReportsModule = lazyWithRetry(() => import('./reports-module'));
const ClientsModule = lazyWithRetry(() => import('./clients-module'));
const FinanciamientosModule = lazyWithRetry(() => import('./financiamientos-module'));
const PaymentsModule = lazyWithRetry(() => import('./payments-module'));
const NotificationsModule = lazyWithRetry(() => import('./notifications-module'));
const AdminModule = lazyWithRetry(() => import('./admin-module'));

// Tipos necesarios
interface FarmerWithParcelas {
  id: string | number;
  name: string;
  isLinkedToClient: boolean;
  hasApprovedInspection: boolean;
  [key: string]: any; // Para propiedades adicionales
}

interface PrefillFinanciamientoData {
  farmerId: string | number;
  farmerName: string; // Haciendo farmerName obligatorio
  [key: string]: any; // Para propiedades adicionales
}


type BolivarDigitalDialogProps = {
    farmers: (FarmerWithParcelas & { isLinkedToClient: boolean; hasApprovedInspection: boolean; })[];
    loadingFarmers: boolean;
    children: React.ReactNode;
}

export default function BolivarDigitalDialog({ farmers, loadingFarmers, children }: BolivarDigitalDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("clients");
  const [prefillData, setPrefillData] = useState<PrefillFinanciamientoData | null>(null);

  const handleCreateFinanciamientoFromClient = (data: PrefillFinanciamientoData) => {
    setPrefillData(data);
    setActiveTab("loans");
  };

  useEffect(() => {
    if (prefillData) {
      setActiveTab("loans");
    }
  }, [prefillData]);
  
  // Clean up prefill data when dialog closes
  useEffect(() => {
    if (!open) {
      setPrefillData(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] flex flex-col w-[95vw] rounded-lg border border-gray-200 bg-white p-0 overflow-hidden shadow-xl">
        <DialogHeader>
          <DialogTitle>Gestión Bolívar Digital</DialogTitle>
          <DialogDescription>
            El Bolívar Digital es una herramienta de la nueva Agroeconomía Digital para transferir el control del sistema productivo al Poder Popular. Estandariza precios, ofertas, pagos y demandas para fortalecer la economía productiva descentralizada.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <Tabs defaultValue="clients" value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
              <TabsTrigger value="clients"><User className="mr-1 h-4 w-4" />Sujetos</TabsTrigger>
              <TabsTrigger value="loans"><Briefcase className="mr-1 h-4 w-4" />Financiamientos</TabsTrigger>
              <TabsTrigger value="payments"><CreditCard className="mr-1 h-4 w-4" />Pagos</TabsTrigger>
              <TabsTrigger value="notifications"><Bell className="mr-1 h-4 w-4" />Notificaciones</TabsTrigger>
              <TabsTrigger value="reports"><AreaChart className="mr-1 h-4 w-4" />Reportes</TabsTrigger>
              <TabsTrigger value="admin"><Wrench className="mr-1 h-4 w-4" />Admin</TabsTrigger>
            </TabsList>
            <div className="flex-grow overflow-auto mt-2">
                <ScrollArea className="h-[65vh] w-full">
                  <TabsContent value="clients" className="p-1">
                    <Suspense fallback={<div>Cargando módulo de clientes...</div>}>
                      <ClientsModule onCreateFinanciamiento={handleCreateFinanciamientoFromClient} />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="loans" className="p-1">
                    <Suspense fallback={<div>Cargando módulo de financiamientos...</div>}>
                      <FinanciamientosModule 
                        farmers={farmers} 
                        loadingFarmers={loadingFarmers} 
                        prefillData={prefillData}
                        clearPrefillData={() => setPrefillData(null)}
                      />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="payments" className="p-1">
                    <Suspense fallback={<div>Cargando módulo de pagos...</div>}>
                      <PaymentsModule />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="notifications" className="p-1">
                    <Suspense fallback={<div>Cargando notificaciones...</div>}>
                      <NotificationsModule setActiveTab={setActiveTab} />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="reports" className="p-1">
                    <Suspense fallback={<div>Cargando reportes...</div>}>
                      <ReportsModule />
                    </Suspense>
                  </TabsContent>
                  <TabsContent value="admin" className="p-1">
                    <Suspense fallback={<div>Cargando administración...</div>}>
                      <AdminModule />
                    </Suspense>
                  </TabsContent>
                </ScrollArea>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
