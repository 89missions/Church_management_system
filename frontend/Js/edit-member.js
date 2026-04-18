// Get member ID from URL


const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (!memberId) {
        showAlert('No member ID provided', 'error');
        document.getElementById('loadingMessage').style.display = 'none';
        return;
    }
    
    loadMemberData();
});

async function loadMemberData() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'signin.html';
            return;
        }
        
        if (!response.ok) {
            throw new Error('Failed to load member data');
        }
        
        const member = await response.json();
        populateForm(member);
        
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('editMemberForm').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading member:', error);
        document.getElementById('loadingMessage').innerHTML = '❌ Failed to load member data. Please try again.';
        showAlert('Error loading member data', 'error');
    }
}

function populateForm(member) {
    document.getElementById('memberId').value = member.id;
    document.getElementById('firstName').value = member.first_name || '';
    document.getElementById('lastName').value = member.last_name || '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('phone').value = member.phone || '';
    document.getElementById('dob').value = member.date_of_birth || '';
    document.getElementById('gender').value = member.gender || '';
    document.getElementById('address').value = member.address || '';
    document.getElementById('maritalStatus').value = member.marital_status || '';
    document.getElementById('occupation').value = member.occupation || '';
    document.getElementById('emergencyName').value = member.emergency_contact_name || '';
    document.getElementById('emergencyPhone').value = member.emergency_contact_phone || '';
    document.getElementById('status').value = member.status || 'Active';
    
    // Handle positions (multi-select)
    const positionsSelect = document.getElementById('positions');
    const userPositions = member.positions || ['member'];
    
    for (let option of positionsSelect.options) {
        if (userPositions.includes(option.value)) {
            option.selected = true;
        }
    }
}

document.getElementById('editMemberForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    
    // Get selected positions
    const positionsSelect = document.getElementById('positions');
    const selectedPositions = Array.from(positionsSelect.selectedOptions).map(opt => opt.value);
    
    // Always include 'member' if no positions selected
    if (selectedPositions.length === 0 || !selectedPositions.includes('member')) {
        selectedPositions.unshift('member');
    }
    
    const memberData = {
        first_name: document.getElementById('firstName').value.trim(),
        last_name: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim() || null,
        phone: document.getElementById('phone').value.trim(),
        date_of_birth: document.getElementById('dob').value || null,
        gender: document.getElementById('gender').value || null,
        address: document.getElementById('address').value.trim() || null,
        marital_status: document.getElementById('maritalStatus').value || null,
        occupation: document.getElementById('occupation').value.trim() || null,
        emergency_contact_name: document.getElementById('emergencyName').value.trim() || null,
        emergency_contact_phone: document.getElementById('emergencyPhone').value.trim() || null,
        status: document.getElementById('status').value,
        positions: selectedPositions
    };
    
    // Validate required fields
    if (!memberData.first_name || !memberData.last_name || !memberData.phone) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Updating...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(memberData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showAlert('Member updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = 'members-list.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Error updating member', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to update member. Make sure backend is running.', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}