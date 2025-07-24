// 🏺 EnkiConnect - Real-Time Chat System
// Advanced chat with Supabase Realtime, typing indicators, and photo sharing

let realtimeChannel = null;
let currentUser = null;
let chatPartner = null;
let isTyping = false;
let typingTimeout = null;
let chatTimer = null;
let timeRemaining = 24 * 60 * 60; // 24 hours in seconds

// Initialize chat when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeRealtimeChat();
    startChatTimer();
    setupMessageInput();
});

async function initializeRealtimeChat() {
    console.log('🏺 Initializing Real-Time Chat System...');
    
    try {
        // Get current user
        const { user } = await window.EnkiConnect.auth.getCurrentUser();
        if (!user) {
            console.error('❌ No authenticated user found');
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = user;
        console.log('✅ Current user:', currentUser.email);
        
        // Initialize Supabase Realtime
        await initializeSupabaseRealtime();
        
        // Set up connection status
        updateConnectionStatus('online');
        
        // Auto-scroll to bottom
        scrollToBottom();
        
    } catch (error) {
        console.error('❌ Chat initialization error:', error);
        updateConnectionStatus('error');
    }
}

async function initializeSupabaseRealtime() {
    try {
        // Create a unique channel for this chat session
        const chatId = getChatId(); // Get from URL params or generate
        const channelName = `chat_${chatId}`;
        
        console.log('🔗 Connecting to channel:', channelName);
        
        // Create Supabase Realtime channel
        realtimeChannel = window.EnkiConnect.supabase
            .channel(channelName)
            .on('broadcast', { event: 'message' }, (payload) => {
                console.log('📨 Received message:', payload);
                handleIncomingMessage(payload.payload);
            })
            .on('broadcast', { event: 'typing' }, (payload) => {
                console.log('⌨️ Typing event:', payload);
                handleTypingEvent(payload.payload);
            })
            .on('presence', { event: 'sync' }, () => {
                console.log('👥 Presence sync');
                updateOnlineStatus();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('👋 User joined:', key, newPresences);
                updateConnectionStatus('online');
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('👋 User left:', key, leftPresences);
                updatePartnerStatus('offline');
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully connected to Realtime');
                    updateConnectionStatus('online');
                    
                    // Track presence
                    await realtimeChannel.track({
                        user_id: currentUser.id,
                        email: currentUser.email,
                        online_at: new Date().toISOString()
                    });
                    
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Realtime connection error');
                    updateConnectionStatus('error');
                } else if (status === 'TIMED_OUT') {
                    console.warn('⚠️ Realtime connection timed out');
                    updateConnectionStatus('reconnecting');
                }
            });
            
    } catch (error) {
        console.error('❌ Supabase Realtime setup error:', error);
        updateConnectionStatus('error');
    }
}

function getChatId() {
    // Get chat ID from URL parameters or generate a demo one
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('chat') || 'demo_chat_' + Date.now();
}

function handleIncomingMessage(messageData) {
    // Don't show our own messages (they're already displayed)
    if (messageData.sender_id === currentUser.id) return;
    
    // Add message to chat
    displayMessage({
        id: messageData.id || Date.now(),
        text: messageData.text,
        sender: messageData.sender_name || 'Partner',
        timestamp: new Date(messageData.timestamp || Date.now()),
        type: messageData.type || 'text',
        isOwn: false
    });
    
    // Hide typing indicator
    hideTypingIndicator();
    
    // Scroll to bottom
    scrollToBottom();
    
    // Play notification sound (if enabled)
    playNotificationSound();
}

function handleTypingEvent(typingData) {
    if (typingData.user_id === currentUser.id) return;
    
    if (typingData.isTyping) {
        showTypingIndicator();
    } else {
        hideTypingIndicator();
    }
}

function setupMessageInput() {
    const messageInput = document.getElementById('messageInput');
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        
        // Update send button state
        updateSendButton();
    });
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    } else {
        // Send typing indicator
        sendTypingIndicator(true);
    }
}

function handleInput() {
    updateSendButton();
    sendTypingIndicator(true);
}

function updateSendButton() {
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    sendBtn.disabled = !messageInput.value.trim();
    sendBtn.classList.toggle('active', messageInput.value.trim().length > 0);
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const messageText = messageInput.value.trim();
    
    if (!messageText || !realtimeChannel) return;
    
    try {
        const messageData = {
            id: Date.now(),
            text: messageText,
            sender_id: currentUser.id,
            sender_name: currentUser.user_metadata?.full_name || currentUser.email,
            timestamp: new Date().toISOString(),
            type: 'text'
        };
        
        // Display message immediately (optimistic update)
        displayMessage({
            ...messageData,
            sender: 'You',
            timestamp: new Date(),
            isOwn: true
        });
        
        // Send via Supabase Realtime
        await realtimeChannel.send({
            type: 'broadcast',
            event: 'message',
            payload: messageData
        });
        
        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        updateSendButton();
        
        // Stop typing indicator
        sendTypingIndicator(false);
        
        // Scroll to bottom
        scrollToBottom();
        
        console.log('📤 Message sent:', messageData);
        
    } catch (error) {
        console.error('❌ Send message error:', error);
        showNotification('Failed to send message. Please try again.', 'error');
    }
}

function displayMessage(messageData) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${messageData.isOwn ? 'my-message' : 'partner-message'}`;
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-${messageData.isOwn ? 'user-circle' : 'user'}"></i>
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="sender-name">${messageData.sender}</span>
                <span class="message-time">${formatTime(messageData.timestamp)}</span>
            </div>
            <div class="message-text">${escapeHtml(messageData.text)}</div>
        </div>
    `;
    
    // Insert before typing indicator
    const typingIndicator = document.getElementById('typingIndicator');
    messagesContainer.insertBefore(messageDiv, typingIndicator);
}

