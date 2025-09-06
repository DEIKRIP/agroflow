// Tipos para los componentes UI personalizados
declare module '@/components/ui/Dialog' {
  import * as React from 'react';
  import * as DialogPrimitive from '@radix-ui/react-dialog';

  export const Dialog: React.FC<DialogPrimitive.DialogProps>;
  export const Trigger: React.FC<DialogPrimitive.DialogTriggerProps>;
  export const Content: React.FC<DialogPrimitive.DialogContentProps>;
  export const Header: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const Title: React.FC<DialogPrimitive.DialogTitleProps>;
  export const Description: React.FC<DialogPrimitive.DialogDescriptionProps>;
  export const Close: React.FC<DialogPrimitive.DialogCloseProps>;

  // Alias para compatibilidad
  export const Root: typeof Dialog;
  
  // Exportación por defecto
  export default Dialog;
}
