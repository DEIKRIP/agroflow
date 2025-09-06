import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Label, Select } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import authService from '@/utils/authService';

const ForgotPassword = () => {
  const [formData, setFormData] = useState({
    documentType: 'V',
    documentNumber: '',
    birthDate: '',
    email: ''
  });
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);
      const email = (formData.email || '').toLowerCase().trim();
      // 1) Verificar identidad contra farmers (email, tipo doc, número y fecha nacimiento)
      const verify = await authService.verifyIdentity({
        email,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        birthDate: formData.birthDate,
      });
      if (!verify?.success) throw new Error(verify?.error || 'No pudimos verificar tu identidad');

      // 2) Enviar email de recuperación (temporal; luego migraremos a flujo sin correo)
      const res = await resetPassword(email);
      if (!res?.success) {
        throw new Error(res?.error || 'No se pudo enviar el correo de recuperación');
      }

      setMessage('Hemos enviado un correo con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada.');
    } catch (err) {
      setError(err.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
      {/* Fondo con patrón de cuadrícula */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="h-full w-full bg-repeat"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-primary) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Elementos decorativos */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl -z-10" />

      {/* Contenedor del formulario */}
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-border/50 z-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary mb-2">Recuperar Contraseña</h1>
          <p className="text-muted-foreground text-sm">Ingresa tus datos para recuperar tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="documentType">Tipo de Documento</Label>
            <Select
              options={[
                { value: '', label: 'Seleccione...', disabled: true, className: 'text-muted-foreground' },
                { value: 'CC', label: 'Consejo Comunal' },
                { value: 'RIF', label: 'RIF Venezolano' },
                { value: 'DIP', label: 'Diplomático' },
                { value: 'PAS', label: 'Pasaporte' },
                { value: 'GOV', label: 'Gobierno' },
                { value: 'J', label: 'Jurídico' },
                { value: 'E', label: 'Extranjero' },
                { value: 'V', label: 'Venezolano' }
              ]}
              value={formData.documentType}
              onChange={(value) => setFormData({...formData, documentType: value})}
              placeholder="Selecciona un tipo de documento"
              className="w-full text-foreground"
              classNames={{
                control: () => 'border-input',
                option: (state) => state.isSelected ? 'bg-primary text-primary-foreground' : state.isFocused ? 'bg-accent' : ''
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentNumber">Número de Documento</Label>
            <Input
              id="documentNumber"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              placeholder="Ej: 12345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
            <Input
              id="birthDate"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tucorreo@ejemplo.com"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {message && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">{message}</div>
          )}

          <Button type="submit" className="w-full mt-6" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar Código de Verificación'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-primary hover:underline font-medium">
            ← Volver al Inicio de Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
