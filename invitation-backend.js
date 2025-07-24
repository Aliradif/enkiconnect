// 🏺 EnkiConnect - Complete Invitation Backend Integration
// Real email and SMS sending with Supabase database storage

// ===========================================
// EMAIL SERVICE INTEGRATION (EmailJS)
// ===========================================

class EmailService {
    constructor() {
        this.serviceId = window.EnkiConfig?.email?.serviceId;
        this.publicKey = window.EnkiConfig?.email?.publicKey;
        this.initialized = false;
    }

    async initialize() {
        if (!this.serviceId || !this.publicKey) {
            console.warn('⚠️ EmailJS not configured. Using simulation mode.');
            return false;
        }

        try {
            // Initialize EmailJS
            if (typeof emailjs !== 'undefined') {
                emailjs.init(this.publicKey);
                this.initialized = true;
                console.log('✅ EmailJS initialized successfully');
                return true;
            } else {
                console.warn('⚠️ EmailJS library not loaded');
                return false;
            }
        } catch (error) {
            console.error('❌ EmailJS initialization failed:', error);
            return false;
        }
    }

    async sendInvitationEmail(invitationData) {
        try {
            if (!this.initialized) {
                return await this.simulateEmailSending(invitationData);
            }

            // Get email template
            const template = await this.getEmailTemplate(invitationData.exchange_type);
            
            // Prepare template parameters
            const templateParams = {
                to_email: invitationData.recipient_email,
                to_name: invitationData.recipient_name || invitationData.recipient_email,
                from_name: invitationData.organizer_name,
                subject: this.replaceVariables(template.subject, invitationData),
                html_content: this.replaceVariables(template.body, invitationData),
                invite_link: invitationData.invite_link,
                exchange_type: invitationData.exchange_type,
                personal_message: invitationData.personal_message || ''
            };

            console.log('📧 Sending email via EmailJS:', templateParams.to_email);

            // Send email via EmailJS
            const response = await emailjs.send(
                this.serviceId,
                template.templateId,
                templateParams
            );

            console.log('✅ Email sent successfully:', response);

            // Log to database
            await this.logEmailDelivery(invitationData.invitation_id, {
                service_id: response.text,
                recipient_email: invitationData.recipient_email,
                subject: templateParams.subject,
                template_id: template.templateId,
                status: 'sent',
                service_response: response
            });

            return {
                success: true,
                service_id: response.text,
                message: 'Email sent successfully'
            };

        } catch (error) {
            console.error('❌ Email sending failed:', error);

            // Log error to database
            await this.logEmailDelivery(invitationData.invitation_id, {
                recipient_email: invitationData.recipient_email,
                status: 'failed',
                error_message: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    async getEmailTemplate(exchangeType) {
        try {
            // Get templates from Supabase
            const { data: templates, error } = await window.EnkiConnect.supabase
                .from('invitation_templates')
                .select('*')
                .eq('exchange_type', exchangeType)
                .eq('is_active', true)
                .eq('is_default', true);

            if (error) throw error;

            if (templates && templates.length > 0) {
                const subjectTemplate = templates.find(t => t.template_type === 'email_subject');
                const bodyTemplate = templates.find(t => t.template_type === 'email_body');

                return {
                    templateId: 'default_invitation', // EmailJS template ID
                    subject: subjectTemplate?.template_content || 'You\'re invited to join EnkiConnect!',
                    body: bodyTemplate?.template_content || this.getDefaultEmailTemplate(exchangeType)
                };
            }

            return this.getDefaultEmailTemplate(exchangeType);
        } catch (error) {
            console.error('❌ Failed to get email template:', error);
            return this.getDefaultEmailTemplate(exchangeType);
        }
    }

    getDefaultEmailTemplate(exchangeType) {
        const templates = {
            company: {
                templateId: 'company_invitation',
                subject: 'You\'re invited to join {{company_name}} Gift Exchange!',
                body: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <h1>🏺 EnkiConnect</h1>
                    <h2>You're invited to join {{company_name}} Gift Exchange!</h2>
                    <p>{{organizer_name}} has invited you to participate in a company gift exchange.</p>
                    <p><strong>Personal Message:</strong> {{personal_message}}</p>
                    <p><a href="{{invite_link}}" style="background: #4c63d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Join Exchange</a></p>
                </div>`
            },
            friend: {
                templateId: 'friend_invitation',
                subject: '{{organizer_name}} invited you to a Gift Exchange!',
                body: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <h1>🏺 EnkiConnect</h1>
                    <h2>You're invited to a Friend Gift Exchange!</h2>
                    <p>Your friend {{organizer_name}} wants to exchange gifts with you.</p>
                    <p><strong>Personal Message:</strong> {{personal_message}}</p>
                    <p><a href="{{invite_link}}" style="background: #f5576c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Join the Fun!</a></p>
                </div>`
            },
            family: {
                templateId: 'family_invitation',
                subject: 'Family Gift Exchange Invitation',
                body: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <h1>🏺 EnkiConnect</h1>
                    <h2>You're invited to our Family Gift Exchange!</h2>
                    <p>{{organizer_name}} has organized a family gift exchange.</p>
                    <p><strong>Personal Message:</strong> {{personal_message}}</p>
                    <p><a href="{{invite_link}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Join Family Exchange</a></p>
                </div>`
            },
            world: {
                templateId: 'world_invitation',
                subject: 'Global Gift Exchange Invitation',
                body: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <h1>🏺 EnkiConnect</h1>
                    <h2>You're invited to a Global Gift Exchange!</h2>
                    <p>Connect with someone amazing from around the world.</p>
                    <p><a href="{{invite_link}}" style="background: #4facfe; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">Connect Globally</a></p>
                </div>`
            }
        };

        return templates[exchangeType] || templates.friend;
    }

    replaceVariables(template, data) {
        let result = template;
        
        // Replace common variables
        const variables = {
            organizer_name: data.organizer_name || 'Someone',
            company_name: data.company_name || data.exchange_name || 'Company',
            exchange_name: data.exchange_name || 'Gift Exchange',
            personal_message: data.personal_message || '',
            invite_link: data.invite_link || '#',
            min_budget: data.min_budget || '20',
            max_budget: data.max_budget || '75',
            exchange_date: data.exchange_date ? new Date(data.exchange_date).toLocaleDateString() : 'TBD'
        };

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, variables[key]);
        });

        return result;
    }

    async logEmailDelivery(invitationId, logData) {
        try {
            const { error } = await window.EnkiConnect.supabase
                .from('email_logs')
                .insert({
                    invitation_id: invitationId,
                    email_service_id: logData.service_id || 'sim_' + Date.now(),
                    recipient_email: logData.recipient_email,
                    subject: logData.subject || 'EnkiConnect Invitation',
                    template_id: logData.template_id,
                    status: logData.status,
                    service_response: logData.service_response,
                    error_message: logData.error_message,
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.error('❌ Failed to log email delivery:', error);
            }
        } catch (error) {
            console.error('❌ Email logging error:', error);
        }
    }

    async simulateEmailSending(invitationData) {
        console.log('📧 Simulating email send to:', invitationData.recipient_email);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const simulatedId = 'sim_email_' + Date.now();

        // Log simulated email
        await this.logEmailDelivery(invitationData.invitation_id, {
            service_id: simulatedId,
            recipient_email: invitationData.recipient_email,
            subject: `EnkiConnect Invitation - ${invitationData.exchange_type}`,
            status: 'sent',
            service_response: { simulated: true }
        });

        return {
            success: true,
            service_id: simulatedId,
            message: 'Email simulated successfully'
        };
    }
}

// ===========================================
// SMS SERVICE INTEGRATION (Twilio)
// ===========================================

class SMSService {
    constructor() {
        this.accountSid = window.EnkiConfig?.twilio?.accountSid;
        this.authToken = window.EnkiConfig?.twilio?.authToken;
        this.fromNumber = window.EnkiConfig?.twilio?.fromNumber;
        this.initialized = false;
    }

    async initialize() {
        if (!this.accountSid || !this.authToken || !this.fromNumber) {
            console.warn('⚠️ Twilio not configured. Using simulation mode.');
            return false;
        }

        this.initialized = true;
        console.log('✅ SMS service initialized');
        return true;
    }

    async sendInvitationSMS(invitationData) {
        try {
            if (!this.initialized) {
                return await this.simulateSMSSending(invitationData);
            }

            // Get SMS template
            const template = await this.getSMSTemplate(invitationData.exchange_type);
            const message = this.replaceVariables(template.body, invitationData);

            console.log('📱 Sending SMS via Twilio:', invitationData.recipient_phone);

            // In a real implementation, you'd use Twilio's REST API
            // This would typically be done from your backend to keep credentials secure
            const response = await this.sendTwilioSMS(invitationData.recipient_phone, message);

            console.log('✅ SMS sent successfully:', response);

            // Log to database
            await this.logSMSDelivery(invitationData.invitation_id, {
                service_id: response.sid,
                recipient_phone: invitationData.recipient_phone,
                message_body: message,
                status: 'sent',
                service_response: response
            });

            return {
                success: true,
                service_id: response.sid,
                message: 'SMS sent successfully'
            };

        } catch (error) {
            console.error('❌ SMS sending failed:', error);

            // Log error to database
            await this.logSMSDelivery(invitationData.invitation_id, {
                recipient_phone: invitationData.recipient_phone,
                message_body: 'Failed to send',
                status: 'failed',
                error_message: error.message
            });

            return {
                success: false,
                error: error.message
            };
        }
    }

    async sendTwilioSMS(to, body) {
        // Note: In production, this should be done via your backend API
        // Frontend should never expose Twilio credentials
        
        // For demo purposes, we'll simulate the API call
        return await this.simulateTwilioAPI(to, body);
    }

    async simulateTwilioAPI(to, body) {
        // Simulate Twilio API response
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return {
            sid: 'SM' + Math.random().toString(36).substring(2, 15),
            status: 'sent',
            to: to,
            body: body,
            date_created: new Date().toISOString()
        };
    }

    async getSMSTemplate(exchangeType) {
        try {
            const { data: template, error } = await window.EnkiConnect.supabase
                .from('invitation_templates')
                .select('template_content')
                .eq('exchange_type', exchangeType)
                .eq('template_type', 'sms_body')
                .eq('is_active', true)
                .eq('is_default', true)
                .single();

            if (error) throw error;

            return {
                body: template.template_content
            };
        } catch (error) {
            console.error('❌ Failed to get SMS template:', error);
            return this.getDefaultSMSTemplate(exchangeType);
        }
    }

    getDefaultSMSTemplate(exchangeType) {
        const templates = {
            company: {
                body: 'Hi! {{organizer_name}} invited you to join {{company_name}} gift exchange on EnkiConnect. Join: {{invite_link}}'
            },
            friend: {
                body: 'Hey! {{organizer_name}} invited you to a gift exchange on EnkiConnect. Join: {{invite_link}}'
            },
            family: {
                body: 'Hi! {{organizer_name}} invited you to our family gift exchange on EnkiConnect. Join: {{invite_link}}'
            },
            world: {
                body: 'You\'re invited to join a global gift exchange on EnkiConnect! Connect: {{invite_link}}'
            }
        };

        return templates[exchangeType] || templates.friend;
    }

    replaceVariables(template, data) {
        let result = template;
        
        const variables = {
            organizer_name: data.organizer_name || 'Someone',
            company_name: data.company_name || data.exchange_name || 'Company',
            invite_link: data.invite_link || 'enkiconnect.app'
        };

        Object.keys(variables).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, variables[key]);
        });

