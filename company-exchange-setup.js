// 🏺 EnkiConnect - Company Exchange Setup Logic
// Handles multi-step form, employee management, and exchange creation

let currentStep = 1;
let employees = [];
let exchangeData = {};

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSetup();
    updateBudgetPreview();
    setMinDates();
});

function initializeSetup() {
    console.log('🏺 Company Exchange Setup initialized');
    
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
        if (user) {
            document.getElementById('organizerEmail').value = user.email || '';
            if (user.user_metadata?.full_name) {
                document.getElementById('organizerName').value = user.user_metadata.full_name;
            }
        }
    } catch (error) {
        console.log('Could not prefill organizer info:', error);
    }
}

function updateBudgetPreview() {
    const minBudget = document.getElementById('minBudget').value || 25;
    const maxBudget = document.getElementById('maxBudget').value || 100;
    
    document.getElementById('budgetRange').textContent = `$${minBudget} - $${maxBudget}`;
    
    // Validate budget range
    if (parseInt(maxBudget) <= parseInt(minBudget)) {
        document.getElementById('maxBudget').setCustomValidity('Maximum budget must be higher than minimum budget');
    } else {
        document.getElementById('maxBudget').setCustomValidity('');
    }
}

function setMinDates() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const signupInput = document.getElementById('signupDeadline');
    const giftInput = document.getElementById('giftDeadline');
    
    signupInput.min = tomorrow.toISOString().split('T')[0];
    
    signupInput.addEventListener('change', function() {
        const signupDate = new Date(this.value);
        const giftMinDate = new Date(signupDate);
        giftMinDate.setDate(giftMinDate.getDate() + 7); // At least 1 week after signup
        
        giftInput.min = giftMinDate.toISOString().split('T')[0];
        if (giftInput.value && new Date(giftInput.value) < giftMinDate) {
            giftInput.value = giftMinDate.toISOString().split('T')[0];
        }
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
    if (step === 4) {
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
    if (currentStep === 2) {
        return validateBudgetAndDates();
    } else if (currentStep === 3) {
        return validateEmployees();
    }
    
    return true;
}

function validateBudgetAndDates() {
    const minBudget = parseInt(document.getElementById('minBudget').value);
    const maxBudget = parseInt(document.getElementById('maxBudget').value);
    
    if (maxBudget <= minBudget) {
        showNotification('Maximum budget must be higher than minimum budget', 'error');
        return false;
    }
    
    const signupDate = new Date(document.getElementById('signupDeadline').value);
    const giftDate = new Date(document.getElementById('giftDeadline').value);
    
    if (giftDate <= signupDate) {
        showNotification('Gift deadline must be after signup deadline', 'error');
        return false;
    }
    
    return true;
}

function validateEmployees() {
    if (employees.length < 3) {
        showNotification('You need at least 3 employees for a company exchange', 'error');
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
    
    // Save employees data
    if (currentStep === 3) {
        exchangeData.employees = [...employees];
    }
}

function addEmployee() {
    const nameInput = document.getElementById('employeeName');
    const emailInput = document.getElementById('employeeEmail');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    
    if (!name || !email) {
        showNotification('Please enter both name and email', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Check for duplicates
    if (employees.some(emp => emp.email.toLowerCase() === email.toLowerCase())) {
        showNotification('This employee is already added', 'error');
        return;
    }
    
    // Add employee
    const employee = {
        id: Date.now(),
        name: name,
        email: email,
        status: 'pending'
    };
    
    employees.push(employee);
    renderEmployeeCard(employee);
    updateEmployeeCount();
    
    // Clear inputs
    nameInput.value = '';
    emailInput.value = '';
    nameInput.focus();
    
    // Enable launch button if we have enough employees
    updateLaunchButton();
}

function removeEmployee(id) {
    employees = employees.filter(emp => emp.id !== id);
    document.getElementById(`employee-${id}`).remove();
    updateEmployeeCount();
    updateLaunchButton();
}

function renderEmployeeCard(employee) {
    const employeeCards = document.getElementById('employeeCards');
    
    const card = document.createElement('div');
    card.className = 'employee-card';
    card.id = `employee-${employee.id}`;
    card.innerHTML = `
        <div class="employee-info">
            <div class="employee-name">${employee.name}</div>
            <div class="employee-email">${employee.email}</div>
        </div>
        <div class="employee-actions">
            <span class="employee-status ${employee.status}">${employee.status}</span>
            <button type="button" class="remove-btn" onclick="removeEmployee(${employee.id})" title="Remove employee">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    employeeCards.appendChild(card);
}

function updateEmployeeCount() {
    document.getElementById('employeeCount').textContent = employees.length;
}

function updateLaunchButton() {
    const launchBtn = document.getElementById('launchBtn');
    launchBtn.disabled = employees.length < 3;
}

function handleCSVImport() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        let importCount = 0;
        
        lines.forEach((line, index) => {
            if (line.trim()) {
                const [name, email] = line.split(',').map(s => s.trim());
                
                if (name && email && isValidEmail(email)) {
                    // Check for duplicates
                    if (!employees.some(emp => emp.email.toLowerCase() === email.toLowerCase())) {
                        const employee = {
                            id: Date.now() + index,
                            name: name,
                            email: email,
                            status: 'pending'
                        };
                        employees.push(employee);
                        renderEmployeeCard(employee);
                        importCount++;
                    }
                }
            }
        });
        
        updateEmployeeCount();
        updateLaunchButton();
        
        if (importCount > 0) {
            showNotification(`Successfully imported ${importCount} employees`, 'success');
        } else {
            showNotification('No valid employees found in CSV file', 'error');
        }
    };
    
    reader.readAsText(file);
    fileInput.value = ''; // Clear the input
}

function updateSummary() {
    document.getElementById('summaryCompany').textContent = exchangeData.companyName || '-';
    document.getElementById('summaryOrganizer').textContent = exchangeData.organizerName || '-';
    document.getElementById('summaryBudget').textContent = `$${exchangeData.minBudget || 25} - $${exchangeData.maxBudget || 100}`;
    document.getElementById('summaryEmployees').textContent = employees.length;
    document.getElementById('summarySignup').textContent = exchangeData.signupDeadline ? 
        new Date(exchangeData.signupDeadline).toLocaleDateString() : '-';
}

async function launchExchange() {
    const launchBtn = document.querySelector('.launch-btn');
    const originalText = launchBtn.innerHTML;
    
    launchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Exchange...';
    launchBtn.disabled = true;
    
    try {
        // Save final step data
        saveCurrentStepData();
        
        console.log('🚀 Launching company exchange with data:', exchangeData);
        
        // Wait for EnkiConnect to be available
        if (!window.EnkiConnect) {
            throw new Error('EnkiConnect not initialized');
        }
        
        // Get current user
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        if (!user) {
            throw new Error('User not authenticated');
        }
        
        // Create exchange in database
        const exchangeResult = await createCompanyExchange(user.id, exchangeData);
        
        if (!exchangeResult.success) {
            throw new Error(exchangeResult.error || 'Failed to create exchange');
        }
        
        console.log('✅ Exchange created successfully!');
        showNotification('🎉 Company exchange launched successfully!', 'success');
        
        // Redirect to company dashboard after delay
        setTimeout(() => {
            window.location.href = `company-dashboard.html?exchange=${exchangeResult.data.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('❌ Launch error:', error);
        showNotification(error.message || 'Failed to launch exchange', 'error');
        
        // Reset button
        launchBtn.innerHTML = originalText;
        launchBtn.disabled = false;
    }
}

async function createCompanyExchange(userId, data) {
    try {
        // Create exchange record
        const exchangeData = {
            organizer_id: userId,
            type: 'company',
            title: `${data.companyName} Gift Exchange`,
            description: `Company gift exchange organized by ${data.organizerName}`,
            min_budget: parseInt(data.minBudget),
            max_budget: parseInt(data.maxBudget),
            signup_deadline: data.signupDeadline,
            gift_deadline: data.giftDeadline,
            status: 'active',
            settings: {
                company_name: data.companyName,
                company_address: data.companyAddress,
                department: data.department,
                team_size: data.teamSize,
                allow_wishlist: data.allowWishlist === 'on',
                anonymous_gifts: data.anonymousGifts === 'on',
                chat_enabled: data.chatEnabled === 'on'
            }
        };
        
        // This would integrate with Supabase - for now return success
        return { 
            success: true, 
            data: { 
                id: 'company_' + Date.now(),
                ...exchangeData
            }
        };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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