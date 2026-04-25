import { API_BASE_URL } from "./config.js";

let searchTimeout = null;
let currentPage = 1;
let totalMarkedPages = 1;
const ITEMS_PER_PAGE = 20;

const today = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    document.getElementById('serviceDate').textContent = `Sunday, ${formatDateLong(today)}`;
    document.getElementById('usherName').textContent = user.name || 'Usher';
    
    await loadTotalMembersCount();
    await loadMarkedToday(1);
    
    setupEventListeners();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            window.location.href = 'signin.html';
        });
    }
}

async function loadTotalMembersCount() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/count`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalMembers').textContent = data.count || 0;
        }
    } catch (error) {
        console.error('Error loading total members:', error);
    }
}

async function loadMarkedToday(page) {
    const token = localStorage.getItem('token');
    currentPage = page;
    
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/today?page=${page}&limit=${ITEMS_PER_PAGE}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderMarkedList(data.records);
            renderPagination(data.total, data.page, data.totalPages);
            document.getElementById('presentCount').textContent = data.total;
            document.getElementById('totalMarkedBadge').textContent = data.total;
        }
    } catch (error) {
        console.error('Error loading marked today:', error);
        document.getElementById('markedList').innerHTML = '<div class="empty-state">Failed to load marked members</div>';
    }
}

function renderMarkedList(records) {
    const container = document.getElementById('markedList');
    
    if (!records || records.length === 0) {
        container.innerHTML = '<div class="empty-state">No members marked today yet</div>';
        return;
    }
    
    container.innerHTML = records.map(record => `
        <div class="marked-item">
            <div>
                <div class="member-name">${record.first_name} ${record.last_name}</div>
                <div class="member-phone">${record.phone}</div>
            </div>
            <div class="marked-time">${formatTime(record.marked_at)}</div>
        </div>
    `).join('');
}

function renderPagination(total, currentPage, totalPages) {
    const container = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let buttons = '';
    
    // Previous button
    buttons += `<button class="page-btn" onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            buttons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            buttons += `<span style="padding: 0.3rem 0.5rem;">...</span>`;
        }
    }
    
    // Next button
    buttons += `<button class="page-btn" onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    
    container.innerHTML = buttons;
}

window.goToPage = function(page) {
    if (page < 1) return;
    loadMarkedToday(page);
};

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        performSearch(searchTerm);
    }, 300);
}

async function performSearch(searchTerm) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '<div class="empty-state">Type at least 2 characters to search...</div>';
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/search?q=${encodeURIComponent(searchTerm)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const members = await response.json();
            displaySearchResults(members, searchTerm);
        }
    } catch (error) {
        console.error('Error searching members:', error);
        resultsDiv.innerHTML = '<div class="empty-state">Search failed. Try again.</div>';
    }
}

function displaySearchResults(members, searchTerm) {
    const resultsDiv = document.getElementById('searchResults');
    
    if (members.length === 0) {
        resultsDiv.innerHTML = '<div class="empty-state">No members found matching your search</div>';
        return;
    }
    
    resultsDiv.innerHTML = members.map(member => `
        <div class="search-result-item" data-member-id="${member.id}">
            <div class="member-info">
                <div class="member-name">${member.first_name} ${member.last_name}</div>
                <div class="member-phone">${member.phone}</div>
            </div>
            <button class="mark-btn" data-member-id="${member.id}" data-first-name="${member.first_name}" data-last-name="${member.last_name}" data-phone="${member.phone}">
                ✅ Mark Present
            </button>
        </div>
    `).join('');
    
    // Attach event listeners to mark buttons
    const markButtons = document.querySelectorAll('.mark-btn');
    markButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const memberId = btn.dataset.memberId;
            const firstName = btn.dataset.firstName;
            const lastName = btn.dataset.lastName;
            const phone = btn.dataset.phone;
            markAttendance(memberId, firstName, lastName, phone);
        });
    });
}

async function markAttendance(memberId, firstName, lastName, phone) {
    const token = localStorage.getItem('token');
    const markBtn = document.querySelector(`.mark-btn[data-member-id="${memberId}"]`);
    
    if (markBtn) {
        markBtn.disabled = true;
        markBtn.textContent = 'Marking...';
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/attendance/mark`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                member_id: memberId,
                service_date: today
            })
        });
        
        if (response.ok) {
            showAlert(`${firstName} ${lastName} marked as present!`, 'success');
            
            // Clear search
            document.getElementById('searchInput').value = '';
            document.getElementById('searchResults').innerHTML = '<div class="empty-state">Start typing to search members...</div>';
            
            // Reload marked list
            await loadMarkedToday(1);
        } else {
            const error = await response.json();
            showAlert(error.message || 'Failed to mark attendance', 'error');
            if (markBtn) {
                markBtn.disabled = false;
                markBtn.textContent = '✅ Mark Present';
            }
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        showAlert('Failed to mark attendance. Check your connection.', 'error');
        if (markBtn) {
            markBtn.disabled = false;
            markBtn.textContent = '✅ Mark Present';
        }
    }
}

function formatDateLong(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}