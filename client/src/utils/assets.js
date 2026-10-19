const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const apiOrigin = configuredApiUrl.replace(/\/api\/?$/, '');

export const assetUrl = (url) => {
    if (!url) return `${apiOrigin}/uploads/events/default-event.jpg`;
    return /^https?:\/\//i.test(url) ? url : `${apiOrigin}${url}`;
};

export const DEFAULT_EVENT_IMAGE = assetUrl('/uploads/events/default-event.jpg');
