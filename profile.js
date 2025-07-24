// ==================== PROFILE PAGE FUNCTIONALITY ====================

let userProfile = {
    personal: {},
    payment: {},
    shipping: {},
    preferences: {},
    privacy: {}
};

// Currency mapping for countries
const currencyMap = {
    'CA': 'CAD',
    'US': 'USD',
    'UK': 'GBP',
    'DE': 'EUR',
    'FR': 'EUR',
    'JP': 'JPY',
    'AU': 'AUD'
};

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.profile-page')) {
        initializeProfile();
        loadSavedProfile();
        setupFormHandlers();
    }
});

function initializeProfile() {
    // Set default active tab
    showTab('personal');
    
    // Update user name display
    updateUserNameDisplay();
    
    // Setup profile photo upload
    setupProfilePhotoUpload();
    
    // Initialize form validation
    setupFormValidation();
}

// ==================== TAB MANAGEMENT ====================

function showTab(tabName) {
    // Hide all tab contents and deactivate buttons
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab and activate button
    const selectedTab = document.getElementById(tabName);
    const selectedBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    
    if (selectedTab && selectedBtn) {
        selectedTab.classList.add('active');
        selectedBtn.classList.add('active');
    }
    
    // Scroll to top of content
    selectedTab.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== FORM HANDLERS ====================

function setupFormHandlers() {
    // Personal Information Form
    const personalForm = document.getElementById('personalForm');
    if (personalForm) {
        personalForm.addEventListener('submit', handlePersonalForm);
    }
    
    // Payment Form
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentForm);
    }
    
    // Shipping Form
    const shippingForm = document.getElementById('shippingForm');
    if (shippingForm) {
        shippingForm.addEventListener('submit', handleShippingForm);
    }
    
    // Preferences Form
    const preferencesForm = document.getElementById('preferencesForm');
    if (preferencesForm) {
        preferencesForm.addEventListener('submit', handlePreferencesForm);
    }
    
    // Privacy Form
    const privacyForm = document.getElementById('privacyForm');
    if (privacyForm) {
        privacyForm.addEventListener('submit', handlePrivacyForm);
    }
}

function handlePersonalForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const personalData = Object.fromEntries(formData);
    
    // Validate required fields
    if (!personalData.firstName || !personalData.lastName || !personalData.email || !personalData.birthDate || !personalData.country) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate age (must be 18+)
    const age = calculateAge(personalData.birthDate);
    if (age < 18) {
        showNotification('You must be 18 or older to use this service', 'error');
        return;
    }
    
    // Save data
    userProfile.personal = personalData;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Update UI
    updateUserNameDisplay();
    updateVerificationStatus('age', age >= 18);
    
    showNotification('Personal information saved successfully!', 'success');
}

function handlePaymentForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const paymentData = Object.fromEntries(formData);
    
    // Validate credit card (basic validation)
    if (!validateCreditCard(paymentData.cardNumber)) {
        showNotification('Please enter a valid credit card number', 'error');
        return;
    }
    
    // Simulate payment verification process
    const submitBtn = e.target.querySelector('.verify-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        // Save data (in real app, this would be encrypted and sent to secure server)
        userProfile.payment = {
            ...paymentData,
            cardNumber: '**** **** **** ' + paymentData.cardNumber.slice(-4) // Mask card number
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        // Update verification status
        updateVerificationStatus('payment', true);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showNotification('Payment method verified successfully!', 'success');
    }, 2000);
}

function handleShippingForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const shippingData = Object.fromEntries(formData);
    
    // Validate required shipping fields
    if (!shippingData.fullName || !shippingData.address1 || !shippingData.city || !shippingData.state || !shippingData.postalCode || !shippingData.shippingCountry) {
        showNotification('Please fill in all required shipping fields', 'error');
        return;
    }
    
    // Save data
    userProfile.shipping = shippingData;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    // Update verification status
    updateVerificationStatus('address', true);
    
    showNotification('Shipping address saved successfully!', 'success');
}

function handlePreferencesForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Handle checkboxes for categories
    const categories = [];
    document.querySelectorAll('input[name="categories"]:checked').forEach(checkbox => {
        categories.push(checkbox.value);
    });
    
    const preferencesData = {
        categories: categories,
        allergies: formData.get('allergies'),
        wishlist: formData.get('wishlist'),
        languages: formData.get('languages')
    };
    
    // Save data
    userProfile.preferences = preferencesData;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    showNotification('Gift preferences saved successfully!', 'success');
}

function handlePrivacyForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Handle checkboxes
    const privacyData = {
        profileVisibility: formData.get('profileVisibility'),
        allowChat: formData.has('allowChat'),
        allowFriendRequests: formData.has('allowFriendRequests'),
        allowEmailNotifications: formData.has('allowEmailNotifications'),
        allowSMSNotifications: formData.has('allowSMSNotifications'),
        reportInappropriate: formData.has('reportInappropriate'),
        blockKeywords: formData.has('blockKeywords'),
        verifiedUsersOnly: formData.has('verifiedUsersOnly')
    };
    
    // Save data
    userProfile.privacy = privacyData;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    showNotification('Privacy settings saved successfully!', 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function calculateAge(birthDate = null) {
    const inputDate = birthDate || document.getElementById('birthDate').value;
    if (!inputDate) return 0;
    
    const today = new Date();
    const birth = new Date(inputDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    // Update age display
    const ageDisplay = document.getElementById('ageDisplay');
    if (ageDisplay) {
        if (age >= 18) {
            ageDisplay.textContent = `Age: ${age} ✓ Eligible`;
            ageDisplay.style.color = '#16a34a';
        } else {
            ageDisplay.textContent = `Age: ${age} ✗ Must be 18+`;
            ageDisplay.style.color = '#dc2626';
        }
    }
    
    return age;
}

function updateCurrency() {
    const countrySelect = document.getElementById('country');
    const currency = currencyMap[countrySelect.value];
    
    if (currency) {
        // Update any currency displays in the UI
        console.log(`Selected currency: ${currency}`);
        
        // You can add logic here to update pricing displays based on currency
        showNotification(`Currency set to ${currency}`, 'info');
    }
}

function copyBillingAddress() {
    const sameAsBilling = document.getElementById('sameAsBilling');
    
    if (sameAsBilling.checked && userProfile.payment && userProfile.payment.billingAddress) {
        // Parse billing address and populate shipping fields
        const billingAddress = userProfile.payment.billingAddress;
        const cardName = userProfile.payment.cardName;
        
        document.getElementById('fullName').value = cardName || '';
        
        // For demo purposes, you'd need to parse the billing address properly
        showNotification('Billing address copied to shipping', 'info');
    } else {
        // Clear shipping fields
        ['fullName', 'address1', 'address2', 'city', 'state', 'postalCode'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) field.value = '';
        });
    }
}

function validateCreditCard(cardNumber) {
    // Basic credit card validation (Luhn algorithm would be used in real app)
    const cleanNumber = cardNumber.replace(/\D/g, '');
    return cleanNumber.length >= 13 && cleanNumber.length <= 19;
}

function updateVerificationStatus(type, isVerified) {
    const statusElement = document.getElementById(`${type}Verified`);
    if (statusElement) {
        if (isVerified) {
            statusElement.className = 'badge verified';
            statusElement.innerHTML = `<i class="fas fa-check-circle"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Verified`;
        } else {
            statusElement.className = 'badge pending';
            statusElement.innerHTML = `<i class="fas fa-clock"></i> ${type.charAt(0).toUpperCase() + type.slice(1)} Pending`;
        }
    }
}

function updateUserNameDisplay() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement && userProfile.personal) {
        const fullName = `${userProfile.personal.firstName || 'John'} ${userProfile.personal.lastName || 'Doe'}`;
        userNameElement.textContent = fullName;
    }
}

// ==================== PROFILE PHOTO MANAGEMENT ====================

function setupProfilePhotoUpload() {
    // In a real app, this would handle file upload
    // For now, we'll just show a file input dialog
}

function changeProfilePhoto() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you'd upload this to a server
            // For demo, we'll just show a preview
            const reader = new FileReader();
            reader.onload = function(e) {
                const profileImagePlaceholder = document.querySelector('.profile-image-placeholder');
                if (profileImagePlaceholder) {
                    profileImagePlaceholder.style.backgroundImage = `url(${e.target.result})`;
                    profileImagePlaceholder.style.backgroundSize = 'cover';
                    profileImagePlaceholder.innerHTML = ''; // Remove icon
                }
                showNotification('Profile photo updated!', 'success');
            };
            reader.readAsDataURL(file);
        }
    };
    
    fileInput.click();
}

// ==================== DATA PERSISTENCE ====================

function loadSavedProfile() {
    const saved = localStorage.getItem('userProfile');
    if (saved) {
        userProfile = JSON.parse(saved);
        populateFormsWithSavedData();
        updateVerificationStatuses();
    }
}

function populateFormsWithSavedData() {
    // Populate personal info
    if (userProfile.personal) {
        Object.keys(userProfile.personal).forEach(key => {
            const field = document.getElementById(key);
            if (field) field.value = userProfile.personal[key];
        });
        calculateAge();
    }
    
    // Populate other forms similarly...
    // (In a real app, you'd populate all form fields)
}

function updateVerificationStatuses() {
    // Update verification badges based on saved data
    updateVerificationStatus('age', userProfile.personal && calculateAge(userProfile.personal.birthDate) >= 18);
    updateVerificationStatus('payment', userProfile.payment && userProfile.payment.cardNumber);
    updateVerificationStatus('address', userProfile.shipping && userProfile.shipping.address1);
}

// ==================== FORM VALIDATION ====================

function setupFormValidation() {
    // Real-time validation for credit card
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
            e.target.value = value;
            
            // Visual feedback
            if (validateCreditCard(value)) {
                e.target.style.borderColor = '#16a34a';
            } else {
                e.target.style.borderColor = '#dc2626';
            }
        });
    }
    
    // Real-time validation for expiry date
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            e.target.value = value;
        });
    }
    
    // Real-time validation for CVV
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', function(e) {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }
}

// ==================== NOTIFICATIONS ====================

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle',
        warning: 'fa-exclamation-triangle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type] || icons.info}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        max-width: 400px;
        font-weight: 500;
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        margin-left: 10px;
        padding: 0;
        font-size: 14px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationColor(type) {
    const colors = {
        success: '#16a34a',
        error: '#dc2626',
        info: '#3b82f6',
        warning: '#d97706'
    };
    return colors[type] || colors.info;
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(notificationStyles);

// ==================== EXPORT FUNCTIONS ====================

// Make functions available globally
window.showTab = showTab;
window.calculateAge = calculateAge;
window.updateCurrency = updateCurrency;
window.copyBillingAddress = copyBillingAddress;
window.changeProfilePhoto = changeProfilePhoto; 