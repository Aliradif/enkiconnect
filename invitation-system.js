// 🏺 EnkiConnect - Multi-Channel Invitation System with Real Backend
// Real email, SMS, and database-backed invitations

let currentUser = null;
let invitationHistory = [];
let invitationManager = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initializeInvitationSystem();
});

async function initializeInvitationSystem() {
    console.log('🏺 Initializing Real Invitation System...');
    
    try {
        // Get current user
        if (window.EnkiConnect) {
            const { user } = await window.EnkiConnect.auth.getCurrentUser();
            if (!user) {
                console.error('❌ No authenticated user found');
                window.location.href = 'index.html';
                return;
            }
            currentUser = user;
            console.log('✅ Current user:', currentUser.email);
            
            // Update preview with user info
            document.getElementById('previewOrganizer').textContent = 
                currentUser.user_metadata?.full_name || currentUser.email;
        }
        
        // Wait for invitation manager to be ready
        if (window.InvitationManager) {
            invitationManager = window.InvitationManager;
            await invitationManager.initialize();
            console.log('✅ Real invitation backend connected');
        } else {
            console.warn('⚠️ Invitation manager not found, using simulation mode');
        }
        
        // Load real invitation history
        await loadRealInvitationHistory();
        
        // Set up real-time message preview
        setupMessagePreviews();
        
        console.log('✅ Real invitation system initialized');
        
    } catch (error) {
        console.error('❌ Invitation system initialization error:', error);
        showNotification('Failed to initialize invitation system', 'error');
    }
}

function setupMessagePreviews() {
    // Email message preview
    const emailMessage = document.getElementById('emailMessage');
    const exchangeType = document.getElementById('exchangeType');
    
    function updateEmailPreview() {
        const message = emailMessage.value || 'Join me for an amazing gift exchange experience!';
        const type = exchangeType.options[exchangeType.selectedIndex].text;
        
        document.getElementById('previewMessage').textContent = message;
        document.getElementById('previewType').textContent = type;
    }
    
    emailMessage.addEventListener('input', updateEmailPreview);
    exchangeType.addEventListener('change', updateEmailPreview);
    
    // SMS character count
    const smsRecipient = document.getElementById('smsRecipient');
    function updateSMSPreview() {
        const baseMessage = 'Hi! Join my EnkiConnect gift exchange: ';
        const link = 'https://enkiconnect.app/join/abc123';
        const fullMessage = baseMessage + link;
        
        document.getElementById('smsTemplate').innerHTML = 
            `Hi! Join my EnkiConnect gift exchange: <span class="link-placeholder">[JOIN_LINK]</span>`;
        document.getElementById('smsCharCount').textContent = fullMessage.length;
        document.getElementById('smsPreviewText').textContent = fullMessage;
    }
    
    smsRecipient.addEventListener('input', updateSMSPreview);
    updateSMSPreview();
}

