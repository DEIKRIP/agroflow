import React, { useEffect, useMemo, useState, useContext } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Icon from '../../components/AppIcon';
import { toast } from 'react-hot-toast';
import RoleBasedSidebar from '../../components/layout/RoleBasedSidebar';
import { SidebarContext } from '../../contexts/SidebarContext';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const initialState = {
  // Perfil
  photo: null,
  photoUrl: null,
  idDocument: null,
  idDocumentUrl: null,
  fullName: '',
  email: '',
  phone: '',
  fechadenacimiento: '',
  bio: '',
  // Identificación
  documentType: 'V',
  documentNumber: '',
  rif: '',
  // Preferencias agrícolas
  cropType: '',
  landSize: '',
  farmingMethod: '',
  irrigation: '',
  experienceYears: '',
  // Ubicación
  country: '',
  city: '',
  address: '',
  gps: '',
  agroZone: '',
  soilTypes: [],
  // Notificaciones
  weatherAlerts: true,
  irrigationReminders: true,
  tipsFrequency: 'semanal',
  offers: false,
  // Seguridad (placeholder)
  twoFactor: false,
};

const soilOptions = ['Arenoso', 'Arcilloso', 'Franco', 'Limoso', 'Turboso'];
const cropOptions = ['Hortalizas', 'Frutales', 'Cereales', 'Leguminosas', 'Tubérculos'];
const methodOptions = ['Convencional', 'Orgánico', 'Hidropónico', 'Agroecológico'];
const irrigationOptions = ['Goteo', 'Aspersión', 'Gravedad', 'Pivot'];

