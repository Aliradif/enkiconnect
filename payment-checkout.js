// 🏺 EnkiConnect - Stripe Payment Processing
// Secure payment integration with beautiful UX

let stripe = null;
let elements = null;
let cardElement = null;
let paymentIntent = null;
let currentUser = null;

// Payment data
let paymentData = {
    exchangeType: 'Friend Exchange',
    organizerName: 'Sarah Johnson', 
    participantCount: '5 friends',
    budgetRange: '$50 - $100',
    giftAmount: 75.00,
    serviceFee: 3.75,
    processingFee: 1.99,
    totalAmount: 80.74,
    currency: 'USD'
};

// Initialize payment system when page loads
document.addEventListener('DOMContentLoaded', async function() {
    await initializePaymentSystem();
    populateOrderSummary();
    setupFormValidation();
});

async function initializePaymentSystem() {
    console.log('🏺 Initializing Payment System...');
    
    try {
        // Get current user
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        if (!user) {
            console.error('❌ No authenticated user found');
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = user;
        
        // Pre-fill user information
        if (user.email) {
            document.getElementById('email').value = user.email;
        }
        if (user.user_metadata?.full_name) {
            const nameParts = user.user_metadata.full_name.split(' ');
            document.getElementById('firstName').value = nameParts[0] || '';
            document.getElementById('lastName').value = nameParts.slice(1).join(' ') || '';
        }
        
        // Initialize Stripe (using demo/test key)
        await initializeStripe();
        
        console.log('✅ Payment system initialized');
        
    } catch (error) {
        console.error('❌ Payment initialization error:', error);
        showError('Failed to initialize payment system. Please refresh and try again.');
    }
}

async function initializeStripe() {
    // For demo purposes, we'll simulate Stripe initialization
    // In production, you'd use your actual Stripe publishable key
    console.log('🔗 Initializing Stripe...');
    
    // Simulate Stripe initialization
    stripe = {
        elements: () => ({
            create: (type, options) => ({
                mount: (selector) => {
                    // Create a styled demo card input
                    const cardContainer = document.getElementById('card-element');
                    cardContainer.innerHTML = `
                        <div class="demo-card-input">
                            <input type="text" placeholder="1234 5678 9012 3456" class="card-number" maxlength="19">
                            <div class="card-details">
                                <input type="text" placeholder="MM/YY" class="card-expiry" maxlength="5">
                                <input type="text" placeholder="CVC" class="card-cvc" maxlength="4">
                            </div>
                        </div>
                    `;
                    
                    // Add input formatting
                    setupCardInputFormatting();
                },
                on: (event, callback) => {
                    // Simulate Stripe events
                }
            })
        }),
        confirmCardPayment: async (clientSecret, data) => {
            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            return {
                paymentIntent: {
                    id: 'pi_demo_' + Date.now(),
                    status: 'succeeded',
                    amount: Math.round(paymentData.totalAmount * 100),
                    currency: paymentData.currency.toLowerCase()
                }
            };
        }
    };
    
    elements = stripe.elements();
    cardElement = elements.create('card', {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                }
            }
        }
    });
    
    cardElement.mount('#card-element');
}

function setupCardInputFormatting() {
    const cardNumber = document.querySelector('.card-number');
    const cardExpiry = document.querySelector('.card-expiry');
    const cardCvc = document.querySelector('.card-cvc');
    
    // Format card number
    cardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
    
    // Format expiry date
    cardExpiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
    
    // Validate CVC
    cardCvc.addEventListener('input', function(e) {
        e.target.value = e.target.value.replace(/\D/g, '');
    });
}

