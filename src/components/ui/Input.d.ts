import * as React from 'react';

declare const Input: React.ForwardRefExoticComponent<
  React.InputHTMLAttributes<HTMLInputElement> & {
    className?: string;
  } & React.RefAttributes<HTMLInputElement>
>;

export { Input };
export default Input;
