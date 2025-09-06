import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

declare const ScrollArea: React.ForwardRefExoticComponent<
  React.HTMLAttributes<HTMLDivElement> & {
    children: React.ReactNode;
    className?: string;
  } & React.RefAttributes<HTMLDivElement>
> & {
  Viewport: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  Scrollbar: React.FC<ScrollAreaPrimitive.ScrollAreaScrollbarProps>;
  Thumb: React.FC<ScrollAreaPrimitive.ScrollAreaThumbProps>;
  Corner: React.FC<ScrollAreaPrimitive.ScrollAreaCornerProps>;
}

export { ScrollArea, ScrollBar } from "./ScrollArea"
