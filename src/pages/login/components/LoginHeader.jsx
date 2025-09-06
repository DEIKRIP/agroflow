import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginHeader = () => {
  return (
    <div className="text-center mb-8">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 shadow-agricultural">
            <Icon name="Sprout" size={28} color="white" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-primary">AgroFlow</h1>
            <p className="text-sm text-muted-foreground">Gestión Agrícola Inteligente</p>
          </div>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Bienvenido de vuelta
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Accede a tu cuenta para gestionar tus cultivos, inspecciones y operaciones agrícolas
        </p>
      </div>
    </div>
  );
};

export default LoginHeader;