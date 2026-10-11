const configuredApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const apiOrigin = configuredApiUrl.replace(/\/api\/?$/, '');

/** Resolves a server upload path in both Vite development and deployed environments. */
export const assetUrl = (url) => {
    if (!url) return `${apiOrigin}/uploads/events/default-event.jpg`;
    return /^https?:\/\//i.test(url) ? url : `${apiOrigin}${url}`;
};

export const DEFAULT_EVENT_IMAGE = assetUrl('/uploads/events/default-event.jpg');
