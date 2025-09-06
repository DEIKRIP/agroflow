import React from 'react';
import Icon from '../../../components/AppIcon';

const LoginFooter = () => {
  const currentYear = new Date()?.getFullYear();

  const supportLinks = [
    {
      label: 'Ayuda',
      href: '/help',
      icon: 'HelpCircle'
    },
    {
      label: 'Soporte Técnico',
      href: '/support',
      icon: 'MessageCircle'
    },
    {
      label: 'Documentación',
      href: '/docs',
      icon: 'FileText'
    }
  ];

  return (
    <div className="mt-12 pt-8 border-t border-border">
      {/* Support Links */}
      <div className="flex flex-wrap justify-center gap-6 mb-6">
        {supportLinks?.map((link) => (
          <a
            key={link?.href}
            href={link?.href}
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-agricultural"
          >
            <Icon name={link?.icon} size={16} className="mr-2" />
            {link?.label}
          </a>
        ))}
      </div>
      {/* Trust Signals */}
      <div className="text-center space-y-4">
        <div className="flex justify-center items-center space-x-6">
          <div className="flex items-center text-xs text-muted-foreground">
            <Icon name="Shield" size={16} className="mr-2 text-success" />
            Conexión Segura SSL
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <Icon name="CheckCircle" size={16} className="mr-2 text-success" />
            Certificado Agrícola
          </div>
        </div>

        {/* Copyright */}
        <div className="text-xs text-muted-foreground">
          <p>© {currentYear} AgroPais. Todos los derechos reservados.</p>
          <p className="mt-1">
            Plataforma de gestión agrícola para el desarrollo sostenible del campo
          </p>
        </div>

        {/* Version Info */}
        <div className="text-xs text-muted-foreground/60">
          Versión 2.5.0 • Última actualización: Agosto 2025
        </div>
      </div>
    </div>
  );
};

export default LoginFooter;