// 🏺 EnkiConnect - Family Exchange Setup Logic
// Family exchange with adult/child roles and shared address

let currentStep = 1;
let familyMembers = [];
let exchangeData = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSetup();
    updateBudgetPreview();
    setMinDate();
});

function initializeSetup() {
    console.log('🏺 Family Exchange Setup initialized');
    
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
    const minBudget = document.getElementById('minBudget').value || 20;
    const maxBudget = document.getElementById('maxBudget').value || 75;
    
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
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7); // At least a week from now
    
    document.getElementById('exchangeDate').min = nextWeek.toISOString().split('T')[0];
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
        return validateFamily();
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

function validateFamily() {
    if (familyMembers.length < 2) {
        showNotification('You need at least 2 family members for an exchange', 'error');
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
    
    // Save family members data
    if (currentStep === 2) {
        exchangeData.familyMembers = [...familyMembers];
    }
}

function addFamilyMember() {
    const nameInput = document.getElementById('familyName');
    const phoneInput = document.getElementById('familyPhone');
    const roleSelect = document.getElementById('familyRole');
    
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    const role = roleSelect.value;
    
    if (!name || !phone || !role) {
        showNotification('Please enter name, phone, and select role', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Check for duplicates
    if (familyMembers.some(member => member.phone === phone)) {
        showNotification('This family member is already added', 'error');
        return;
    }
    
    // Add family member
    const member = {
        id: Date.now(),
        name: name,
        phone: phone,
        role: role,
        status: 'pending'
    };
    
    familyMembers.push(member);
    renderFamilyCard(member);
    updateFamilyCount();
    
    // Clear inputs
    nameInput.value = '';
    phoneInput.value = '';
    roleSelect.value = '';
    nameInput.focus();
    
    // Enable launch button if we have enough family members
    updateLaunchButton();
}

function removeFamilyMember(id) {
    familyMembers = familyMembers.filter(member => member.id !== id);
    document.getElementById(`family-${id}`).remove();
    updateFamilyCount();
    updateLaunchButton();
}

function renderFamilyCard(member) {
    const familyCards = document.getElementById('familyCards');
    
    const card = document.createElement('div');
    card.className = 'employee-card'; // Reusing employee card styles
    card.id = `family-${member.id}`;
    card.innerHTML = `
        <div class="employee-info">
            <div class="employee-name">${member.name} ${member.role === 'child' ? '(Child)' : ''}</div>
            <div class="employee-email">${member.phone}</div>
        </div>
        <div class="employee-actions">
            <span class="employee-status ${member.status}">${member.status}</span>
            <button type="button" class="remove-btn" onclick="removeFamilyMember(${member.id})" title="Remove family member">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    familyCards.appendChild(card);
}

function updateFamilyCount() {
    document.getElementById('familyCount').textContent = familyMembers.length;
}

function updateLaunchButton() {
    const launchBtn = document.getElementById('launchBtn');
    launchBtn.disabled = familyMembers.length < 2;
}

function updateSummary() {
    document.getElementById('summaryName').textContent = exchangeData.exchangeName || '-';
    document.getElementById('summaryOrganizer').textContent = exchangeData.organizerName || '-';
    document.getElementById('summaryBudget').textContent = `$${exchangeData.minBudget || 20} - $${exchangeData.maxBudget || 75}`;
    document.getElementById('summaryFamily').textContent = familyMembers.length;
    document.getElementById('summaryDate').textContent = exchangeData.exchangeDate ? 
        new Date(exchangeData.exchangeDate).toLocaleDateString() : '-';
    document.getElementById('summaryAddress').textContent = exchangeData.familyAddress || '-';
}

async function launchExchange() {
    const launchBtn = document.querySelector('.launch-btn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Exchange...';
    launchBtn.disabled = true;
    
    try {
        // Save final step data
        saveCurrentStepData();
        
        console.log('🚀 Launching family exchange with data:', exchangeData);
        
        // Simulate exchange creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Family exchange created successfully!');
        showNotification('🎉 Family exchange launched successfully!', 'success');
        
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