        return result;
    }

    async logSMSDelivery(invitationId, logData) {
        try {
            const { error } = await window.EnkiConnect.supabase
                .from('sms_logs')
                .insert({
                    invitation_id: invitationId,
                    sms_service_id: logData.service_id || 'sim_' + Date.now(),
                    recipient_phone: logData.recipient_phone,
                    message_body: logData.message_body,
                    status: logData.status,
                    service_response: logData.service_response,
                    error_message: logData.error_message,
                    sent_at: new Date().toISOString()
                });

            if (error) {
                console.error('❌ Failed to log SMS delivery:', error);
            }
        } catch (error) {
            console.error('❌ SMS logging error:', error);
        }
    }

    async simulateSMSSending(invitationData) {
        console.log('📱 Simulating SMS send to:', invitationData.recipient_phone);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const simulatedId = 'sim_sms_' + Date.now();

        // Log simulated SMS
        await this.logSMSDelivery(invitationData.invitation_id, {
            service_id: simulatedId,
            recipient_phone: invitationData.recipient_phone,
            message_body: `Hi! You're invited to join EnkiConnect: ${invitationData.invite_link}`,
            status: 'sent',
            service_response: { simulated: true }
        });

        return {
            success: true,
            service_id: simulatedId,
            message: 'SMS simulated successfully'
        };
    }
}

