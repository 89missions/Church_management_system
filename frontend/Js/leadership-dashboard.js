import { API_BASE_URL } from "./config.js";
import { fetchWithAuth } from './auth.js';

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
            loadUpcomingEvents(),
            loadSundaySummary()
        ]);
        
        updateLastUpdated();
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function loadStats() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/leadership/stats`);
        
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
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/leadership/attendance-trend`);
        
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
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/leadership/offering-summary`);
        
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
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/leadership/member-breakdown`);
        
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
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/events/upcoming?limit=5`);
        
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

async function loadSundaySummary() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/sunday-summary/latest`);
        
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
            <div class="summary-value">${formatCurrency(summary.offering_total || 0)}</div>
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

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

async function refreshDashboard() {
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

window.addEventListener('beforeunload', () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
});