import { apiFetch } from './api';

export const agentService = {
  getDecisions: () => apiFetch('/agents/decisions'),
  approveDecision: (id) => apiFetch(`/agents/decisions/${id}/approve`, { method: 'PUT' }),
  getDemandForecasts: () => apiFetch('/agents/forecasts'),
};
