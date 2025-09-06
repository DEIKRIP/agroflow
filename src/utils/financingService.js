import { supabase } from '../lib/supabase';

/**
 * Obtiene todos los créditos con información relacionada
 * @param {Object} filters - Filtros opcionales para la consulta
 * @returns {Promise<{data: Array, error: string}>}
 */
const getCredits = async (filters = {}) => {
  try {
    let query = supabase
      .from('credits')
      .select(`
        *,
        farmer:farmer_id (*),
        parcel:parcel_id (*)
      `)
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.farmer_id) {
      query = query.eq('farmer_id', filters.farmer_id);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Obtiene un crédito por su ID
 * @param {string} creditId - ID del crédito
 * @returns {Promise<{data: Object, error: string}>}
 */
const getCreditById = async (creditId) => {
  try {
    const { data, error } = await supabase
      .from('credits')
      .select(`
        *,
        farmer:farmer_id (*),
        parcel:parcel_id (*),
        payments (*)
      `)
      .eq('id', creditId)
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching credit by ID:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Crea un nuevo crédito
 * @param {Object} creditData - Datos del crédito a crear
 * @returns {Promise<{data: Object, error: string}>}
 */
const createCredit = async (creditData) => {
  try {
    const { data, error } = await supabase
      .from('credits')
      .insert([creditData])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error creating credit:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Actualiza un crédito existente
 * @param {string} creditId - ID del crédito a actualizar
 * @param {Object} updates - Campos a actualizar
 * @returns {Promise<{data: Object, error: string}>}
 */
const updateCredit = async (creditId, updates) => {
  try {
    const { data, error } = await supabase
      .from('credits')
      .update(updates)
      .eq('id', creditId)
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error updating credit:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Elimina un crédito
 * @param {string} creditId - ID del crédito a eliminar
 * @returns {Promise<{data: Object, error: string}>}
 */
const deleteCredit = async (creditId) => {
  try {
    const { data, error } = await supabase
      .from('credits')
      .delete()
      .eq('id', creditId);

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error deleting credit:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Obtiene los pagos de un crédito
 * @param {string} creditId - ID del crédito
 * @returns {Promise<{data: Array, error: string}>}
 */
const getCreditPayments = async (creditId) => {
  try {
    const { data, error } = await supabase
      .from('credit_payments')
      .select('*')
      .eq('credit_id', creditId)
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching credit payments:', error);
    return { data: null, error: error.message };
  }
};

/**
 * Registra un pago de crédito
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<{data: Object, error: string}>}
 */
const recordPayment = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('credit_payments')
      .insert([paymentData])
      .select()
      .single();

    if (error) throw error;
    
    return { data, error: null };
  } catch (error) {
    console.error('Error recording payment:', error);
    return { data: null, error: error.message };
  }
};

export default {
  getCredits,
  getCreditById,
  createCredit,
  updateCredit,
  deleteCredit,
  getCreditPayments,
  recordPayment
};
