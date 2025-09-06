import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Search as FiSearch, X as FiX, Wallet } from "lucide-react";
import BolivarDigitalDialog from "./bolivar-digital/bolivar-digital-dialog";
import { SimpleTestDialog } from "./bolivar-digital/SimpleTestDialog";

const FinancingManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [loadingFarmers, setLoadingFarmers] = useState(false);

  // Efecto para verificar si el componente se monta correctamente
  useEffect(() => {
    console.log('FinancingManagement montado');
    return () => {
      console.log('FinancingManagement desmontado');
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" style={{ border: '2px solid red', padding: '10px' }}>
      {/* Fixed Sidebar */}
      <div className={`fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <RoleBasedSidebar 
          collapsed={sidebarCollapsed} 
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />
      </div>
      {/* Spacer for fixed sidebar */}
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0`}>
        {/* This div is just for spacing, content is in the fixed sidebar */}
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out min-w-0">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800">Financiamiento</h1>
            </div>
            
            <div className="flex items-center space-x-4" style={{ border: '1px solid blue', padding: '10px' }}>
            <div style={{ border: '1px solid green', padding: '5px' }}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <FiX className="h-5 w-5 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ border: '1px solid orange', padding: '5px' }}>
              <BolivarDigitalDialog 
                farmers={farmers}
                loadingFarmers={loadingFarmers}
              >
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  disabled={loadingFarmers}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  {loadingFarmers ? 'Cargando...' : 'Nuevo Financiamiento'}
                </button>
              </BolivarDigitalDialog>
            </div>
            
            <div style={{ border: '1px solid purple', padding: '5px' }}>
              <SimpleTestDialog />
            </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto transition-all duration-300 ease-in-out p-8">
          <div className="h-full flex items-center justify-center">
            <div className="w-full max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-lg p-10 text-center">
                <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-50 mb-6">
                  <Wallet className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-4">Gestion Bolivar Digital</h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  Gestiona los financiamientos, préstamos y transacciones financieras de los agricultores de manera eficiente y organizada.
                </p>
                <div className="flex justify-center">
                  <BolivarDigitalDialog 
                    farmers={farmers}
                    loadingFarmers={loadingFarmers}
                  >
                    <Button
                      variant="success"
                      className="px-8 py-3 text-base font-medium"
                      disabled={loadingFarmers}
                    >
                      {loadingFarmers ? 'Cargando...' : 'Abrir Gestor Financiero'}
                    </Button>
                  </BolivarDigitalDialog>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FinancingManagement;
