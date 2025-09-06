import React, { useContext } from 'react';
import { SidebarContext } from '../../contexts/SidebarContext';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const navigationItems = [
  {
    label: 'Panel Principal',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    roles: ['admin', 'operador', 'productor'],
    badge: null,
    tooltip: 'Vista general del sistema'
  },
  {
    label: 'Agricultores',
    path: '/farmers',
    icon: 'Users',
    roles: ['admin', 'operador'],
    badge: null,
    tooltip: 'Gestionar registros de agricultores'
  },
  {
    label: 'Parcelas',
    path: '/parcels',
    icon: 'MapPin',
    roles: ['admin', 'operador', 'productor'],
    badge: null,
    tooltip: 'Administrar parcelas agrícolas'
  },
  {
    label: 'Inspecciones',
    path: '/inspections',
    icon: 'ClipboardCheck',
    roles: ['admin', 'operador'],
    badge: null,
    tooltip: 'Flujo de trabajo de inspecciones'
  },
  {
    label: 'Financiamiento',
    path: '/financing',
    icon: 'DollarSign',
    roles: ['admin', 'operador', 'productor'],
    badge: null,
    tooltip: 'Gestión de créditos y pagos'
  }
  ,
  {
    label: 'Configuración',
    path: '/settings/profile',
    icon: 'Settings',
    roles: ['admin', 'operador', 'productor'],
    badge: null,
    tooltip: 'Configuración de perfil agrícola'
  }
];

const RoleBasedSidebar = () => {
  const { collapsed, toggleSidebar } = useContext(SidebarContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role || 'productor';

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

  return (
    <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 ease-in-out ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="sidebar-header flex items-center justify-between p-4 border-b">
        {!collapsed && <span className="font-bold text-lg">Siembra País</span>}
        <button 
          onClick={toggleSidebar} 
          className={`${collapsed ? 'mx-auto' : 'ml-2'}`}
          aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          <Icon name={collapsed ? 'ChevronRight' : 'ChevronLeft'} />
        </button>
      </div>
      <nav className="sidebar-menu p-4 pb-24">
        <ul className="space-y-2">
          {navigationItems.filter(item => item.roles.includes(userRole)).map(item => (
            <li key={item.path}>
              <button
                className={`flex items-center w-full px-3 py-2 rounded hover:bg-green-100 transition-colors ${location.pathname === item.path ? 'bg-green-200 font-semibold' : ''}`}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.tooltip : ''}
              >
                <Icon name={item.icon} className={`${collapsed ? 'mx-auto' : 'mr-3'} w-6 h-6`} />
                {!collapsed && (
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
          className={`flex items-center w-full px-3 py-2 rounded hover:bg-red-50 text-red-600 transition-colors ${collapsed ? 'justify-center' : ''}`}
          aria-label="Cerrar sesión"
        >
          <Icon name="LogOut" className={`${collapsed ? '' : 'mr-3'} w-5 h-5`} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default RoleBasedSidebar;
