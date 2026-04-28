import { API_BASE_URL } from './config.js';
import { fetchWithAuth } from './auth.js';

let currentMember = null;

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    await loadMemberData();
    await loadUpcomingEvents();
    await loadMyOfferings();
    await loadAttendanceHistory();
    await loadStreak();
    await loadSundaySummary();
});

async function loadMemberData() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    currentMember = user;
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/members/${user.id}`);
        
        if (response.ok) {
            const member = await response.json();
            currentMember = member;
            
            document.getElementById('welcomeName').textContent = `Welcome back, ${member.first_name} ${member.last_name}!`;
            
            const joinedDate = new Date(member.joined_date);
            document.getElementById('memberSince').textContent = `Member since ${joinedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
            
            displayProfile(member);
        }
    } catch (error) {
        console.error('Error loading member:', error);
    }
}

function displayProfile(member) {
    const profileHtml = `
        <div class="profile-row">
            <div class="profile-label">Full Name</div>
            <div class="profile-value">${member.first_name} ${member.last_name}</div>
        </div>
        <div class="profile-row">
            <div class="profile-label">Email</div>
            <div class="profile-value">${member.email || 'Not provided'}</div>
        </div>
        <div class="profile-row">
            <div class="profile-label">Phone</div>
            <div class="profile-value">${member.phone || 'Not provided'}</div>
        </div>
        <div class="profile-row">
            <div class="profile-label">Address</div>
            <div class="profile-value">${member.address || 'Not provided'}</div>
        </div>
        <div class="profile-row">
            <div class="profile-label">Position</div>
            <div class="profile-value">${member.positions ? member.positions.join(', ') : 'Member'}</div>
        </div>
        <div class="profile-row">
            <div class="profile-label">Joined</div>
            <div class="profile-value">${formatDate(member.joined_date)}</div>
        </div>
    `;
    
    document.getElementById('profileInfo').innerHTML = profileHtml;
}

async function loadUpcomingEvents() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/events/upcoming`);
        
        if (response.ok) {
            const allEvents = await response.json();
            const today = new Date().toISOString().split('T')[0];
            const upcoming = allEvents
                .filter(event => event.event_date >= today && event.status !== 'Cancelled')
                .sort((a, b) => a.event_date - b.event_date)
                .slice(0, 5);
            
            if (upcoming.length === 0) {
                document.getElementById('upcomingEvents').innerHTML = '<p style="color: var(--gray);">No upcoming events</p>';
                return;
            }
            
            document.getElementById('upcomingEvents').innerHTML = upcoming.map(event => `
                <div class="event-item">
                    <div>
                        <strong>${escapeHtml(event.title)}</strong>
                        <div style="font-size: 0.8rem; color: var(--gray);">${event.location || 'Church'}</div>
                    </div>
                    <div class="event-date">${formatShortDate(event.event_date)}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('upcomingEvents').innerHTML = '<p style="color: var(--gray);">Failed to load events</p>';
    }
}

async function loadMyOfferings() {
    const memberId = currentMember?.id;
    
    if (!memberId) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/offerings/member/${memberId}`);
        
        if (response.ok) {
            const offerings = await response.json();
            
            if (offerings.length === 0) {
                document.getElementById('myOfferings').innerHTML = '<p style="color: var(--gray);">No offerings recorded yet</p>';
                return;
            }
            
            document.getElementById('myOfferings').innerHTML = offerings.slice(0, 5).map(offering => `
                <div class="offering-item">
                    <div>${offering.offering_type}</div>
                    <div class="offering-amount">₵${parseFloat(offering.amount).toFixed(2)}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading offerings:', error);
        document.getElementById('myOfferings').innerHTML = '<p style="color: var(--gray);">Failed to load offerings</p>';
    }
}

