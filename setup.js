// ==================== SETUP PAGES FUNCTIONALITY ====================

let currentStep = 1;
let setupData = {
    employees: [],
    friends: [],
    family: []
};

// Initialize setup pages
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.setup-page')) {
        initializeSetup();
        setupFormValidation();
        setupEventListeners();
    }
});

function initializeSetup() {
    // Set default dates
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const registrationDeadline = document.getElementById('registrationDeadline');
    const exchangeDate = document.getElementById('exchangeDate');
    
    if (registrationDeadline) {
        registrationDeadline.value = nextWeek.toISOString().split('T')[0];
    }
    if (exchangeDate) {
        exchangeDate.value = nextMonth.toISOString().split('T')[0];
    }
    
    // Add demo data for realistic presentation
    addDemoData();
    
    // Initialize progress bar
    updateProgressBar(1);
}

// ==================== STEP NAVIGATION ====================

function nextStep(step) {
    if (!validateCurrentStep()) {
        return;
    }
    
    // Hide current step
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active'));
    
    // Show next step
    const nextStepElement = document.getElementById(`step${step}`);
    const nextProgressStep = document.querySelectorAll('.progress-step')[step - 1];
    
    if (nextStepElement && nextProgressStep) {
        nextStepElement.classList.add('active');
        nextProgressStep.classList.add('active');
        currentStep = step;
        
        // Update progress bar
        updateProgressBar(step);
        
        // Populate summary if on final step
        if (step === 4) {
            populateSummary();
        }
        
        // Show helpful demo message
        showNotification(`📍 Demo Step ${step}/4 - Navigate through all steps for presentation`, 'info');
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

function prevStep(step) {
    // Hide current step
    document.querySelectorAll('.setup-step').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.progress-step').forEach(s => s.classList.remove('active'));
    
    // Show previous step
    const prevStepElement = document.getElementById(`step${step}`);
    const prevProgressStep = document.querySelectorAll('.progress-step')[step - 1];
    
    if (prevStepElement && prevProgressStep) {
        prevStepElement.classList.add('active');
        prevProgressStep.classList.add('active');
        currentStep = step;
        
        // Update progress bar
        updateProgressBar(step);
        
        // Scroll to top
        window.scrollTo(0, 0);
    }
}

function updateProgressBar(step) {
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((progressStep, index) => {
        if (index < step) {
            progressStep.classList.add('completed');
        } else {
            progressStep.classList.remove('completed');
        }
    });
}

// ==================== FORM VALIDATION ====================

function validateCurrentStep() {
    // For demo purposes, allow navigation without strict validation
    // In production, you would enable full validation
    return true;
    
    /* PRODUCTION VALIDATION (commented out for demo):
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
    */
}

function validateStep1() {
    // Demo mode: Show helpful message but allow navigation
    const requiredFields = ['companyName', 'organizerName', 'organizerEmail', 'companyAddress'];
    const friendsFields = ['eventName', 'organizerName', 'organizerPhone'];
    const familyFields = ['familyName', 'eventName', 'organizerName', 'organizerPhone', 'familyAddress'];
    
    let fieldsToCheck = requiredFields;
    
    if (document.querySelector('.setup-page').classList.contains('friends-page')) {
        fieldsToCheck = friendsFields;
    } else if (document.querySelector('.setup-page').classList.contains('family-page')) {
        fieldsToCheck = familyFields;
    }
    
    let hasEmptyFields = false;
    for (const fieldId of fieldsToCheck) {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            hasEmptyFields = true;
            break;
        }
    }
    
    if (hasEmptyFields) {
        showNotification('💡 Demo Mode: You can navigate without filling all fields for testing', 'info');
    }
    
    return true; // Always allow navigation in demo mode
}

function validateStep2() {
    // Demo mode: Skip validation but show helpful message
    if (setupData.employees.length === 0 && setupData.friends.length === 0 && setupData.family.length === 0) {
        showNotification('💡 Demo Mode: You can navigate without adding people for testing', 'info');
    }
    return true;
}

function validateStep3() {
    const minAmount = document.getElementById('minAmount');
    const maxAmount = document.getElementById('maxAmount');
    
    if (minAmount && maxAmount) {
        if (parseInt(minAmount.value) >= parseInt(maxAmount.value)) {
            showNotification('Maximum amount must be greater than minimum amount', 'error');
            return false;
        }
    }
    
    return true;
}

// ==================== EMPLOYEE MANAGEMENT (Company) ====================

function addEmployee() {
    const name = document.getElementById('employeeName').value.trim();
    const email = document.getElementById('employeeEmail').value.trim();
    const role = document.getElementById('employeeRole').value.trim();
    
    if (!email) {
        showNotification('Email is required', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Check if email already exists
    if (setupData.employees.some(emp => emp.email === email)) {
        showNotification('This email is already added', 'error');
        return;
    }
    
    const employee = {
        id: generateId(),
        name: name || email.split('@')[0],
        email: email,
        role: role || 'Employee',
        status: 'pending'
    };
    
    setupData.employees.push(employee);
    renderEmployees();
    clearEmployeeForm();
    updateNextButton();
    
    showNotification('Employee added successfully', 'success');
}

function renderEmployees() {
    const container = document.getElementById('employeesContainer');
    const countElement = document.getElementById('employeeCount');
    
    if (!container) return;
    
    if (setupData.employees.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h4>No employees added yet</h4>
                <p>Add employees using the form above or import from CSV</p>
            </div>
        `;
    } else {
        container.innerHTML = setupData.employees.map(emp => `
            <div class="employee-item" data-id="${emp.id}">
                <label class="employee-checkbox">
                    <input type="checkbox" onchange="toggleSelection('employee', '${emp.id}')">
                </label>
                <div class="employee-info">
                    <div class="employee-name">${emp.name}</div>
                    <div class="employee-email">${emp.email}</div>
                    <div class="employee-role">${emp.role}</div>
                </div>
                <div class="employee-status">
                    <span class="status-badge ${emp.status}">${emp.status}</span>
                </div>
                <button class="remove-btn" onclick="removeEmployee('${emp.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    if (countElement) {
        countElement.textContent = setupData.employees.length;
    }
}

function removeEmployee(id) {
    setupData.employees = setupData.employees.filter(emp => emp.id !== id);
    renderEmployees();
    updateNextButton();
    showNotification('Employee removed', 'info');
}

function clearEmployeeForm() {
    document.getElementById('employeeName').value = '';
    document.getElementById('employeeEmail').value = '';
    document.getElementById('employeeRole').value = '';
}

// ==================== FRIENDS MANAGEMENT ====================

function addFriend() {
    const name = document.getElementById('friendName').value.trim();
    const phone = document.getElementById('friendPhone').value.trim();
    const nickname = document.getElementById('friendNickname').value.trim();
    
    if (!phone) {
        showNotification('Phone number is required', 'error');
        return;
    }
    
    if (!validatePhone(phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    // Check if phone already exists
    if (setupData.friends.some(friend => friend.phone === phone)) {
        showNotification('This phone number is already added', 'error');
        return;
    }
    
    const friend = {
        id: generateId(),
        name: name || 'Friend',
        phone: phone,
        nickname: nickname,
        status: 'pending'
    };
    
    setupData.friends.push(friend);
    renderFriends();
    clearFriendForm();
    updateNextButton();
    
    showNotification('Friend added successfully', 'success');
}

function renderFriends() {
    const container = document.getElementById('friendsContainer');
    const countElement = document.getElementById('friendCount');
    
    if (!container) return;
    
    if (setupData.friends.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-friends"></i>
                <h4>No friends added yet</h4>
                <p>Add friends using phone numbers or import from contacts</p>
            </div>
        `;
    } else {
        container.innerHTML = setupData.friends.map(friend => `
            <div class="friend-item" data-id="${friend.id}">
                <label class="friend-checkbox">
                    <input type="checkbox" onchange="toggleSelection('friend', '${friend.id}')">
                </label>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-phone">${friend.phone}</div>
                    ${friend.nickname ? `<div class="friend-nickname">"${friend.nickname}"</div>` : ''}
                </div>
                <div class="friend-status">
                    <span class="status-badge ${friend.status}">${friend.status}</span>
                </div>
                <button class="remove-btn" onclick="removeFriend('${friend.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    if (countElement) {
        countElement.textContent = setupData.friends.length;
    }
}

function removeFriend(id) {
    setupData.friends = setupData.friends.filter(friend => friend.id !== id);
    renderFriends();
    updateNextButton();
    showNotification('Friend removed', 'info');
}

function clearFriendForm() {
    document.getElementById('friendName').value = '';
    document.getElementById('friendPhone').value = '';
    document.getElementById('friendNickname').value = '';
}

// ==================== FAMILY MANAGEMENT ====================

function addFamilyMember() {
    const name = document.getElementById('memberName').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const age = parseInt(document.getElementById('memberAge').value);
    const relationship = document.getElementById('relationship').value;
    
    if (!name || !age || !relationship) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    const member = {
        id: generateId(),
        name: name,
        phone: phone,
        age: age,
        relationship: relationship,
        isMinor: age < 18,
        status: 'pending'
    };
    
    // Add guardian info for minors
    if (age < 18) {
        const guardianPhone = document.getElementById('guardianPhone').value.trim();
        const guardianName = document.getElementById('guardianName').value.trim();
        
        if (!guardianPhone || !guardianName) {
            showNotification('Guardian information is required for minors', 'error');
            return;
        }
        
        member.guardian = {
            name: guardianName,
            phone: guardianPhone
        };
    }
    
    setupData.family.push(member);
    renderFamilyMembers();
    clearFamilyForm();
    updateNextButton();
    updateFamilyStats();
    
    showNotification('Family member added successfully', 'success');
}

function renderFamilyMembers() {
    const container = document.getElementById('membersContainer');
    const countElement = document.getElementById('memberCount');
    
    if (!container) return;
    
    if (setupData.family.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h4>No family members added yet</h4>
                <p>Add family members to start your gift exchange</p>
            </div>
        `;
    } else {
        container.innerHTML = setupData.family.map(member => `
            <div class="family-member-item" data-id="${member.id}">
                <div class="member-info">
                    <div class="member-name">
                        ${member.name}
                        ${member.isMinor ? '<span class="minor-badge">Minor</span>' : ''}
                    </div>
                    <div class="member-details">
                        <span class="age">Age: ${member.age}</span>
                        <span class="relationship">${member.relationship}</span>
                    </div>
                    ${member.phone ? `<div class="member-phone">${member.phone}</div>` : ''}
                    ${member.guardian ? `<div class="guardian-info">Guardian: ${member.guardian.name} (${member.guardian.phone})</div>` : ''}
                </div>
                <div class="member-status">
                    <span class="status-badge ${member.status}">${member.status}</span>
                </div>
                <button class="remove-btn" onclick="removeFamilyMember('${member.id}')" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
    
    if (countElement) {
        countElement.textContent = setupData.family.length;
    }
}

function removeFamilyMember(id) {
    setupData.family = setupData.family.filter(member => member.id !== id);
    renderFamilyMembers();
    updateNextButton();
    updateFamilyStats();
    showNotification('Family member removed', 'info');
}

function updateFamilyStats() {
    const adultCount = setupData.family.filter(m => !m.isMinor).length;
    const childCount = setupData.family.filter(m => m.isMinor).length;
    
    const adultCountElement = document.getElementById('adultCount');
    const childCountElement = document.getElementById('childCount');
    
    if (adultCountElement) adultCountElement.textContent = adultCount;
    if (childCountElement) childCountElement.textContent = childCount;
}

function updateMemberType() {
    const age = parseInt(document.getElementById('memberAge').value);
    const minorSettings = document.getElementById('minorSettings');
    
    if (minorSettings) {
        if (age < 18) {
            minorSettings.style.display = 'block';
        } else {
            minorSettings.style.display = 'none';
        }
    }
}

function clearFamilyForm() {
    document.getElementById('memberName').value = '';
    document.getElementById('memberPhone').value = '';
    document.getElementById('memberAge').value = '';
    document.getElementById('relationship').value = '';
    document.getElementById('guardianPhone').value = '';
    document.getElementById('guardianName').value = '';
    document.getElementById('minorSettings').style.display = 'none';
}

// ==================== UTILITY FUNCTIONS ====================

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function updateNextButton() {
    const nextBtn = document.getElementById('step2NextBtn');
    if (nextBtn) {
        const hasData = setupData.employees.length > 0 || setupData.friends.length > 0 || setupData.family.length > 0;
        nextBtn.disabled = !hasData;
    }
}

function setupEventListeners() {
    // Delivery method change
    const deliveryOptions = document.querySelectorAll('input[name="deliveryMethod"]');
    deliveryOptions.forEach(option => {
        option.addEventListener('change', function() {
            const centralSection = document.getElementById('centralAddressSection');
            if (centralSection) {
                centralSection.style.display = this.value === 'central' ? 'block' : 'none';
            }
        });
    });
    
    // Amount range inputs
    const minAmount = document.getElementById('minAmount');
    const maxAmount = document.getElementById('maxAmount');
    
    if (minAmount && maxAmount) {
        minAmount.addEventListener('input', updatePreview);
        maxAmount.addEventListener('input', updatePreview);
    }
    
    // Checklist validation
    const checklistItems = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    checklistItems.forEach(item => {
        item.addEventListener('change', updateLaunchButton);
    });
}

function updatePreview() {
    const minAmount = document.getElementById('minAmount');
    const maxAmount = document.getElementById('maxAmount');
    const currency = document.getElementById('currency').value;
    const previewMin = document.getElementById('previewMin');
    const previewMax = document.getElementById('previewMax');
    
    if (previewMin && previewMax && minAmount && maxAmount) {
        previewMin.textContent = `${currency === 'EUR' ? '€' : '$'}${minAmount.value}`;
        previewMax.textContent = `${currency === 'EUR' ? '€' : '$'}${maxAmount.value}`;
    }
}

function updateLaunchButton() {
    const launchBtn = document.getElementById('launchBtn');
    const checklistItems = document.querySelectorAll('.checklist-item input[type="checkbox"]');
    
    if (launchBtn) {
        const allChecked = Array.from(checklistItems).every(item => item.checked);
        launchBtn.disabled = !allChecked;
    }
}

// ==================== LAUNCH FUNCTIONS ====================

function launchCompanyExchange() {
    const launchBtn = document.getElementById('launchBtn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Launching...</span>';
    launchBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('🎉 Company exchange launched! Redirecting to organizer dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'company-dashboard.html';
        }, 1500);
    }, 2000);
}

function launchFriendsExchange() {
    const launchBtn = document.getElementById('launchBtn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Launching...</span>';
    launchBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('🎉 Friends exchange launched! Redirecting to organizer dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'friends-dashboard.html';
        }, 1500);
    }, 2000);
}

function launchFamilyExchange() {
    const launchBtn = document.getElementById('launchBtn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-heart fa-spin"></i> <span>Launching...</span>';
    launchBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('🎉 Family exchange launched! Redirecting to organizer dashboard...', 'success');
        setTimeout(() => {
            window.location.href = 'family-dashboard.html';
        }, 1500);
    }, 2000);
}

// ==================== WORLD PAGE FUNCTIONS ====================

function updateContribution() {
    updateMysteryContribution();
}

function updateMysteryContribution() {
    const slider = document.getElementById('contributionRange');
    const amount = document.getElementById('contributionAmount');
    const dynamicAmount1 = document.getElementById('dynamicAmount');
    const dynamicAmount2 = document.getElementById('dynamicAmount2');
    
    if (!slider || !amount) return;
    
    const value = parseInt(slider.value);
    amount.textContent = value;
    
    // Update dynamic amounts in mystery explanation
    if (dynamicAmount1) dynamicAmount1.textContent = value;
    if (dynamicAmount2) dynamicAmount2.textContent = value;
    
    // Update mystery label instead of tier
    const mysteryLabel = document.querySelector('.mystery-label');
    if (mysteryLabel) {
        mysteryLabel.textContent = `🎲 Mystery Box Budget: $${value}`;
    }
}

function joinWorldQueue() {
    const joinBtn = document.getElementById('joinBtn');
    const originalText = joinBtn.innerHTML;
    
    joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Joining Queue...</span>';
    joinBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('Successfully joined the global queue!', 'success');
        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 2000);
    }, 2000);
}

