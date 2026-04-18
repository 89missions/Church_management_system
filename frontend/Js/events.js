let currentEventId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
});

// Load all events
async function loadEvents() {
    const token = localStorage.getItem('token');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/events`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'signin.html';
            return;
        }

        if (!response.ok) throw new Error('Failed to load events');

        const events = await response.json();
        displayEvents(events);

    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsList').innerHTML = `
            <div class="empty-state">
                ❌ Failed to load events.
            </div>
        `;
    }
}

// Display events
function displayEvents(events) {
    const container = document.getElementById('eventsList');
    
    if (!events || events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                📅 No events scheduled. Click "Create New Event" to get started.
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="events-grid">
            ${events.map(event => `
                <div class="event-card">
                    <span class="event-status status-${event.status?.toLowerCase()}">${event.status || 'Scheduled'}</span>
                    <div class="event-title">${escapeHtml(event.title)}</div>
                    <div class="event-datetime">
                        📅 ${formatDate(event.event_date)}
                        ${event.start_time ? ` ⏰ ${event.start_time.slice(0,5)}` : ''}
                    </div>
                    ${event.location ? `
                        <div class="event-location">
                            📍 ${escapeHtml(event.location)}
                        </div>
                    ` : ''}
                    ${event.description ? `
                        <div class="event-description">
                            ${escapeHtml(event.description.substring(0, 100))}${event.description.length > 100 ? '...' : ''}
                        </div>
                    ` : ''}
                    <div class="event-attendees">
                        👥 ${event.attendee_count || 0} / ${event.max_attendees || '∞'} attending
                    </div>
                    <div class="event-actions">
                        <button class="edit-event" onclick="openEventModal('${event.id}')">✏️ Edit</button>
                        <button class="delete-event" onclick="deleteEvent('${event.id}')">🗑️ Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Open modal for add/edit
async function openEventModal(id = null) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    form.reset();
    
    if (id) {
        currentEventId = id;
        document.getElementById('modalTitle').textContent = 'Edit Event';
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`${API_BASE_URL}/events/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.ok) {
                const event = await response.json();
                document.getElementById('eventId').value = event.id;
                document.getElementById('eventTitle').value = event.title;
                document.getElementById('eventDescription').value = event.description || '';
                document.getElementById('eventDate').value = event.event_date;
                document.getElementById('startTime').value = event.start_time?.slice(0,5) || '';
                document.getElementById('endTime').value = event.end_time?.slice(0,5) || '';
                document.getElementById('eventLocation').value = event.location || '';
                document.getElementById('maxAttendees').value = event.max_attendees || '';
                document.getElementById('eventStatus').value = event.status || 'Scheduled';
            }
        } catch (error) {
            console.error('Error fetching event:', error);
        }
    } else {
        currentEventId = null;
        document.getElementById('modalTitle').textContent = 'Create New Event';
        document.getElementById('eventId').value = '';
        document.getElementById('eventDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('eventStatus').value = 'Scheduled';
    }
    
    modal.style.display = 'flex';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
    currentEventId = null;
}

// Save event
document.getElementById('eventForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const eventId = document.getElementById('eventId').value;
    
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const eventData = {
        title: document.getElementById('eventTitle').value,
        description: document.getElementById('eventDescription').value,
        event_date: document.getElementById('eventDate').value,
        start_time: document.getElementById('startTime').value || null,
        end_time: document.getElementById('endTime').value || null,
        location: document.getElementById('eventLocation').value,
        status: document.getElementById('eventStatus').value,
        created_by: user.id || null
    };
    
    const url = eventId ? `${API_BASE_URL}/events/${eventId}` : `${API_BASE_URL}/events`;
    const method = eventId ? 'PUT' : 'POST';
    
    const saveBtn = document.querySelector('.save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            closeEventModal();
            loadEvents();
        } else {
            const error = await response.json();
            alert(error.message || 'Error saving event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to save event');
    } finally {
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
    }
});

// Delete event
async function deleteEvent(id) {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            loadEvents();
        } else {
            const error = await response.json();
            alert(error.message || 'Failed to delete event');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete event');
    }
}

// View RSVP list
async function viewRsvp(eventId) {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/${eventId}/rsvp`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to load RSVPs');
        
        const attendees = await response.json();
        
        const modal = document.getElementById('rsvpModal');
        const container = document.getElementById('rsvpList');
        
        if (attendees.length === 0) {
            container.innerHTML = '<p style="color: var(--gray);">No attendees yet.</p>';
        } else {
            container.innerHTML = `
                <ul style="list-style: none; padding: 0;">
                    ${attendees.map(attendee => `
                        <li style="padding: 0.75rem 0; border-bottom: 1px solid #e5e7eb;">
                            <strong>${attendee.member_name || attendee.name || 'Unknown'}</strong><br>
                            <small>Status: ${attendee.status || 'Confirmed'}</small>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        modal.style.display = 'flex';
        
    } catch (error) {
        console.error('Error loading RSVPs:', error);
        alert('Failed to load attendees');
    }
}

function closeRsvpModal() {
    document.getElementById('rsvpModal').style.display = 'none';
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.onclick = function(event) {
    const eventModal = document.getElementById('eventModal');
    const rsvpModal = document.getElementById('rsvpModal');
    if (event.target === eventModal) closeEventModal();
    if (event.target === rsvpModal) closeRsvpModal();
}