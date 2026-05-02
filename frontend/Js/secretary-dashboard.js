import { API_BASE_URL } from './config.js';
import { fetchWithAuth } from './auth.js';

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load stats
        await loadStats();
        
        // Load Sunday summary
        await loadSundaySummary();
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }

    // Display welcome message
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg && user.name) {
        welcomeMsg.textContent = `Welcome back, ${user.name}! ${getTimeGreeting()}`;
    }
}

// Load stats
async function loadStats() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/dashboard/stats`);
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalMembers').textContent = stats.totalMembers || 0;
            document.getElementById('totalOfferings').textContent = formatCurrency(stats.monthlyOfferings || 0);
            document.getElementById('weeklyAttendance').textContent = stats.lastSundayAttendance || 0;
        }
    } catch (error) {
        // Demo data
        document.getElementById('totalMembers').textContent = '156';
        document.getElementById('totalOfferings').textContent = '₵8,450';
        document.getElementById('weeklyAttendance').textContent = '98';
    }
}

// Load Sunday summary
async function loadSundaySummary() {
    const summaryDate = document.getElementById('summaryDate');
    
    const today = new Date();
    const lastSunday = getLastSunday(today);
    summaryDate.textContent = formatDateForDisplay(lastSunday);
    
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/sunday-summary`);
        
        if (response.ok) {
            const summary = await response.json();
            displaySummary(summary);
        } else {
            showEmptySummary();
        }
    } catch (error) {
        showEmptySummary();
    }
}
// Display Sunday summary
function displaySummary(summary) {
    const container = document.getElementById('summaryContent');
    container.innerHTML = `
        <div class="summary-content">
            <div class="summary-field">
                <label><i class="fas fa-bible"></i> Sermon Text</label>
                <p>${summary.sermon_text || 'Not recorded'}</p>
            </div>
            <div class="summary-field">
                <label><i class="fas fa-bullseye"></i> Sermon Title</label>
                <p>${summary.sermon_title || 'Not recorded'}</p>
            </div>
            <div class="summary-field">
                <label><i class="fas fa-book"></i> Teaching Text</label>
                <p>${summary.teaching_text || 'Not recorded'}</p>
            </div>
            <div class="summary-field">
                <label><i class="fas fa-hand-holding-usd"></i> Offering Total</label>
                <p>${formatCurrency(summary.offering_total || 0)}</p>
            </div>
            <div class="summary-field">
                <label><i class="fas fa-users"></i> Attendance</label>
                <p>${summary.attendance_count || 0} people</p>
            </div>
            <div class="summary-field">
                <label><i class="fas fa-pen-alt"></i> Highlights</label>
                <p>${summary.highlights || 'No notes recorded'}</p>
            </div>
        </div>
    `;
}

// Show empty summary state
function showEmptySummary() {
    const container = document.getElementById('summaryContent');
    container.innerHTML = `
        <div class="summary-content">
            <div class="summary-field">
                <p style="text-align: center; grid-column: 1/-1;">No Sunday summary recorded for this week. Click "Edit Summary" to add one.</p>
            </div>
        </div>
    `;
}

// Event listeners instead of inline onclick
const editSummaryBtn = document.querySelector('.edit-summary-btn');
const cancelBtn = document.querySelector('.cancel-btn');

if (editSummaryBtn) {
    editSummaryBtn.addEventListener('click', openSummaryModal);
}
if (cancelBtn) {
    cancelBtn.addEventListener('click', closeSummaryModal);
}

// Open modal to edit summary
function openSummaryModal() {
    const modal = document.getElementById('summaryModal');
    modal.style.display = 'flex';
    
    // Pre-fill with existing data if any
    const existingSummary = getExistingSummaryData();
    document.getElementById('sermonText').value = existingSummary.sermon_text || '';
    document.getElementById('sermonTitle').value = existingSummary.sermon_title || '';
    document.getElementById('teachingText').value = existingSummary.teaching_text || '';
    document.getElementById('offeringTotal').value = existingSummary.offering_total || '';
    document.getElementById('highlights').value = existingSummary.highlights || '';
}

// Close modal
function closeSummaryModal() {
    const modal = document.getElementById('summaryModal');
    modal.style.display = 'none';
}

// Save Sunday summary
const summaryForm = document.getElementById('summaryForm');
if (summaryForm) {
    summaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const summaryData = {
            sermon_text: document.getElementById('sermonText').value,
            sermon_title: document.getElementById('sermonTitle').value,
            teaching_text: document.getElementById('teachingText').value,
            offering_total: parseFloat(document.getElementById('offeringTotal').value) || 0,
            highlights: document.getElementById('highlights').value,
            summary_date: getLastSunday(new Date()).toISOString().split('T')[0]
        };
        
        const saveBtn = document.querySelector('.save-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/sunday-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summaryData)
            });
            
            if (response.ok) {
                alert('Sunday summary saved successfully!');
                closeSummaryModal();
                loadSundaySummary(); // Refresh display
            } else {
                const error = await response.json();
                alert(error.message || 'Error saving summary');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error saving summary. Make sure backend is running.');
            // Demo: save locally
            localStorage.setItem('lastSundaySummary', JSON.stringify(summaryData));
            displaySummary(summaryData);
            closeSummaryModal();
        } finally {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        }
    });
}

// Helper: Get last Sunday
function getLastSunday(date) {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday
    if (day !== 0) {
        result.setDate(result.getDate() - day);
    }
    return result;
}

// Helper: Format date for display
function formatDateForDisplay(date) {
    return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Helper: Get existing summary data from DOM
function getExistingSummaryData() {
    const container = document.getElementById('summaryContent');
    const fields = container.querySelectorAll('.summary-field p');
    
    if (fields.length >= 6) {
        return {
            sermon_text: fields[0]?.textContent !== 'Not recorded' ? fields[0]?.textContent : '',
            sermon_title: fields[1]?.textContent !== 'Not recorded' ? fields[1]?.textContent : '',
            teaching_text: fields[2]?.textContent !== 'Not recorded' ? fields[2]?.textContent : '',
            offering_total: parseFloat(fields[3]?.textContent?.replace(/[^0-9.-]+/g, '')) || 0,
            attendance_count: parseInt(fields[4]?.textContent) || 0,
            highlights: fields[5]?.textContent !== 'No notes recorded' ? fields[5]?.textContent : ''
        };
    }
    return {};
}

// Helper: Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
        minimumFractionDigits: 2
    }).format(amount);
}

// Helper: Get time greeting
function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning!';
    if (hour < 18) return 'Good afternoon!';
    return 'Good evening!';
}

// PWA Install Button
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'block';
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') installBtn.style.display = 'none';
            deferredPrompt = null;
        }
    });
}

// Make functions available to inline onclick handlers
window.openSummaryModal = openSummaryModal;
window.closeSummaryModal = closeSummaryModal;

// Load dashboard on page load
document.addEventListener('DOMContentLoaded', loadDashboardData);