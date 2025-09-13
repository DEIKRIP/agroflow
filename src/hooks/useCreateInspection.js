// hooks/useCreateInspection.js
// TanStack Query mutation to create an inspection via our Netlify API
import { useMutation, useQueryClient } from '@tanstack/react-query';
import inspectionService from '../utils/inspectionService';

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      // Map UI payload to DB shape if needed
      const createPayload = {
        parcel_id: payload.parcel_id,
        priority: payload.priority || 'media',
        metadata: payload.metadata || {},
        status: 'pendiente',
      };
      const res = await inspectionService.createInspection(createPayload);
      if (!res.success) {
        const err = new Error(res.error || 'No se pudo crear la inspección');
        throw err;
      }
      return res.data;
    },
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