async function sendTypingIndicator(typing) {
    if (!realtimeChannel || isTyping === typing) return;
    
    isTyping = typing;
    
    // Clear existing timeout
    if (typingTimeout) {
        clearTimeout(typingTimeout);
    }
    
    try {
        await realtimeChannel.send({
            type: 'broadcast',
            event: 'typing',
            payload: {
                user_id: currentUser.id,
                isTyping: typing
            }
        });
        
        // Auto-stop typing after 3 seconds
        if (typing) {
            typingTimeout = setTimeout(() => {
                sendTypingIndicator(false);
            }, 3000);
        }
        
    } catch (error) {
        console.error('❌ Typing indicator error:', error);
    }
}

function stopTyping() {
    sendTypingIndicator(false);
}

function showTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'block';
    scrollToBottom();
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'none';
}

function updateConnectionStatus(status) {
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const connectionStatus = document.getElementById('connectionStatus');
    
    statusIndicator.className = `status-indicator ${status}`;
    
    switch (status) {
        case 'online':
            statusText.textContent = 'Online';
            connectionStatus.style.display = 'none';
            break;
        case 'offline':
            statusText.textContent = 'Offline';
            break;
        case 'reconnecting':
            statusText.textContent = 'Reconnecting...';
            connectionStatus.style.display = 'flex';
            break;
        case 'error':
            statusText.textContent = 'Connection Error';
            connectionStatus.style.display = 'flex';
            break;
    }
}

function updatePartnerStatus(status) {
    updateConnectionStatus(status);
}

function updateOnlineStatus() {
    if (!realtimeChannel) return;
    
    const presenceState = realtimeChannel.presenceState();
    const onlineUsers = Object.keys(presenceState).length;
    
    if (onlineUsers > 1) {
        updateConnectionStatus('online');
    } else {
        updatePartnerStatus('offline');
    }
}

function startChatTimer() {
    updateTimerDisplay();
    
    chatTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(chatTimer);
            handleChatExpiry();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timeRemaining').textContent = timeString;
    
    // Change color when time is running low
    const timerElement = document.querySelector('.chat-timer');
    if (timeRemaining < 3600) { // Less than 1 hour
        timerElement.classList.add('warning');
    }
    if (timeRemaining < 600) { // Less than 10 minutes
        timerElement.classList.add('critical');
    }
}

function handleChatExpiry() {
    showNotification('Chat time has expired. Thank you for using EnkiConnect!', 'info');
    
    // Disable input
    document.getElementById('messageInput').disabled = true;
    document.getElementById('sendBtn').disabled = true;
    
    // Show expiry message
    displaySystemMessage('Chat session has ended. Thank you for connecting!');
    
    // Redirect after delay
    setTimeout(() => {
        window.location.href = 'categories.html';
    }, 5000);
}

function displaySystemMessage(text) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.innerHTML = `
        <div class="system-icon">
            <i class="fas fa-info-circle"></i>
        </div>
        <div class="system-content">
            <p>${text}</p>
        </div>
    `;
    
    const typingIndicator = document.getElementById('typingIndicator');
    messagesContainer.insertBefore(messageDiv, typingIndicator);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function playNotificationSound() {
    // Simple notification sound (you can replace with actual audio file)
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Audio notification not available');
        }
    }
}

// Chat menu functions
function toggleChatMenu() {
    const chatMenu = document.getElementById('chatMenu');
    chatMenu.classList.toggle('show');
}

function viewProfile() {
    showNotification('Profile viewing coming soon!', 'info');
    toggleChatMenu();
}

function reportUser() {
    if (confirm('Are you sure you want to report this user?')) {
        showNotification('User reported. Thank you for keeping our community safe.', 'success');
    }
    toggleChatMenu();
}

function exportChat() {
    showNotification('Chat export feature coming soon!', 'info');
    toggleChatMenu();
}

function leaveChat() {
    if (confirm('Are you sure you want to leave this chat?')) {
        if (realtimeChannel) {
            realtimeChannel.unsubscribe();
        }
        window.location.href = 'categories.html';
    }
    toggleChatMenu();
}

// Photo sharing functions
function attachPhoto() {
    document.getElementById('photoModal').style.display = 'flex';
}

function closePhotoModal() {
    document.getElementById('photoModal').style.display = 'none';
    document.getElementById('photoInput').value = '';
    document.getElementById('photoPreview').innerHTML = `
        <div class="upload-placeholder" onclick="document.getElementById('photoInput').click()">
            <i class="fas fa-camera"></i>
            <p>Click to select a photo</p>
        </div>
    `;
}

function previewPhoto() {
    const input = document.getElementById('photoInput');
    const preview = document.getElementById('photoPreview');
    const sendBtn = document.querySelector('.send-photo-btn');
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Photo preview">`;
            sendBtn.disabled = false;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

function sendPhotoMessage() {
    showNotification('Photo sharing feature coming soon!', 'info');
    closePhotoModal();
}

function sendGif() {
    showNotification('GIF feature coming soon!', 'info');
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.chat-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `chat-notification setup-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
}

// Close chat menu when clicking outside
document.addEventListener('click', function(event) {
    const chatMenu = document.getElementById('chatMenu');
    const menuBtn = document.querySelector('.chat-menu-btn');
    
    if (!chatMenu.contains(event.target) && !menuBtn.contains(event.target)) {
        chatMenu.classList.remove('show');
    }
});

// Cleanup when leaving page
window.addEventListener('beforeunload', function() {
    if (realtimeChannel) {
        realtimeChannel.unsubscribe();
    }
    if (chatTimer) {
        clearInterval(chatTimer);
    }
}); 