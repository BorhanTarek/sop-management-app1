import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  return '/api'; // fallback to relative route for Vite dev server proxy
};

const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sop_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sop_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
