// 🏺 EnkiConnect - World Exchange Setup Logic
// Global gift exchange with cultural preferences and matching

let currentStep = 1;
let exchangeData = {};
let selectedInterests = [];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSetup();
    updateBudgetPreview();
});

function initializeSetup() {
    console.log('🏺 World Exchange Setup initialized');
    
    // Add event listeners for budget inputs
    document.getElementById('minBudget').addEventListener('input', updateBudgetPreview);
    document.getElementById('maxBudget').addEventListener('input', updateBudgetPreview);
    
    // Add event listeners for interest checkboxes
    document.querySelectorAll('input[name="interests"]').forEach(checkbox => {
        checkbox.addEventListener('change', updateInterests);
    });
    
    // Pre-fill user info if available
    if (window.EnkiConnect) {
        prefillUserInfo();
    }
}

async function prefillUserInfo() {
    try {
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        if (user && user.user_metadata?.full_name) {
            document.getElementById('displayName').value = user.user_metadata.full_name;
        }
    } catch (error) {
        console.log('Could not prefill user info:', error);
    }
}

function updateBudgetPreview() {
    const minBudget = document.getElementById('minBudget').value || 25;
    const maxBudget = document.getElementById('maxBudget').value || 100;
    
    document.getElementById('budgetRange').textContent = `$${minBudget} - $${maxBudget} USD`;
    
    // Validate budget range
    if (parseInt(maxBudget) <= parseInt(minBudget)) {
        document.getElementById('maxBudget').setCustomValidity('Maximum budget must be higher than minimum budget');
    } else {
        document.getElementById('maxBudget').setCustomValidity('');
    }
}

function updateInterests() {
    selectedInterests = [];
    document.querySelectorAll('input[name="interests"]:checked').forEach(checkbox => {
        selectedInterests.push(checkbox.value);
    });
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
        return validateProfileAndBudget();
    }
    
    return true;
}

function validateProfileAndBudget() {
    const minBudget = parseInt(document.getElementById('minBudget').value);
    const maxBudget = parseInt(document.getElementById('maxBudget').value);
    
    if (maxBudget <= minBudget) {
        showNotification('Maximum budget must be higher than minimum budget', 'error');
        return false;
    }
    
    return true;
}

function saveCurrentStepData() {
    const currentStepElement = document.getElementById(`step${currentStep}`);
    const forms = currentStepElement.querySelectorAll('form, .preferences-section');
    
    forms.forEach(form => {
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            if (key === 'interests') {
                // Handle multiple interests
                if (!exchangeData.interests) exchangeData.interests = [];
                exchangeData.interests.push(value);
            } else {
                exchangeData[key] = value;
            }
        }
    });
    
    // Save interests from checkboxes
    exchangeData.interests = selectedInterests;
    
    // Save message if exists
    const messageField = document.getElementById('giftMessage');
    if (messageField) {
        exchangeData.giftMessage = messageField.value;
    }
    
    // Save multi-select preferences
    const regionsSelect = document.getElementById('preferredRegions');
    if (regionsSelect) {
        exchangeData.preferredRegions = Array.from(regionsSelect.selectedOptions).map(option => option.value);
    }
}

function updateSummary() {
    document.getElementById('summaryName').textContent = exchangeData.displayName || '-';
    
    // Get country display name
    const countrySelect = document.getElementById('country');
    const selectedCountry = countrySelect.options[countrySelect.selectedIndex];
    document.getElementById('summaryCountry').textContent = selectedCountry ? selectedCountry.text : '-';
    
    document.getElementById('summaryBudget').textContent = `$${exchangeData.minBudget || 25} - $${exchangeData.maxBudget || 100} USD`;
    document.getElementById('summaryInterests').textContent = selectedInterests.length > 0 ? 
        selectedInterests.join(', ') : 'Open to all interests';
}

async function joinGlobalPool() {
    const launchBtn = document.querySelector('.launch-btn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining Global Pool...';
    launchBtn.disabled = true;
    
    try {
        // Save final step data
        saveCurrentStepData();
        
        console.log('🚀 Joining global exchange pool with data:', exchangeData);
        
        // Simulate joining global pool
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Successfully joined global exchange pool!');
        showNotification('🌍 Welcome to the global community! You\'ll be matched soon!', 'success');
        
        // Redirect to categories after delay
        setTimeout(() => {
            window.location.href = 'categories.html';
        }, 3000);
        
    } catch (error) {
        console.error('❌ Join error:', error);
        showNotification(error.message || 'Failed to join global pool', 'error');
        
        // Reset button
        launchBtn.innerHTML = originalText;
        launchBtn.disabled = false;
    }
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