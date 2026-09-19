// Configuration for API endpoints
// If VITE_API_URL is set (e.g. in production), use it.
// Otherwise, default to empty string which means relative paths (proxied in dev).

export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const getApiUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path.replace(/#/g, '%23');
    }
    // Ensure path starts with / if not present
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // Encode '#' as '%23' so browsers do not treat it as a URL fragment identifier
    return `${API_BASE_URL}${normalizedPath.replace(/#/g, '%23')}`;
};
