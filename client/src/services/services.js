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
};
