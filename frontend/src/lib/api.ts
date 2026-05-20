import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

// Interceptor para agregar token JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ───────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  profile: () => api.get('/auth/profile'),
};

// ─── Dashboard ──────────────────────────────────────
export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  charts: () => api.get('/dashboard/charts'),
};

// ─── Fincas ─────────────────────────────────────────
export const farmsApi = {
  list: () => api.get('/fincas'),
  get: (id: string) => api.get(`/fincas/${id}`),
  create: (data: any) => api.post('/fincas', data),
  update: (id: string, data: any) => api.put(`/fincas/${id}`, data),
  delete: (id: string) => api.delete(`/fincas/${id}`),
};

// ─── Lotes ──────────────────────────────────────────
export const plotsApi = {
  list: (fincaId?: string) => api.get('/lotes', { params: { finca_id: fincaId } }),
  get: (id: string) => api.get(`/lotes/${id}`),
  stats: (id: string) => api.get(`/lotes/${id}/stats`),
  create: (data: any) => api.post('/lotes', data),
  update: (id: string, data: any) => api.put(`/lotes/${id}`, data),
  delete: (id: string) => api.delete(`/lotes/${id}`),
};

// ─── Cultivos ───────────────────────────────────────
export const cropsApi = {
  list: () => api.get('/cultivos'),
  get: (id: string) => api.get(`/cultivos/${id}`),
  create: (data: any) => api.post('/cultivos', data),
};

// ─── Sensores ───────────────────────────────────────
export const sensorsApi = {
  list: (loteId?: string) => api.get('/sensores', { params: { lote_id: loteId } }),
  get: (id: string) => api.get(`/sensores/${id}`),
  readings: (id: string) => api.get(`/sensores/${id}/lecturas`),
  create: (data: any) => api.post('/sensores', data),
  addReading: (id: string, data: any) => api.post(`/sensores/${id}/lecturas`, data),
};

// ─── Riego ──────────────────────────────────────────
export const irrigationApi = {
  list: (loteId?: string, limit?: number) =>
    api.get('/riego', { params: { lote_id: loteId, limit } }),
  stats: (loteId: string) => api.get(`/riego/stats/${loteId}`),
  optimizations: (loteId: string) => api.get(`/riego/optimizaciones/${loteId}`),
  create: (data: any) => api.post('/riego', data),
};

// ─── Predicciones ───────────────────────────────────
export const predictionsApi = {
  list: (temporadaId?: string) =>
    api.get('/predicciones', { params: { temporada_id: temporadaId } }),
  latest: () => api.get('/predicciones/latest'),
  trigger: (temporadaId: string) =>
    api.post('/predicciones/trigger', { temporada_id: temporadaId }),
};

// ─── Reportes ───────────────────────────────────────
export const reportsApi = {
  list: () => api.get('/reportes'),
  generateOperational: (data: any) => api.post('/reportes/operacional', data),
  generateManagement: (data: any) => api.post('/reportes/gestion', data),
  downloadPdf: (id: string) =>
    api.get(`/reportes/${id}/pdf`, { responseType: 'blob' }),
};

// ─── Workflows ──────────────────────────────────────
export const workflowsApi = {
  triggerClimate: () => api.post('/workflows/climate/trigger'),
  triggerYield: () => api.post('/workflows/yield/trigger'),
};

// ─── Alertas ────────────────────────────────────────
export const alertsApi = {
  list: (leida?: boolean, loteId?: string) =>
    api.get('/alertas', { params: { leida, lote_id: loteId } }),
  unreadCount: () => api.get('/alertas/count/unread'),
  markRead: (id: string) => api.put(`/alertas/${id}/read`),
  markAllRead: () => api.put('/alertas/mark-all-read'),
};

// ─── Clima ──────────────────────────────────────────
export const climateApi = {
  byLote: (loteId: string, days?: number) =>
    api.get(`/clima/lote/${loteId}`, { params: { days } }),
  latest: (loteId: string) => api.get(`/clima/lote/${loteId}/latest`),
  summary: (loteId: string) => api.get(`/clima/lote/${loteId}/summary`),
};
