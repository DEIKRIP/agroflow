import React, { useState, useEffect, useRef } from 'react';
import Icon from '../AppIcon';
import StatusBadgeSystem from './StatusBadgeSystem';

const NotificationCenter = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Mock notifications data
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'inspection',
        title: 'Inspección Completada',
        message: 'La inspección de la parcela #P-2024-001 ha sido completada exitosamente.',
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
        read: false,
        priority: 'medium',
        actionUrl: '/inspection-workflow'
      },
      {
        id: 2,
        type: 'farmer',
        title: 'Nuevo Agricultor Registrado',
        message: 'Carlos Mendoza ha completado su registro en el sistema.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        read: false,
        priority: 'low',
        actionUrl: '/farmer-management'
      },
      {
        id: 3,
        type: 'financing',
        title: 'Solicitud de Financiamiento',
        message: 'Nueva solicitud de financiamiento requiere revisión urgente.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: true,
        priority: 'high',
        actionUrl: '/farmer-dashboard'
      },
      {
        id: 4,
        type: 'system',
        title: 'Actualización del Sistema',
        message: 'El sistema se actualizará el próximo domingo a las 2:00 AM.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: true,
        priority: 'low',
        actionUrl: null
      },
      {
        id: 5,
        type: 'parcel',
        title: 'Parcela Aprobada',
        message: 'La parcela #P-2024-005 ha sido aprobada para financiamiento.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        read: false,
        priority: 'medium',
        actionUrl: '/parcel-management'
      }
    ];

    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    const icons = {
      inspection: 'ClipboardCheck',
      farmer: 'Users',
      financing: 'DollarSign',
      system: 'Settings',
      parcel: 'MapPin'
    };
    return icons[type] || 'Bell';
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high' || priority === 'urgent') {
      return 'text-error';
    }
    
    const colors = {
      inspection: 'text-primary',
      farmer: 'text-secondary',
      financing: 'text-accent',
      system: 'text-muted-foreground',
      parcel: 'text-success'
    };
    return colors[type] || 'text-muted-foreground';
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return timestamp.toLocaleDateString('es-VE');
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.actionUrl) {
      // Navigate to the action URL
      window.location.href = notification.actionUrl;
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg micro-interaction"
        aria-label="Notificaciones"
      >
        <Icon name="Bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-error text-error-foreground text-xs font-medium rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className={`absolute right-0 mt-2 w-80 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-lg shadow-lg bg-white border border-border z-50 divide-y divide-border`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 micro-interaction"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="Bell" size={32} className="mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No hay notificaciones</p>
              </div>
            ) : (
              <div className="py-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left hover:bg-muted micro-interaction border-l-4 ${
                      notification.read 
                        ? 'border-l-transparent' :'border-l-primary bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 ${getNotificationColor(notification.type, notification.priority)}`}>
                        <Icon name={getNotificationIcon(notification.type)} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.priority && notification.priority !== 'low' && (
                          <div className="mt-2">
                            <StatusBadgeSystem 
                              status={notification.priority === 'high' ? 'requires_action' : 'pending'} 
                              size="sm" 
                              showIcon={false}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border">
              <button className="w-full text-center text-sm text-primary hover:text-primary/80 micro-interaction">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;