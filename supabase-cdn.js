// 🏺 EnkiConnect Supabase Client (CDN Version)
// This avoids CORS issues by using CDN instead of ES6 modules

// Supabase client will be loaded from CDN in HTML
// This file provides the wrapper functions

let supabase;

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    supabase = window.supabase.createClient(
        window.EnkiConfig.supabase.url,
        window.EnkiConfig.supabase.anonKey
    );
    
    // Make available globally
    window.EnkiConnect = {
        supabase,
        auth: authFunctions,
        userProfile: userProfileFunctions,
        exchanges: exchangesFunctions,
        participants: participantsFunctions,
        invitations: invitationsFunctions,
        chat: chatFunctions,
        formatCurrency,
        calculateServiceFee,
        isValidEmail,
        showNotification
    };
});

// ==================== AUTHENTICATION ====================

const authFunctions = {
    // Sign up new user
    async signUp(email, password, fullName) {
        try {
            console.log('🔄 Starting Supabase signUp with:', { email, fullName });
            
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    }
                }
            });
            
            console.log('📋 Supabase signUp response:', { data, error });
            
            if (error) {
                console.error('❌ Supabase signUp error:', error);
                throw error;
            }
            
            console.log('✅ SignUp successful:', data);
            return { success: true, data };
        } catch (error) {
            console.error('❌ Sign up error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in existing user
    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign in with social provider
    async signInWithProvider(provider) {
        try {
            // Check if we're running from file:// (won't work with social auth)
            if (window.location.protocol === 'file:') {
                throw new Error('Social authentication requires a web server. Please use email/password authentication or run a local server.');
            }

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/categories.html`
                }
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Social sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    // Sign out
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            // Redirect to sign in page
            window.location.href = 'index.html';
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    // Reset password
    async resetPassword(email) {
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password.html`
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get current user
    async getCurrentUser() {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            return { success: true, user };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    },

    // Listen to auth changes
    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange((event, session) => {
            callback(event, session);
        });
    }
};

// ==================== USER PROFILE ====================

const userProfileFunctions = {
    // Get user profile
    async getProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get profile error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update user profile
    async updateProfile(userId, updates) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update profile error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==================== EXCHANGES ====================

const exchangesFunctions = {
    // Create new exchange
    async createExchange(exchangeData) {
        try {
            const { data, error } = await supabase
                .from('exchanges')
                .insert([exchangeData])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create exchange error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get user's exchanges
    async getUserExchanges(userId) {
        try {
            const { data, error } = await supabase
                .from('exchanges')
                .select(`
                    *,
                    exchange_participants(count)
                `)
                .eq('organizer_id', userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get exchanges error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get exchange by ID
    async getExchange(exchangeId) {
        try {
            const { data, error } = await supabase
                .from('exchanges')
                .select(`
                    *,
                    exchange_participants(*),
                    users!organizer_id(full_name, email)
                `)
                .eq('id', exchangeId)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get exchange error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==================== PARTICIPANTS ====================

const participantsFunctions = {
    // Join exchange
    async joinExchange(exchangeId, userId, participantData) {
        try {
            const { data, error } = await supabase
                .from('exchange_participants')
                .insert([{
                    exchange_id: exchangeId,
                    user_id: userId,
                    ...participantData
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Join exchange error:', error);
            return { success: false, error: error.message };
        }
    },

    // Update participant
    async updateParticipant(participantId, updates) {
        try {
            const { data, error } = await supabase
                .from('exchange_participants')
                .update(updates)
                .eq('id', participantId)
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update participant error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==================== INVITATIONS ====================

const invitationsFunctions = {
    // Create invitation
    async createInvitation(invitationData) {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .insert([{
                    ...invitationData,
                    token: generateInviteToken(),
                    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Create invitation error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get invitation by token
    async getInvitationByToken(token) {
        try {
            const { data, error } = await supabase
                .from('invitations')
                .select(`
                    *,
                    exchanges(*),
                    users!inviter_id(full_name)
                `)
                .eq('token', token)
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get invitation error:', error);
            return { success: false, error: error.message };
        }
    }
};

// ==================== CHAT ====================

const chatFunctions = {
    // Send message
    async sendMessage(matchId, senderId, message) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert([{
                    match_id: matchId,
                    sender_id: senderId,
                    message
                }])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Send message error:', error);
            return { success: false, error: error.message };
        }
    },

    // Get messages for match
    async getMessages(matchId) {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    users!sender_id(full_name)
                `)
                .eq('match_id', matchId)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Get messages error:', error);
            return { success: false, error: error.message };
        }
    },

    // Subscribe to new messages
    subscribeToMessages(matchId, callback) {
        return supabase
            .channel(`messages:${matchId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `match_id=eq.${matchId}`
            }, callback)
            .subscribe();
    }
};

// ==================== UTILITY FUNCTIONS ====================

// Generate unique invitation token
function generateInviteToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Format currency
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Calculate service fee
function calculateServiceFee(amount) {
    return Math.round(amount * window.EnkiConfig.business.serviceFeePercentage * 100) / 100;
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 