// ==================== DEMO DATA FOR PRESENTATION ====================

function addDemoData() {
    // Add demo employees for company setup
    if (document.querySelector('.setup-page.company-page')) {
        setupData.employees = [
            { name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Engineering' },
            { name: 'Mike Chen', email: 'mike.chen@company.com', department: 'Design' },
            { name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', department: 'Marketing' }
        ];
        updateEmployeeList();
    }
    
    // Add demo friends for friends setup  
    if (document.querySelector('.setup-page.friends-page')) {
        setupData.friends = [
            { name: 'Alex Chen', phone: '(555) 123-4567' },
            { name: 'Maya Rodriguez', phone: '(555) 234-5678' },
            { name: 'Sam Johnson', phone: '(555) 345-6789' }
        ];
        updateFriendsList();
    }
    
    // Add demo family for family setup
    if (document.querySelector('.setup-page.family-page')) {
        setupData.family = [
            { name: 'Mom (Linda)', phone: '(555) 123-4567', type: 'adult' },
            { name: 'Dad (Robert)', phone: '(555) 234-5678', type: 'adult' },
            { name: 'Emma (16)', phone: 'N/A', type: 'child' }
        ];
        updateFamilyList();
    }
}

// Make functions globally available
window.nextStep = nextStep;
window.prevStep = prevStep;
window.addEmployee = addEmployee;
window.removeEmployee = removeEmployee;
window.addFriend = addFriend;
window.removeFriend = removeFriend;
window.addFamilyMember = addFamilyMember;
window.removeFamilyMember = removeFamilyMember;
window.updateMemberType = updateMemberType;
window.launchCompanyExchange = launchCompanyExchange;
window.launchFriendsExchange = launchFriendsExchange;
window.launchFamilyExchange = launchFamilyExchange;
window.updateContribution = updateContribution;
window.joinWorldQueue = joinWorldQueue; 
window.joinWorldQueue = joinWorldQueue; 