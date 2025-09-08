// hooks/useCreateInspection.js
// TanStack Query mutation to create an inspection via our Netlify API
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/api/inspections', payload),
    onSuccess: (data, variables) => {
      // Invalidate general inspections list and this parcel's data
      qc.invalidateQueries({ queryKey: ['inspections'] });
      if (variables?.parcel_id) {
        qc.invalidateQueries({ queryKey: ['parcels', variables.parcel_id] });
      }
    },
    onError: (err) => {
      // Optionally handle globally in caller
      // err.message contains a user-friendly error string
    }
  });
}
