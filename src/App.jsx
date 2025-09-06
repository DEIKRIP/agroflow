import React from "react";
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./Routes";

import { SidebarProvider } from "./contexts/SidebarContext";

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Routes />
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;