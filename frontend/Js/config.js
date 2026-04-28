const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                window.location.hostname === '';

const API_BASE_URL = isLocal 
    ? 'http://localhost:3000/api'
    : 'https://church-management-system-hj7g.onrender.com/api';

    console.log(API_BASE_URL);

export { API_BASE_URL };