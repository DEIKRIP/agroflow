import * as React from 'react';

declare const Textarea: React.ForwardRefExoticComponent<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    className?: string;
  } & React.RefAttributes<HTMLTextAreaElement>
>;

export { Textarea };
export default Textarea;
