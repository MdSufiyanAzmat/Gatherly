import axios from 'axios';

const isViteDevServer =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) &&
    window.location.port === '5173';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || (isViteDevServer ? '/api' : 'http://localhost:5000/api'),
    // Authentication is stored in an HTTP-only cookie, so JavaScript never has
    // to read or persist the JWT.
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    // Older versions stored `undefined` here because the API intentionally
    // returns the token only as a cookie. Sending that value made every
    // optional-auth request fail with "Token failed".
    if (token === 'undefined' || token === 'null') {
        localStorage.removeItem('token');
    } else if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
