import { supabase, auth } from '../lib/supabase';

// Iniciar sesión con email y contraseña
export const signIn = async (email, password) => {
  try {
    const { data, error } = await auth.signInWithPassword({
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
    const { data: authData, error: signUpError } = await auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone: userData.phone || '' },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    const userId = authData.user.id;
    const normalizedEmail = (email || '').toLowerCase().trim();

    // 2) Crear/agregar registro en farmers con identidad básica
    //    Nota: en este esquema farmers usa "cedula" como PK y guarda email.
    //    Si ya existe un farmer con esa cédula, lo actualizamos y mantenemos consistencia de email/nombre.
    const farmerPayload = {
      cedula: String(userData.documentNumber || '').trim(),
      nombre_completo: fullName || (authData.user.user_metadata?.full_name || '').trim() || normalizedEmail,
      rif: userData.rif || null,
      email: normalizedEmail,
      telefono: userData.phone || null,
      document_type: userData.documentType || null,
      birth_date: userData.birthDate || null,
      created_by: userId
    };

    // Upsert farmer (si ya existe por cédula, se actualiza)
    const { data: farmerData, error: farmerError } = await supabase
      .from('farmers')
      .upsert([farmerPayload], { onConflict: 'cedula' })
      .select()
      .single();
    if (farmerError) {
      // rollback del usuario si falla el farmer
      console.error('Error al crear/actualizar farmer, intentando revertir usuario auth:', farmerError);
      throw new Error('Error al registrar datos del agricultor');
    }

    // 3) Enlazar user_profiles con farmers mediante farmer_cedula y actualizar full_name si procede
    const { data: updatedProfile, error: linkError } = await supabase
      .from('user_profiles')
      .update({ farmer_cedula: farmerData.cedula, full_name: fullName || undefined })
      .eq('id', userId)
      .select()
      .single();
    if (linkError) {
      console.warn('No se pudo vincular user_profile con farmer:', linkError);
    }

    return {
      success: true,
      data: {
        user: authData.user,
        profile: updatedProfile || null,
        farmer: farmerData
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
    const { error } = await auth.signOut();
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
      .from('user_profiles')
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
      .from('user_profiles')
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
    const normalizedEmail = (email || '').toLowerCase().trim();
    const docType = (documentType || '').toUpperCase().trim();
    const docNum = String(documentNumber || '').trim();
    const bdate = birthDate ? new Date(birthDate).toISOString().slice(0, 10) : null; // YYYY-MM-DD

    // Buscar farmer por email
    const { data: farmer, error } = await supabase
      .from('farmers')
      .select('cedula, email, document_type, birth_date')
      .eq('email', normalizedEmail)
      .single();

    if (error || !farmer) {
      return { success: false, error: 'No encontramos un usuario con ese correo' };
    }

    const okType = String(farmer.document_type || '').toUpperCase().trim() === docType;
    const okNumber = String(farmer.cedula || '').trim() === docNum;
    const okBirth = !bdate || (farmer.birth_date && String(farmer.birth_date).slice(0,10) === bdate);

    if (!okType || !okNumber || !okBirth) {
      return { success: false, error: 'Los datos no coinciden con nuestros registros' };
    }

    return { success: true, data: { cedula: farmer.cedula } };
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
    const { error } = await auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
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
    const { data, error } = await auth.getSession();
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
  return auth.onAuthStateChange(callback);
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
