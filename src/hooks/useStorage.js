import { useState } from 'react';
import { uploadFile, getPublicUrl, deleteFile, generateFilePath } from '../services/storageService';

export const useStorage = (bucket = 'documents') => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const upload = async (entityType, entityId, file, options = {}) => {
    const {
      onProgress,
      onComplete,
      onError,
      customPath,
      metadata = {}
    } = options;

    setIsUploading(true);
    setError(null);
    setProgress(0);

    try {
      // Generar ruta del archivo
      const filePath = customPath || generateFilePath(entityType, entityId, file.name);
      
      // Subir archivo
      const { data, error: uploadError } = await uploadFile(
        bucket,
        filePath,
        file,
        {
          cacheControl: '3600',
          upsert: true,
          ...metadata,
        },
        (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          setProgress(percent);
          onProgress?.(percent);
        }
      );

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const publicUrl = getPublicUrl(bucket, filePath);
      
      onComplete?.({
        path: filePath,
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      });

      return {
        success: true,
        data: {
          path: filePath,
          url: publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        },
      };
    } catch (err) {
      console.error('Error en useStorage.upload:', err);
      setError(err.message || 'Error al subir el archivo');
      onError?.(err);
      return {
        success: false,
        error: err.message || 'Error al subir el archivo',
      };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const remove = async (filePath, options = {}) => {
    const { onComplete, onError } = options;
    
    try {
      await deleteFile(bucket, filePath);
      onComplete?.();
      return { success: true };
    } catch (err) {
      console.error('Error en useStorage.remove:', err);
      setError(err.message || 'Error al eliminar el archivo');
      onError?.(err);
      return {
        success: false,
        error: err.message || 'Error al eliminar el archivo',
      };
    }
  };

  const getUrl = (path) => {
    return getPublicUrl(bucket, path);
  };

  return {
    upload,
    remove,
    getUrl,
    isUploading,
    progress,
    error,
    resetError: () => setError(null),
  };
};

export default useStorage;
