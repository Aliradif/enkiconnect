// ==================== GLOBAL FUNCTIONS ====================

// Page navigation function
function navigateToCategories() {
    window.location.href = 'categories.html';
}

// Skip to categories without sign-in
function skipToCategories() {
    // Add a quick animation effect
    const demoBtn = event.target;
    const originalText = demoBtn.innerHTML;
    
    demoBtn.innerHTML = '<i class="fas fa-rocket"></i> Launching Demo...';
    demoBtn.style.background = 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)';
    
    setTimeout(() => {
        window.location.href = 'categories.html';
    }, 800);
}

// ==================== SIGN-IN PAGE FUNCTIONS ====================

// Social media sign-in handlers
function signInWith(provider) {
    console.log(`Signing in with ${provider}`);
    
    // Add loading animation to the clicked button
    const button = event.target.closest('.social-btn');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Connecting...</span>';
    button.disabled = true;
    
    // Simulate authentication process - FASTER FOR TESTING
    setTimeout(() => {
        // In a real app, you would integrate with actual OAuth providers
        // For demo purposes, we'll just navigate to categories page
        // alert(`Successfully signed in with ${provider}!`); // Removed alert for faster testing
        navigateToCategories();
    }, 500); // Reduced from 2000ms to 500ms for faster testing
    
    // Reset button after timeout (in case navigation fails)
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 5000);
}

// Email form handler
document.addEventListener('DOMContentLoaded', function() {
    const emailForm = document.querySelector('.email-form');
    
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = this.querySelector('input[type="email"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            // Add loading state to sign-in button
            const submitBtn = this.querySelector('.signin-btn');
            const originalText = submitBtn.textContent;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
            submitBtn.disabled = true;
            
            // Simulate authentication - FASTER FOR TESTING
            setTimeout(() => {
                // alert('Successfully signed in!'); // Removed alert for faster testing
                navigateToCategories();
            }, 500); // Reduced from 1500ms to 500ms for faster testing
            
            // Reset button
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 3000);
        });
    }
    
    // Add input focus animations
    const inputs = document.querySelectorAll('.email-form input');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentNode.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentNode.classList.remove('focused');
            }
        });
    });
});

// ==================== CATEGORIES PAGE FUNCTIONS ====================

// Category selection handler
function selectCategory(category) {
    console.log(`Selected category: ${category}`);
    
    const card = event.currentTarget;
    
    // Add selection animation
    card.style.transform = 'scale(0.95)';
    card.style.transition = 'transform 0.1s ease';
    
    setTimeout(() => {
        card.style.transform = 'scale(1.05)';
    }, 100);
    
    setTimeout(() => {
        card.style.transform = '';
        card.style.transition = '';
    }, 300);
    
    // Show confirmation and navigate
    setTimeout(() => {
        const categoryNames = {
            'world': 'Play with World',
            'company': 'Play with Your Company',
            'friends': 'Play with Friends',
            'family': 'Play with Family'
        };
        
        if (confirm(`Ready to start "${categoryNames[category]}"? This will take you to the game lobby.`)) {
            // In a real app, this would navigate to the specific game mode
            alert(`Launching ${categoryNames[category]} mode...`);
            // You can add navigation to specific game pages here
            // window.location.href = `game-${category}.html`;
        }
    }, 400);
}

// Initialize categories page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.categories-page')) {
        // Initialize floating particles animation
        createFloatingParticles();
        
        // Add hover sound effects (optional)
        const categoryCards = document.querySelectorAll('.category-card');
        categoryCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                // Add subtle hover effect
                this.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.4)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.boxShadow = '';
            });
        });
        
        // Profile button functionality
        const profileBtn = document.querySelector('.profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', function() {
                // Create dropdown menu
                showProfileMenu();
            });
        }
        
        // Add keyboard navigation
        document.addEventListener('keydown', function(e) {
            const cards = document.querySelectorAll('.category-card');
            let currentIndex = Array.from(cards).findIndex(card => card.classList.contains('focused'));
            
            switch(e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    currentIndex = (currentIndex + 1) % cards.length;
                    focusCard(cards[currentIndex]);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    currentIndex = currentIndex <= 0 ? cards.length - 1 : currentIndex - 1;
                    focusCard(cards[currentIndex]);
                    break;
                case 'Enter':
                    e.preventDefault();
                    const focusedCard = document.querySelector('.category-card.focused');
                    if (focusedCard) {
                        focusedCard.click();
                    }
                    break;
            }
        });
    }
});