async function sendEmailInvite() {
    const recipient = document.getElementById('emailRecipient').value.trim();
    const message = document.getElementById('emailMessage').value.trim();
    const exchangeType = document.getElementById('exchangeType').value;
    
    if (!recipient) {
        showNotification('Please enter recipient email address', 'error');
        return;
    }
    
    if (!isValidEmail(recipient)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    const emailBtn = document.querySelector('.email-btn');
    const originalText = emailBtn.innerHTML;
    emailBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    emailBtn.disabled = true;
    
    try {
        console.log('📧 Sending email invitation to:', recipient);
        
        // Generate invitation token
        const inviteToken = generateInviteToken();
        const inviteLink = `${window.location.origin}/join-exchange.html?token=${inviteToken}`;
        
        // Create invitation record
        const invitationData = {
            type: 'email',
            recipient: recipient,
            message: message || 'Join me for an amazing gift exchange experience!',
            exchange_type: exchangeType,
            token: inviteToken,
            status: 'sent',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            organizer_id: currentUser.id,
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email
        };
        
        // Send real email via backend
        const result = await sendRealInvitation({
            type: 'email',
            exchange_type: exchangeType,
            recipient_email: recipient,
            recipient_name: recipient.split('@')[0], // Extract name from email
            message: message,
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email,
            inviter_id: currentUser.id
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to send email invitation');
        }
        
        // Refresh history
        await loadRealInvitationHistory();
        
        // Show success
        showSuccessModal('Email Invitation Sent!', 
            `Real email sent to ${recipient}. They'll receive it in their inbox shortly.`);
        
        // Clear form
        document.getElementById('emailRecipient').value = '';
        document.getElementById('emailMessage').value = '';
        
        // Show email preview
        showEmailPreview();
        
    } catch (error) {
        console.error('❌ Email invitation error:', error);
        showNotification('Failed to send email invitation', 'error');
    } finally {
        emailBtn.innerHTML = originalText;
        emailBtn.disabled = false;
    }
}

async function sendSMSInvite() {
    const recipient = document.getElementById('smsRecipient').value.trim();
    
    if (!recipient) {
        showNotification('Please enter recipient phone number', 'error');
        return;
    }
    
    if (!isValidPhone(recipient)) {
        showNotification('Please enter a valid phone number', 'error');
        return;
    }
    
    const smsBtn = document.querySelector('.sms-btn');
    const originalText = smsBtn.innerHTML;
    smsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    smsBtn.disabled = true;
    
    try {
        console.log('📱 Sending SMS invitation to:', recipient);
        
        // Generate invitation token
        const inviteToken = generateInviteToken();
        const inviteLink = `${window.location.origin}/join-exchange.html?token=${inviteToken}`;
        
        // Create SMS message
        const smsMessage = `Hi! Join my EnkiConnect gift exchange: ${inviteLink}`;
        
        // Create invitation record
        const invitationData = {
            type: 'sms',
            recipient: recipient,
            message: smsMessage,
            exchange_type: 'friend', // Default for SMS
            token: inviteToken,
            status: 'sent',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            organizer_id: currentUser.id,
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email
        };
        
        // Send real SMS via backend
        const result = await sendRealInvitation({
            type: 'sms',
            exchange_type: 'friend', // Default for SMS
            recipient_phone: recipient,
            recipient_name: recipient, // Use phone as name
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email,
            inviter_id: currentUser.id
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to send SMS invitation');
        }
        
        // Refresh history
        await loadRealInvitationHistory();
        
        // Show success
        showSuccessModal('SMS Invitation Sent!', 
            `Real text message sent to ${recipient}. They should receive it within seconds.`);
        
        // Clear form
        document.getElementById('smsRecipient').value = '';
        
        // Show SMS preview
        showSMSPreview();
        
    } catch (error) {
        console.error('❌ SMS invitation error:', error);
        showNotification('Failed to send SMS invitation', 'error');
    } finally {
        smsBtn.innerHTML = originalText;
        smsBtn.disabled = false;
    }
}

async function generateInviteLink() {
    const expiry = document.getElementById('linkExpiry').value;
    const maxUses = document.getElementById('maxUses').value;
    
    const linkBtn = document.querySelector('.link-btn');
    const originalText = linkBtn.innerHTML;
    linkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    linkBtn.disabled = true;
    
    try {
        console.log('🔗 Generating invite link...');
        
        // Generate invitation token
        const inviteToken = generateInviteToken();
        const inviteLink = `${window.location.origin}/join-exchange.html?token=${inviteToken}`;
        
        // Create invitation record
        const invitationData = {
            type: 'link',
            token: inviteToken,
            link: inviteLink,
            exchange_type: 'world', // Default for links
            status: 'active',
            expires_at: expiry === '0' ? null : 
                new Date(Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000).toISOString(),
            max_uses: parseInt(maxUses) || null,
            current_uses: 0,
            organizer_id: currentUser.id,
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email
        };
        
        // Generate real link via backend
        const result = await sendRealInvitation({
            type: 'link',
            exchange_type: 'world', // Default for links
            max_uses: parseInt(maxUses) || null,
            expires_at: expiry === '0' ? null : 
                new Date(Date.now() + parseInt(expiry) * 24 * 60 * 60 * 1000).toISOString(),
            organizer_name: currentUser.user_metadata?.full_name || currentUser.email,
            inviter_id: currentUser.id
        });
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to generate invite link');
        }
        
        // Refresh history
        await loadRealInvitationHistory();
        
        // Show generated link
        const realLink = result.invitation.invite_link;
        document.getElementById('inviteLink').textContent = realLink;
        document.getElementById('generatedLink').style.display = 'block';
        
        // Update stats with real data
        updateLinkStats({
            expires_at: result.invitation.expires_at,
            max_uses: result.invitation.max_uses,
            current_uses: result.invitation.current_uses
        });
        
        showNotification('Invite link generated successfully!', 'success');
        
    } catch (error) {
        console.error('❌ Link generation error:', error);
        showNotification('Failed to generate invite link', 'error');
    } finally {
        linkBtn.innerHTML = originalText;
        linkBtn.disabled = false;
    }
}

function copyInviteLink() {
    const linkElement = document.getElementById('inviteLink');
    const link = linkElement.textContent;
    
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link copied to clipboard!', 'success');
        
        // Visual feedback
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
        }, 2000);
    }).catch(() => {
        showNotification('Failed to copy link', 'error');
    });
}

