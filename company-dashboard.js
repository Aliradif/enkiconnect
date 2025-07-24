// 🏺 EnkiConnect - Company Dashboard Logic
// Manages company exchange dashboard functionality

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadExchangeData();
});

function initializeDashboard() {
    console.log('🏺 Company Dashboard initialized');
    
    // Get exchange ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const exchangeId = urlParams.get('exchange');
    
    if (exchangeId) {
        console.log('Loading exchange:', exchangeId);
        // In a real app, we'd load exchange data from Supabase
    }
}

function loadExchangeData() {
    // Simulate loading exchange data
    setTimeout(() => {
        updateStats();
        updateTimeline();
        updateActivity();
    }, 1000);
}

function updateStats() {
    // Simulate employee data
    const employees = JSON.parse(localStorage.getItem('companyEmployees') || '[]');
    
    document.getElementById('totalParticipants').textContent = employees.length || '5';
    document.getElementById('joinedCount').textContent = Math.floor(employees.length * 0.6) || '3';
    document.getElementById('pendingCount').textContent = Math.ceil(employees.length * 0.4) || '2';
    
    // Update budget from localStorage if available
    const exchangeData = JSON.parse(localStorage.getItem('companyExchangeData') || '{}');
    if (exchangeData.minBudget && exchangeData.maxBudget) {
        document.getElementById('budgetRange').textContent = `$${exchangeData.minBudget}-$${exchangeData.maxBudget}`;
    }
}

function updateTimeline() {
    const exchangeData = JSON.parse(localStorage.getItem('companyExchangeData') || '{}');
    
    if (exchangeData.signupDeadline) {
        document.getElementById('signupDeadline').textContent = 
            new Date(exchangeData.signupDeadline).toLocaleDateString();
    }
    
    if (exchangeData.giftDeadline) {
        document.getElementById('giftDeadline').textContent = 
            new Date(exchangeData.giftDeadline).toLocaleDateString();
    }
}

function updateActivity() {
    const activityList = document.getElementById('activityList');
    
    // Add some demo activities
    const activities = [
        {
            type: 'success',
            icon: 'check',
            message: 'Exchange launched successfully',
            time: 'Just now'
        },
        {
            type: 'info',
            icon: 'envelope',
            message: 'Invitations sent to all team members',
            time: '1 minute ago'
        }
    ];
    
    // Clear existing activities except the first two
    const existingItems = activityList.querySelectorAll('.activity-item');
    if (existingItems.length > 2) {
        for (let i = 2; i < existingItems.length; i++) {
            existingItems[i].remove();
        }
    }
}

// Dashboard action functions
function manageParticipants() {
    showNotification('👥 Participant management coming in Week 2!', 'info');
}

function sendReminders() {
    showNotification('📧 Reminder emails sent to pending participants!', 'success');
    
    // Update activity
    addActivity('info', 'paper-plane', 'Reminder emails sent to pending participants', 'Just now');
}

function editSettings() {
    showNotification('⚙️ Exchange settings editor coming in Week 2!', 'info');
}

function viewAnalytics() {
    showNotification('📊 Advanced analytics dashboard coming in Week 2!', 'info');
}

function addActivity(type, icon, message, time) {
    const activityList = document.getElementById('activityList');
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-icon ${type}">
            <i class="fas fa-${icon}"></i>
        </div>
        <div class="activity-content">
            <p><strong>${message}</strong></p>
            <span class="activity-time">${time}</span>
        </div>
    `;
    
    // Insert at the beginning
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    // Keep only the latest 5 activities
    const activities = activityList.querySelectorAll('.activity-item');
    if (activities.length > 5) {
        activities[activities.length - 1].remove();
    }
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.dashboard-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `dashboard-notification setup-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
} 