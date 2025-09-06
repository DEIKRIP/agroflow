import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import RoleBasedSidebar from "../../components/layout/RoleBasedSidebar";
import StatusBadgeSystem from '../../components/ui/StatusBadgeSystem';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import NotificationCenter from '../../components/ui/NotificationCenter';
import financingService from '../../utils/financingService';
import farmerService from '../../utils/farmerService';

import { Search, Plus, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function FinancingManagement() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [financings, setFinancings] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    estado: '',
    farmer_cedula: '',
    min_monto: '',
    max_monto: '',
    nivel_riesgo: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    farmer_cedula: '',
    monto_solicitado: '',
    proposito: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadFinancings();
    loadStats();
    loadFarmers();
  }, [filters]);

  const loadFinancings = async () => {
    try {
      setLoading(true);
      const result = await financingService.getFinancings(filters);
      
      if (result.success) {
        setFinancings(result.data || []);
      } else {
        setError(result.error || 'Error al cargar financiamientos');
      }
    } catch (err) {
      setError('Error inesperado al cargar financiamientos');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await financingService.getFinancingStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.log('Error loading stats:', err);
    }
  };

  const loadFarmers = async () => {
    try {
      const result = await farmerService.getFarmers({}, 1, 100);
      if (result.success) {
        setFarmers(result.data || []);
      }
    } catch (err) {
      console.log('Error loading farmers:', err);
    }
  };

  const handleCreateFinancing = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const result = await financingService.createFinancing({
        ...createForm,
        monto_solicitado: parseFloat(createForm.monto_solicitado)
      });
      
      if (result.success) {
        setShowCreateModal(false);
        setCreateForm({ farmer_cedula: '', monto_solicitado: '', proposito: '' });
        loadFinancings();
        loadStats();
      } else {
        setError(result.error || 'Error al crear solicitud');
      }
    } catch (err) {
      setError('Error inesperado al crear solicitud');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    switch(estado) {
      case 'solicitado': return 'yellow';
      case 'aprobado': return 'green';
      case 'rechazado': return 'red';
      case 'activo': return 'blue';
      case 'pagado': return 'gray';
      default: return 'gray';
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'bajo': return 'green';
      case 'medio': return 'yellow';
      case 'alto': return 'red';
      default: return 'gray';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <RoleBasedSidebar currentPath="/financing-management" />
      
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Financiamiento</h1>
                <p className="text-gray-600">Administra solicitudes de crédito y automatización</p>
              </div>
              <div className="flex items-center space-x-4">
                <NotificationCenter />
                {user && (
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile?.full_name || 'Usuario'}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {userProfile?.role || 'Sin rol'}
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {(userProfile?.full_name || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Stats Section */}
        {stats && (
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Solicitado</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(stats.total_solicited)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Aprobado</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {formatCurrency(stats.total_approved)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Pendientes</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {stats.by_status?.solicitado || 0}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Solicitudes</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {stats.total_requests}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 px-6 pb-6">
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Select
                      value={filters.farmer_cedula}
                      onChange={(e) => setFilters({...filters, farmer_cedula: e.target.value})}
                      className="pl-10 min-w-48"
                    >
                      <option value="">Todos los agricultores</option>
                      {farmers.map((farmer) => (
                        <option key={farmer.cedula} value={farmer.cedula}>
                          {farmer.nombre_completo} ({farmer.cedula})
                        </option>
                      ))}
                    </Select>
                  </div>

                  <Select
                    value={filters.estado}
                    onChange={(e) => setFilters({...filters, estado: e.target.value})}
                    className="min-w-40"
                  >
                    <option value="">Todos los estados</option>
                    <option value="solicitado">Solicitado</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                    <option value="activo">Activo</option>
                    <option value="pagado">Pagado</option>
                  </Select>

                  <Select
                    value={filters.nivel_riesgo}
                    onChange={(e) => setFilters({...filters, nivel_riesgo: e.target.value})}
                  >
                    <option value="">Todos los riesgos</option>
                    <option value="bajo">Bajo</option>
                    <option value="medio">Medio</option>
                    <option value="alto">Alto</option>
                  </Select>
                </div>

                {(userProfile?.role === 'admin' || userProfile?.role === 'operador') && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Solicitud
                  </Button>
                )}
              </div>
            </div>

            {/* Financings List */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                  <p className="text-gray-600">{error}</p>
                  <Button onClick={loadFinancings} className="mt-4">
                    Reintentar
                  </Button>
                </div>
              ) : financings?.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay financiamientos registrados</p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Agricultor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Propósito
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Solicitado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Aprobado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Riesgo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financings.map((financing) => (
                      <tr key={financing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-green-700 font-medium text-sm">
                                  {financing.farmer?.nombre_completo?.charAt(0) || 'F'}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {financing.farmer?.nombre_completo || 'Sin nombre'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {financing.farmer?.cedula || 'Sin cédula'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {financing.proposito}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(financing.monto_solicitado)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {financing.monto_aprobado ? formatCurrency(financing.monto_aprobado) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadgeSystem
                            status={financing.estado}
                            variant={getStatusColor(financing.estado)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {financing.nivel_riesgo && (
                            <StatusBadgeSystem
                              status={financing.nivel_riesgo}
                              variant={getRiskColor(financing.nivel_riesgo)}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(financing.fecha_solicitud).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create Financing Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Nueva Solicitud de Financiamiento
              </h3>
              <form onSubmit={handleCreateFinancing} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Agricultor
                  </label>
                  <Select
                    value={createForm.farmer_cedula}
                    onChange={(e) => setCreateForm({...createForm, farmer_cedula: e.target.value})}
                    required
                  >
                    <option value="">Seleccionar agricultor...</option>
                    {farmers.map((farmer) => (
                      <option key={farmer.cedula} value={farmer.cedula}>
                        {farmer.nombre_completo} ({farmer.cedula})
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto Solicitado (VES)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.monto_solicitado}
                    onChange={(e) => setCreateForm({...createForm, monto_solicitado: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Propósito del Financiamiento
                  </label>
                  <textarea
                    value={createForm.proposito}
                    onChange={(e) => setCreateForm({...createForm, proposito: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Describe el uso del financiamiento..."
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Creando...' : 'Crear Solicitud'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}