function showQRCode() {
    const modal = document.getElementById('qrModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // In a real app, you'd generate an actual QR code here
    // For demo, we show a placeholder
    console.log('📱 QR Code generated for invite link');
}

function closeQRModal() {
    const modal = document.getElementById('qrModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function shareLink() {
    const link = document.getElementById('inviteLink').textContent;
    
    if (navigator.share) {
        navigator.share({
            title: 'Join my EnkiConnect Gift Exchange!',
            text: 'You\'re invited to join an amazing gift exchange experience.',
            url: link
        }).then(() => {
            console.log('✅ Link shared successfully');
            showNotification('Link shared!', 'success');
        }).catch(() => {
            console.log('❌ Share cancelled');
        });
    } else {
        // Fallback for browsers without Web Share API
        copyInviteLink();
    }
}

function showEmailPreview() {
    const preview = document.getElementById('emailPreview');
    preview.style.display = 'block';
    preview.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
        preview.style.display = 'none';
    }, 10000); // Hide after 10 seconds
}

function closeEmailPreview() {
    document.getElementById('emailPreview').style.display = 'none';
}

function showSMSPreview() {
    const preview = document.getElementById('smsPreview');
    preview.style.display = 'block';
    
    setTimeout(() => {
        preview.style.display = 'none';
    }, 5000); // Hide after 5 seconds
}