function populateOrderSummary() {
    document.getElementById('exchangeType').textContent = paymentData.exchangeType;
    document.getElementById('organizerName').textContent = paymentData.organizerName;
    document.getElementById('participantCount').textContent = paymentData.participantCount;
    document.getElementById('budgetRange').textContent = paymentData.budgetRange;
    document.getElementById('giftAmount').textContent = `$${paymentData.giftAmount.toFixed(2)}`;
    document.getElementById('serviceFee').textContent = `$${paymentData.serviceFee.toFixed(2)}`;
    document.getElementById('processingFee').textContent = `$${paymentData.processingFee.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `$${paymentData.totalAmount.toFixed(2)}`;
    
    // Update button text
    document.querySelector('.button-text').textContent = `Pay $${paymentData.totalAmount.toFixed(2)} Securely`;
}

function setupFormValidation() {
    const form = document.getElementById('payment-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await handlePaymentSubmit();
    });
    
    // Real-time validation
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (!value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && !isValidEmail(value)) {
        showFieldError(field, 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.classList.add('error');
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

async function handlePaymentSubmit() {
    const submitButton = document.getElementById('submit-button');
    const buttonText = document.querySelector('.button-text'); 
    const loadingSpinner = document.querySelector('.loading-spinner');
    
    try {
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Show loading state
        submitButton.disabled = true;
        buttonText.style.display = 'none';
        loadingSpinner.style.display = 'block';
        
        // Show processing modal
        showProcessingModal();
        
        // Simulate payment processing
        console.log('💳 Processing payment...');
        
        // Create payment intent (in real app, this would be a backend call)
        const paymentIntentData = await createPaymentIntent();
        
        // Confirm payment with Stripe
        const result = await stripe.confirmCardPayment(paymentIntentData.client_secret, {
            payment_method: {
                card: cardElement,
                billing_details: {
                    name: `${document.getElementById('firstName').value} ${document.getElementById('lastName').value}`,
                    email: document.getElementById('email').value,
                    address: {
                        line1: document.getElementById('billingAddress').value,
                        country: document.getElementById('country').value
                    }
                }
            }
        });
        
        if (result.error) {
            throw new Error(result.error.message);
        }
        
        // Payment succeeded
        console.log('✅ Payment successful:', result.paymentIntent);
        
        // Hide processing modal
        hideProcessingModal();
        
        // Show success modal
        showSuccessModal(result.paymentIntent);
        
        // Save payment record (in real app, this would save to database)
        await savePaymentRecord(result.paymentIntent);
        
    } catch (error) {
        console.error('❌ Payment error:', error);
        
        // Hide processing modal
        hideProcessingModal();
        
        // Reset button state
        submitButton.disabled = false;
        buttonText.style.display = 'block';
        loadingSpinner.style.display = 'none';
        
        // Show error
        showError(error.message || 'Payment failed. Please try again.');
    }
}

function validateForm() {
    const form = document.getElementById('payment-form');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    // Validate card inputs
    const cardNumber = document.querySelector('.card-number');
    const cardExpiry = document.querySelector('.card-expiry');
    const cardCvc = document.querySelector('.card-cvc');
    
    if (!cardNumber.value.replace(/\s/g, '')) {
        showError('Please enter a valid card number');
        isValid = false;
    }
    
    if (!cardExpiry.value || cardExpiry.value.length < 5) {
        showError('Please enter a valid expiry date');
        isValid = false;
    }
    
    if (!cardCvc.value || cardCvc.value.length < 3) {
        showError('Please enter a valid CVC');
        isValid = false;
    }
    
    return isValid;
}

async function createPaymentIntent() {
    // In a real app, this would make an API call to your backend
    // which would create a PaymentIntent with Stripe
    
    console.log('🔄 Creating payment intent...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
        client_secret: 'pi_demo_client_secret_' + Date.now(),
        amount: Math.round(paymentData.totalAmount * 100),
        currency: paymentData.currency.toLowerCase()
    };
}

async function savePaymentRecord(paymentIntent) {
    console.log('💾 Saving payment record...');
    
    const paymentRecord = {
        user_id: currentUser.id,
        payment_intent_id: paymentIntent.id,
        amount: paymentData.totalAmount,
        currency: paymentData.currency,
        status: 'completed',
        exchange_type: paymentData.exchangeType,
        created_at: new Date().toISOString()
    };
    
    // In a real app, this would save to Supabase
    console.log('Payment record:', paymentRecord);
}

function showProcessingModal() {
    const modal = document.getElementById('processingModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function hideProcessingModal() {
    const modal = document.getElementById('processingModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showSuccessModal(paymentIntent) {
    const modal = document.getElementById('successModal');
    
    // Update success details
    document.getElementById('transactionId').textContent = paymentIntent.id;
    document.getElementById('paidAmount').textContent = `$${paymentData.totalAmount.toFixed(2)}`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function handlePaymentSuccess() {
    // Redirect to appropriate page based on exchange type
    console.log('🎉 Redirecting after successful payment...');
    
    // In a real app, you might redirect to a confirmation page or dashboard
    window.location.href = 'categories.html?payment=success';
}

function showError(message) {
    // Remove existing errors
    document.querySelectorAll('.payment-error').forEach(e => e.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'payment-error';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <span>${message}</span>
    `;
    
    const form = document.getElementById('payment-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 10000);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Currency conversion (demo)
document.getElementById('currency').addEventListener('change', function(e) {
    const currency = e.target.value;
    const rates = { USD: 1, CAD: 1.25, EUR: 0.85, GBP: 0.73 };
    const rate = rates[currency] || 1;
    
    // Convert amounts
    const convertedGift = paymentData.giftAmount * rate;
    const convertedService = paymentData.serviceFee * rate;
    const convertedProcessing = paymentData.processingFee * rate;
    const convertedTotal = paymentData.totalAmount * rate;
    
    // Update display
    document.getElementById('giftAmount').textContent = `${getCurrencySymbol(currency)}${convertedGift.toFixed(2)}`;
    document.getElementById('serviceFee').textContent = `${getCurrencySymbol(currency)}${convertedService.toFixed(2)}`;
    document.getElementById('processingFee').textContent = `${getCurrencySymbol(currency)}${convertedProcessing.toFixed(2)}`;
    document.getElementById('totalAmount').textContent = `${getCurrencySymbol(currency)}${convertedTotal.toFixed(2)}`;
    document.querySelector('.button-text').textContent = `Pay ${getCurrencySymbol(currency)}${convertedTotal.toFixed(2)} Securely`;
    
    // Update payment data
    paymentData.currency = currency;
    paymentData.totalAmount = convertedTotal;
});

function getCurrencySymbol(currency) {
    const symbols = { USD: '$', CAD: '$', EUR: '€', GBP: '£' };
    return symbols[currency] || '$';
} 