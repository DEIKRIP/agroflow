// Tipos para el módulo de Select personalizado
declare module '@/components/ui/select' {
  import * as React from 'react';

  export interface SelectProps {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    disabled?: boolean;
    name?: string;
    required?: boolean;
    children?: React.ReactNode;
  }

  export const Select: React.FC<SelectProps>;

  export interface SelectTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
    id?: string;
    children?: React.ReactNode;
  }
  export const SelectTrigger: React.FC<SelectTriggerProps>;

  export interface SelectValueProps {
    placeholder?: string;
  }
  export const SelectValue: React.FC<SelectValueProps>;

  export interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  export const SelectContent: React.FC<SelectContentProps>;

  export interface SelectItemProps {
    value: string;
    disabled?: boolean;
    children?: React.ReactNode;
  }
  export const SelectItem: React.FC<SelectItemProps>;
}
