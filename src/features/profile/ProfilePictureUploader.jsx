import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import FileUploader from '../ui/FileUploader';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { toast } from '../ui/use-toast';

const ProfilePictureUploader = () => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (userProfile?.avatar_url) {
      setAvatarUrl(userProfile.avatar_url);
    } else if (user?.email) {
      // Mostrar inicial con la primera letra del email
      setAvatarUrl(`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email[0])}&background=random`);
    }
  }, [user, userProfile]);

  const handleFileUploaded = async (fileUrl) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Actualizar el perfil del usuario con la nueva URL del avatar
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: fileUrl })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Actualizar el contexto de autenticación
      await refreshUserProfile();
      
      toast({
        title: "¡Perfecto!",
        description: "Tu foto de perfil se ha actualizado correctamente.",
      });
      
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la foto de perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={avatarUrl} alt={user?.email?.[0] || 'U'} />
          <AvatarFallback>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="text-lg font-medium">Foto de perfil</h3>
          <p className="text-sm text-muted-foreground">
            Sube una imagen cuadrada para tu perfil.
          </p>
        </div>
      </div>
      
      <FileUploader
        entityType="users"
        entityId={user?.id}
        onFileUploaded={handleFileUploaded}
        accept="image/*"
        maxSizeMB={2}
        buttonText="Cambiar foto"
        buttonVariant="outline"
        disabled={isLoading}
      />
    </div>
  );
};

export default ProfilePictureUploader;
