import React, { createContext, useState } from "react";

export const SidebarContext = createContext({
  collapsed: false,
  toggleSidebar: () => {},
});

export const SidebarProvider = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};
