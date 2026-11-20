import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Sisipkan JWT token secara otomatis ke setiap outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gotix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Format respons error terpadu
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan saat menghubungi server';
    return Promise.reject(new Error(message));
  }
);

export default api;
