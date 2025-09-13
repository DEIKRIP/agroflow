import React from 'react';
import { FiCheckCircle, FiPhone, FiMail, FiMap, FiClipboard, FiTrendingUp, FiAlertCircle, FiClock } from 'react-icons/fi';

const defaultProfile = 'https://ui-avatars.com/api/?name=Farmer&background=f3f3f3&color=555&rounded=true&size=96';

const FarmerCard = ({ farmer, onViewDetails }) => {
  // Format helpers
  const formatCedula = (cedula) => cedula ? cedula.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  const formatArea = (area) => area ? area.toLocaleString('es-VE', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0';
  const formatDate = (date) => date ? new Date(date).toLocaleDateString('es-VE') : '';

  // Format data
  const profile = farmer.photo || defaultProfile;
  const name = farmer.full_name || farmer.nombre_completo || farmer.name || 'Sin nombre';
  const displayId = farmer.display_id ? `#${farmer.display_id}` : '';
  const cedula = formatCedula(farmer.cedula) || 'Sin C.I.';
  const status = farmer.status || farmer.estado || 'active';
  const statusText = status === 'active' ? 'Activo' : 'Inactivo';
  const crop = farmer.primaryCrop || 'Sin cultivo';
  const area = formatArea(farmer.totalArea);
  const location = farmer.location || 'Sin ubicación';
  const registrationDate = formatDate(farmer.registrationDate || farmer.fecha_registro);
  const phone = farmer.phone || farmer.telefono || 'Sin teléfono';
  const email = farmer.email || farmer.correo || 'Sin correo';
  const parcels = farmer.parcelsCount ?? 0;
  const inspections = farmer.inspectionsCount ?? 0;
  const balance = farmer.lastFinancingAmount ?? 0;
  
  // Status colors and icons based on system status
  const getStatusStyles = () => {
    if (status === 'active') return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-100',
      icon: <FiCheckCircle className="text-green-500" />
    };
    if (status === 'pending') return {
      bg: 'bg-yellow-50',
      text: 'text-yellow-700',
      border: 'border-yellow-100',
      icon: <FiClock className="text-yellow-500" />
    };
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-100',
      icon: <FiAlertCircle className="text-red-500" />
    };
  };

  const statusStyles = getStatusStyles();

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200 max-w-sm mx-auto">
      {/* Status Header */}
      <div className={`${statusStyles.bg} ${statusStyles.border} px-4 py-2 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {statusStyles.icon}
          <span className={`text-sm font-medium ${statusStyles.text}`}>
            {status === 'active' ? 'Productor Activo' : status === 'pending' ? 'Pendiente de Aprobación' : 'Inactivo'}
          </span>
        </div>
        <span className="text-xs text-gray-500">ID: {displayId || 'N/A'}</span>
      </div>

      {/* Profile Section */}
      <div className="p-5">
        <div className="flex items-start space-x-4">
          <img src={profile} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">C.I. {cedula}</p>
            {farmer.created_via && (
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 border border-gray-200">
                  {farmer.created_via === 'admin' ? 'Creado por administrador' : 'Creado por el usuario (Signup)'}
                </span>
              </div>
            )}
            
            {/* Contact Info */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <FiPhone className="mr-2 text-gray-400" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FiMail className="mr-2 text-gray-400" />
                <span className="truncate">{email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 my-5 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{parcels}</div>
            <div className="text-xs text-gray-500">Parcelas</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{area} <span className="text-sm">ha</span></div>
            <div className="text-xs text-gray-500">Área Total</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{inspections}</div>
            <div className="text-xs text-gray-500">Inspecciones</div>
          </div>
        </div>

        {/* Location & Registration */}
        <div className="space-y-2 text-sm text-gray-600 mb-5">
          <div className="flex items-center">
            <FiMap className="mr-2 text-gray-400" />
            <span>{location}</span>
          </div>
          <div className="flex items-center">
            <FiClipboard className="mr-2 text-gray-400" />
            <span>Registrado el {registrationDate}</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => onViewDetails && onViewDetails(farmer)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <FiClipboard size={18} />
          Ver Detalles Completos
        </button>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex justify-between items-center">
        <div className="flex items-center text-sm text-gray-600">
          <FiTrendingUp className="mr-1 text-green-500" />
          <span>Bs. {balance.toLocaleString('es-VE', {minimumFractionDigits: 2})}</span>
        </div>
        <div className="text-xs text-gray-500">
          Última actualización: {new Date().toLocaleDateString('es-VE')}
        </div>
      </div>
    </div>
  );
};

export default FarmerCard;