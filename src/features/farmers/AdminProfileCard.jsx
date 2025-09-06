import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import FarmerCard from './components/FarmerCard';

const AdminProfileCard = () => {
  const [user, setUser] = useState(null);
  const [farmer, setFarmer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndFarmer = async () => {
      // 1. Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 2. Buscar agricultor/perfil por UID
        const { data, error } = await supabase
          .from('agricultores')
          .select('*')
          .eq('user_id', user.id)
          .single();
        setFarmer(data);
      }
      setLoading(false);
    };
    fetchUserAndFarmer();
  }, []);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <div>Debes iniciar sesión para ver tu perfil.</div>;
  if (!farmer) return <div>No tienes perfil de agricultor registrado.</div>;

  return (
    <div className="flex justify-center mt-10">
      <FarmerCard farmer={farmer} onViewDetails={() => {}} />
    </div>
  );
};

export default AdminProfileCard;
