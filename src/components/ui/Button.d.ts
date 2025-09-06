import React from 'react';

declare const Button: React.ForwardRefExoticComponent<
  {
    children?: React.ReactNode;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success' | 'warning' | 'danger';
    size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs' | 'xl';
    asChild?: boolean;
    loading?: boolean;
    iconName?: string | null;
    iconPosition?: 'left' | 'right';
    iconSize?: string | number | null;
    fullWidth?: boolean;
    disabled?: boolean;
    className?: string;
  } & React.ButtonHTMLAttributes<HTMLButtonElement> & 
    React.RefAttributes<HTMLButtonElement>
>;

export { Button };
export default Button;
