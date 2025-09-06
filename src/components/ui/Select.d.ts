import * as React from "react";

export type SelectOption = {
  value: string | number;
  label: string;
  description?: string;
  disabled?: boolean;
};

export interface SelectProps {
  className?: string;
  options?: SelectOption[];
  value?: string | number | (string | number)[];
  defaultValue?: string | number | (string | number)[];
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  description?: string;
  error?: string;
  searchable?: boolean;
  clearable?: boolean;
  loading?: boolean;
  id?: string;
  name?: string;
  onChange?: (value: any) => void;
  onOpenChange?: (open: boolean) => void;
}

export default function Select(props: SelectProps & React.RefAttributes<HTMLButtonElement>): JSX.Element;
