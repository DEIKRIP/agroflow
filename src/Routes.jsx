import React from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from 'react-router-dom';
import ScrollToTop from 'components/ScrollToTop';
import ErrorBoundary from 'components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

// Auth Components
import Login from 'pages/login';
import Signup from 'pages/signup';
import ForgotPassword from 'pages/forgot-password';
import ResetPassword from 'pages/reset-password';

// Main Application Pages
import Dashboard from 'features/dashboard/Dashboard';
import FarmerList from 'features/farmers/FarmerList';
import PlotList from 'features/parcels/PlotList';
import InspectionList from 'features/inspections/InspectionList';
import FinancingManagement from 'features/financing/FinancingManagement';
import CreditList from 'features/financing/CreditList';
import NotFound from 'pages/NotFound';
import ProfileSettings from 'features/settings/ProfileSettings';

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  return user ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

// Restricción por rol (admin, operador, productor)
const RoleRoute = ({ roles = [], children }) => {
  const { userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // Si no hay perfil, redirigir a login (o mantener lógica de ProtectedRoute arriba)
  if (!userProfile) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = userProfile?.role || 'productor';
  if (!roles.includes(role)) {
    // Redirige al dashboard si el rol no está autorizado
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/farmers" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operador']}>
                <FarmerList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/parcels" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operador', 'productor']}>
                <PlotList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/inspections" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operador']}>
                <InspectionList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/financing" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operador', 'productor']}>
                <FinancingManagement />
              </RoleRoute>
            </ProtectedRoute>
          }>
            <Route index element={<CreditList />} />
            <Route path="credits" element={<CreditList />} />
            <Route path="management" element={<FinancingManagement />} />
          </Route>

          {/* Configuración de perfil */}
          <Route path="/settings/profile" element={
            <ProtectedRoute>
              <ProfileSettings />
            </ProtectedRoute>
          } />
          
          {/* Redirecciones para mantener compatibilidad */}
          <Route path="/farmer-dashboard" element={<Navigate to="/dashboard" replace />} />
          <Route path="/parcel-management" element={<Navigate to="/parcels" replace />} />
          <Route path="/farmer-management" element={<Navigate to="/farmers" replace />} />
          <Route path="/inspection-workflow" element={<Navigate to="/inspections" replace />} />
          <Route path="/financing-management" element={<Navigate to="/financing" replace />} />
          
          {/* Ruta para redirección de login antiguo */}
          <Route path="/auth/login" element={<Navigate to="/login" replace />} />
          {/* Redirección para menú de perfil */}
          <Route path="/perfil" element={<Navigate to="/settings/profile" replace />} />
          
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;