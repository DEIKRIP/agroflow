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

const initialState = {
  // Perfil
  photo: null,
  idDocument: null,
  fullName: '',
  email: '',
  phone: '',
  bio: '',
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
    return true;
  }, [form.fullName, form.email]);

  const handleChange = (field) => (eOrValue) => {
    const value = eOrValue?.target ? eOrValue.target.value : eOrValue;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('La imagen no debe superar 2MB');
      return;
    }
    setForm((p) => ({ ...p, photo: file }));
  };

  const handleIdFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      toast.error('El documento no debe superar 3MB');
      return;
    }
    setForm((p) => ({ ...p, idDocument: file }));
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está soportada en este navegador');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setForm((p) => ({ ...p, gps: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, agroZone: 'Auto' }));
        toast.success('Ubicación obtenida');
      },
      () => toast.error('No se pudo obtener la ubicación'),
      { enableHighAccuracy: true, timeout: 8000 }
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
      toast.error('Por favor completa los campos obligatorios');
      return;
    }
    try {
      setSaving(true);
      // Aquí se puede integrar Supabase u otra API. Por ahora simulamos guardado.
      await new Promise((res) => setTimeout(res, 800));
      toast.success('Cambios guardados correctamente');
    } catch (e) {
      console.error(e);
      toast.error('Error al guardar cambios');
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    setForm(initialState);
    toast('Cambios descartados');
  };

  const { collapsed } = useContext(SidebarContext);

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
                  Ubicación del Terreno
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
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {form.photo ? (
                            <img
                              src={URL.createObjectURL(form.photo)}
                              alt="Foto"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon name="User" className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
                          <Button variant="outline" size="sm">
                            <Icon name="Upload" className="w-4 h-4 mr-2" /> Subir imagen
                          </Button>
                        </label>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 mt-4">
                      <p className="font-medium mb-2">Documento de identificación</p>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {form.idDocument ? (
                            <img
                              src={URL.createObjectURL(form.idDocument)}
                              alt="Documento"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon name="IdCard" className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 cursor-pointer">
                          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleIdFile} />
                          <Button variant="outline" size="sm">
                            <Icon name="Upload" className="w-4 h-4 mr-2" /> Subir documento
                          </Button>
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Acepta imagen o PDF (máx. 3MB). Se recomienda foto nítida del anverso.</p>
                    </div>
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm mb-1.5 block">Nombre completo</label>
                      <Input value={form.fullName} onChange={handleChange('fullName')} placeholder="Ej: María Pérez" />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block">Correo electrónico</label>
                      <Input type="email" value={form.email} onChange={handleChange('email')} placeholder="usuario@correo.com" />
                    </div>
                    <div>
                      <label className="text-sm mb-1.5 block">Número de teléfono</label>
                      <Input value={form.phone} onChange={handleChange('phone')} placeholder="+58 412-0000000" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm mb-1.5 block">Biografía</label>
                      <Textarea value={form.bio} onChange={handleChange('bio')} placeholder="Describe tu experiencia agrícola" />
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="preferencias">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm mb-1.5 block">Tipo de Cultivo Principal</label>
                    <Select value={form.cropType} onChange={handleChange('cropType')} placeholder="Selecciona uno" options={cropOptions.map(o => ({ label: o, value: o.toLowerCase() }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Tamaño del Terreno (ha)</label>
                    <Input value={form.landSize} onChange={handleChange('landSize')} placeholder="Ej: 2.5" />
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Método de Cultivo</label>
                    <Select value={form.farmingMethod} onChange={handleChange('farmingMethod')} placeholder="Selecciona uno" options={methodOptions.map(o => ({ label: o, value: o.toLowerCase() }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Sistema de Riego</label>
                    <Select value={form.irrigation} onChange={handleChange('irrigation')} placeholder="Selecciona uno" options={irrigationOptions.map(o => ({ label: o, value: o.toLowerCase() }))} />
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Experiencia Agrícola (años)</label>
                    <Input value={form.experienceYears} onChange={handleChange('experienceYears')} placeholder="Ej: 5" />
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="ubicacion">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm mb-1.5 block">País/Región</label>
                    <Input value={form.country} onChange={handleChange('country')} placeholder="País" />
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Ciudad</label>
                    <Input value={form.city} onChange={handleChange('city')} placeholder="Ciudad" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm mb-1.5 block">Dirección</label>
                    <Input value={form.address} onChange={handleChange('address')} placeholder="Dirección" />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm mb-1.5 block">Coordenadas GPS (opcional)</label>
                      <Input value={form.gps} onChange={handleChange('gps')} placeholder="lat, lng" />
                    </div>
                    <Button variant="outline" onClick={getLocation}>
                      <Icon name="Locate" className="w-4 h-4 mr-2" /> Obtener ubicación
                    </Button>
                  </div>
                  <div>
                    <label className="text-sm mb-1.5 block">Zona Agroclimática</label>
                    <Input value={form.agroZone} onChange={handleChange('agroZone')} placeholder="Automática" />
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm mb-2">Tipo de Suelo</p>
                    <div className="flex flex-wrap gap-3">
                      {soilOptions.map((s) => (
                        <label key={s} className="inline-flex items-center gap-2">
                          <Checkbox checked={form.soilTypes.includes(s)} onChange={() => toggleSoil(s)} />
                          <span className="text-sm">{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="notificaciones">
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="inline-flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="CloudSun" className="w-4 h-4" />
                      <span>Alertas Climáticas</span>
                    </div>
                    <Checkbox checked={form.weatherAlerts} onChange={(e)=> setForm(p=>({...p, weatherAlerts: !!e.target.checked}))} />
                  </label>

                  <label className="inline-flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="Droplets" className="w-4 h-4" />
                      <span>Recordatorios de Riego</span>
                    </div>
                    <Checkbox checked={form.irrigationReminders} onChange={(e)=> setForm(p=>({...p, irrigationReminders: !!e.target.checked}))} />
                  </label>

                  <div>
                    <label className="text-sm mb-1.5 block">Consejos de Cultivo</label>
                    <Select
                      value={form.tipsFrequency}
                      onChange={handleChange('tipsFrequency')}
                      options={[{label:'Diario', value:'diario'}, {label:'Semanal', value:'semanal'}]}
                    />
                  </div>

                  <label className="inline-flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="Tag" className="w-4 h-4" />
                      <span>Ofertas y Actualizaciones</span>
                    </div>
                    <Checkbox checked={form.offers} onChange={(e)=> setForm(p=>({...p, offers: !!e.target.checked}))} />
                  </label>

                  <div className="md:col-span-2 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon name="Moon" className="w-4 h-4" />
                        <p className="font-medium">Modo Oscuro</p>
                      </div>
                      <Checkbox checked={darkMode} onChange={(e)=> setDarkMode(!!e.target.checked)} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Activa el tema oscuro para reducir el cansancio visual.</p>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="seguridad">
                <section className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Cambio de contraseña</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input type="password" placeholder="Contraseña actual" />
                      <Input type="password" placeholder="Nueva contraseña" />
                      <Input type="password" placeholder="Confirmar contraseña" />
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={()=>toast('Funcionalidad próximamente')}>Actualizar contraseña</Button>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Autenticación de dos factores</p>
                    <label className="inline-flex items-center gap-2">
                      <Checkbox checked={form.twoFactor} onChange={(e)=> setForm(p=>({...p, twoFactor: !!e.target.checked}))} />
                      <span>Habilitar 2FA</span>
                    </label>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Dispositivos conectados</p>
                    <p className="text-sm text-muted-foreground">Mostraremos aquí tus sesiones activas. (Placeholder)</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <p className="font-medium mb-2">Historial de inicio de sesión</p>
                    <p className="text-sm text-muted-foreground">Registros recientes de accesos. (Placeholder)</p>
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
            <Button variant="ghost" onClick={cancelChanges}>Cancelar</Button>
            <Button onClick={saveChanges} disabled={!isValid || saving}>
              {saving ? 'Guardando…' : 'Guardar Cambios'}
            </Button>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
