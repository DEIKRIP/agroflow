# Sistema de Gestión de Archivos con Supabase Storage

Este documento explica cómo utilizar el sistema de gestión de archivos integrado con Supabase Storage en la aplicación SiembraPais.

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Configuración](#configuración)
3. [Componentes Principales](#componentes-principales)
   - [FileUploader](#fileuploader)
   - [MultiFileUploader](#multifileuploader)
   - [DocumentViewer](#documentviewer)
4. [Servicios](#servicios)
   - [storageService](#storageservice)
   - [useStorage](#usestorage-hook)
5. [Ejemplos de Uso](#ejemplos-de-uso)
6. [Mejores Prácticas](#mejores-prácticas)
7. [Solución de Problemas](#solución-de-problemas)

## Introducción

El sistema de gestión de archivos está diseñado para manejar la subida, descarga y visualización de archivos de manera segura y eficiente utilizando Supabase Storage. Incluye componentes React reutilizables y hooks personalizados para facilitar la integración en cualquier parte de la aplicación.

## Configuración

### Variables de Entorno

Asegúrate de tener configuradas las siguientes variables de entorno en tu archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Buckets de Almacenamiento

El sistema utiliza los siguientes buckets predeterminados:

- `documents`: Para documentos generales (PDF, Word, etc.)
- `images`: Para imágenes (perfiles, fotos, etc.)
- `media`: Para archivos multimedia (videos, audio)
- `temp`: Para archivos temporales

## Componentes Principales

### FileUploader

Componente para subir un solo archivo.

**Props:**
- `entityType`: Tipo de entidad (ej: 'users', 'parcels')
- `entityId`: ID de la entidad
- `onFileUploaded`: Callback que se ejecuta cuando se sube un archivo
- `accept`: Tipos de archivo aceptados (por defecto: imágenes, PDF, Word)
- `maxSizeMB`: Tamaño máximo en MB (por defecto: 5MB)
- `preview`: Mostrar vista previa (por defecto: true)

**Ejemplo de uso:**

```jsx
import FileUploader from '@/components/ui/FileUploader';

function ProfilePictureUpload() {
  const { user } = useAuth();
  
  const handleFileUploaded = async (fileUrl) => {
    // Actualizar el perfil del usuario con la nueva URL de la imagen
    await updateUserProfile(user.id, { avatar_url: fileUrl });
  };

  return (
    <FileUploader
      entityType="users"
      entityId={user.id}
      onFileUploaded={handleFileUploaded}
      accept="image/*"
      maxSizeMB={2}
    />
  );
}
```

### MultiFileUploader

Componente para subir múltiples archivos con vista previa y arrastrar/soltar.

**Props:**
- `entityType`: Tipo de entidad
- `entityId`: ID de la entidad
- `maxFiles`: Número máximo de archivos (por defecto: 5)
- `maxSizeMB`: Tamaño máximo por archivo (por defecto: 10MB)
- `onFilesUploaded`: Callback cuando se suben archivos
- `onFileRemoved`: Callback cuando se elimina un archivo
- `existingFiles`: Array de archivos existentes para mostrar

**Ejemplo de uso:**

```jsx
import { MultiFileUploader } from '@/components/MultiFileUploader';

function ParcelDocuments({ parcelId }) {
  const [documents, setDocuments] = useState([]);
  
  const handleFilesUploaded = (newFiles) => {
    setDocuments([...documents, ...newFiles]);
  };
  
  const handleFileRemoved = (fileId) => {
    setDocuments(documents.filter(doc => doc.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <h3>Documentos de la Parcela</h3>
      <MultiFileUploader
        entityType="parcels"
        entityId={parcelId}
        maxFiles={10}
        maxSizeMB={5}
        onFilesUploaded={handleFilesUploaded}
        onFileRemoved={handleFileRemoved}
        existingFiles={documents}
      />
    </div>
  );
}
```

### DocumentViewer

Componente para visualizar diferentes tipos de archivos con un diseño consistente.

**Props:**
- `file`: Objeto con la información del archivo
- `onRemove`: Función para manejar la eliminación del archivo
- `preview`: Mostrar vista previa (por defecto: true)
- `showRemove`: Mostrar botón de eliminar (por defecto: true)

**Ejemplo de uso:**

```jsx
import DocumentViewer from '@/components/ui/DocumentViewer';

function DocumentList({ documents, onRemoveDocument }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentViewer
          key={doc.id}
          file={doc}
          onRemove={() => onRemoveDocument(doc.id)}
          preview
        />
      ))}
    </div>
  );
}
```

## Servicios

### storageService

Servicio principal para interactuar con Supabase Storage.

**Métodos principales:**

- `uploadFile(bucket, path, file, options)`: Sube un archivo
- `getPublicUrl(bucket, path)`: Obtiene la URL pública de un archivo
- `deleteFile(bucket, paths)`: Elimina uno o más archivos
- `getSignedUrl(bucket, path, expiresIn)`: Genera una URL firmada
- `listFiles(bucket, path, options)`: Lista archivos en un directorio

### useStorage Hook

Hook personalizado para manejar la subida de archivos con estado y retroalimentación.

**Ejemplo de uso:**

```jsx
import { useStorage } from '@/hooks/useStorage';

function FileUploadComponent() {
  const { upload, isUploading, progress, error } = useStorage('documents');
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const result = await upload(
        'users', 
        'user-123', 
        file,
        {
          onProgress: (percent) => console.log(`Progreso: ${percent}%`),
          onComplete: (fileData) => console.log('Archivo subido:', fileData),
          onError: (error) => console.error('Error:', error)
        }
      );
      
      console.log('Resultado:', result);
    } catch (err) {
      console.error('Error al subir el archivo:', err);
    }
  };
  
  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      {isUploading && <progress value={progress} max="100" />}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

## Ejemplos de Uso

### Subir una imagen de perfil

```jsx
import { useStorage } from '@/hooks/useStorage';
import { BUCKETS } from '@/services/storageService';

function ProfilePictureUpload({ userId }) {
  const { upload, isUploading } = useStorage(BUCKETS.IMAGES);
  
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const path = `users/${userId}/profile.${file.name.split('.').pop()}`;
      const { url } = await upload(path, file);
      
      // Actualizar el perfil del usuario con la nueva URL de la imagen
      await updateUserProfile(userId, { avatar_url: url });
      
      toast.success('Foto de perfil actualizada correctamente');
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast.error('No se pudo actualizar la foto de perfil');
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*" 
        disabled={isUploading}
      />
      {isUploading && <p>Subiendo imagen...</p>}
    </div>
  );
}
```

### Subir múltiples documentos para una parcela

```jsx
import { MultiFileUploader } from '@/components/MultiFileUploader';
import { BUCKETS } from '@/services/storageService';

function ParcelDocuments({ parcelId }) {
  const [documents, setDocuments] = useState([]);
  
  const handleFilesUploaded = async (newFiles) => {
    try {
      // Guardar referencias en la base de datos
      const { error } = await supabase
        .from('parcel_documents')
        .insert(
          newFiles.map(file => ({
            parcel_id: parcelId,
            file_url: file.url,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
          }))
        );
      
      if (error) throw error;
      
      // Actualizar estado local
      setDocuments(prev => [...prev, ...newFiles]);
      toast.success('Documentos subidos correctamente');
    } catch (error) {
      console.error('Error al guardar documentos:', error);
      toast.error('Error al guardar los documentos');
    }
  };
  
  const handleFileRemoved = async (fileId) => {
    try {
      const fileToRemove = documents.find(doc => doc.id === fileId);
      if (!fileToRemove) return;
      
      // Eliminar de la base de datos
      const { error } = await supabase
        .from('parcel_documents')
        .delete()
        .eq('file_url', fileToRemove.url);
      
      if (error) throw error;
      
      // Eliminar del almacenamiento
      await deleteFile(BUCKETS.DOCUMENTS, fileToRemove.path);
      
      // Actualizar estado local
      setDocuments(docs => docs.filter(doc => doc.id !== fileId));
      toast.success('Documento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar documento:', error);
      toast.error('No se pudo eliminar el documento');
    }
  };

  return (
    <div className="space-y-4">
      <h3>Documentos de la Parcela</h3>
      <MultiFileUploader
        entityType="parcels"
        entityId={parcelId}
        maxFiles={10}
        maxSizeMB={5}
        onFilesUploaded={handleFilesUploaded}
        onFileRemoved={handleFileRemoved}
        existingFiles={documents}
      />
    </div>
  );
}
```

## Mejores Prácticas

1. **Validar archivos en el frontend**: Siempre valida el tipo y tamaño del archivo antes de subirlo.

2. **Usar nombres de archivo únicos**: Genera nombres de archivo únicos para evitar colisiones.

3. **Manejar errores**: Implementa manejo de errores adecuado para todas las operaciones de almacenamiento.

4. **Optimizar imágenes**: Considera redimensionar o comprimir imágenes antes de subirlas.

5. **Usar URLs firmadas para contenido privado**: Para archivos privados, genera URLs firmadas con tiempo de expiración.

6. **Limitar permisos**: Configura políticas de seguridad en Supabase para restringir el acceso a los archivos.

## Solución de Problemas

### Error: "Bucket not found"
Asegúrate de que el bucket existe en tu proyecto de Supabase y que el nombre esté escrito correctamente.

### Error: "Storage quota exceeded"
Tu proyecto de Supabase ha alcanzado el límite de almacenamiento. Considera actualizar tu plan o eliminar archivos innecesarios.

### Error: "Invalid file type"
El tipo de archivo que estás intentando subir no está permitido. Verifica los tipos de archivo aceptados en la configuración.

### Los archivos no se muestran correctamente
Asegúrate de que las URLs de los archivos sean accesibles y que las políticas de CORS estén configuradas correctamente en Supabase.

---

Este documento proporciona una visión general del sistema de gestión de archivos. Para obtener más información, consulta la documentación oficial de [Supabase Storage](https://supabase.com/docs/guides/storage).