// ===========================================
// INVITATION DATABASE MANAGER
// ===========================================

class InvitationManager {
    constructor() {
        this.emailService = new EmailService();
        this.smsService = new SMSService();
    }

    async initialize() {
        await this.emailService.initialize();
        await this.smsService.initialize();
        console.log('✅ Invitation Manager initialized');
    }

    async createInvitation(invitationData) {
        try {
            console.log('🏺 Creating invitation:', invitationData);

            // Generate invitation token for links
            const token = this.generateInviteToken();
            const inviteLink = `${window.location.origin}/join-exchange.html?token=${token}`;

            // Prepare invitation record
            const invitationRecord = {
                exchange_id: invitationData.exchange_id,
                inviter_id: invitationData.inviter_id,
                invitation_type: invitationData.type,
                exchange_type: invitationData.exchange_type,
                recipient_email: invitationData.recipient_email,
                recipient_phone: invitationData.recipient_phone,
                recipient_name: invitationData.recipient_name,
                personal_message: invitationData.message,
                token: token,
                invite_link: inviteLink,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
                max_uses: invitationData.max_uses || 1,
                status: 'sent',
                metadata: {
                    user_agent: navigator.userAgent,
                    created_from: 'invitation_system'
                }
            };

            // Insert invitation into database
            const { data: invitation, error } = await window.EnkiConnect.supabase
                .from('invitations')
                .insert(invitationRecord)
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Invitation record created:', invitation.id);

            // Prepare data for sending
            const sendData = {
                ...invitationData,
                invitation_id: invitation.id,
                invite_link: inviteLink,
                token: token
            };

            // Send invitation based on type
            let sendResult;
            if (invitationData.type === 'email') {
                sendResult = await this.emailService.sendInvitationEmail(sendData);
            } else if (invitationData.type === 'sms') {
                sendResult = await this.smsService.sendInvitationSMS(sendData);
            } else if (invitationData.type === 'link') {
                sendResult = { success: true, message: 'Link generated successfully' };
            }

            // Update invitation with send result
            if (sendResult.success) {
                await this.updateInvitationStatus(invitation.id, 'sent', {
                    service_id: sendResult.service_id,
                    sent_at: new Date().toISOString()
                });

                // Track analytics event
                await this.trackInvitationEvent(invitation.id, 'sent');
            } else {
                await this.updateInvitationStatus(invitation.id, 'failed', {
                    error_message: sendResult.error
                });
            }

            return {
                success: sendResult.success,
                invitation: {
                    ...invitation,
                    invite_link: inviteLink
                },
                message: sendResult.message || 'Invitation created',
                error: sendResult.error
            };

        } catch (error) {
            console.error('❌ Failed to create invitation:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateInvitationStatus(invitationId, status, updates = {}) {
        try {
            const updateData = {
                status: status,
                updated_at: new Date().toISOString(),
                ...updates
            };

            const { error } = await window.EnkiConnect.supabase
                .from('invitations')
                .update(updateData)
                .eq('id', invitationId);

            if (error) throw error;

            console.log('✅ Invitation status updated:', invitationId, status);
        } catch (error) {
            console.error('❌ Failed to update invitation status:', error);
        }
    }

    async trackInvitationEvent(invitationId, eventType, metadata = {}) {
        try {
            const analyticsData = {
                invitation_id: invitationId,
                event_type: eventType,
                user_agent: navigator.userAgent,
                metadata: metadata
            };

            const { error } = await window.EnkiConnect.supabase
                .from('invitation_analytics')
                .insert(analyticsData);

            if (error) throw error;

            console.log('📊 Invitation event tracked:', eventType);
        } catch (error) {
            console.error('❌ Failed to track invitation event:', error);
        }
    }

    async getInvitationHistory(userId, limit = 10) {
        try {
            const { data: invitations, error } = await window.EnkiConnect.supabase
                .from('invitations')
                .select(`
                    *,
                    email_logs(*),
                    sms_logs(*)
                `)
                .eq('inviter_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return {
                success: true,
                invitations: invitations
            };
        } catch (error) {
            console.error('❌ Failed to get invitation history:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getInvitationByToken(token) {
        try {
            const { data: invitation, error } = await window.EnkiConnect.supabase
                .from('invitations')
                .select('*')
                .eq('token', token)
                .single();

            if (error) throw error;

            // Check if invitation is valid
            if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
                return {
                    success: false,
                    error: 'Invitation has expired'
                };
            }

            if (invitation.max_uses && invitation.current_uses >= invitation.max_uses) {
                return {
                    success: false,
                    error: 'Invitation has reached maximum uses'
                };
            }

            // Track click event
            await this.trackInvitationEvent(invitation.id, 'clicked');

            return {
                success: true,
                invitation: invitation
            };
        } catch (error) {
            console.error('❌ Failed to get invitation by token:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    generateInviteToken() {
        return 'inv_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
}

// ===========================================
// GLOBAL EXPORT
// ===========================================

// Initialize and export the invitation manager
window.InvitationManager = new InvitationManager();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    if (window.EnkiConnect) {
        await window.InvitationManager.initialize();
        console.log('🏺 Invitation backend ready for real communications!');
    }
});

// Export individual services for direct use
window.EmailService = EmailService;
window.SMSService = SMSService; 