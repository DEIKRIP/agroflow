import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStorage } from '../hooks/useStorage';
import Button from './ui/Button';
import { Icon } from './AppIcon';
import DocumentViewer from './ui/DocumentViewer';

export const MultiFileUploader = ({
  entityType,
  entityId,
  maxFiles = 5,
  maxSizeMB = 10,
  accept = {
    'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  onFilesUploaded = () => {},
  onFileRemoved = () => {},
  existingFiles = [],
  className = '',
}) => {
  const [files, setFiles] = useState(existingFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const { upload, remove: removeFile } = useStorage();

  const onDrop = useCallback(
    async (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles && rejectedFiles.length > 0) {
        // Manejar archivos rechazados
        console.warn('Algunos archivos fueron rechazados:', rejectedFiles);
        return;
      }

      if (acceptedFiles.length === 0) return;

      const uploadPromises = [];
      const newFiles = [];

      acceptedFiles.forEach((file) => {
        const fileId = `${file.name}-${file.size}-${file.lastModified}`;
        
        uploadPromises.push(
          upload(
            entityType,
            entityId,
            file,
            {
              onProgress: (progress) => {
                setUploadProgress((prev) => ({
                  ...prev,
                  [fileId]: progress,
                }));
              },
              onComplete: (fileData) => {
                setFiles((prev) => [...prev, fileData]);
                onFilesUploaded([...files, fileData]);
              },
              onError: (error) => {
                console.error('Error al subir el archivo:', error);
              },
            }
          )
        );

        newFiles.push({
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          progress: 0,
          status: 'uploading',
        });
      });

      setFiles((prev) => [...prev, ...newFiles]);
      setIsUploading(true);

      try {
        await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Error al subir archivos:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress({});
      }
    },
    [entityType, entityId, files, onFilesUploaded, upload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeMB * 1024 * 1024,
    maxFiles,
    disabled: isUploading || files.length >= maxFiles,
  });

  const handleRemove = async (fileId, filePath) => {
    try {
      // Si el archivo se está subiendo actualmente, no hacemos nada
      if (uploadProgress[fileId] !== undefined && uploadProgress[fileId] < 100) {
        return;
      }

      // Si el archivo ya está en el servidor, lo eliminamos
      if (filePath) {
        await removeFile(filePath);
      }

      // Actualizamos el estado local
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      
      // Notificamos al componente padre
      onFileRemoved(fileId);
    } catch (error) {
      console.error('Error al eliminar el archivo:', error);
    }
  };

  const isDisabled = isUploading || files.length >= maxFiles;

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Icon
            name={isDragActive ? 'UploadCloud' : 'Upload'}
            className={`mx-auto h-10 w-10 ${
              isDragActive ? 'text-blue-500' : 'text-gray-400'
            }`}
          />
          <p className="text-sm text-gray-600">
            {isDragActive
              ? 'Suelta los archivos aquí...'
              : `Arrastra y suelta archivos aquí, o haz clic para seleccionar`}
          </p>
          <p className="text-xs text-gray-500">
            {`Máximo ${maxFiles} archivos, ${maxSizeMB}MB cada uno. Formatos: JPG, PNG, PDF, DOC, DOCX`}
          </p>
          {files.length > 0 && (
            <p className="text-xs text-gray-500">
              {`${files.length} de ${maxFiles} archivos seleccionados`}
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Archivos seleccionados:</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <DocumentViewer
                key={file.id}
                file={{
                  ...file,
                  url: file.url || URL.createObjectURL(file),
                }}
                onRemove={() => handleRemove(file.id, file.path)}
                showRemove={!isUploading}
                preview
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiFileUploader;
