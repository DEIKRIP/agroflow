import React, { useState, useRef } from 'react';
import { uploadFile, getPublicUrl, generateFilePath } from '../../services/storageService';
import Button from './Button';
import { Icon } from '../AppIcon';

const FileUploader = ({
  entityType,
  entityId,
  onFileUploaded,
  onError,
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  className = '',
  preview = true,
  buttonText = 'Subir archivo',
  buttonVariant = 'outline',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`El archivo no debe superar los ${maxSizeMB}MB`);
      return;
    }

    // Validar tipo
    const fileType = file.type;
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const validDocTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (![...validImageTypes, ...validDocTypes].includes(fileType)) {
      setError('Tipo de archivo no soportado');
      return;
    }

    try {
      setIsUploading(true);
      setError('');

      // Generar ruta del archivo
      const filePath = generateFilePath(entityType, entityId, file.name);
      
      // Subir archivo
      await uploadFile('documents', filePath, file);
      
      // Obtener URL pública
      const fileUrl = getPublicUrl('documents', filePath);
      
      // Mostrar vista previa si es imagen
      if (validImageTypes.includes(fileType)) {
        setFilePreview(fileUrl);
      }
      
      // Notificar al componente padre
      onFileUploaded?.(fileUrl, file);
      
    } catch (err) {
      console.error('Error al subir archivo:', err);
      setError('Error al subir el archivo. Inténtalo de nuevo.');
      onError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={isUploading}
      />
      
      <Button
        type="button"
        onClick={triggerFileInput}
        variant={buttonVariant}
        disabled={isUploading}
        className="flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <Icon name="Loader" className="animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Icon name="Upload" />
            {buttonText}
          </>
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {preview && filePreview && (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground mb-2">Vista previa:</p>
          <div className="border rounded-lg p-2 max-w-xs">
            {filePreview.endsWith('.pdf') ? (
              <div className="flex items-center gap-2 text-blue-500">
                <Icon name="FileText" size={24} />
                <span>Documento PDF</span>
              </div>
            ) : filePreview.match(/\.(docx?)$/i) ? (
              <div className="flex items-center gap-2 text-blue-500">
                <Icon name="FileText" size={24} />
                <span>Documento Word</span>
              </div>
            ) : (
              <img 
                src={filePreview} 
                alt="Vista previa" 
                className="max-h-40 w-auto rounded" 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
