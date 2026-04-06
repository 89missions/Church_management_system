// Authentication handling
const API_BASE_URL = 'http://localhost:3000/api';

// Handle sign in form submission
document.getElementById('signinForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    // Clear previous error
    hideError();
    
    // Validate role is selected
    if (!role ||!password ||!email) {
        showError('Please select your role');
        return;
    }
    
    // Show loading state
    const submitBtn = document.querySelector('.signin-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email, 
                password, 
                role 
            })
        });
     console.log(role)
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Store user data
            localStorage.setItem('token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('role', role);
            
            // Redirect based on role
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
    switch(role) {
        case 'secretary':
            window.location.href = 'dashboard-secretary.html';
            break;
        case 'leadership':
            window.location.href = 'dashboard-leadership.html';
            break;
        case 'member':
            window.location.href = 'dashboard-member.html';
            break;
        case 'usher':
            window.location.href = 'dashboard-usher.html';
            break;
        default:
            window.location.href = 'index.html';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideError();
        }, 5000);
    }
}

// Hide error message
function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = 'signin.html';
}

// Run auth check on protected pages
if (window.location.pathname.includes('dashboard')) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'signin.html';
    }
}