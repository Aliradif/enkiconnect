# 🏺 **EnkiConnect - Real Communications Setup Guide**

## **🎯 Overview**
This guide will help you set up **real email and SMS sending** for the EnkiConnect invitation system. After following these steps, invitations will be sent to real email addresses and phone numbers.

---

## **📧 EmailJS Setup (Real Emails)**

### **Step 1: Create EmailJS Account**
1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create a free account
3. Verify your email address

### **Step 2: Add Email Service**
1. In EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Yahoo**
   - **Custom SMTP**
4. Follow the connection instructions
5. **Copy your Service ID** (e.g., `service_abc123`)

### **Step 3: Create Email Templates**
Create these 4 templates for different exchange types:

#### **Company Invitation Template**
- Template ID: `template_company`
- Subject: `{{from_name}} invited you to join {{company_name}} Gift Exchange!`
- Content: Use the HTML template from `invitation-backend.js`

#### **Friend Invitation Template**
- Template ID: `template_friend`  
- Subject: `{{from_name}} invited you to a Gift Exchange!`
- Content: Use the HTML template from `invitation-backend.js`

#### **Family Invitation Template**
- Template ID: `template_family`
- Subject: `Family Gift Exchange Invitation`
- Content: Use the HTML template from `invitation-backend.js`

#### **World Invitation Template**
- Template ID: `template_world`
- Subject: `Global Gift Exchange Invitation`
- Content: Use the HTML template from `invitation-backend.js`

### **Step 4: Get Public Key**
1. Go to "Account" → "General"
2. **Copy your Public Key** (e.g., `user_abc123def456`)

### **Step 5: Update Configuration**
In `config.js`, update these values:
```javascript
email: {
  serviceId: 'service_abc123',        // Your Service ID
  publicKey: 'user_abc123def456',     // Your Public Key
  templateIds: {
    company_invitation: 'template_company',
    friend_invitation: 'template_friend',
    family_invitation: 'template_family',
    world_invitation: 'template_world'
  }
},

features: {
  enableRealEmail: true,  // Enable real emails
  // ... other features
}
```

---

## **📱 Twilio Setup (Real SMS)**

### **Step 1: Create Twilio Account**
1. Go to [https://www.twilio.com/](https://www.twilio.com/)
2. Sign up for a free account (get $15 credit)
3. Verify your email and phone number

### **Step 2: Get Phone Number**
1. In Twilio Console, go to "Phone Numbers" → "Manage" → "Buy a number"
2. Choose a number from your country
3. Enable "SMS" capability
4. **Copy your Twilio phone number** (e.g., `+1234567890`)

### **Step 3: Get Account Credentials**
1. In Twilio Console dashboard
2. **Copy Account SID** (e.g., `ACxxxxxxxxx`)
3. **Copy Auth Token** (click "Show" to reveal)

### **Step 4: Update Configuration**
In `config.js`, update these values:
```javascript
twilio: {
  accountSid: 'ACxxxxxxxxx',      // Your Account SID
  authToken: 'your_auth_token',   // Your Auth Token  
  fromNumber: '+1234567890'       // Your Twilio phone number
},

features: {
  enableRealSMS: true,  // Enable real SMS
  // ... other features
}
```

### **⚠️ Important Security Note**
**In production, Twilio credentials should be on your backend server, not in frontend JavaScript!** For this demo, we're using frontend integration for simplicity.

---

## **🗄️ Database Setup**

### **Step 1: Run Database Schema**
1. Open Supabase dashboard
2. Go to "SQL Editor"
3. Copy and paste the contents of `supabase-schema-extended.sql`
4. Click "Run" to create all tables and functions

### **Step 2: Verify Tables Created**
Check that these tables were created:
- `invitations`
- `email_logs`
- `sms_logs`
- `invitation_analytics`
- `invitation_templates`

---

## **🧪 Testing Real Communications**

### **Test Email Sending**
1. Open `invitation-system.html`
2. Fill in the email form with your real email address
3. Click "Send Email Invite"
4. Check your inbox for the real email
5. Check Supabase `email_logs` table for delivery tracking

### **Test SMS Sending**
1. Fill in the SMS form with your real phone number
2. Click "Send SMS Invite"
3. Check your phone for the real text message
4. Check Supabase `sms_logs` table for delivery tracking

### **Test Link Generation**
1. Click "Generate Invite Link"
2. Copy the generated link
3. Open in new browser/incognito window
4. Verify it opens the join page correctly

---

## **📊 Monitoring & Analytics**

### **Email Tracking**
- **Sent**: Logged when email is sent via EmailJS
- **Delivered**: When EmailJS confirms delivery
- **Opened**: When recipient opens email (if tracking enabled)
- **Clicked**: When recipient clicks invitation link

### **SMS Tracking**
- **Sent**: Logged when SMS is sent via Twilio
- **Delivered**: When Twilio confirms delivery
- **Failed**: When SMS fails to send

### **Database Analytics**
All invitation events are tracked in:
- `invitation_analytics` - Detailed event tracking
- `email_logs` - Email-specific logs
- `sms_logs` - SMS-specific logs

---

## **💰 Cost Estimates**

### **EmailJS (Free Tier)**
- ✅ **200 emails/month FREE**
- ✅ Perfect for demos and small exchanges
- 💰 $15/month for 1,000 emails

### **Twilio (Free Trial)**
- ✅ **$15 FREE credit**
- 💰 ~$0.0075 per SMS (varies by country)
- 💰 ~2,000 SMS messages with free credit

### **Supabase (Free Tier)**
- ✅ **50,000 database rows FREE**
- ✅ **5GB storage FREE**
- ✅ More than enough for demo

---

## **🚀 Production Recommendations**

### **Security**
1. **Move Twilio credentials to backend API**
2. **Use environment variables for secrets**
3. **Implement rate limiting for invitations**
4. **Add CAPTCHA to prevent spam**

### **Scalability**
1. **Use background jobs for bulk invitations**
2. **Implement webhook callbacks for delivery status**
3. **Add retry logic for failed deliveries**
4. **Cache invitation templates**

### **Monitoring**
1. **Set up error alerts for failed sends**
2. **Monitor delivery rates and bounce rates**
3. **Track invitation conversion rates**
4. **Add user feedback for invitation problems**

---

## **🔧 Troubleshooting**

### **EmailJS Issues**
- **Error: Unauthorized** → Check Service ID and Public Key
- **Error: Template not found** → Verify template IDs match
- **Emails not arriving** → Check spam folder, verify email service

### **Twilio Issues**
- **Error: Authentication failed** → Check Account SID and Auth Token
- **Error: Invalid number** → Verify phone number format (+1234567890)
- **Messages not sending** → Check Twilio account balance and phone number verification

### **Database Issues**
- **Error: Permission denied** → Check Row Level Security policies
- **Error: Table not found** → Run the database schema setup
- **Missing invitation data** → Check if user is authenticated

---

## **✅ Final Checklist**

- [ ] EmailJS account created and configured
- [ ] Email templates created for all exchange types
- [ ] Twilio account created with phone number
- [ ] Database schema installed in Supabase
- [ ] `config.js` updated with real credentials
- [ ] `enableRealEmail` and `enableRealSMS` set to `true`
- [ ] Tested email sending with real email address
- [ ] Tested SMS sending with real phone number
- [ ] Verified links work correctly
- [ ] Checked database logs for tracking data

**🎉 Once complete, your EnkiConnect invitation system will send REAL communications to REAL people!** 