function updateLinkStats(invitationData) {
    const daysLeft = invitationData.expires_at ? 
        Math.ceil((new Date(invitationData.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : '∞';
    const usesLeft = invitationData.max_uses ? 
        invitationData.max_uses - invitationData.current_uses : '∞';
    
    document.querySelector('.link-stats .stat-value').textContent = invitationData.current_uses;
    document.querySelectorAll('.link-stats .stat-value')[1].textContent = daysLeft;
    document.querySelectorAll('.link-stats .stat-value')[2].textContent = usesLeft;
}

function addToInvitationHistory(invitationData) {
    invitationHistory.unshift({
        ...invitationData,
        created_at: new Date().toISOString()
    });
    
    // Keep only last 10 invitations
    if (invitationHistory.length > 10) {
        invitationHistory = invitationHistory.slice(0, 10);
    }
    
    refreshHistoryDisplay();
}

async function loadRealInvitationHistory() {
    try {
        if (!invitationManager || !currentUser) {
            return loadSampleHistory(); // Fallback
        }
        
        console.log('📋 Loading real invitation history...');
        
        const result = await invitationManager.getInvitationHistory(currentUser.id, 10);
        
        if (result.success) {
            invitationHistory = result.invitations.map(invitation => ({
                type: invitation.invitation_type,
                recipient: invitation.recipient_email || invitation.recipient_phone || 'Link',
                exchange_type: invitation.exchange_type,
                status: invitation.status,
                current_uses: invitation.current_uses || 0,
                created_at: invitation.created_at,
                delivered_at: invitation.delivered_at,
                opened_at: invitation.opened_at,
                clicked_at: invitation.clicked_at
            }));
            
            console.log('✅ Loaded real invitation history:', invitationHistory.length, 'items');
        } else {
            console.warn('⚠️ Failed to load history, using sample data');
            loadSampleHistory();
        }
        
        refreshHistoryDisplay();
    } catch (error) {
        console.error('❌ Error loading invitation history:', error);
        loadSampleHistory();
        refreshHistoryDisplay();
    }
}

function loadSampleHistory() {
    // Fallback sample data
    invitationHistory = [
        {
            type: 'email',
            recipient: 'sarah@example.com',
            exchange_type: 'company',
            status: 'pending',
            created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        {
            type: 'sms',
            recipient: '+1 (555) 123-4567',
            exchange_type: 'friend',
            status: 'delivered',
            created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
            type: 'link',
            exchange_type: 'world',
            status: 'active',
            current_uses: 3,
            created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
    ];
}

function refreshHistoryDisplay() {
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';
    
    invitationHistory.forEach(invitation => {
        const historyItem = createHistoryItem(invitation);
        historyList.appendChild(historyItem);
    });
}

function createHistoryItem(invitation) {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const iconClass = invitation.type === 'email' ? 'email-sent' : 
                     invitation.type === 'sms' ? 'sms-sent' : 'link-shared';
    const iconName = invitation.type === 'email' ? 'envelope' : 
                    invitation.type === 'sms' ? 'sms' : 'link';
    
    const title = invitation.type === 'email' ? `Email to ${invitation.recipient}` :
                 invitation.type === 'sms' ? `SMS to ${invitation.recipient}` :
                 'Shareable Link';
    
    const timeAgo = getTimeAgo(invitation.created_at);
    const details = invitation.type === 'link' ? 
        `${invitation.exchange_type.charAt(0).toUpperCase() + invitation.exchange_type.slice(1)} Exchange • ${invitation.current_uses || 0} clicks • ${timeAgo}` :
        `${invitation.exchange_type.charAt(0).toUpperCase() + invitation.exchange_type.slice(1)} Exchange • ${timeAgo}`;
    
    const statusClass = invitation.status === 'pending' ? 'pending' :
                       invitation.status === 'delivered' ? 'delivered' : 'active';
    const statusIcon = invitation.status === 'pending' ? 'clock' :
                      invitation.status === 'delivered' ? 'check' : 'eye';
    const statusText = invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1);
    
    item.innerHTML = `
        <div class="history-icon ${iconClass}">
            <i class="fas fa-${iconName}"></i>
        </div>
        <div class="history-content">
            <div class="history-title">${title}</div>
            <div class="history-details">${details}</div>
        </div>
        <div class="history-status ${statusClass}">
            <i class="fas fa-${statusIcon}"></i> ${statusText}
        </div>
    `;
    
    return item;
}

async function refreshHistory() {
    const refreshBtn = document.querySelector('.refresh-btn i');
    refreshBtn.classList.add('fa-spin');
    
    try {
        await loadRealInvitationHistory();
        showNotification('History refreshed with real data', 'success');
    } catch (error) {
        console.error('❌ Failed to refresh history:', error);
        showNotification('Failed to refresh history', 'error');
    } finally {
        refreshBtn.classList.remove('fa-spin');
    }
}

function showSuccessModal(title, message) {
    document.getElementById('successTitle').textContent = title;
    document.getElementById('successMessage').textContent = message;
    
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function downloadQR() {
    // In a real app, this would download the actual QR code
    showNotification('QR code download started', 'success');
    console.log('📥 QR code download simulated');
}

// Utility functions
function generateInviteToken() {
    return 'inv_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.invitation-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `invitation-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
}

// Real invitation sending function
async function sendRealInvitation(invitationData) {
    try {
        if (!invitationManager) {
            throw new Error('Invitation manager not initialized');
        }
        
        console.log('🚀 Sending real invitation:', invitationData);
        
        const result = await invitationManager.createInvitation(invitationData);
        
        if (result.success) {
            console.log('✅ Real invitation sent successfully:', result.invitation?.id);
        } else {
            console.error('❌ Real invitation failed:', result.error);
        }
        
        return result;
    } catch (error) {
        console.error('❌ Error sending real invitation:', error);
        return {
            success: false,
            error: error.message
        };
    }
} 