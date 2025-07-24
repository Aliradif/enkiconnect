// 🏺 EnkiConnect Real Authentication
// This replaces the simulation in script.js with real Supabase auth

document.addEventListener('DOMContentLoaded', function() {
    initializeRealAuth();
});

async function initializeRealAuth() {
    // Wait for EnkiConnect to be available
    if (!window.EnkiConnect) {
        setTimeout(initializeRealAuth, 100);
        return;
    }

    try {
        // Check if user is already authenticated
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        
        if (user) {
            // User is authenticated, redirect to categories if on sign-in page
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
                window.location.href = 'categories.html';
                return;
            }
            
            // Update UI with user info if on other pages
            updateUIWithUser(user);
        }
    } catch (error) {
        // Auth session missing is normal for new users
        console.log('No active session - user needs to sign in');
    }
    
    // Set up form handlers
    setupAuthForms();
}

function setupAuthForms() {
    // Email form handler
    const emailForm = document.querySelector('.email-form');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailAuth);
    }
    
    // Social button handlers
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(button => {
        button.addEventListener('click', handleSocialAuth);
    });
    
    // Skip demo button (keep existing functionality)
    const skipBtn = document.querySelector('.demo-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', skipToCategories);
    }
}

async function handleEmailAuth(e) {
    e.preventDefault();
    console.log('🏺 Email auth started');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('.signin-btn');
    
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    
    if (!email || !password) {
        showAuthError('Please fill in all fields');
        return;
    }
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    submitBtn.disabled = true;
    
    try {
        console.log('🔄 Attempting sign in with email:', email);
        // Try to sign in first
        let result = await window.EnkiConnect.auth.signIn(email, password);
        console.log('📋 Sign in result:', result);
        console.log('📋 Result success status:', result.success);
        console.log('📋 Result error:', result.error);
        
        if (!result.success) {
            console.log('❌ Sign in failed with error:', result.error);
            
            // Show appropriate error message
            if (result.error.includes('Invalid login credentials') || result.error.includes('Email not confirmed')) {
                showAuthError('Invalid email or password. Please check your credentials and try again.');
            } else if (result.error.includes('Email not confirmed')) {
                showAuthError('Please check your email and click the verification link before signing in.');
            } else {
                showAuthError(result.error || 'Sign in failed. Please try again.');
            }
        } else {
            // Successful sign in
            console.log('✅ Sign in successful for existing user!');
            console.log('📋 User data:', result.data?.user);
            
            showAuthSuccess('👋 Welcome back!');
            setTimeout(() => {
                console.log('🔄 Redirecting to categories...');
                window.location.href = 'categories.html';
            }, 1500);
        }
    } catch (error) {
        console.error('❌ Auth error:', error);
        showAuthError(error.message || 'Authentication failed');
    } finally {
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleSocialAuth(e) {
    e.preventDefault();
    
    const provider = e.currentTarget.dataset.provider;
    const button = e.currentTarget;
    
    // Show loading state
    const originalHTML = button.innerHTML;
    button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Connecting...`;
    button.disabled = true;
    
    try {
        const result = await window.EnkiConnect.auth.signInWithProvider(provider);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        // Success - Supabase will handle the redirect
        showAuthSuccess(`Connecting with ${provider}...`);
    } catch (error) {
        console.error('Social auth error:', error);
        showAuthError(`Failed to connect with ${provider}`);
        
        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;
    }
}

function updateUIWithUser(user) {
    // Update user name in header if present
    const userNameElement = document.querySelector('.user-name');
    if (userNameElement) {
        userNameElement.textContent = user.user_metadata?.full_name || user.email;
    }
    
    // Update profile button
    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
        profileBtn.style.display = 'flex';
    }
    
    // Show logout option
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

async function handleLogout() {
    const result = await window.EnkiConnect.auth.signOut();
    if (result.success) {
        showAuthSuccess('Logged out successfully');
        // Redirect handled by signOut function
    } else {
        showAuthError('Logout failed');
    }
}

function showAuthError(message) {
    // Remove existing notifications
    document.querySelectorAll('.auth-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'auth-notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showAuthSuccess(message) {
    // Remove existing notifications
    document.querySelectorAll('.auth-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'auth-notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Keep the skip function for demo purposes
function skipToCategories() {
    window.location.href = 'categories.html';
}

// Listen for auth state changes
setTimeout(() => {
    window.EnkiConnect?.auth.onAuthStateChange((event, session) => {
        console.log('Auth state changed:', event, session);
        
        if (event === 'SIGNED_IN' && session) {
            // User signed in successfully
            window.location.href = 'categories.html';
        } else if (event === 'SIGNED_OUT') {
            // User signed out
            window.location.href = 'index.html';
        }
    });
}, 1000);

// Show server setup instructions
function showServerInstructions() {
    alert(`To enable social login:

1. Open terminal in enkiconnect-main folder
2. Run: npx vite --host
3. Open http://localhost:3000 instead of file://

This will enable Google, Apple, Facebook, etc. authentication.

For now, use email/password authentication below!`);
} 