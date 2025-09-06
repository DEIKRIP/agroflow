
import { CheckCircle2, Circle, Truck, Tractor, Milestone, Wallet, ShieldCheck } from "lucide-react";
import type { Financiamiento, Parcela, FinanciamientoStatus, QualityControl } from "@/lib/types";
import { financiamientoStates } from "@/lib/workflow";
import { cn } from "@/lib/utils";

type ChecklistItemProps = {
  isCompleted: boolean;
  label: string;
  icon: React.ReactNode;
};

const ChecklistItem = ({ isCompleted, label, icon }: ChecklistItemProps) => (
  <li className={cn("flex items-center gap-3 text-sm", isCompleted ? "text-foreground font-medium" : "text-muted-foreground")}>
    {isCompleted ? (
      <CheckCircle2 className="h-5 w-5 text-primary" />
    ) : (
      icon
    )}
    <span>{label}</span>
  </li>
);

type FinanciamientoChecklistProps = {
  financiamiento: Financiamiento;
  parcelaGarantia: (Parcela & { qualityControls?: QualityControl[] }) | null | undefined;
};

// Helper function to get the index of a status in the workflow
const getStatusIndex = (status: FinanciamientoStatus) => {
    return financiamientoStates.indexOf(status);
};

export default function FinanciamientoChecklist({ financiamiento, parcelaGarantia }: FinanciamientoChecklistProps) {
  const hasApprovedInspection = parcelaGarantia?.inspections?.some(i => i.status === 'Aprobada') ?? false;
  const hasApprovedQualityControl = parcelaGarantia?.qualityControls?.some(qc => qc.result === 'Aprobado') ?? false;
  const currentStatusIndex = getStatusIndex(financiamiento.estado);

  const checklistItems = [
    {
      id: "solicitud",
      label: "Solicitud Completada",
      isCompleted: currentStatusIndex >= getStatusIndex("Solicitud"),
      icon: <Circle className="h-5 w-5 text-muted-foreground/50" />,
    },
    {
      id: "garantia",
      label: "Inspección de Garantía Aprobada",
      isCompleted: hasApprovedInspection && currentStatusIndex >= getStatusIndex("Verificación de Garantía"),
      icon: <Milestone className="h-5 w-5 text-muted-foreground/50" />,
    },
     {
      id: "control_calidad",
      label: "Control de Calidad Aprobado",
      isCompleted: hasApprovedQualityControl,
      icon: <ShieldCheck className="h-5 w-5 text-muted-foreground/50" />,
    },
    {
      id: "instalado",
      label: "Operativo Instalado",
      isCompleted: currentStatusIndex >= getStatusIndex("Operativo Instalado"),
      icon: <Tractor className="h-5 w-5 text-muted-foreground/50" />,
    },
    {
      id: "cosechado",
      label: "Cosecha Embarcada",
      isCompleted: currentStatusIndex >= getStatusIndex("Cosechado"),
      icon: <Truck className="h-5 w-5 text-muted-foreground/50" />,
    },
    {
      id: "pagado",
      label: "Crédito Pagado",
      isCompleted: currentStatusIndex >= getStatusIndex("Pagado"),
      icon: <Wallet className="h-5 w-5 text-muted-foreground/50" />,
    },
  ];

  return (
    <div className="p-3 bg-muted/40 rounded-lg border border-dashed">
        <h4 className="font-semibold text-foreground mb-3 text-sm">Hitos del Financiamiento</h4>
        <ul className="space-y-2">
            {checklistItems.map(item => (
                <ChecklistItem key={item.id} {...item} />
            ))}
        </ul>
    </div>
  );
}

    