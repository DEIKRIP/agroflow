import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

declare const Tabs: React.FC<TabsPrimitive.TabsProps> & {
  List: React.FC<TabsPrimitive.TabsListProps>;
  Trigger: React.FC<TabsPrimitive.TabsTriggerProps>;
  Content: React.FC<TabsPrimitive.TabsContentProps>;
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "./Tabs"
