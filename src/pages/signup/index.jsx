import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LoginHeader from '../login/components/LoginHeader';
import LoginBackground from '../login/components/LoginBackground';
import { supabase } from '../../lib/supabase';
import authService from '../../utils/authService';
import { toast } from 'react-hot-toast';
import { Button, Input, Label, Select } from '@/components/ui';

const SignupPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    documentType: 'V',
    documentNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user types
    if (error) setError('');
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await authService.signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        documentType: formData.documentType,
        documentNumber: formData.documentNumber,
        birthDate: null,
        rif: null
      });

      if (!result?.success) {
        throw new Error(result?.error || 'No se pudo completar el registro');
      }

      toast.success('Registro exitoso. Revisa tu correo para confirmar.');
      navigate('/login');

    } catch (error) {
      console.error('Error en el registro:', error);
      setError(error.message || 'Error al registrar el usuario. Por favor inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
      <LoginBackground />
      
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mr-4 shadow-agricultural">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sprout">
                    <path d="M7 20h10"></path>
                    <path d="M10 20c5.5-2.5.8-6.4 3-10"></path>
                    <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"></path>
                    <path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-3xl font-bold text-primary">AgroFlow</h1>
                  <p className="text-sm text-muted-foreground">Gestión Agrícola Inteligente</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Crear Cuenta</h2>
              <p className="text-muted-foreground">Completa el formulario para unirte a nuestra plataforma</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombres</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellidos</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <select
                  id="documentType"
                  name="documentType"
                  value={formData.documentType}
                  onChange={(e) => handleSelectChange('documentType', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="V">V - Venezolano</option>
                  <option value="E">E - Extranjero</option>
                  <option value="J">J - Jurídico</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  required
                  placeholder={formData.documentType === 'J' ? '12345678-9' : '12345678'}
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0412-1234567"
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                minLength={6}
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength={6}
                required
                placeholder="Vuelve a escribir tu contraseña"
                className="w-full"
              />
            </div>

            <div className="text-xs text-muted-foreground pt-2">
              <p>Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.</p>
              <p className="mt-1">Tu cuenta estará en estado <span className="font-medium">pendiente de aprobación</span> hasta que sea revisada por un administrador.</p>
            </div>

            <Button 
              type="submit" 
              className="w-full mt-4 py-2 text-base"
              disabled={isLoading}
            >
              {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Inicia Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
