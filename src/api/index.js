// Platform Links APIs
export const platformLinksApi = {
  get: () => api.get('/platform-links'),
  update: (data) => api.post('/platform-links/update', data),
};
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Game APIs
export const gameApi = {
  getAll: (params) => api.get('/games', { params }),
  getFeatured: () => api.get('/games/featured'),
  getNew: () => api.get('/games/new'),
  getById: (id) => api.get(`/games/${id}`),
  getAllAdmin: () => api.get('/games/admin/all'),
  create: (data) => api.post('/games', data),
  update: (id, data) => api.put(`/games/${id}`, data),
  delete: (id) => api.delete(`/games/${id}`),
  toggleActive: (id) => api.patch(`/games/${id}/toggle-active`),
  reorder: (games) => api.patch('/games/reorder', { games }),
};

// Upload APIs (ImageKit cloud storage)
export const uploadApi = {
  uploadImage: (formData) => api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  uploadImages: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteImage: (fileId) => api.delete(`/upload/image/${fileId}`),
};

// Auth APIs
export const authApi = {
  getMe: () => api.get('/auth/me'),
  updateSuperAdmin: (data) => api.post('/auth/update-super-admin', data),
};

export default api;
