// ==================== CHAT FUNCTIONALITY ====================

let chatTimer;
let remainingTime = 18 * 60 * 60 + 24 * 60 + 15; // 18 hours, 24 minutes, 15 seconds
let isTyping = false;
let typingTimeout;

// Initialize chat page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.chat-page')) {
        initializeChat();
        startCountdown();
        setupChatEventListeners();
        simulatePartnerActivity();
    }
});

function initializeChat() {
    // Scroll to bottom of messages
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Focus message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.focus();
    }
    
    // Add typing indicator listener
    if (messageInput) {
        messageInput.addEventListener('input', handleTyping);
    }
}

// ==================== COUNTDOWN TIMER ====================

function startCountdown() {
    chatTimer = setInterval(() => {
        remainingTime--;
        updateCountdownDisplay();
        
        if (remainingTime <= 0) {
            endChatSession();
        }
        
        // Warning notifications
        if (remainingTime === 60 * 60) { // 1 hour remaining
            showChatNotification('⏰ 1 hour remaining in your chat window!', 'warning');
        } else if (remainingTime === 15 * 60) { // 15 minutes remaining
            showChatNotification('⚠️ Only 15 minutes left to chat!', 'warning');
        } else if (remainingTime === 5 * 60) { // 5 minutes remaining
            showChatNotification('🚨 Final 5 minutes! Wrap up your conversation.', 'error');
        }
    }, 1000);
}

function updateCountdownDisplay() {
    const countdownElement = document.getElementById('countdown');
    if (!countdownElement) return;
    
    const hours = Math.floor(remainingTime / 3600);
    const minutes = Math.floor((remainingTime % 3600) / 60);
    const seconds = remainingTime % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    countdownElement.textContent = timeString;
    
    // Change color based on remaining time
    if (remainingTime <= 5 * 60) { // 5 minutes
        countdownElement.style.color = '#dc2626';
    } else if (remainingTime <= 15 * 60) { // 15 minutes
        countdownElement.style.color = '#d97706';
    } else if (remainingTime <= 60 * 60) { // 1 hour
        countdownElement.style.color = '#4c63d2';
    }
}

function endChatSession() {
    clearInterval(chatTimer);
    
    // Show final message
    addSystemMessage('Chat window has closed. Thank you for the wonderful cultural exchange!');
    
    // Disable input
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.querySelector('.send-btn');
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = 'Chat session has ended';
    }
    
    if (sendBtn) {
        sendBtn.disabled = true;
    }
    
    // Show modal for post-chat actions
    setTimeout(() => {
        showPostChatModal();
    }, 2000);
}

// ==================== MESSAGE HANDLING ====================

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput || !messageInput.value.trim()) return;
    
    const message = messageInput.value.trim();
    addMyMessage(message);
    messageInput.value = '';
    
    // Stop typing indicator
    clearTyping();
    
    // Simulate partner response after delay
    setTimeout(() => {
        simulatePartnerResponse(message);
    }, Math.random() * 3000 + 1000); // 1-4 seconds
}

function addMyMessage(content) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message my-message';
    messageElement.innerHTML = `
        <div class="message-bubble">
            <div class="message-content">${escapeHtml(content)}</div>
            <div class="message-time">just now</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function addPartnerMessage(content) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message partner-message';
    messageElement.innerHTML = `
        <div class="message-avatar">
            <img src="https://via.placeholder.com/32x32?text=MK" alt="Maria">
        </div>
        <div class="message-bubble">
            <div class="message-content">${escapeHtml(content)}</div>
            <div class="message-time">just now</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

function addSystemMessage(content) {
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = 'message system-message';
    messageElement.innerHTML = `
        <div class="message-content">
            <i class="fas fa-info-circle"></i>
            <span>${escapeHtml(content)}</span>
        </div>
        <div class="message-time">just now</div>
    `;
    
    messagesContainer.appendChild(messageElement);
    scrollToBottom();
}

// ==================== TYPING INDICATORS ====================

function handleTyping() {
    if (!isTyping) {
        isTyping = true;
        // You could send typing indicator to partner here
    }
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        clearTyping();
    }, 1000);
}

function clearTyping() {
    isTyping = false;
    // Remove typing indicator
}

