const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://church-management-system-hj7g.onrender.com/api';

let refreshInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (!token) {
        window.location.href = 'signin.html';
        return;
    }
    
    // Display leader name
    document.getElementById('leaderName').textContent = user.name || 'Leader';
    
    // Load all dashboard data
    await loadDashboardData();
    
    // Auto-refresh every 5 minutes
    refreshInterval = setInterval(loadDashboardData, 5 * 60 * 1000);
});

async function loadDashboardData() {
    try {
        await Promise.all([
            loadStats(),
            loadAttendanceTrend(),
            loadOfferingSummary(),
            loadMemberBreakdown(),
            loadUpcomingEvents()
        ]);
        
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/leadership/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalMembers').textContent = stats.totalMembers || 0;
            document.getElementById('newMembers').textContent = stats.newMembersThisMonth || 0;
            document.getElementById('totalOfferings').textContent = formatCurrency(stats.totalOfferingsThisMonth || 0);
            document.getElementById('avgAttendance').textContent = stats.avgSundayAttendance || 0;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadAttendanceTrend() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/leadership/attendance-trend`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            renderAttendanceChart(data);
        }
    } catch (error) {
        console.error('Error loading attendance trend:', error);
        document.getElementById('attendanceChart').innerHTML = '<div class="empty-state">Failed to load attendance data</div>';
    }
}

function renderAttendanceChart(data) {
    const container = document.getElementById('attendanceChart');
    
    if (!data || data.length === 0) {
        container.innerHTML = '<div class="empty-state">No attendance data available</div>';
        return;
    }
    
    // Find max attendance for scaling
    const maxAttendance = Math.max(...data.map(d => d.count), 1);
    
    container.innerHTML = `
        <div class="bar-chart">
            ${data.map(item => {
                const height = (item.count / maxAttendance) * 200;
                return `
                    <div class="bar-item">
                        <div class="bar-value">${item.count}</div>
                        <div class="bar" style="height: ${height}px; min-height: 10px;"></div>
                        <div class="bar-label">${item.week}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

async function loadOfferingSummary() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/leadership/offering-summary`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const offerings = await response.json();
            renderOfferingSummary(offerings);
        }
    } catch (error) {
        console.error('Error loading offering summary:', error);
        document.getElementById('offeringSummary').innerHTML = '<div class="empty-state">Failed to load offering data</div>';
    }
}

function renderOfferingSummary(offerings) {
    const container = document.getElementById('offeringSummary');
    
    if (!offerings || offerings.length === 0) {
        container.innerHTML = '<div class="empty-state">No offering records this month</div>';
        return;
    }
    
    container.innerHTML = offerings.map(offering => `
        <div class="offering-item">
            <span class="offering-type">${offering.type}</span>
            <span class="offering-amount">${formatCurrency(offering.amount)}</span>
        </div>
    `).join('');
}

async function loadMemberBreakdown() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/leadership/member-breakdown`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const breakdown = await response.json();
            renderMemberBreakdown(breakdown);
        }
    } catch (error) {
        console.error('Error loading member breakdown:', error);
        document.getElementById('memberBreakdown').innerHTML = '<div class="empty-state">Failed to load member data</div>';
    }
}

function renderMemberBreakdown(breakdown) {
    const container = document.getElementById('memberBreakdown');
    
    container.innerHTML = `
        <div class="breakdown-grid">
            <div class="breakdown-item">
                <div class="breakdown-number">${breakdown.active || 0}</div>
                <div class="breakdown-label">✅ Active Members</div>
            </div>
            <div class="breakdown-item">
                <div class="breakdown-number">${breakdown.inactive || 0}</div>
                <div class="breakdown-label">❌ Inactive Members</div>
            </div>
            <div class="breakdown-item">
                <div class="breakdown-number">${breakdown.male || 0}</div>
                <div class="breakdown-label">👨 Male</div>
            </div>
            <div class="breakdown-item">
                <div class="breakdown-number">${breakdown.female || 0}</div>
                <div class="breakdown-label">👩 Female</div>
            </div>
        </div>
    `;
}

async function loadUpcomingEvents() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/events/upcoming?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const events = await response.json();
            renderUpcomingEvents(events);
        }
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('upcomingEvents').innerHTML = '<div class="empty-state">Failed to load events</div>';
    }
}

function renderUpcomingEvents(events) {
    const container = document.getElementById('upcomingEvents');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<div class="empty-state">No upcoming events scheduled</div>';
        return;
    }
    
    container.innerHTML = events.map(event => `
        <div class="event-item">
            <div>
                <div class="event-title">${escapeHtml(event.title)}</div>
                <div class="event-date">${event.location || 'Church'}</div>
            </div>
            <div class="event-date">${formatShortDate(event.event_date)}</div>
        </div>
    `).join('');
}

async function refreshDashboard() {
    // Show refreshing indicator
    const refreshBtn = document.querySelector('.refresh-btn');
    const originalText = refreshBtn.textContent;
    refreshBtn.textContent = 'Refreshing...';
    refreshBtn.disabled = true;
    
    await loadDashboardData();
    
    refreshBtn.textContent = originalText;
    refreshBtn.disabled = false;
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastUpdated').textContent = timeString;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2
    }).format(amount);
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

// Cleanup interval on page unload
window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});