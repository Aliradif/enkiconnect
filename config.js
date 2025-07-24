// 🏺 EnkiConnect Configuration
// Fill in your actual values after setting up accounts

const config = {
  // Supabase Configuration
  supabase: {
    url: 'https://fymnqafvhauvrrnaenpf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bW5xYWZ2aGF1dnJybmFlbnBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzk0NjQsImV4cCI6MjA2ODk1NTQ2NH0.mZKZdFKrj52qz98wDJUyk95GJsnPLICuL-JeL7AUTVk',
  },
  
  // Stripe Configuration
  stripe: {
    publishableKey: 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY',
  },
  
  // App Configuration
  app: {
    name: 'EnkiConnect',
    url: 'https://enkiconnect.vercel.app',
    currency: 'USD',
    defaultCountry: 'US',
  },
  
  // ===========================================
  // REAL COMMUNICATION SERVICES
  // ===========================================
  
  // EmailJS Configuration (for real emails)
  // Sign up at: https://www.emailjs.com/
  email: {
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',     // Replace with your EmailJS service ID
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY',     // Replace with your EmailJS public key
    templateIds: {
      company_invitation: 'template_company',  // Replace with your template IDs
      friend_invitation: 'template_friend',
      family_invitation: 'template_family',
      world_invitation: 'template_world'
    }
  },
  
  // Twilio Configuration (for real SMS) - CONFIGURED ✅
  // Sign up at: https://www.twilio.com/
  // NOTE: In production, these should be in your backend, not frontend!
  twilio: {
    accountSid: 'AC348fdbb639c85456fc455c9ffda59606',    // Your Twilio Account SID
    authToken: '60df3a9b6f6b34a3535ab7f295bed1e5',      // Your Twilio Auth Token
    fromNumber: '+18145262365'    // Your Twilio phone number
  },
  
  // ===========================================
  // DEMO/TESTING CONFIGURATION
  // ===========================================
  
  // Feature Flags
  features: {
    enablePayments: true,
    enableChat: true,
    enableInvitations: true,
    enableAgeVerification: true,
    enableRealEmail: false,      // Set to true when EmailJS is configured
    enableRealSMS: true,         // ✅ ENABLED - Twilio is configured
    enableSimulation: true       // Keep true for demo purposes
  },
  
  // Business Logic
  business: {
    serviceFeePercentage: 0.05, // 5%
    chatDurationHours: 24,
    minimumAge: 13,
    currencies: ['USD', 'CAD', 'EUR', 'GBP', 'JPY'],
    invitationExpireDays: 7,     // How long invitations are valid
    maxInviteUses: 10,           // Default max uses for link invitations
  },
  
  // ===========================================
  // SETUP INSTRUCTIONS
  // ===========================================
  
  setup: {
    emailjs: {
      url: 'https://www.emailjs.com/',
      steps: [
        '1. Create free EmailJS account',
        '2. Create email service (Gmail, Outlook, etc.)',
        '3. Create email templates for each exchange type',
        '4. Copy Service ID and Public Key to config above',
        '5. Set features.enableRealEmail = true'
      ]
    },
    twilio: {
      url: 'https://www.twilio.com/',
      steps: [
        '1. Create free Twilio account ($15 credit)',
        '2. Get phone number for sending SMS',
        '3. Copy Account SID, Auth Token, and Phone Number',
        '4. Set features.enableRealSMS = true',
        '5. For production: Move credentials to backend API'
      ]
    }
  }
};

// Export for use in other files
window.EnkiConfig = config;

// ===========================================
// AUTO-CONFIGURATION HELPERS
// ===========================================

// Check if services are properly configured
window.EnkiConfig.checkSetup = function() {
  const results = {
    supabase: !!(config.supabase.url && config.supabase.anonKey),
    emailjs: !!(config.email.serviceId && config.email.publicKey && config.email.serviceId !== 'YOUR_EMAILJS_SERVICE_ID'),
    twilio: !!(config.twilio.accountSid && config.twilio.authToken && config.twilio.accountSid !== 'YOUR_TWILIO_ACCOUNT_SID'),
    stripe: !!(config.stripe.publishableKey && config.stripe.publishableKey !== 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY')
  };
  
  console.log('🏺 EnkiConnect Service Configuration:');
  console.log('✅ Supabase:', results.supabase ? 'Configured' : '❌ Not configured');
  console.log('📧 EmailJS:', results.emailjs ? 'Configured' : '❌ Not configured (using simulation)');
  console.log('📱 Twilio:', results.twilio ? 'Configured' : '❌ Not configured (using simulation)');
  console.log('💳 Stripe:', results.stripe ? 'Configured' : '❌ Not configured (using demo)');
  
  return results;
};

// Auto-check configuration on load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    window.EnkiConfig.checkSetup();
  }, 1000);
}); 