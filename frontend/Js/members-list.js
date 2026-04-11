let allMembers = [];
let currentMemberId = null;

// Load all members on page load
document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterMembers(e.target.value);
    });
});

// Load members from backend
async function loadMembers() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/members/`, {
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
            throw new Error('Failed to load members');
        }

        allMembers = await response.json();
        displayMembers(allMembers);

    } catch (error) {
        console.error('Error loading members:', error);
        document.getElementById('membersList').innerHTML = `
            <div class="empty-state">
                ❌ Failed to load members. Make sure backend is running.
            </div>
        `;
    }
}

// Display members in table
function displayMembers(members) {
    const container = document.getElementById('membersList');
    
    if (!members || members.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                👥 No members found. Click "Add New Member" to get started.
            </div>
        `;
        return;
    }

    const tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${members.map(member => `
                    <tr class="member-row" data-id="${member.id}">
                        <td onclick="viewMember('${member.id}')">${member.first_name} ${member.last_name}</td>
                        <td onclick="viewMember('${member.id}')">${member.email || '-'}</td>
                        <td onclick="viewMember('${member.id}')">${member.phone}</td>
                        <td onclick="viewMember('${member.id}')">${member.address || '-'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="edit-btn" onclick="editMember('${member.id}')">Edit</button>
                                <button class="delete-btn" onclick="confirmDelete('${member.id}', '${member.first_name} ${member.last_name}')">Delete</button>
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHtml;
}

// Filter members based on search input
function filterMembers(searchTerm) {
    if (!searchTerm.trim()) {
        displayMembers(allMembers);
        return;
    }

    const filtered = allMembers.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const email = (member.email || '').toLowerCase();
        const phone = member.phone;
        
        return fullName.includes(searchTerm.toLowerCase()) ||
               email.includes(searchTerm.toLowerCase()) ||
               phone.includes(searchTerm);
    });
    
    displayMembers(filtered);
}

// View member details
async function viewMember(id) {
    const token = localStorage.getItem('token');
    currentMemberId = id;
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load member details');
        }
        
        const member = await response.json();
        
        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Full Name:</div>
                <div class="detail-value">${member.first_name} ${member.last_name}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value">${member.email || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${member.phone}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Address:</div>
                <div class="detail-value">${member.address || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date of Birth:</div>
                <div class="detail-value">${member.date_of_birth || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Gender:</div>
                <div class="detail-value">${member.gender || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Marital Status:</div>
                <div class="detail-value">${member.marital_status || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Occupation:</div>
                <div class="detail-value">${member.occupation || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Emergency Contact:</div>
                <div class="detail-value">${member.emergency_contact_name || '-'} (${member.emergency_contact_phone || '-'})</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Joined Date:</div>
                <div class="detail-value">${member.joined_date || '-'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">${member.status || 'Active'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Positions:</div>
                <div class="detail-value">${member.positions ? member.positions.join(', ') : 'member'}</div>
            </div>
        `;
        
        document.getElementById('memberModal').style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading member details:', error);
        alert('Failed to load member details');
    }
}

// Edit member (redirect to edit page)
function editMember(id) {
    // For now, redirect to edit page with ID
    window.location.href = `edit-member.html?id=${id}`;
}

// Edit current member from modal
function editCurrentMember() {
    if (currentMemberId) {
        window.location.href = `edit-member.html?id=${currentMemberId}`;
    }
}

// Confirm delete
function confirmDelete(id, name) {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        deleteMember(id);
    }
}

// Delete current member from modal
function deleteCurrentMember() {
    if (currentMemberId) {
        confirmDelete(currentMemberId, 'this member');
    }
}

// Delete member
async function deleteMember(id) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/delete/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            alert('Member deleted successfully');
            closeModal();
            loadMembers(); // Refresh the list
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete member');
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member');
    }
}

// Close modal
function closeModal() {
    document.getElementById('memberModal').style.display = 'none';
    currentMemberId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('memberModal');
    if (event.target === modal) {
        closeModal();
    }
}