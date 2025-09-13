import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginHeader from './components/LoginHeader';
import LoginForm from './components/LoginForm';
import LoginFooter from './components/LoginFooter';
import LoginBackground from './components/LoginBackground';
import { supabase } from '../../lib/supabase';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (formData) => {
    try {
      setIsLoading(true);
      setError('');
      
      const { email, password, rememberMe } = formData;
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data?.user) {
        // Guardar preferencia de "Recordarme"
        if (rememberMe) {
          localStorage.setItem('rememberLogin', 'true');
        }

        // Post-login first-run: ensure farmer record exists
        try {
          const user = data.user;
          const meta = user.user_metadata || {};
          const documentNumber = meta.document_number;
          const documentType = meta.document_type;

          if (documentNumber) {
            // Check if farmer already exists
            const { data: existingFarmer, error: checkErr } = await supabase
              .from('farmers')
              .select('cedula')
              .eq('cedula', documentNumber)
              .maybeSingle();

            if (checkErr) {
              // Non-fatal: log and continue to dashboard
              console.warn('No se pudo verificar farmer existente:', checkErr);
            }

            if (!existingFarmer) {
              const fullName = [meta.first_name, meta.last_name].filter(Boolean).join(' ').trim() || (meta.full_name || '').trim() || (user.email || '').split('@')[0];
              const rif = documentType === 'J' ? `J-${documentNumber}` : null;

              const insertPayload = {
                cedula: documentNumber,
                nombre_completo: fullName,
                rif,
                email: user.email,
                telefono: meta.phone || null,
                tipo_documento: documentType || null,
                estado: 'pendiente',
                fecha_registro: new Date().toISOString(),
                created_by: user.id,
                created_via: 'login_first_run',
                risk: 'bajo',
              };

              const { error: insertErr } = await supabase
                .from('farmers')
                .insert([insertPayload]);

              if (insertErr) {
                console.warn('No se pudo crear el registro de productor en primer inicio de sesión:', insertErr);
              }
            }
          }
        } catch (hookErr) {
          console.warn('Hook post-login falló:', hookErr);
        }

        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <LoginBackground />
      
      <div className="relative z-10 flex-1 flex flex-col md:flex-row">
        {/* Sección izquierda - Logo */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-primary/5 flex items-center justify-center p-12">
          <div className="text-center max-w-sm">
            <div className="rounded-full shadow-2xl overflow-hidden mb-8 inline-block transform transition-all duration-300 hover:scale-105 w-96 h-96">
              <img 
                src="/Imagen de WhatsApp 2025-09-13 a las 18.13.44_f1910094-Photoroom.png" 
                alt="Fondo Agrícola" 
                className="w-full h-full object-cover scale-110"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/512';
                }}
              />
            </div>
            <h2 className="text-3xl font-bold text-primary mb-3">Sistema de Gestión Agrícola</h2>
            <p className="text-muted-foreground text-lg">Plataforma integral para el manejo de cultivos</p>
          </div>
        </div>

        {/* Sección derecha - Formulario */}
        <div className="w-full md:w-1/2 lg:w-2/3 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <LoginHeader />
              {error && (
                <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <LoginForm 
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
              />
            </div>
            
            {/* Ayuda para credenciales de prueba */}
            <div className="mt-6 bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
              <p className="font-medium mb-2">Credenciales de prueba:</p>
              <div className="space-y-1">
                <p><strong>Admin:</strong> admin@agropais.com / admin123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Pie de página - Políticas y documentación */}
      <footer className="w-full bg-background border-t border-border py-6">
        <div className="container mx-auto px-4">
          <LoginFooter />
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;