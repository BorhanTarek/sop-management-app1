import api from './api';

export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const userService = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const categoryService = {
  tree: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
  reorder: (items) => api.patch('/categories/reorder', { items }),
};

export const sopService = {
  list: (params) => api.get('/sops', { params }),
  get: (id) => api.get(`/sops/${id}`),
  create: (data) => api.post('/sops', data),
  update: (id, data) => api.patch(`/sops/${id}`, data),
  delete: (id) => api.delete(`/sops/${id}`),
  publish: (id) => api.post(`/sops/${id}/publish`),
  archive: (id) => api.post(`/sops/${id}/archive`),
  restore: (id) => api.post(`/sops/${id}/restore`),
  versions: (id) => api.get(`/sops/${id}/versions`),
  changelog: (id) => api.get(`/sops/${id}/changelog`),
  restoreVersion: (id, version) => api.post(`/sops/${id}/restore/${version}`),
  acknowledgeStep: (id, stepId, version) => api.post(`/sops/${id}/steps/${stepId}/acknowledge`, { version }),
};

export const stationService = {
  list: () => api.get('/stations'),
  myStations: () => api.get('/stations/my'),
  get: (id) => api.get(`/stations/${id}`),
  assignSop: (id, sopId, procedureType) => api.post(`/stations/${id}/assign-sop`, { sopId, procedureType }),
};

export const sessionService = {
  start: (stationId, procedureType) => api.post('/sessions', { stationId, procedureType }),
  get: (id) => api.get(`/sessions/${id}`),
  acknowledge: (id, data) => api.post(`/sessions/${id}/acknowledge`, data),
  complete: (id) => api.post(`/sessions/${id}/complete`),
  list: (params) => api.get('/sessions', { params }),
};

export const safetyNoticeService = {
  list: () => api.get('/safety-notices'),
  get: (id) => api.get(`/safety-notices/${id}`),
  create: (formData) => api.post('/safety-notices', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.patch(`/safety-notices/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/safety-notices/${id}`),
  acknowledge: (id) => api.post(`/safety-notices/${id}/acknowledge`),
  logs: (id) => api.get(`/safety-notices/${id}/logs`),
};

