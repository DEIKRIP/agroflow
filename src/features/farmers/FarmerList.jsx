import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import Button from '../../components/ui/Button';
import { FiUserPlus, FiSearch, FiUsers, FiX, FiChevronRight } from 'react-icons/fi';
import FarmerCard from './components/FarmerCard';
import FarmerDetailPanel from './components/FarmerDetailPanel';

const FarmerManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewFarmerForm, setShowNewFarmerForm] = useState(false);
  const [formError, setFormError] = useState('');
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Datos del formulario de nuevo agricultor
  const [newFarmer, setNewFarmer] = useState({
    name: '',
    docType: 'V',
    cedula: '',
    rif: '',
    organizationType: 'Individual',
    phone: '',
    email: '',
    address: '',
  });

  // Cargar agricultores desde la base de datos
  useEffect(() => {
    const loadFarmers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('farmers')
          .select('*')
          .order('display_id', { ascending: true });

        if (error) throw error;
        
        setFarmers(data || []);
      } catch (error) {
        console.error('Error al cargar los agricultores:', error);
        // Datos de ejemplo en caso de error
        setFarmers([
          {
            id: '1',
            display_id: 1,
            nombre_completo: 'Juan Pérez',
            cedula: '12345678',
            rif: 'J-12345678-9',
            telefono: '04121234567',
            email: 'juan@example.com',
            risk: 'bajo',
            created_at: '2023-01-15T00:00:00Z'
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFarmers();
  }, []);

  // Manejar cambios en los inputs del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFarmer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejar envío del formulario
  const handleSubmitFarmer = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!newFarmer.name.trim() || !newFarmer.cedula.trim() || !newFarmer.rif.trim()) {
      setFormError('Por favor complete todos los campos requeridos');
      return;
    }

    try {
      setFormError('');
      setIsLoading(true);

      // Normalizar cédula con prefijo de tipo de documento (V/E/J/...)
      const rawCed = newFarmer.cedula.trim();
      const type = (newFarmer.docType || 'V').toUpperCase();
      // Evitar duplicar prefijo si el usuario ya lo escribió
      const cedulaConPrefijo = /^[VEJPGRCA]/i.test(rawCed) ? rawCed.toUpperCase() : `${type}${rawCed}`;

      // Insertar en Supabase (tabla farmers) con created_via: 'admin'
      const nombreCompleto = newFarmer.name.trim();
      const { error: insertError } = await supabase
        .from('farmers')
        .insert([
          {
            nombre_completo: nombreCompleto,
            cedula: cedulaConPrefijo,
            rif: newFarmer.rif.trim(),
            email: (newFarmer.email || '').trim(),
            telefono: (newFarmer.phone || '').trim(),
            risk: 'bajo'
          }
        ]);

      if (insertError) throw insertError;

      // Refrescar lista desde Supabase
      const { data: refreshed, error: refreshError } = await supabase
        .from('farmers')
        .select('*')
        .order('display_id', { ascending: true });

      if (refreshError) throw refreshError;
      setFarmers(refreshed || []);

      // Cerrar modal y limpiar formulario
      setShowNewFarmerForm(false);
      setNewFarmer({
        name: '',
        docType: 'V',
        cedula: '',
        rif: '',
        organizationType: 'Individual',
        phone: '',
        email: '',
        address: '',
      });
    } catch (error) {
      console.error('Error al guardar el agricultor:', error);
      setFormError(error.message || 'No se pudo guardar el agricultor');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar agricultores
  const filteredFarmers = farmers.filter(farmer => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (farmer.nombre_completo?.toLowerCase() || '').includes(searchLower) ||
      (farmer.cedula || '').includes(searchTerm) ||
      (farmer.rif?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Manejar ver detalles del agricultor
  const handleViewDetails = (farmer) => {
    setSelectedFarmer(farmer);
    setIsPanelOpen(true);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  // Cerrar el panel de detalles
  const handleClosePanel = () => {
    setIsPanelOpen(false);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  return (
    <div className="flex h-screen bg-gray-50 relative">
      <RoleBasedSidebar
        userRole="admin"
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'pl-20' : 'pl-64'} w-full`}>
        <div className="p-6">
          {/* Header */}
          <header className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestión de Agricultores</h1>
                <p className="text-muted-foreground">
                  Administra y supervisa todos los agricultores registrados
                </p>
              </div>
              <Button
                variant="default"
                onClick={() => setShowNewFarmerForm(true)}
                className="flex items-center gap-2"
              >
                <FiUserPlus />
                <span>Nuevo Agricultor</span>
              </Button>
            </div>
          </header>

          {/* Barra de búsqueda */}
          <div className="mb-6">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Buscar agricultores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Grid de tarjetas de agricultores */}
          <div className={`transition-all duration-300 ease-in-out ${isPanelOpen ? 'mr-96' : ''}`}>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
              </div>
            ) : filteredFarmers.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron agricultores</h3>
                <p className="mt-1 text-gray-500">
                  {searchTerm ? 'Intenta con otro término de búsqueda' : 'Comienza agregando un nuevo agricultor'}
                </p>
                <div className="mt-6">
                  <Button
                    onClick={() => setShowNewFarmerForm(true)}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <FiUserPlus />
                    <span>Agregar Agricultor</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFarmers.map((farmer) => (
                  <FarmerCard
                    key={farmer.id}
                    farmer={farmer}
                    onViewDetails={() => handleViewDetails(farmer)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Panel de detalles del agricultor */}
          <div 
            className={`fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
              isPanelOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            style={{ marginTop: '64px' }}
          >
            <div className="h-full flex flex-col">
              {selectedFarmer && (
                <FarmerDetailPanel 
                  farmer={selectedFarmer} 
                  isOpen={isPanelOpen} 
                  onClose={handleClosePanel}
                  userRole="admin"
                />
              )}
            </div>
          </div>

          {/* Formulario de nuevo agricultor */}
          {showNewFarmerForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Nuevo Agricultor</h2>
                    <button
                      onClick={() => setShowNewFarmerForm(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FiX className="h-6 w-6" />
                    </button>
                  </div>
                  
                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                      {formError}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitFarmer} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Nombre completo *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={newFarmer.name}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Documento de identidad *
                        </label>
                        <div className="mt-1 flex gap-2">
                          <select
                            id="docType"
                            name="docType"
                            value={newFarmer.docType}
                            onChange={handleInputChange}
                            className="w-24 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          >
                            <option value="V">V</option>
                            <option value="E">E</option>
                            <option value="J">J</option>
                            <option value="P">P</option>
                            <option value="G">G</option>
                            <option value="R">R</option>
                            <option value="C">C</option>
                            <option value="A">A</option>
                          </select>
                          <input
                            type="text"
                            id="cedula"
                            name="cedula"
                            value={newFarmer.cedula}
                            onChange={handleInputChange}
                            placeholder="Ej: 10395700"
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                            required
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Se guardará como {`${newFarmer.docType || 'V'}${newFarmer.cedula || ''}`.toUpperCase()}</p>
                      </div>
                      
                      <div>
                        <label htmlFor="rif" className="block text-sm font-medium text-gray-700">
                          RIF *
                        </label>
                        <input
                          type="text"
                          id="rif"
                          name="rif"
                          value={newFarmer.rif}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          placeholder="J-12345678-9"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="organizationType" className="block text-sm font-medium text-gray-700">
                          Tipo de organización
                        </label>
                        <select
                          id="organizationType"
                          name="organizationType"
                          value={newFarmer.organizationType}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        >
                          <option value="Individual">Individual</option>
                          <option value="Cooperativa">Cooperativa</option>
                          <option value="Asociación">Asociación</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Teléfono *
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={newFarmer.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Correo electrónico
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={newFarmer.email}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Dirección
                        </label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={newFarmer.address}
                          onChange={handleInputChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowNewFarmerForm(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Guardar Agricultor
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerManagement;