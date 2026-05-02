import { API_BASE_URL } from './config.js';
import { fetchWithAuth } from './auth.js';

let allMembers = [];
let currentMemberId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterMembers(e.target.value);
    });
});
const MEMBERS_PER_PAGE = 15;
let currentPage = 1;
let totalPages = 1;

async function loadMembers(page = 1) {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/members/?page=${page}&limit=${MEMBERS_PER_PAGE}`);

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'signin.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to load members');

        const data = await response.json();
        allMembers = data.members;
        currentPage = data.pagination.currentPage;
        totalPages = data.pagination.totalPages;

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

    container.innerHTML = `
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
        <div class="pagination">
            <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>
        </div>
    `;
}

function changePage(page) {
    if (page < 1 || page > totalPages) return;
    loadMembers(page);
}

window.changePage = changePage;
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

async function viewMember(id) {
    currentMemberId = id;
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/members/${id}`);
        
        if (!response.ok) throw new Error('Failed to load member details');
        
        const member = await response.json();
        
        document.getElementById('modalBody').innerHTML = `
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

function editMember(id) {
    window.location.href = `edit-member.html?id=${id}`;
}

function editCurrentMember() {
    if (currentMemberId) {
        window.location.href = `edit-member.html?id=${currentMemberId}`;
    }
}

function confirmDelete(id, name) {
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
        deleteMember(id);
    }
}

function deleteCurrentMember() {
    if (currentMemberId) {
        confirmDelete(currentMemberId, 'this member');
    }
}

async function deleteMember(id) {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/members/delete/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            alert('Member deleted successfully');
            closeModal();
            loadMembers();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete member');
        }
    } catch (error) {
        console.error('Error deleting member:', error);
        alert('Failed to delete member');
    }
}

function closeModal() {
    document.getElementById('memberModal').style.display = 'none';
    currentMemberId = null;
}

window.onclick = function(event) {
    const modal = document.getElementById('memberModal');
    if (event.target === modal) closeModal();
}

window.viewMember = viewMember;
window.editMember = editMember;
window.editCurrentMember = editCurrentMember;
window.confirmDelete = confirmDelete;
window.deleteCurrentMember = deleteCurrentMember;
window.closeModal = closeModal;