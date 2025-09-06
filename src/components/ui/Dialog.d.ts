import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

// Extender las interfaces de Radix UI
declare module '@radix-ui/react-dialog' {
  interface DialogProps extends DialogPrimitive.DialogProps {}
  interface DialogTriggerProps extends DialogPrimitive.DialogTriggerProps {}
  interface DialogContentProps extends DialogPrimitive.DialogContentProps {}
  interface DialogTitleProps extends DialogPrimitive.DialogTitleProps {}
  interface DialogDescriptionProps extends DialogPrimitive.DialogDescriptionProps {}
  interface DialogCloseProps extends DialogPrimitive.DialogCloseProps {}
}

// Componentes individuales
declare const Dialog: React.FC<DialogPrimitive.DialogProps>;
declare const Trigger: React.FC<DialogPrimitive.DialogTriggerProps>;
declare const Content: React.FC<DialogPrimitive.DialogContentProps>;
declare const Header: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const Footer: React.FC<React.HTMLAttributes<HTMLDivElement>>;
declare const Title: React.FC<DialogPrimitive.DialogTitleProps>;
declare const Description: React.FC<DialogPrimitive.DialogDescriptionProps>;
declare const Close: React.FC<DialogPrimitive.DialogCloseProps>;

// Exportaciones nombradas
export {
  Dialog,
  Dialog as Root,
  Trigger,
  Content,
  Header,
  Footer,
  Title,
  Description,
  Close,
};

// Exportación por defecto
export default Dialog;
