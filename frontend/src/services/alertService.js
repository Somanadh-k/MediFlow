import { apiFetch } from './api';

export const alertService = {
  getAlerts: () => apiFetch('/alerts'),
};
