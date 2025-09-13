import React from 'react';
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate, useLocation } from 'react-router-dom';
import ScrollToTop from 'components/ScrollToTop';
import ErrorBoundary from 'components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';
import { normalizeRole } from './components/layout/RoleBasedSidebar.jsx';

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

// Restricción por rol (Admin, Operator, Farmer)
const RoleRoute = ({ roles = [], children }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Cargando...</div>;
  }

  // Check for hardcoded admin email
  const email = String(user?.email || '').toLowerCase().trim();
  const isHardcodedAdmin = email === 'manzanillamadriddeiker@gmail.com';
  
  // Log role information for debugging
  console.log('RoleRoute - Access Check:', {
    email,
    userRole: userProfile?.role,
    isHardcodedAdmin,
    requiredRoles: roles,
    path: location.pathname
  });

  // Admin has access to everything
  if (isHardcodedAdmin) {
    console.log('RoleRoute - Admin access granted to', location.pathname);
    return children;
  }

  // For non-admin users, check their role
  const baseRole = (userProfile?.role || '').toLowerCase().trim();
  const effectiveRole = normalizeRole(baseRole);
  const hasAccess = roles.includes(effectiveRole);
  
  console.log('RoleRoute - Access Check Result:', {
    effectiveRole,
    hasAccess,
    requiredRoles: roles
  });

  if (!hasAccess) {
    console.warn('Access denied to', location.pathname, 'for role', effectiveRole);
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
              <RoleRoute roles={['admin', 'operator']}>
                <FarmerList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/parcels" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operator', 'farmer']}>
                <PlotList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/inspections" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operator']}>
                <InspectionList />
              </RoleRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/financing" element={
            <ProtectedRoute>
              <RoleRoute roles={['admin', 'operator', 'farmer']}>
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