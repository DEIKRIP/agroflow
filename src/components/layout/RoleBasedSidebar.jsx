import React, { useContext, useEffect } from 'react';
import { SidebarContext } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

// Debug function to log role and access
const logAccess = (userProfile, path, hasAccess) => {
  console.log(`[${new Date().toISOString()}]`, {
    email: userProfile?.email,
    rawRole: userProfile?.role,
    path,
    hasAccess,
    allNavItems: navigationItems.map(i => ({
      path: i.path,
      roles: i.roles,
      label: i.label
    }))
  });
};

// Shared normalizer so other modules can import it
export const normalizeRole = (r) => {
  switch ((r || '').toLowerCase().trim()) {
    case 'admin':
    case 'administrator':
      return 'admin';
    case 'operador':
    case 'operator':
      return 'operator';
    case 'agricultor':
    case 'farmer':
    case 'productor':
    case 'producer':
      return 'farmer';
    default:
      return 'farmer';
  }
};

const navigationItems = [
  {
    label: 'Panel Principal',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Vista general del sistema'
  },
  {
    label: 'Agricultores',
    path: '/farmers',
    icon: 'Users',
    roles: ['admin', 'operator'],
    badge: null,
    tooltip: 'Gestionar registros de agricultores'
  },
  {
    label: 'Parcelas',
    path: '/parcels',
    icon: 'MapPin',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Administrar parcelas agrícolas'
  },
  {
    label: 'Inspecciones',
    path: '/inspections',
    icon: 'ClipboardCheck',
    roles: ['admin', 'operator'],
    badge: null,
    tooltip: 'Flujo de trabajo de inspecciones'
  },
  {
    label: 'Financiamiento',
    path: '/financing',
    icon: 'DollarSign',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Gestión de créditos y pagos'
  }
  ,
  {
    label: 'Configuración',
    path: '/settings/profile',
    icon: 'Settings',
    roles: ['admin', 'operator', 'farmer'],
    badge: null,
    tooltip: 'Configuración de perfil agrícola'
  }
];

const RoleBasedSidebar = ({ collapsed: collapsedProp, onToggle }) => {
  const { collapsed, toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userProfile } = useAuth();

  // Debug effect to log role changes
  useEffect(() => {
    if (userProfile) {
      console.log('Current User Profile:', {
        id: userProfile.id,
        email: user?.email,
        role: userProfile.role,
        isAdmin: userProfile.role === 'admin' || user?.email === 'manzanillamadriddeiker@gmail.com'
      });
    }
  }, [userProfile, user]);

  // Force admin role for specific email
  const email = String(user?.email || '').toLowerCase().trim();
  const isHardcodedAdmin = email === 'manzanillamadriddeiker@gmail.com';
  const userRole = isHardcodedAdmin ? 'admin' : normalizeRole(userProfile?.role || 'farmer');
  
  console.log('Sidebar - Effective Role:', { 
    email, 
    role: userRole, 
    isHardcodedAdmin 
  });

  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo cerrar la sesión');
    }
  };

  const isCollapsed = typeof collapsedProp === 'boolean' ? collapsedProp : collapsed;
  const handleToggle = onToggle || toggleSidebar;

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="sidebar-header flex items-center justify-between p-4 border-b">
        {!isCollapsed && <span className="font-bold text-lg">Siembra País</span>}
        <button 
          onClick={handleToggle} 
          className={`${isCollapsed ? 'mx-auto' : 'ml-2'}`}
          aria-label={isCollapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Icon name={isCollapsed ? 'ChevronRight' : 'ChevronLeft'} />
        </button>
      </div>
      <nav className="sidebar-menu p-4 pb-24">
        <ul className="space-y-2">
          {(userRole === 'admin' ? navigationItems : navigationItems.filter(item => item.roles.includes(userRole))).map(item => (
            <li key={item.path}>
              <button
                className={`flex items-center w-full px-3 py-2 rounded hover:bg-green-100 transition-colors ${location.pathname === item.path ? 'bg-green-200 font-semibold' : ''}`}
                onClick={() => navigate(item.path)}
                title={isCollapsed ? item.tooltip : ''}
              >
                <Icon name={item.icon} className={`${isCollapsed ? 'mx-auto' : 'mr-3'} w-6 h-6`} />
                {!isCollapsed && (
                  <>
                    <span>{item.label}</span>
                    {item.badge && <span className="ml-auto bg-green-500 text-white rounded-full px-2 text-xs">{item.badge}</span>}
                  </>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      {/* Footer con botón de cerrar sesión */}
      <div className="absolute bottom-0 left-0 right-0 border-t p-4">
        <button
          onClick={handleLogout}
          className={`flex items-center w-full px-3 py-2 rounded hover:bg-red-50 text-red-600 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          aria-label="Cerrar sesión"
        >
          <Icon name="LogOut" className={`${isCollapsed ? '' : 'mr-3'} w-5 h-5`} />
          {!isCollapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default RoleBasedSidebar;
