import * as React from 'react';

declare const Label: React.ForwardRefExoticComponent<
  React.LabelHTMLAttributes<HTMLLabelElement> & {
    className?: string;
  } & React.RefAttributes<HTMLLabelElement>
>;

export { Label };
export default Label;
