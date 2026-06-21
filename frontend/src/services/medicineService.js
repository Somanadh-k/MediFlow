import { apiFetch } from './api';

export const medicineService = {
  getMedicines: async () => {
    const data = await apiFetch('/medicines');
    return data;
  },
  getMedicineById: async (id) => {
    const m = await apiFetch(`/medicines/${id}`);
    return m;
  },
  createMedicine: (data) => apiFetch('/medicines', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicine: (id, data) => apiFetch(`/medicines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMedicine: (id) => apiFetch(`/medicines/${id}`, { method: 'DELETE' }),
};