async function loadAttendanceHistory() {
    const memberId = currentMember?.id;
    
    if (!memberId) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/attendance/member/${memberId}`);
        
        if (response.ok) {
            const attendance = await response.json();
            
            if (attendance.length === 0) {
                document.getElementById('attendanceHistory').innerHTML = '<p style="color: var(--gray);">No attendance records yet</p>';
                return;
            }
            
            document.getElementById('attendanceHistory').innerHTML = attendance.slice(0, 5).map(record => `
                <div class="attendance-item">
                    <div>${formatDate(record.service_date)}</div>
                    <div class="attendance-badge ${record.attended ? 'attendance-present' : 'attendance-absent'}">
                        ${record.attended ? '✓ Present' : '✗ Absent'}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        document.getElementById('attendanceHistory').innerHTML = '<p style="color: var(--gray);">Failed to load attendance</p>';
    }
}

async function loadStreak() {
    const memberId = currentMember?.id;
    
    if (!memberId) return;
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/attendance/streak/${memberId}`);
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('streakCount').textContent = data.streak || 0;
        }
    } catch (error) {
        console.error('Error loading streak:', error);
        document.getElementById('streakCount').textContent = '0';
    }
}

async function loadSundaySummary() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/sunday-summary`);
        
        if (response.ok) {
            const summary = await response.json();
            displaySundaySummary(summary);
        } else if (response.status === 404) {
            document.getElementById('sundaySummary').innerHTML = `
                <div style="text-align: center; padding: 1rem; color: var(--gray);">
                    📭 No Sunday summary available yet
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading Sunday summary:', error);
        document.getElementById('sundaySummary').innerHTML = `
            <div style="text-align: center; padding: 1rem; color: var(--gray);">
                ❌ Failed to load summary
            </div>
        `;
    }
}

function displaySundaySummary(summary) {
    const container = document.getElementById('sundaySummary');
    
    container.innerHTML = `
        <div class="summary-field">
            <div class="summary-label">📅 Date</div>
            <div class="summary-value">${formatDate(summary.summary_date)}</div>
        </div>
        <div class="summary-sermon">
            <div class="summary-label">📖 Sermon Text</div>
            <div class="summary-sermon-text">${escapeHtml(summary.sermon_text || 'Not recorded')}</div>
        </div>
        <div class="summary-field">
            <div class="summary-label">🎯 Sermon Title</div>
            <div class="summary-value">${escapeHtml(summary.sermon_title || 'Not recorded')}</div>
        </div>
        <div class="summary-field">
            <div class="summary-label">📚 Teaching Text</div>
            <div class="summary-value">${escapeHtml(summary.teaching_text || 'Not recorded')}</div>
        </div>
        <div class="summary-field">
            <div class="summary-label">💰 Offering Total</div>
            <div class="summary-value">₵${parseFloat(summary.offering_total || 0).toFixed(2)}</div>
        </div>
        <div class="summary-field">
            <div class="summary-label">👥 Attendance</div>
            <div class="summary-value">${summary.attendance_count || 0} people</div>
        </div>
        ${summary.highlights ? `
            <div class="summary-highlights">
                <div class="summary-label">📝 Highlights</div>
                <div>${escapeHtml(summary.highlights)}</div>
            </div>
        ` : ''}
    `;
}

// Password Modal Functions
function openPasswordModal() {
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('passwordForm').reset();
    document.getElementById('passwordAlert').innerHTML = '';
}

function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
}

document.getElementById('passwordForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        showPasswordAlert('New passwords do not match', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showPasswordAlert('Password must be at least 6 characters', 'error');
        return;
    }
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/auth/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showPasswordAlert('Password changed successfully!', 'success');
            setTimeout(() => {
                closePasswordModal();
            }, 1500);
        } else {
            showPasswordAlert(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showPasswordAlert('Failed to change password', 'error');
    }
});

function showPasswordAlert(message, type) {
    const alertDiv = document.getElementById('passwordAlert');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

// Helper Functions
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('passwordModal');
    if (event.target === modal) {
        closePasswordModal();
    }
}