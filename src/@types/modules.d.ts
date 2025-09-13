// Declaraciones de tipos para módulos que no tienen tipos definidos
declare module '@/hooks/use-toast' {
  export function useToast(): {
    toasts: Array<{
      id: string;
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }>;
    toast: (props: {
      title: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => void;
    dismiss: (toastId?: string) => void;
  };
}

declare module '@/utils/parcelService' {
  const parcelService: any;
  export default parcelService;
}

declare module '@/utils/inspectionService' {
  const inspectionService: any;
  export default inspectionService;
}

// AppIcon (JSX wrapper over lucide-react), default export
declare module '@/components/AppIcon' {
  import type React from 'react';
  const Icon: React.FC<{
    name: string;
    size?: number;
    color?: string;
    className?: string;
    strokeWidth?: number;
    [key: string]: any;
  }>;
  export default Icon;
}