function showPartnerTyping() {
    // Remove existing typing indicator
    const existingTyping = document.querySelector('.typing-indicator');
    if (existingTyping) {
        existingTyping.remove();
    }
    
    const messagesContainer = document.getElementById('messagesContainer');
    if (!messagesContainer) return;
    
    const typingElement = document.createElement('div');
    typingElement.className = 'message system-message typing-indicator';
    typingElement.innerHTML = `
        <div class="message-content">
            <i class="fas fa-info-circle"></i>
            <span>Maria is typing...</span>
        </div>
    `;
    
    messagesContainer.appendChild(typingElement);
    scrollToBottom();
}

function removePartnerTyping() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// ==================== PARTNER SIMULATION ====================

function simulatePartnerActivity() {
    // Simulate partner coming online
    setTimeout(() => {
        const onlineIndicator = document.querySelector('.online-indicator');
        if (onlineIndicator) {
            onlineIndicator.style.backgroundColor = '#10b981';
        }
    }, 2000);
    
    // Simulate occasional partner messages
    setInterval(() => {
        if (Math.random() < 0.1 && remainingTime > 60) { // 10% chance every interval
            simulateRandomPartnerMessage();
        }
    }, 30000); // Every 30 seconds
}

function simulatePartnerResponse(userMessage) {
    // Show typing indicator
    showPartnerTyping();
    
    setTimeout(() => {
        removePartnerTyping();
        
        // Generate contextual response
        const response = generatePartnerResponse(userMessage);
        addPartnerMessage(response);
    }, Math.random() * 2000 + 1000);
}

function generatePartnerResponse(userMessage) {
    const responses = [
        "That's really interesting! I'd love to learn more about that.",
        "Wow, that's so different from how we do things here in Germany!",
        "I've always wondered about that! Thanks for sharing.",
        "That sounds amazing! We have something similar here, but it's quite different.",
        "I'm learning so much about Canadian culture from you! 🇨🇦",
        "That's fascinating! I'll have to remember that when I visit Canada someday.",
        "Your perspective is really eye-opening. I never thought about it that way.",
        "Thanks for explaining that! I'm definitely going to look that up later."
    ];
    
    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('food') || lowerMessage.includes('eat')) {
        return "German food is quite hearty! Have you ever tried schnitzel or sauerbraten? I'm curious about Canadian specialties!";
    } else if (lowerMessage.includes('weather') || lowerMessage.includes('cold')) {
        return "Berlin winters can be pretty cold too, but I heard Canadian winters are legendary! How do you deal with all that snow?";
    } else if (lowerMessage.includes('language') || lowerMessage.includes('german')) {
        return "My English is getting better through conversations like this! German has some funny long words - Donaudampfschifffahrtsgesellschaftskapitän is a real word! 😄";
    } else if (lowerMessage.includes('travel') || lowerMessage.includes('visit')) {
        return "I would love to visit Canada someday! The nature looks absolutely breathtaking in photos. What's your favorite place there?";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function simulateRandomPartnerMessage() {
    const randomMessages = [
        "I just looked up something you mentioned earlier - so cool!",
        "Quick question: what's the weather like there right now?",
        "I'm really enjoying our conversation! 😊",
        "I found a great photo of my city to show you later!",
        "This cultural exchange is exactly what I hoped it would be!",
        "I'm definitely adding some Canadian things to my travel list now!"
    ];
    
    showPartnerTyping();
    
    setTimeout(() => {
        removePartnerTyping();
        const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
        addPartnerMessage(message);
    }, 3000);
}

// ==================== EVENT LISTENERS ====================

function setupChatEventListeners() {
    // Enter key to send message
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    // Suggestion buttons
    const suggestionBtns = document.querySelectorAll('.suggestion-btn');
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Add a subtle animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}

// ==================== SUGGESTION FUNCTIONS ====================

function sendSuggestion(text) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = text;
        sendMessage();
    }
}

// ==================== CHAT ACTIONS ====================

