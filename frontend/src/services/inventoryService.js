import { apiFetch } from './api';

export const inventoryService = {
  getLowStock: async () => {
    const data = await apiFetch('/inventory/low-stock');
    return data;
  },
  getOutOfStock: async () => {
    const data = await apiFetch('/inventory/out-of-stock');
    return data;
  },
  getQuarantine: () => apiFetch('/inventory/quarantine'),
};
