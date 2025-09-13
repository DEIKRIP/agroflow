import { supabase } from '../lib/supabase';

// Iniciar sesión con email y contraseña
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Obtener el perfil del usuario desde user_profiles
    const profile = await getUserProfile(data.user.id);
    
    return { 
      success: true, 
      data: {
        ...data,
        profile: profile.data
      } 
    };
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    return { 
      success: false, 
      error: error.message || 'Error al iniciar sesión' 
    };
  }
};

// Registrar nuevo usuario
export const signUp = async (email, password, userData = {}) => {
  try {
    // 1) Crear usuario en auth.users (el trigger poblará user_profiles con email/full_name/role)
    const fullName = `${(userData.firstName || '').trim()} ${(userData.lastName || '').trim()}`.trim();
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: userData.phone || '' },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    // 2) Nuevo flujo: NO crear farmer aquí.
    //    El farmer se crea/actualiza cuando el usuario completa su perfil en ProfileSettings (RPC upsert_farmer).
    //    Opcionalmente podemos actualizar el full_name en user_profiles para que aparezca en la UI.
    const userId = authData.user.id;
    const { data: updatedProfile, error: updateProfileErr } = await supabase
      .from('users_profiles')
      .update({ full_name: fullName || authData.user.user_metadata?.full_name || null })
      .eq('id', userId)
      .select()
      .single();
    if (updateProfileErr) {
      console.warn('No se pudo actualizar full_name inicial en user_profiles:', updateProfileErr);
    }

    return {
      success: true,
      data: {
        user: authData.user,
        profile: updatedProfile || null,
        farmer: null
      },
      message: 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.'
    };
  } catch (error) {
    console.error('Error en el registro:', error);
    return {
      success: false,
      error: error.message || 'Error al registrar el usuario',
      details: error
    };
  }
};

// Cerrar sesión
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    return { 
      success: false, 
      error: error.message || 'Error al cerrar sesión' 
    };
  }
};

// Obtener perfil de usuario
export const getUserProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al obtener el perfil:', error);
    return { 
      success: false, 
      error: error.message || 'Error al obtener el perfil' 
    };
  }
};

// Actualizar perfil de usuario
export const updateUserProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('users_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return { 
      success: false, 
      error: error.message || 'Error al actualizar el perfil' 
    };
  }
};

// Verificar identidad contra tabla farmers
export const verifyIdentity = async ({ email, documentType, documentNumber, birthDate }) => {
  try {
    // Nuevo esquema: no hay document_type ni farmer_cedula.
    // Esta función opcional valida que exista un farmer con el email/cedula indicado.
    const normalizedEmail = (email || '').toLowerCase().trim();
    const digitsOnly = String(documentNumber || '').replace(/\D/g, '');
    const bdate = birthDate ? new Date(birthDate).toISOString().slice(0, 10) : null; // YYYY-MM-DD

    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('id, email, cedula, birth_date')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (error || !farmer) {
      return { success: false, error: 'No encontramos un productor con ese correo' };
    }

    const okNumber = !digitsOnly || (String(farmer.cedula || '').replace(/\D/g, '') === digitsOnly);
    const okBirth = !bdate || (farmer.birth_date && String(farmer.birth_date).slice(0,10) === bdate);

    if (!okNumber || !okBirth) {
      return { success: false, error: 'Los datos no coinciden con nuestros registros' };
    }

    return { success: true, data: { farmer_id: farmer.id } };
  } catch (error) {
    console.error('Error al verificar identidad:', error);
    return { success: false, error: 'No se pudo verificar la identidad' };
  }
};

// Restablecer contraseña
// Envía un correo con enlace seguro de recuperación que redirige a /reset-password
export const resetPassword = async (email) => {
  try {
    const normalizedEmail = (email || '').toLowerCase().trim();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    return { 
      success: false, 
      error: error.message || 'Error al restablecer la contraseña' 
    };
  }
};

// Verificar sesión actual
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return { 
      success: false, 
      error: error.message || 'Error al verificar la sesión' 
    };
  }
};

// Escuchar cambios en la autenticación
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Exportar todo como un objeto por defecto para compatibilidad
const authService = {
  signIn,
  signUp,
  signOut,
  getUserProfile,
  updateUserProfile,
  resetPassword,
  getSession,
  onAuthStateChange,
  verifyIdentity
};

export default authService;
