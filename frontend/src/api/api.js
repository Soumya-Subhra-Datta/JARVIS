import axios from 'axios';
import toast from 'react-hot-toast';

const baseURL = import.meta.env.VITE_API_BASE_URL;
const API_BASE = baseURL ? `${baseURL.replace(/\/+$/, '')}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jarvis_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('jarvis_token');
      localStorage.removeItem('jarvis_user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const chatApi = {
  sendMessage: (data) => api.post('/chat', data),
  getSessions: () => api.get('/chat/sessions'),
  createSession: (title) => api.post('/chat/sessions', { title }),
  getSession: (id) => api.get(`/chat/sessions/${id}`),
  updateSession: (id, data) => api.put(`/chat/sessions/${id}`, data),
  deleteSession: (id) => api.delete(`/chat/sessions/${id}`)
};

export const memoryApi = {
  getMemories: () => api.get('/memory'),
  addMemory: (data) => api.post('/memory', data),
  deleteMemory: (id) => api.delete(`/memory/${id}`),
  clearMemories: () => api.delete('/memory')
};

export const tasksApi = {
  getTasks: () => api.get('/tasks'),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`)
};

export const notesApi = {
  getNotes: (search) => api.get(`/notes${search ? `?search=${search}` : ''}`),
  createNote: (data) => api.post('/notes', data),
  updateNote: (id, data) => api.put(`/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/notes/${id}`)
};

export const filesApi = {
  uploadFile: (formData) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFiles: () => api.get('/files'),
  getFile: (id) => api.get(`/files/${id}`),
  deleteFile: (id) => api.delete(`/files/${id}`),
  askFile: (id, question) => api.post(`/files/${id}/ask`, { question })
};

export const csvApi = {
  uploadCsv: (formData) => api.post('/csv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDatasets: () => api.get('/csv'),
  getSummary: (id) => api.get(`/csv/${id}/summary`),
  askCsv: (id, question) => api.post(`/csv/${id}/ask`, { question }),
  deleteDataset: (id) => api.delete(`/csv/${id}`)
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data)
};

export const logsApi = {
  getLogs: (limit) => api.get(`/logs?limit=${limit || 50}`)
};

export default api;
