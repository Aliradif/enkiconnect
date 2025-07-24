// 🏺 EnkiConnect Supabase Client
// This file handles all database connections and operations

// Use CDN import for now to avoid module issues
// import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = window.EnkiConfig.supabase.url;
const supabaseAnonKey = window.EnkiConfig.supabase.anonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ==================== AUTHENTICATION ====================

export const auth = {
  // Sign up new user
  async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Sign up error:', error);
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

export const userProfile = {
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

export const exchanges = {
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

export const participants = {
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

export const invitations = {
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

export const chat = {
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
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

// Calculate service fee
export function calculateServiceFee(amount) {
  return Math.round(amount * window.EnkiConfig.business.serviceFeePercentage * 100) / 100;
}

// Validate email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Show notification
export function showNotification(message, type = 'info') {
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

// ==================== INITIALIZATION ====================

// Initialize auth state checking
document.addEventListener('DOMContentLoaded', async () => {
  // Check if user is authenticated
  const { user } = await auth.getCurrentUser();
  
  // Redirect logic based on current page
  const currentPage = window.location.pathname.split('/').pop();
  
  if (user && currentPage === 'index.html') {
    // User is logged in but on sign-in page - redirect to categories
    window.location.href = 'categories.html';
  } else if (!user && currentPage !== 'index.html') {
    // User is not logged in but not on sign-in page - redirect to sign-in
    window.location.href = 'index.html';
  }
});

// Export everything for global access
window.EnkiConnect = {
  supabase,
  auth,
  userProfile,
  exchanges,
  participants,
  invitations,
  chat,
  formatCurrency,
  calculateServiceFee,
  isValidEmail,
  showNotification
}; 