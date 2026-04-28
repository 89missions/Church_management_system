import { API_BASE_URL } from './config.js';

// Handle sign in form submission
document.getElementById('signinForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    hideError();
    
    if (!role || !password || !email) {
        showError('Please fill in all fields');
        return;
    }
    
    const submitBtn = document.querySelector('.signin-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', role);
            
            redirectToDashboard(role);
        } else {
            showError(data.message || 'Invalid email, password, or role combination');
        }
    } catch (error) {
        console.error('Sign in error:', error);
        showError('Cannot connect to server. Please make sure your backend is running on port 3000');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Redirect based on role
function redirectToDashboard(role) {
    const dashboards = {
        'secretary': 'dashboard-secretary.html',
        'leadership': 'dashboard-leadership.html',
        'member': 'dashboard-member.html',
        'usher': 'dashboard-usher.html'
    };
    window.location.href = dashboards[role] || 'index.html';
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => hideError(), 5000);
    }
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) errorDiv.style.display = 'none';
}

// Refresh access token when expired
async function refreshAccessToken() {
    const refresh_token = localStorage.getItem('refresh_token');
    
    if (!refresh_token) return false;
    
    try {
        const response = await fetch(`${API_BASE_URL}/refresh/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token })
        });
        
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.access_token);
            return true;
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
    }
    
    return false;
}

// Wrapper for authenticated fetch requests
async function fetchWithAuth(url, options = {}) {
    let token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'signin.html';
        throw new Error('No token found');
    }
    
    let response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        
        if (refreshed) {
            token = localStorage.getItem('token');
            response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`
                }
            });
        } else {
            localStorage.clear();
            window.location.href = 'signin.html';
            throw new Error('Session expired. Please login again.');
        }
    }
    
    return response;
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = 'signin.html';
}

// Make logout available globally (for onclick in HTML)
window.logout = logout;

// Run auth check on protected pages
if (window.location.pathname.includes('dashboard')) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signin.html';
    }
}

// Export for use in other modules
export { fetchWithAuth, logout, refreshAccessToken };