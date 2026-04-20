import { API_BASE_URL } from './config.js';

document.getElementById('addMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Collect form data
    const memberData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        email: document.getElementById('email').value || null,
        phone: document.getElementById('phone').value,
        date_of_birth: document.getElementById('dob').value || null,
        gender: document.getElementById('gender').value || null,
        address: document.getElementById('address').value || null,
        marital_status: document.getElementById('maritalStatus').value || null,
        occupation: document.getElementById('occupation').value || null,
        emergency_contact_name: document.getElementById('emergencyName').value || null,
        emergency_contact_phone: document.getElementById('emergencyPhone').value || null,
        positions: getSelectedPositions()
    };

    console.log(memberData)
    
    // Validate required fields
    if (!memberData.first_name || !memberData.last_name || !memberData.phone) {
        showAlert('Please fill in all required fields (*)', 'error');
        return;
    }
    
    // Validate phone number (basic)
    if (!memberData.phone.match(/^\d{10,}$/)) {
        showAlert('Please enter a valid phone number (minimum 10 digits)', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_BASE_URL}/members/addmember`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(memberData)
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Show default password
            document.getElementById('defaultPassword').textContent = data.default_password;
            document.getElementById('passwordResult').classList.add('show');
            showAlert('Member registered successfully!', 'success');
            document.getElementById('addMemberForm').reset();
            
            // Auto-hide password result after 30 seconds
            setTimeout(() => {
                document.getElementById('passwordResult').classList.remove('show');
            }, 30000);
        } else {
            showAlert(data.message || 'Error registering member', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Cannot connect to server. Make sure backend is running on port 3000', 'error');
        
        // DEMO MODE: Show mock password for testing
        const mockPassword = generateDefaultPassword(memberData.first_name, memberData.phone);
        document.getElementById('defaultPassword').textContent = mockPassword;
        document.getElementById('passwordResult').classList.add('show');
        showAlert('DEMO MODE: Member registered locally. Connect backend for production.', 'success');
        document.getElementById('addMemberForm').reset();
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Get selected positions from multi-select
function getSelectedPositions() {
    const select = document.getElementById('positions');
    const selected = [];
    for (let option of select.options) {
        if (option.selected) {
            selected.push(option.value);
        }
    }
    // Always ensure 'member' is included if no positions or if member not selected
    if (selected.length === 0 || !selected.includes('member')) {
        selected.unshift('member');
    }
    return selected;
}

/*
function generateDefaultPassword(firstName, phone) {
    const churchCode = 'WC';
    const last4 = phone.slice(-4);
    const randomNum = Math.floor(Math.random() * 100);
    return `${churchCode}${last4}${randomNum}`;
}
*/

// Copy password to clipboard
function copyPassword() {
    const password = document.getElementById('defaultPassword').textContent;
    navigator.clipboard.writeText(password);
    const copyBtn = document.querySelector('.copy-btn');
    const originalText = copyBtn.textContent;
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
        copyBtn.textContent = originalText;
    }, 2000);
}

// Show alert message
function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 5000);
}