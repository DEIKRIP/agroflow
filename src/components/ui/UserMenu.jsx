import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Icon from '../../components/AppIcon';

const UserMenu = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { signOut, userProfile } = useAuth();

  // Cerrar el menú al hacer clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada correctamente');
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
          <Icon name="User" size={16} color="white" />
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-foreground">{userProfile?.full_name || user?.name || 'Usuario'}</p>
          {userProfile?.cedula || userProfile?.farmer_cedula ? (
            <p className="text-xs font-medium text-foreground">
              C.I. {userProfile?.cedula || userProfile?.farmer_cedula}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg overflow-hidden z-50 border border-border">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
            <div className="px-4 py-2 border-b border-border">
              <p className="text-sm font-medium text-foreground">{userProfile?.full_name || user?.name || 'Usuario'}</p>
              {(userProfile?.cedula || userProfile?.farmer_cedula) && (
                <p className="text-xs font-medium text-foreground">
                  C.I. {userProfile?.cedula || userProfile?.farmer_cedula}
                </p>
              )}
              <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
            
            <button
              onClick={() => {
                navigate('/settings/profile');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50"
              role="menuitem"
            >
              <Icon name="User" size={16} className="mr-2" />
              Mi Perfil
            </button>
            
            <button
              onClick={() => {
                navigate('/settings/profile');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50"
              role="menuitem"
            >
              <Icon name="Settings" size={16} className="mr-2" />
              Configuración
            </button>
            
            <button
              onClick={() => {
                // Navegar a la página de soporte cuando exista
                toast('Próximamente: Soporte');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted/50"
              role="menuitem"
            >
              <Icon name="HelpCircle" size={16} className="mr-2" />
              Soporte
            </button>
            
            <div className="border-t border-border my-1"></div>
            
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-muted/50"
              role="menuitem"
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
