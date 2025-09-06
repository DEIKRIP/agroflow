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
