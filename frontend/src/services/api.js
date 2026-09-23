import axios from 'axios';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthform_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if already on login/register/landing
      if (!['/login', '/register', '/'].includes(window.location.pathname)) {
        localStorage.removeItem('healthform_token');
        localStorage.removeItem('healthform_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
