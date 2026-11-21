import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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

// Penanganan respon error dan global 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tangani 401 Unauthorized secara global: hapus token dan arahkan ke login
    if (error.response?.status === 401) {
      localStorage.removeItem('gotix_token');
      localStorage.removeItem('gotix_user');
      // Jika bukan di halaman auth, arahkan ke login
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/masuk') &&
        !window.location.pathname.startsWith('/daftar')
      ) {
        window.location.href = `/masuk?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }

    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan saat menghubungi server';

    return Promise.reject(new Error(message));
  }
);

export default api;
