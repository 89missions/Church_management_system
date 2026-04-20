import { API_BASE_URL } from './config.js';

let allMembers = [];
let offerings = [];

document.addEventListener('DOMContentLoaded', () => {
    loadMembers();
    loadOfferings();
    setupDateDefaults();
    setupEventListeners();
});

function setupDateDefaults() {
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('offeringDate')) {
        document.getElementById('offeringDate').value = today;
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('memberSearch');
    if (searchInput) {
        searchInput.addEventListener('input', handleMemberSearch);
    }

    document.getElementById('filterSearch')?.addEventListener('input', filterOfferings);
    document.getElementById('filterType')?.addEventListener('change', filterOfferings);
    
    // Date filter listeners
    document.getElementById('startDate')?.addEventListener('change', filterByDateRange);
    document.getElementById('endDate')?.addEventListener('change', filterByDateRange);
    document.getElementById('clearFilter')?.addEventListener('click', clearDateFilter);
}

async function loadMembers() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/members/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            allMembers = await response.json();
        }
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

async function loadOfferings() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/offerings`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            localStorage.clear();
            window.location.href = 'signin.html';
            return;
        }
        
        if (response.ok) {
            offerings = await response.json();
            displayOfferings(offerings);
        }
        
        await loadTodayTotal();
        await loadMonthlyTotal();
        
    } catch (error) {
        console.error('Error loading offerings:', error);
        document.getElementById('offeringsList').innerHTML = `
            <div class="empty-state">Failed to load offerings</div>
        `;
    }
}

async function loadTodayTotal() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/offerings/today`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalToday').textContent = `₵${data.total.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading today total:', error);
    }
}

async function loadMonthlyTotal() {
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/offerings/monthly`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalThisMonth').textContent = `₵${data.total.toFixed(2)}`;
        }
    } catch (error) {
        console.error('Error loading monthly total:', error);
    }
}

async function filterByDateRange() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (!startDate || !endDate) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/offerings/date-range?startDate=${startDate}&endDate=${endDate}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const filtered = await response.json();
            displayOfferings(filtered);
        }
    } catch (error) {
        console.error('Error filtering by date:', error);
        showAlert('Error filtering offerings', 'error');
    }
}

function clearDateFilter() {
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    displayOfferings(offerings);
}

function handleMemberSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const resultsDiv = document.getElementById('searchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    const filtered = allMembers.filter(member => {
        const fullName = `${member.first_name} ${member.last_name}`.toLowerCase();
        const phone = member.phone;
        return fullName.includes(searchTerm) || phone.includes(searchTerm);
    }).slice(0, 5);
    
    if (filtered.length === 0) {
        resultsDiv.style.display = 'none';
        return;
    }
    
    resultsDiv.innerHTML = filtered.map(member => `
        <div class="search-result-item" onclick="selectMember('${member.id}', '${member.first_name} ${member.last_name}')">
            <strong>${member.first_name} ${member.last_name}</strong><br>
            <small>${member.phone} | ${member.email || ''}</small>
        </div>
    `).join('');
    
    resultsDiv.style.display = 'block';
}

function selectMember(id, name) {
    document.getElementById('selectedMemberId').value = id;
    document.getElementById('selectedMemberName').textContent = name;
    document.getElementById('selectedMemberDisplay').style.display = 'block';
    document.getElementById('memberSearch').value = '';
    document.getElementById('searchResults').style.display = 'none';
}

function clearSelectedMember() {
    document.getElementById('selectedMemberId').value = '';
    document.getElementById('selectedMemberDisplay').style.display = 'none';
    document.getElementById('memberSearch').value = '';
}

async function recordOffering() {
    const memberId = document.getElementById('selectedMemberId').value;
    const offeringType = document.getElementById('offeringType').value;
    const amount = document.getElementById('amount').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const referenceNumber = document.getElementById('referenceNumber').value;
    const offeringDate = document.getElementById('offeringDate').value;
    const notes = document.getElementById('notes').value;
    
    if (!memberId) {
        showAlert('Please select a member', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showAlert('Please enter a valid amount', 'error');
        return;
    }
    
    const token = localStorage.getItem('token');
    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Recording...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/offerings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                member_id: memberId,
                offering_type: offeringType,
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                reference_number: referenceNumber || null,
                offering_date: offeringDate,
                notes: notes || null
            })
        });
        
        if (response.ok) {
            showAlert('Offering recorded successfully!', 'success');
            
            clearSelectedMember();
            document.getElementById('offeringType').value = 'Tithe';
            document.getElementById('amount').value = '';
            document.getElementById('paymentMethod').value = 'Cash';
            document.getElementById('referenceNumber').value = '';
            document.getElementById('notes').value = '';
            document.getElementById('offeringDate').value = new Date().toISOString().split('T')[0];
            
            await loadOfferings();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Error recording offering', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Failed to record offering', 'error');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function displayOfferings(offeringsList) {
    const container = document.getElementById('offeringsList');
    
    if (!offeringsList || offeringsList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">No offerings recorded yet</div>
        `;
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Method</th>
                </tr>
            </thead>
            <tbody>
                ${offeringsList.map(offering => `
                    <tr>
                        <td>${formatDate(offering.offering_date)}</td>
                        <td>${offering.member_name || 'Unknown'}</td>
                        <td>${offering.offering_type}</td>
                        <td style="font-weight: 600; color: var(--primary);">₵${parseFloat(offering.amount).toFixed(2)}</td>
                        <td>${offering.payment_method}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function filterOfferings() {
    const searchTerm = document.getElementById('filterSearch').value.toLowerCase();
    const typeFilter = document.getElementById('filterType').value;
    
    let filtered = [...offerings];
    
    if (searchTerm) {
        filtered = filtered.filter(o => 
            o.member_name?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilter) {
        filtered = filtered.filter(o => o.offering_type === typeFilter);
    }
    
    displayOfferings(filtered);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showAlert(message, type) {
    const alertDiv = document.getElementById('alertMessage');
    alertDiv.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    setTimeout(() => {
        alertDiv.innerHTML = '';
    }, 3000);
}

function scrollToForm() {
    document.getElementById('offeringForm').scrollIntoView({ behavior: 'smooth' });
}