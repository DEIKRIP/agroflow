import { supabase } from '../lib/supabase';
import { 
  BUCKETS, 
  generateFilePath as configGenerateFilePath, 
  validateFile as configValidateFile,
  BucketType
} from '../config/storage';

// Definimos el tipo FileObject de Supabase
interface FileObject {
  name: string;
  id: string;
  updated_at?: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  size?: number;
  mimetype?: string;
}

// Tipos para las opciones de carga
export interface UploadOptions {
  onProgress?: (percent: number) => void;
  upsert?: boolean;
  contentType?: string;
  cacheControl?: string;
}

// Tipo para las opciones de listado
export interface ListOptions {
  limit?: number;
  offset?: number;
  sortBy?: {
    column: string;
    order: 'asc' | 'desc';
  };
}

// Definimos el tipo para los archivos listados con la propiedad path
type FileWithPath = FileObject & { path: string };

export { BUCKETS };

/**
 * Sube un archivo a Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta donde se guardará el archivo
 * @param {File} file - Archivo a subir
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Object>} Datos del archivo subido
 */
export async function uploadFile(
  bucket: BucketType, 
  path: string, 
  file: File, 
  options: UploadOptions = {}
): Promise<{ path: string }> {
  // Validar el archivo según las reglas del bucket
  const validation = configValidateFile(file, bucket);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const { onProgress, upsert = true, contentType = file.type } = options;
  
  // Configurar el manejador de progreso si se proporciona
  const uploadOptions: {
    upsert: boolean;
    contentType: string;
    cacheControl: string;
    onUploadProgress?: (progress: { loaded: number; total: number }) => void;
  } = {
    upsert,
    contentType: contentType || file.type,
    cacheControl: '3600',
  };

  if (onProgress) {
    uploadOptions.onUploadProgress = (progress: { loaded: number; total: number }) => {
      const percent = Math.round((progress.loaded / progress.total) * 100);
      onProgress(percent);
    };
  }

  // Subir el archivo
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, uploadOptions);

  if (error) {
    console.error('Error al subir archivo:', error);
    throw new Error(error.message || 'Error al subir el archivo');
  }
  
  return data;
}

/**
 * Obtiene la URL pública de un archivo
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {string} URL pública del archivo
 */
export function getPublicUrl(bucket: BucketType, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Elimina un archivo de Supabase Storage
 * @param {string} bucket - Nombre del bucket
 * @param {string|string[]} paths - Ruta o rutas de los archivos a eliminar
 * @returns {Promise<Object>} Resultado de la operación
 */
export async function deleteFile(
  bucket: BucketType, 
  paths: string | string[]
): Promise<Array<{ path: string }>> {
  // Aseguramos que paths sea un array
  const pathsArray = Array.isArray(paths) ? paths : [paths];
  
  // La API de Supabase devuelve un array de FileObject
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove(pathsArray);
    
  if (error) {
    console.error('Error al eliminar archivo:', error);
    throw new Error(error.message || 'Error al eliminar el archivo');
  }
  
  // Mapeamos los FileObject a un array de objetos con la propiedad path
  return (data || []).map((file: FileObject) => ({
    path: file.name // Usamos la propiedad 'name' como path
  }));

}

/**
 * Genera una ruta de archivo consistente
 * @param {string} entityType - Tipo de entidad (users, parcels, etc.)
 * @param {string} entityId - ID de la entidad
 * @param {string} fileName - Nombre del archivo
 * @returns {string} Ruta completa del archivo
 */
export const generateFilePath = (
  entityType: string, 
  entityId: string, 
  fileName: string
): string => {
  return configGenerateFilePath(BUCKETS.DOCUMENTS, entityType, entityId, fileName);
};

/**
 * Obtiene la URL de descarga de un archivo
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @param {number} expiresIn - Tiempo de expiración en segundos (predeterminado: 1 hora)
 * @returns {Promise<string>} URL de descarga firmada
 */
export async function getSignedUrl(
  bucket: BucketType, 
  path: string, 
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
    
  if (error) {
    console.error('Error al generar URL firmada:', error);
    throw new Error(error.message || 'Error al generar URL de descarga');
  }
  
  return data.signedUrl;
}

/**
 * Lista los archivos en un directorio
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del directorio
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Array>} Lista de archivos
 */
export async function listFiles(
  bucket: BucketType, 
  path: string = '', 
  options: ListOptions = {}
): Promise<FileWithPath[]> {
  const { 
    limit = 100, 
    offset = 0, 
    sortBy = { column: 'name', order: 'asc' as const } 
  } = options;
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path, {
      limit,
      offset,
      sortBy: sortBy as { column: string; order: 'asc' | 'desc' },
    });
    
  if (error) {
    console.error('Error al listar archivos:', error);
    throw new Error(error.message || 'Error al listar archivos');
  }
  
  // Mapeamos los datos para asegurar que tengan la propiedad path
  const files: FileWithPath[] = (data || []).map(file => ({
    ...file,
    path: path ? `${path}${path.endsWith('/') ? '' : '/'}${file.name}` : file.name
  }));
  
  return files;
}
