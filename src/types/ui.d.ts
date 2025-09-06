import React from 'react';

declare module 'src/components/ui/Button' {
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'danger';
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs' | 'xl';
    asChild?: boolean;
    loading?: boolean;
    iconName?: string | null;
    iconPosition?: 'left' | 'right';
    iconSize?: string | number | null;
    fullWidth?: boolean;
  }
  
  const Button: React.ForwardRefExoticComponent<
    ButtonProps & React.RefAttributes<HTMLButtonElement>
  >;
  
  export default Button;
}

declare module 'src/components/ui/dialog' {
  interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children?: React.ReactNode;
  }

  interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    onEscapeKeyDown?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: MouseEvent) => void;
  }

  interface DialogTriggerProps {
    asChild?: boolean;
    children: React.ReactNode;
  }

  interface DialogHeaderProps {
    children?: React.ReactNode;
  }

  interface DialogTitleProps {
    children?: React.ReactNode;
  }

  interface DialogDescriptionProps {
    children?: React.ReactNode;
  }

  interface DialogFooterProps {
    children?: React.ReactNode;
  }

  interface DialogCloseProps {
    children?: React.ReactNode;
  }

  export const Dialog: React.FC<DialogProps>;
  export const DialogTrigger: React.FC<DialogTriggerProps>;
  export const DialogContent: React.FC<DialogContentProps>;
  export const DialogHeader: React.FC<DialogHeaderProps>;
  export const DialogTitle: React.FC<DialogTitleProps>;
  export const DialogDescription: React.FC<DialogDescriptionProps>;
  export const DialogFooter: React.FC<DialogFooterProps>;
  export const DialogClose: React.FC<DialogCloseProps>;
}

declare module 'src/components/ui/tabs' {
  interface TabsProps {
    value: string;
    onValueChange: (value: string) => void;
    children?: React.ReactNode;
    className?: string;
  }

  interface TabsListProps {
    children?: React.ReactNode;
    className?: string;
  }

  interface TabsTriggerProps {
    value: string;
    children?: React.ReactNode;
    className?: string;
    disabled?: boolean;
  }

  interface TabsContentProps {
    value: string;
    children?: React.ReactNode;
    className?: string;
  }

  export const Tabs: React.FC<TabsProps>;
  export const TabsList: React.FC<TabsListProps>;
  export const TabsTrigger: React.FC<TabsTriggerProps>;
  export const TabsContent: React.FC<TabsContentProps>;
}

declare module 'src/components/ui/scroll-area' {
  interface ScrollAreaProps {
    children?: React.ReactNode;
    className?: string;
  }

  export const ScrollArea: React.FC<ScrollAreaProps>;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export const Briefcase: ComponentType<SVGProps<SVGSVGElement>>;
  export const CreditCard: ComponentType<SVGProps<SVGSVGElement>>;
  export const AreaChart: ComponentType<SVGProps<SVGSVGElement>>;
  export const Bell: ComponentType<SVGProps<SVGSVGElement>>;
  export const User: ComponentType<SVGProps<SVGSVGElement>>;
  export const Wrench: ComponentType<SVGProps<SVGSVGElement>>;
  export const X: ComponentType<SVGProps<SVGSVGElement>>;
  export const Wallet: ComponentType<SVGProps<SVGSVGElement>>;
  export const FileText: ComponentType<SVGProps<SVGSVGElement>>;
}
