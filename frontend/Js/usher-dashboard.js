import { API_BASE_URL } from "./config.js";

let allMembers = [];
let pendingAttendance = []; // { member_id, first_name, last_name, phone, attended }
let searchTimeout = null;

// Get today's date
const today = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    // Set service date
    document.getElementById('serviceDate').textContent = `Sunday, ${formatDateLong(today)}`;
    
    // Display usher name
    document.getElementById('usherName').textContent = user.name || 'Usher';
    
    // Load all members for searching
    await loadAllMembers();
    
    // Load any existing attendance for today (if already saved)
    await loadExistingAttendance();
    
    // Setup search listener
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', handleSearch);
});

async function loadAllMembers() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/members`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allMembers = await response.json();
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function loadExistingAttendance() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/today?service_type=Sunday`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const existing = await response.json();
            
            // Convert existing attendance to pending format
            existing.forEach(record => {
                if (!pendingAttendance.find(p => p.member_id === record.member_id)) {
                    pendingAttendance.push({
                        member_id: record.member_id,
                        first_name: record.first_name,
                        last_name: record.last_name,
                        phone: record.phone,
                        attended: record.attended
                    });
                }
            });
            
            renderPendingList();
            updateStats();
        }
    } catch (error) {
        console.error('Error loading existing attendance:', error);
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        performSearch(searchTerm);
    }, 300);
}

function performSearch(searchTerm) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '<div class="empty-state">Type at least 2 characters to search...</div>';
        return;
    }
    
    const filtered = allMembers.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const phone = member.phone;
        return fullName.includes(searchTerm) || phone.includes(searchTerm);
    }).slice(0, 10);
    
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state">No members found</div>';
        return;
    }
    
    resultsDiv.innerHTML = filtered.map(member => {
        const alreadyMarked = pendingAttendance.find(p => p.member_id === member.id);
        return `
            <div class="search-result-item">
                <div class="member-info">
                    <div class="member-name">${member.first_name} ${member.last_name}</div>
                    <div class="member-phone">${member.phone}</div>
                </div>
                <div class="action-buttons">
                    <button class="present-btn" onclick="markAttendance('${member.id}', '${member.first_name}', '${member.last_name}', '${member.phone}', true)" ${alreadyMarked ? 'disabled' : ''}>
                        ✅ Present
                    </button>
                    <button class="absent-btn" onclick="markAttendance('${member.id}', '${member.first_name}', '${member.last_name}', '${member.phone}', false)" ${alreadyMarked ? 'disabled' : ''}>
                        ❌ Absent
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function markAttendance(memberId, firstName, lastName, phone, attended) {
    // Check if already marked
    const alreadyMarked = pendingAttendance.find(p => p.member_id === memberId);
    if (alreadyMarked) {
        showAlert(`${firstName} ${lastName} is already marked`, 'error');
        return;
    }
    
    // Add to pending list
    pendingAttendance.push({
        member_id: memberId,
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        attended: attended
    });
    
    // Clear search input and results
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').innerHTML = '<div class="empty-state">Start typing to search members...</div>';
    
    // Update UI
    renderPendingList();
    updateStats();
    
    showAlert(`${firstName} ${lastName} marked as ${attended ? 'Present' : 'Absent'}`, 'success');
}

function removeFromPending(memberId, firstName, lastName) {
    pendingAttendance = pendingAttendance.filter(p => p.member_id !== memberId);
    renderPendingList();
    updateStats();
    showAlert(`${firstName} ${lastName} removed from list`, 'success');
}

function updateAttendanceStatus(memberId, attended) {
    const member = pendingAttendance.find(p => p.member_id === memberId);
    if (member) {
        member.attended = attended;
        renderPendingList();
        updateStats();
    }
}

function renderPendingList() {
    const container = document.getElementById('pendingList');
    const countSpan = document.getElementById('pendingListCount');
    
    countSpan.textContent = pendingAttendance.length;
    
    if (pendingAttendance.length === 0) {
        container.innerHTML = '<div class="empty-state">No members marked yet</div>';
        return;
    }
    
    container.innerHTML = pendingAttendance.map(member => `
        <div class="pending-item">
            <div>
                <strong>${member.first_name} ${member.last_name}</strong>
                <div style="font-size: 0.8rem; color: var(--gray);">${member.phone}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <select onchange="updateAttendanceStatus('${member.member_id}', this.value === 'true')" style="padding: 0.3rem; border-radius: 6px;">
                    <option value="true" ${member.attended ? 'selected' : ''}>✅ Present</option>
                    <option value="false" ${!member.attended ? 'selected' : ''}>❌ Absent</option>
                </select>
                <button class="remove-btn" onclick="removeFromPending('${member.member_id}', '${member.first_name}', '${member.last_name}')">✖</button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    const present = pendingAttendance.filter(m => m.attended === true).length;
    const absent = pendingAttendance.filter(m => m.attended === false).length;
    const pending = pendingAttendance.length;
    
    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('pendingCount').textContent = pending;
}

async function saveAllAttendance() {
    if (pendingAttendance.length === 0) {
        showAlert('No attendance records to save', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    const saveBtn = document.getElementById('saveAllBtn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    const records = pendingAttendance.map(member => ({
        member_id: member.member_id,
        attended: member.attended
    }));
    
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                service_date: today,
                service_type: 'Sunday',
                records: records
            })
        });
        
        if (response.ok) {
            showAlert(`Successfully saved ${pendingAttendance.length} attendance records!`, 'success');
            pendingAttendance = [];
            renderPendingList();
            updateStats();
            
            // Clear search input and results
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').innerHTML = '<div class="empty-state">Start typing to search members...</div>';
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to save attendance', 'error');
        }
    } catch (error) {
        console.error('Error saving attendance:', error);
        showAlert('Failed to save attendance. Check your connection.', 'error');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

const logoutbtn = document.querySelector('.logout-btn')

logoutbtn.addEventListener('click',()=>{
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    window.location.href = 'signin.html';
})