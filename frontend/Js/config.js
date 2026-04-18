const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal 
    ? 'http://localhost:3000/api'           // Local development
    : 'https://church-management-system-hj7g.onrender.com/api';  // Production