export default function ProfileSettings() {
  const [tab, setTab] = useState('perfil');
  const [form, setForm] = useState(initialState);
  const [darkMode, setDarkMode] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('theme') === 'dark' : false));
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const { user, userProfile, refreshProfile } = useAuth();
  
  // Seguridad: cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    // Aplicar tema
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const isValid = useMemo(() => {
    // Validación mínima para campos clave
    if (!form.fullName.trim()) return false;
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
    if (!String(form.documentNumber || '').trim()) return false;
    return true;
  }, [form.fullName, form.email, form.documentNumber]);

  // Cargar datos existentes del usuario y farmer
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        // Cargar datos del perfil de usuario
        const { data: profile, error: profileError } = await supabase
          .from('users_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error loading profile:', profileError);
        }
        
        // Cargar datos del farmer si existe
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (farmerError && farmerError.code !== 'PGRST116') {
          console.error('Error loading farmer:', farmerError);
        }
        
        // Combinar datos y llenar el formulario
        const combinedData = {
          fullName: farmer?.full_name || profile?.full_name || user?.email || '',
          email: farmer?.email || user?.email || '',
          phone: farmer?.phone || profile?.phone || '',
          fechadenacimiento: farmer?.birth_date || '',
          bio: farmer?.biography || '',
          documentNumber: farmer?.cedula || '',
          rif: farmer?.rif || '',
          country: profile?.country || '',
          city: profile?.city || '',
          address: profile?.address || '',
          gps: profile?.gps || '',
          photoUrl: farmer?.profile_image_url || profile?.avatar_url || null,
          idDocumentUrl: farmer?.id_document_url || null,
        };
        
        setForm(prev => ({
          ...prev,
          ...combinedData
        }));
        
      } catch (error) {
        console.error('Error loading user data:', error);
        toast.error('Error al cargar los datos del perfil');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user]);

  const handleChange = (field) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Función para subir archivos a Supabase Storage
  const uploadFile = async (file, bucket, folder = '') => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    try {
      setUploadingPhoto(true);
      toast.loading('Subiendo foto de perfil...', { id: 'photo-upload' });

      // Crear preview local inmediatamente
      setForm((p) => ({ ...p, photo: file }));

      // Subir a Supabase Storage
      const photoUrl = await uploadFile(file, 'profile-images', 'photos');
      
      setForm((p) => ({ ...p, photoUrl, photo: file }));
      toast.success('Foto de perfil subida correctamente', { id: 'photo-upload' });

    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Error al subir la foto de perfil', { id: 'photo-upload' });
      setForm((p) => ({ ...p, photo: null }));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleIdFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 3 * 1024 * 1024) {
      toast.error('El documento no debe superar 3MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPG, PNG) o archivos PDF');
      return;
    }

    try {
      setUploadingDocument(true);
      toast.loading('Subiendo documento de identificación...', { id: 'document-upload' });

      // Crear preview local inmediatamente
      setForm((p) => ({ ...p, idDocument: file }));

      // Subir a Supabase Storage
      const documentUrl = await uploadFile(file, 'profile-images', 'documents');
      
      setForm((p) => ({ ...p, idDocumentUrl: documentUrl, idDocument: file }));
      toast.success('Documento subido correctamente', { id: 'document-upload' });

    } catch (error) {
      console.error('Document upload error:', error);
      toast.error('Error al subir el documento', { id: 'document-upload' });
      setForm((p) => ({ ...p, idDocument: null }));
    } finally {
      setUploadingDocument(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en este navegador');
      return;
    }
    
    toast.loading('Obteniendo ubicación...', { id: 'location' });
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({ 
          ...p, 
          gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, 
          agroZone: 'Auto' 
        }));
        toast.success('Ubicación obtenida correctamente', { id: 'location' });
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'No se pudo obtener la ubicación';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permiso de ubicación denegado';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Ubicación no disponible';
            break;
          case error.TIMEOUT:
            errorMessage = 'Tiempo de espera agotado';
            break;
        }
        
        toast.error(errorMessage, { id: 'location' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const toggleSoil = (soil) => {
    setForm((p) => {
      const exists = p.soilTypes.includes(soil);
      return { ...p, soilTypes: exists ? p.soilTypes.filter((s) => s !== soil) : [...p.soilTypes, soil] };
    });
  };

  const saveChanges = async () => {
    if (!isValid) {
      toast.error('Por favor completa los campos obligatorios: Nombre, Email y Número de documento');
      return;
    }
    
    if (!user?.id) {
      toast.error('Usuario no autenticado');
      return;
    }
    
    try {
      setSaving(true);
      toast.loading('Guardando cambios...', { id: 'save' });

      // Normalizaciones
      const digitsOnly = String(form.documentNumber || '').replace(/\D/g, '');
      const email = String(form.email || '').trim().toLowerCase();
      const fullName = String(form.fullName || '').trim();

      if (!digitsOnly) {
        toast.error('El número de documento es requerido', { id: 'save' });
        return;
      }

      // Guardar/actualizar farmer vía RPC
      const { data: farmerId, error: rpcError } = await supabase.rpc('upsert_farmer', {
        p_cedula: digitsOnly,
        p_full_name: fullName,
        p_phone: form.phone || null,
        p_email: email,
        p_rif: form.rif || null,
        p_birth_date: form.fechadenacimiento || null,
        p_biography: form.bio || null,
        p_profile_image_url: form.photoUrl || null
      });
      
      if (rpcError) {
        console.error('upsert_farmer error:', rpcError);
        throw new Error(`Error al guardar datos del agricultor: ${rpcError.message}`);
      }

      // Actualizar datos adicionales en users_profiles
      const { error: profileError } = await supabase
        .from('users_profiles')
        .update({
          full_name: fullName,
          phone: form.phone || null,
          country: form.country || null,
          city: form.city || null,
          address: form.address || null,
          gps: form.gps || null,
          avatar_url: form.photoUrl || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (profileError) {
        console.warn('Error updating profile:', profileError);
        // No lanzar error, ya que el farmer se guardó correctamente
      }

      // Si hay documento ID, actualizar en farmers
      if (form.idDocumentUrl) {
        const { error: docError } = await supabase
          .from('farmers')
          .update({
            id_document_url: form.idDocumentUrl,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
          
        if (docError) {
          console.warn('Error updating document URL:', docError);
        }
      }

      // Refrescar el contexto de usuario
      if (refreshProfile) {
        await refreshProfile();
      }

      toast.success('Perfil guardado correctamente', { id: 'save' });
      
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error?.message || 'Error al guardar cambios', { id: 'save' });
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (confirm('¿Estás seguro de que quieres descartar los cambios?')) {
      // Recargar datos originales
      window.location.reload();
    }
  };

  // Cambiar contraseña del usuario autenticado
  const changePassword = async () => {
    try {
      if (!newPassword || newPassword.length < 6) {
        toast.error('La nueva contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('La confirmación no coincide con la nueva contraseña');
        return;
      }
      if (!user?.email) {
        toast.error('Usuario no autenticado');
        return;
      }

      setChangingPassword(true);
      toast.loading('Actualizando contraseña...', { id: 'password' });

      // Actualizar contraseña
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (error) {
        throw error;
      }

      // Limpiar campos de seguridad
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      toast.success('Contraseña actualizada correctamente', { id: 'password' });
      
    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error?.message || 'No se pudo actualizar la contraseña', { id: 'password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const { collapsed } = useContext(SidebarContext);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <RoleBasedSidebar />
        <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'pl-20' : 'pl-64'}`}>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Cargando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar principal */}
      <RoleBasedSidebar />
      <div className={`transition-all duration-300 ease-in-out ${collapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Encabezado */}
        <header className="px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold">Configuración de Perfil Agrícola</h1>
          <p className="text-sm text-muted-foreground">Administra tu información personal y preferencias agrícolas</p>
        </header>

        <div className="px-6 pb-28">
          {/* Un solo contenedor Tabs que controla sidebar y contenido */}
          <Tabs value={tab} onValueChange={setTab} orientation="vertical" className="w-full">
            <div className="flex gap-8 max-w-6xl mx-auto">
              {/* Barra lateral de pestañas verticales */}
              <aside className="w-64 hidden md:block">
                <TabsList className="h-auto flex flex-col items-stretch bg-transparent p-0 gap-1.5">
                  <TabsTrigger value="perfil" className={`justify-start gap-3 px-3 py-2.5 text-sm data-[state=active]:bg-primary/10`}>
                    <Icon name="User" className="w-4 h-4" />
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger value="preferencias" className="justify-start gap-3 px-3 py-2.5 text-sm">
                    <Icon name="Leaf" className="w-4 h-4" />
                    Preferencias Agrícolas
                  </TabsTrigger>
                  <TabsTrigger value="ubicacion" className="justify-start gap-3 px-3 py-2.5 text-sm">
                    <Icon name="MapPin" className="w-4 h-4" />
                    Ubicación de Residencia
                  </TabsTrigger>
                  <TabsTrigger value="notificaciones" className="justify-start gap-3 px-3 py-2.5 text-sm">
                    <Icon name="Bell" className="w-4 h-4" />
                    Notificaciones
                  </TabsTrigger>
                  <TabsTrigger value="seguridad" className="justify-start gap-3 px-3 py-2.5 text-sm">
                    <Icon name="Lock" className="w-4 h-4" />
                    Seguridad
                  </TabsTrigger>
                </TabsList>
              </aside>

              {/* Contenido principal */}
              <main className="flex-1">
                <TabsContent value="perfil">
                  <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                      <div className="border rounded-lg p-4">
                        <p className="font-medium mb-2">Foto de perfil</p>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                            {uploadingPhoto && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              </div>
                            )}
                            {form.photo ? (
                              <img
                                src={URL.createObjectURL(form.photo)}
                                alt="Foto"
                                className="w-full h-full object-cover"
                              />
                            ) : form.photoUrl ? (
                              <img
                                src={form.photoUrl}
                                alt="Foto"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon name="User" className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleFile}
                              disabled={uploadingPhoto}
                            />
                            <Button variant="outline" size="sm" type="button" disabled={uploadingPhoto}>
                              <Icon name="Upload" className="w-4 h-4 mr-2" /> 
                              {uploadingPhoto ? 'Subiendo...' : 'Subir imagen'}
                            </Button>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Acepta JPG, PNG (máx. 2MB). Recomendado: 400x400px.</p>
                      </div>

                      <div className="border rounded-lg p-4 mt-4">
                        <p className="font-medium mb-2">Documento de identificación</p>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden relative">
                            {uploadingDocument && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                              </div>
                            )}
                            {form.idDocument ? (
                              form.idDocument.type === 'application/pdf' ? (
                                <div className="text-center">
                                  <Icon name="IdCard" className="w-6 h-6 text-muted-foreground" />
                                  <p className="text-xs mt-1">PDF</p>
                                </div>
                              ) : (
                                <img
                                  src={URL.createObjectURL(form.idDocument)}
                                  alt="Documento"
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : form.idDocumentUrl ? (
                              <img
                                src={form.idDocumentUrl}
                                alt="Documento"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Icon name="IdCard" className="w-6 h-6 text-muted-foreground" />
                            )}
                          </div>
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input 
                              type="file" 
                              accept="image/*,.pdf" 
                              className="hidden" 
                              onChange={handleIdFile}
                              disabled={uploadingDocument}
                            />
                            <Button variant="outline" size="sm" type="button" disabled={uploadingDocument}>
                              <Icon name="Upload" className="w-4 h-4 mr-2" /> 
                              {uploadingDocument ? 'Subiendo...' : 'Subir documento'}
                            </Button>
                          </label>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Acepta imagen o PDF (máx. 3MB). Se recomienda foto nítida del anverso.</p>
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">
                          Nombre completo <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={form.fullName} 
                          onChange={handleChange('fullName')} 
                          placeholder="Ej: María Pérez"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">
                          Correo electrónico <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          type="email" 
                          value={form.email} 
                          onChange={handleChange('email')} 
                          placeholder="usuario@correo.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">Número de teléfono</label>
                        <Input 
                          value={form.phone} 
                          onChange={handleChange('phone')} 
                          placeholder="+58 412-0000000" 
                        />
                      </div>

                      {/* Identificación */}
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">Tipo de documento</label>
                        <Select
                          value={form.documentType}
                          onChange={handleChange('documentType')}
                          placeholder="Selecciona"
                          options={[
                            { label: 'V - Venezolano', value: 'V' },
                            { label: 'E - Extranjero', value: 'E' },
                            { label: 'P - Pasaporte', value: 'P' },
                            { label: 'J - Jurídico', value: 'J' },
                            { label: 'G - Gubernamental', value: 'G' },
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">
                          Número de documento <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          value={form.documentNumber} 
                          onChange={handleChange('documentNumber')} 
                          placeholder="Ej: 12345678"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">RIF (opcional)</label>
                        <Input 
                          value={form.rif} 
                          onChange={handleChange('rif')} 
                          placeholder="Ej: V-12345678-9" 
                        />
                      </div>
                      <div>
                        <label className="text-sm mb-1.5 block font-medium">Fecha de nacimiento</label>
                        <Input 
                          type="date" 
                          value={form.fechadenacimiento} 
                          onChange={handleChange('fechadenacimiento')} 
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm mb-1.5 block font-medium">Biografía</label>
                        <Textarea 
                          value={form.bio} 
                          onChange={handleChange('bio')} 
                          placeholder="Describe tu experiencia agrícola"
                          rows={3}
                        />
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="preferencias">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Tipo de Cultivo Principal</label>
                      <Select 
                        value={form.cropType} 
                        onChange={handleChange('cropType')} 
                        placeholder="Selecciona uno" 
                        options={cropOptions.map(o => ({ label: o, value: o.toLowerCase() }))} 
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Tamaño del Terreno (ha)</label>
                      <Input 
                        type="number" 
                        step="0.1" 
                        value={form.landSize} 
                        onChange={handleChange('landSize')} 
                        placeholder="Ej: 2.5" 
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Método de Cultivo</label>
                      <Select 
                        value={form.farmingMethod} 
                        onChange={handleChange('farmingMethod')} 
                        placeholder="Selecciona uno" 
                        options={methodOptions.map(o => ({ label: o, value: o.toLowerCase() }))} 
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Sistema de Riego</label>
                      <Select 
                        value={form.irrigation} 
                        onChange={handleChange('irrigation')} 
                        placeholder="Selecciona uno" 
                        options={irrigationOptions.map(o => ({ label: o, value: o.toLowerCase() }))} 
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Experiencia Agrícola (años)</label>
                      <Input 
                        type="number" 
                        value={form.experienceYears} 
                        onChange={handleChange('experienceYears')} 
                        placeholder="Ej: 5" 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-sm mb-1.5 block font-medium">Tipos de Suelo</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {soilOptions.map((soil) => (
                          <label key={soil} className="inline-flex items-center gap-2 p-2 border rounded cursor-pointer hover:bg-muted/50">
                            <Checkbox 
                              checked={form.soilTypes.includes(soil)} 
                              onChange={() => toggleSoil(soil)} 
                            />
                            <span className="text-sm">{soil}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="ubicacion">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">País/Región de residencia</label>
                      <Input 
                        value={form.country} 
                        onChange={handleChange('country')} 
                        placeholder="País" 
                      />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Ciudad de residencia</label>
                      <Input 
                        value={form.city} 
                        onChange={handleChange('city')} 
                        placeholder="Ciudad" 
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm mb-1.5 block font-medium">Dirección de residencia</label>
                      <Input 
                        value={form.address} 
                        onChange={handleChange('address')} 
                        placeholder="Dirección" 
                      />
                      <p className="text-xs text-muted-foreground mt-1">Esta dirección corresponde a tu lugar de residencia, no a la parcela.</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm mb-1.5 block font-medium">Coordenadas GPS</label>
                      <div className="flex gap-2">
                        <Input 
                          value={form.gps} 
                          onChange={handleChange('gps')} 
                          placeholder="Latitud, Longitud" 
                          className="flex-1"
                        />
                        <Button variant="outline" onClick={getLocation} type="button">
                          <Icon name="Locate" className="w-4 h-4 mr-2" /> Obtener ubicación
                        </Button>
                      </div>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="notificaciones">
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <label className="inline-flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="CloudSun" className="w-4 h-4" />
                        <span>Alertas Climáticas</span>
                      </div>
                      <Checkbox 
                        checked={form.weatherAlerts} 
                        onChange={(e) => setForm(p => ({...p, weatherAlerts: !!e.target.checked}))} 
                      />
                    </label>

                    <label className="inline-flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="Droplets" className="w-4 h-4" />
                        <span>Recordatorios de Riego</span>
                      </div>
                      <Checkbox 
                        checked={form.irrigationReminders} 
                        onChange={(e) => setForm(p => ({...p, irrigationReminders: !!e.target.checked}))} 
                      />
                    </label>

                    <div>
                      <label className="text-sm mb-1.5 block font-medium">Consejos de Cultivo</label>
                      <Select
                        value={form.tipsFrequency}
                        onChange={handleChange('tipsFrequency')}
                        options={[
                          {label:'Diario', value:'diario'}, 
                          {label:'Semanal', value:'semanal'},
                          {label:'Mensual', value:'mensual'}
                        ]}
                      />
                    </div>

                    <label className="inline-flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Icon name="Tag" className="w-4 h-4" />
                        <span>Ofertas y Actualizaciones</span>
                      </div>
                      <Checkbox 
                        checked={form.offers} 
                        onChange={(e) => setForm(p => ({...p, offers: !!e.target.checked}))} 
                      />
                    </label>

                    <div className="md:col-span-2 border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon name="Moon" className="w-4 h-4" />
                          <p className="font-medium">Modo Oscuro</p>
                        </div>
                        <Checkbox 
                          checked={darkMode} 
                          onChange={(e) => setDarkMode(!!e.target.checked)} 
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">Activa el tema oscuro para reducir el cansancio visual.</p>
                    </div>
                  </section>
                </TabsContent>

                <TabsContent value="seguridad">
                  <section className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <p className="font-medium mb-4">Cambio de contraseña</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        <Input 
                          type="password" 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)} 
                          placeholder="Contraseña actual" 
                        />
                        <Input 
                          type="password" 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="Nueva contraseña" 
                        />
                        <Input 
                          type="password" 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="Confirmar contraseña" 
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={changePassword} 
                        disabled={changingPassword || !newPassword || !confirmPassword}
                        type="button"
                      >
                        {changingPassword ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                            Actualizando…
                          </>
                        ) : (
                          'Actualizar contraseña'
                        )}
                      </Button>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="font-medium mb-2">Autenticación de dos factores</p>
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={form.twoFactor} 
                          onChange={(e) => setForm(p => ({...p, twoFactor: !!e.target.checked}))} 
                        />
                        <span>Habilitar 2FA (Próximamente)</span>
                      </label>
                      <p className="text-xs text-muted-foreground mt-2">La autenticación de dos factores estará disponible próximamente.</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="font-medium mb-2">Dispositivos conectados</p>
                      <p className="text-sm text-muted-foreground">Mostraremos aquí tus sesiones activas. (Próximamente)</p>
                    </div>

                    <div className="border rounded-lg p-4">
                      <p className="font-medium mb-2">Historial de inicio de sesión</p>
                      <p className="text-sm text-muted-foreground">Registros recientes de accesos. (Próximamente)</p>
                    </div>
                  </section>
                </TabsContent>
              </main>
            </div>
          </Tabs>
        </div>

        {/* Pie de Página */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur border-t p-3" style={{marginLeft: collapsed ? '5rem' : '16rem'}}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <a href="#" className="underline mr-4">Políticas de Privacidad</a>
              <a href="#" className="underline">Términos de Uso</a>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={cancelChanges} type="button">
                Cancelar
              </Button>
              <Button 
                onClick={saveChanges} 
                disabled={!isValid || saving}
                type="button"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando…
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}