// 🏺 EnkiConnect - Friend Exchange Setup Logic
// Simplified version for friend group exchanges

let currentStep = 1;
let friends = [];
let exchangeData = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSetup();
    updateBudgetPreview();
    setMinDate();
});

function initializeSetup() {
    console.log('🏺 Friend Exchange Setup initialized');
    
    // Add event listeners for budget inputs
    document.getElementById('minBudget').addEventListener('input', updateBudgetPreview);
    document.getElementById('maxBudget').addEventListener('input', updateBudgetPreview);
    
    // Pre-fill organizer info if available
    if (window.EnkiConnect) {
        prefillOrganizerInfo();
    }
}

async function prefillOrganizerInfo() {
    try {
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        if (user && user.user_metadata?.full_name) {
            document.getElementById('organizerName').value = user.user_metadata.full_name;
        }
    } catch (error) {
        console.log('Could not prefill organizer info:', error);
    }
}

function updateBudgetPreview() {
    const minBudget = document.getElementById('minBudget').value || 15;
    const maxBudget = document.getElementById('maxBudget').value || 50;
    
    document.getElementById('budgetRange').textContent = `$${minBudget} - $${maxBudget}`;
    
    // Validate budget range
    if (parseInt(maxBudget) <= parseInt(minBudget)) {
        document.getElementById('maxBudget').setCustomValidity('Maximum budget must be higher than minimum budget');
    } else {
        document.getElementById('maxBudget').setCustomValidity('');
    }
}

function setMinDate() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 7); // At least a week from now
    
    document.getElementById('exchangeDate').min = tomorrow.toISOString().split('T')[0];
}

function nextStep() {
    if (validateCurrentStep()) {
        saveCurrentStepData();
        currentStep++;
        showStep(currentStep);
        updateProgressSteps();
    }
}

function prevStep() {
    currentStep--;
    showStep(currentStep);
    updateProgressSteps();
}

function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update summary if on final step
    if (step === 3) {
        updateSummary();
    }
}

function updateProgressSteps() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index < currentStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

function validateCurrentStep() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (!field.value.trim()) {
            field.focus();
            showNotification(`Please fill in the ${field.previousElementSibling?.textContent?.replace(' *', '') || 'required field'}`, 'error');
            return false;
        }
    }
    
    // Additional validation for specific steps
    if (currentStep === 1) {
        return validateBudgetAndDate();
    } else if (currentStep === 2) {
        return validateFriends();
    }
    
    return true;
}

function validateBudgetAndDate() {
    const minBudget = parseInt(document.getElementById('minBudget').value);
    const maxBudget = parseInt(document.getElementById('maxBudget').value);
    
    if (maxBudget <= minBudget) {
        showNotification('Maximum budget must be higher than minimum budget', 'error');
        return false;
    }
    
    return true;
}

function validateFriends() {
    if (friends.length < 3) {
        showNotification('You need at least 3 friends for an exchange', 'error');
        return false;
    }
    return true;
}

function saveCurrentStepData() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const formData = new FormData(currentStepElement.querySelector('form'));
    
    for (let [key, value] of formData.entries()) {
        exchangeData[key] = value;
    }
    
    // Save friends data
    if (currentStep === 2) {
        exchangeData.friends = [...friends];
    }
}

function addFriend() {
    const nameInput = document.getElementById('friendName');
    const phoneInput = document.getElementById('friendPhone');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    
    if (!name || !phone) {
        showNotification('Please enter both name and phone number', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Check for duplicates
    if (friends.some(friend => friend.phone === phone)) {
        showNotification('This friend is already added', 'error');
        return;
    }
    
    // Add friend
    const friend = {
        id: Date.now(),
        name: name,
        phone: phone,
        status: 'pending'
    };
    
    friends.push(friend);
    renderFriendCard(friend);
    updateFriendCount();
    
    // Clear inputs
    nameInput.value = '';
    phoneInput.value = '';
    nameInput.focus();
    
    // Enable launch button if we have enough friends
    updateLaunchButton();
}

function removeFriend(id) {
    friends = friends.filter(friend => friend.id !== id);
    document.getElementById(`friend-${id}`).remove();
    updateFriendCount();
    updateLaunchButton();
}

function renderFriendCard(friend) {
    const friendCards = document.getElementById('friendCards');
    
    const card = document.createElement('div');
    card.className = 'employee-card'; // Reusing employee card styles
    card.id = `friend-${friend.id}`;
    card.innerHTML = `
        <div class="employee-info">
            <div class="employee-name">${friend.name}</div>
            <div class="employee-email">${friend.phone}</div>
        </div>
        <div class="employee-actions">
            <span class="employee-status ${friend.status}">${friend.status}</span>
            <button type="button" class="remove-btn" onclick="removeFriend(${friend.id})" title="Remove friend">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    friendCards.appendChild(card);
}

function updateFriendCount() {
    document.getElementById('friendCount').textContent = friends.length;
}

function updateLaunchButton() {
    const launchBtn = document.getElementById('launchBtn');
    launchBtn.disabled = friends.length < 3;
}

function updateSummary() {
    document.getElementById('summaryName').textContent = exchangeData.exchangeName || '-';
    document.getElementById('summaryOrganizer').textContent = exchangeData.organizerName || '-';
    document.getElementById('summaryBudget').textContent = `$${exchangeData.minBudget || 15} - $${exchangeData.maxBudget || 50}`;
    document.getElementById('summaryFriends').textContent = friends.length;
    document.getElementById('summaryDate').textContent = exchangeData.exchangeDate ? 
        new Date(exchangeData.exchangeDate).toLocaleDateString() : '-';
}

async function launchExchange() {
    const launchBtn = document.querySelector('.launch-btn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Exchange...';
    launchBtn.disabled = true;
    
    try {
        // Save final step data
        saveCurrentStepData();
        
        console.log('🚀 Launching friend exchange with data:', exchangeData);
        
        // Simulate exchange creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Friend exchange created successfully!');
        showNotification('🎉 Friend exchange launched successfully!', 'success');
        
        // Redirect to categories after delay
        setTimeout(() => {
            window.location.href = 'categories.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Launch error:', error);
        showNotification(error.message || 'Failed to launch exchange', 'error');
        
        // Reset button
        launchBtn.innerHTML = originalText;
        launchBtn.disabled = false;
    }
}

// Utility functions
function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.setup-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `setup-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
} 