function showGiftReveal() {
    const modal = document.getElementById('giftModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeGiftModal() {
    const modal = document.getElementById('giftModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function reportUser() {
    if (confirm('Are you sure you want to report this user? This will end the chat session immediately.')) {
        showChatNotification('User reported. Our team will review this conversation.', 'info');
        // In a real app, this would send a report to moderators
        setTimeout(() => {
            endChatSession();
        }, 2000);
    }
}

function addToFriends() {
    if (confirm('Would you like to add Maria as a friend? You can stay connected after the chat window closes.')) {
        showChatNotification('Friend request sent! Maria will be notified.', 'success');
        
        // Update button
        const friendBtn = document.querySelector('[onclick="addToFriends()"]');
        if (friendBtn) {
            friendBtn.innerHTML = '<i class="fas fa-user-check"></i>';
            friendBtn.style.background = '#10b981';
            friendBtn.onclick = null;
            friendBtn.title = 'Friend request sent';
        }
    }
}

function closeChat() {
    if (confirm('Are you sure you want to close this chat? You won\'t be able to reopen it.')) {
        endChatSession();
    }
}

function attachPhoto() {
    // Create file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            // In a real app, you'd upload this
            showChatNotification('Photo sharing will be available in the full version!', 'info');
        }
    };
    
    fileInput.click();
}

function showEmojiPicker() {
    // Simple emoji insertion
    const emojis = ['😊', '😄', '🎁', '❤️', '👍', '🙏', '🎉', '🌟', '🇨🇦', '🇩🇪'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value += emoji;
        messageInput.focus();
    }
}

function toggleTranslation() {
    const toggleBtn = document.querySelector('.toggle-translate');
    const isEnabled = toggleBtn.textContent === 'Disable';
    
    if (isEnabled) {
        toggleBtn.textContent = 'Enable';
        showChatNotification('Auto-translation disabled', 'info');
    } else {
        toggleBtn.textContent = 'Disable';
        showChatNotification('Auto-translation enabled', 'info');
    }
}

// ==================== UTILITY FUNCTIONS ====================

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showChatNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `chat-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: ${getNotificationColor(type)};
        color: white;
        padding: 12px 20px;
        border-radius: 25px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideDown 0.3s ease-out;
        font-weight: 500;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#dc2626',
        warning: '#d97706',
        info: '#3b82f6'
    };
    return colors[type] || colors.info;
}

function showPostChatModal() {
    const modal = document.createElement('div');
    modal.className = 'post-chat-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h3><i class="fas fa-heart"></i> Thank You for the Amazing Chat!</h3>
            <p>Your 24-hour window with Maria has ended. What would you like to do next?</p>
            
            <div class="post-chat-actions">
                <button class="action-btn primary" onclick="rateChatExperience()">
                    <i class="fas fa-star"></i> Rate Experience
                </button>
                <button class="action-btn" onclick="viewGiftStatus()">
                    <i class="fas fa-gift"></i> View Gift Status
                </button>
                <button class="action-btn" onclick="findNewMatch()">
                    <i class="fas fa-users"></i> Find New Match
                </button>
                <button class="action-btn" onclick="goHome()">
                    <i class="fas fa-home"></i> Go Home
                </button>
            </div>
        </div>
    `;
    
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    document.body.appendChild(modal);
}

function rateChatExperience() {
    showChatNotification('Thank you for your feedback!', 'success');
    setTimeout(() => window.location.href = 'categories.html', 1000);
}

function viewGiftStatus() {
    showGiftReveal();
}

function findNewMatch() {
    if (confirm('Join the queue for another global match?')) {
        window.location.href = 'setup-world.html';
    }
}

function goHome() {
    window.location.href = 'categories.html';
}

// Add notification animations
const chatStyles = document.createElement('style');
chatStyles.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-20px); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-20px); opacity: 0; }
    }
`;
document.head.appendChild(chatStyles);

// Make functions globally available
window.sendMessage = sendMessage;
window.sendSuggestion = sendSuggestion;
window.handleKeyPress = handleKeyPress;
window.showGiftReveal = showGiftReveal;
window.closeGiftModal = closeGiftModal;
window.reportUser = reportUser;
window.addToFriends = addToFriends;
window.closeChat = closeChat;
window.attachPhoto = attachPhoto;
window.showEmojiPicker = showEmojiPicker;
window.toggleTranslation = toggleTranslation; 