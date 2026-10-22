import axios from 'axios';

const isViteDevServer =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) &&
    window.location.port === '5173';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isViteDevServer ? '/api' : 'http://localhost:5000/api'),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token === 'undefined' || token === 'null') {
        localStorage.removeItem('token');
    } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