// Create floating particles animation
function createFloatingParticles() {
    const container = document.querySelector('.floating-particles');
    if (!container) return;
    
    // Create additional floating particles
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.2});
            border-radius: 50%;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            animation: float ${Math.random() * 4 + 4}s ease-in-out infinite ${Math.random() * 2}s;
            pointer-events: none;
        `;
        container.appendChild(particle);
    }
}

// Profile menu functionality
function showProfileMenu() {
    // Remove existing menu if present
    const existingMenu = document.querySelector('.profile-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const menu = document.createElement('div');
    menu.className = 'profile-dropdown';
    menu.innerHTML = `
        <div class="profile-menu-item" onclick="viewProfile()">
            <i class="fas fa-user"></i> View Profile
        </div>
        <div class="profile-menu-item" onclick="showSettings()">
            <i class="fas fa-cog"></i> Settings
        </div>
        <div class="profile-menu-item" onclick="showStats()">
            <i class="fas fa-chart-bar"></i> Statistics
        </div>
        <div class="profile-menu-item" onclick="signOut()">
            <i class="fas fa-sign-out-alt"></i> Sign Out
        </div>
    `;
    
    menu.style.cssText = `
        position: absolute;
        top: 70px;
        right: 40px;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        padding: 10px 0;
        min-width: 180px;
        z-index: 1000;
        animation: dropdownSlide 0.3s ease-out;
    `;
    
    // Add dropdown animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes dropdownSlide {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .profile-menu-item {
            padding: 12px 20px;
            color: #333;
            cursor: pointer;
            transition: background 0.2s ease;
            display: flex;
            align-items: center;
        }
        .profile-menu-item:hover {
            background: rgba(76, 99, 210, 0.1);
        }
        .profile-menu-item i {
            margin-right: 10px;
            width: 16px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(menu);
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && !e.target.closest('.profile-btn')) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 100);
}

// Profile menu item handlers
function viewProfile() {
    alert('Profile page would open here');
    document.querySelector('.profile-dropdown')?.remove();
}

function showSettings() {
    alert('Settings page would open here');
    document.querySelector('.profile-dropdown')?.remove();
}

function showStats() {
    alert('Statistics page would open here');
    document.querySelector('.profile-dropdown')?.remove();
}

function signOut() {
    if (confirm('Are you sure you want to sign out?')) {
        alert('Signing out...');
        window.location.href = 'index.html';
    }
    document.querySelector('.profile-dropdown')?.remove();
}

// Focus card for keyboard navigation
function focusCard(card) {
    document.querySelectorAll('.category-card').forEach(c => c.classList.remove('focused'));
    card.classList.add('focused');
    card.style.outline = '3px solid rgba(255, 255, 255, 0.5)';
    card.style.outlineOffset = '2px';
    
    // Remove outline after interaction
    setTimeout(() => {
        card.style.outline = '';
        card.style.outlineOffset = '';
    }, 3000);
}

// ==================== UTILITY FUNCTIONS ====================

// Smooth scroll utility
function smoothScrollTo(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Add loading animation utility
function addLoadingAnimation(element, originalContent) {
    element.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    element.disabled = true;
    
    return function restore() {
        element.innerHTML = originalContent;
        element.disabled = false;
    };
}

// Mobile touch handling
if ('ontouchstart' in window) {
    document.addEventListener('touchstart', function() {}, true);
}

// Page loading animation
window.addEventListener('load', function() {
    document.body.classList.add('loaded');
    
    // Add loaded class for additional animations
    const style = document.createElement('style');
    style.textContent = `
        body.loaded .signin-content,
        body.loaded .category-card {
            animation-play-state: running;
        }
    `;
    document.head.appendChild(style);
}); 