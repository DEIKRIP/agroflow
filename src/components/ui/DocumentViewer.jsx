import React from 'react';
import { FileText, Image, File, FileArchive, FileVideo, FileAudio } from 'lucide-react';
import Button from './Button';

const getFileIcon = (fileType, size = 20) => {
  if (!fileType) return <File size={size} />;
  
  if (fileType.startsWith('image/')) {
    return <Image size={size} />;
  }
  
  if (fileType.includes('pdf')) {
    return <FileText size={size} />;
  }
  
  if (fileType.includes('zip') || fileType.includes('compressed')) {
    return <FileArchive size={size} />;
  }
  
  if (fileType.startsWith('video/')) {
    return <FileVideo size={size} />;
  }
  
  if (fileType.startsWith('audio/')) {
    return <FileAudio size={size} />;
  }
  
  return <File size={size} />;
};

const DocumentViewer = ({
  file,
  onRemove,
  className = '',
  showRemove = true,
  preview = true,
}) => {
  const { url, name, type, size } = file;
  const isImage = type?.startsWith('image/');
  const isPdf = type === 'application/pdf';
  const isVideo = type?.startsWith('video/');
  
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`border rounded-lg overflow-hidden bg-white ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100">
            {getFileIcon(type, 24)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(size)}</p>
          </div>
          {showRemove && onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-red-500 hover:text-red-600"
            >
              Eliminar
            </Button>
          )}
        </div>
      </div>
      
      {preview && (isImage || isPdf || isVideo) && (
        <div className="border-t p-4 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Vista previa:</h4>
          <div className="flex justify-center">
            {isImage && (
              <img 
                src={url} 
                alt={name} 
                className="max-h-60 max-w-full object-contain rounded"
              />
            )}
            
            {isPdf && (
              <div className="w-full h-60 border rounded bg-white flex items-center justify-center">
                <div className="text-center p-4">
                  <FileText size={48} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">Vista previa no disponible</p>
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                  >
                    Ver documento
                  </a>
                </div>
              </div>
            )}
            
            {isVideo && (
              <div className="w-full">
                <video 
                  controls 
                  className="max-h-60 max-w-full rounded"
                  src={url}
                >
                  Tu navegador no soporta la reproducción de videos.
                </video>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="border-t p-2 bg-gray-50 text-right">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:underline"
        >
          Ver completo
        </a>
      </div>
    </div>
  );
};

export default DocumentViewer;
