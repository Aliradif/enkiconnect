-- 🏺 EnkiConnect Extended Database Schema
-- Complete backend for invitation system with real communications

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- INVITATION SYSTEM TABLES
-- ===========================================

-- Enhanced Invitations table with real communication tracking
DROP TABLE IF EXISTS public.invitations CASCADE;
CREATE TABLE public.invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Invitation details
  exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Invitation type and method
  invitation_type TEXT NOT NULL CHECK (invitation_type IN ('email', 'sms', 'link')),
  exchange_type TEXT NOT NULL CHECK (exchange_type IN ('company', 'friend', 'family', 'world')),
  
  -- Recipient information
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,
  
  -- Invitation content
  personal_message TEXT,
  
  -- Status tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'joined', 'declined', 'expired', 'failed')),
  
  -- Link-specific fields
  token TEXT UNIQUE,
  invite_link TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  
  -- Tracking fields
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- External service IDs for tracking
  email_service_id TEXT, -- EmailJS message ID
  sms_service_id TEXT,   -- Twilio message SID
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Constraints
  CONSTRAINT valid_recipient CHECK (
    (invitation_type = 'email' AND recipient_email IS NOT NULL) OR
    (invitation_type = 'sms' AND recipient_phone IS NOT NULL) OR
    (invitation_type = 'link' AND token IS NOT NULL)
  )
);

-- Email delivery logs
CREATE TABLE public.email_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  email_service_id TEXT NOT NULL, -- EmailJS message ID
  
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id TEXT,
  
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  
  -- EmailJS response data
  service_response JSONB,
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE
);

-- SMS delivery logs
CREATE TABLE public.sms_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  sms_service_id TEXT NOT NULL, -- Twilio message SID
  
  recipient_phone TEXT NOT NULL,
  message_body TEXT NOT NULL,
  
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'undelivered')),
  
  -- Twilio response data
  service_response JSONB,
  error_message TEXT,
  
  -- Tracking
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  delivered_at TIMESTAMP WITH TIME ZONE
);

-- Invitation analytics
CREATE TABLE public.invitation_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  invitation_id UUID REFERENCES public.invitations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'joined', 'declined')),
  
  -- Browser/device info for web events
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Location data (optional)
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ===========================================
-- EXCHANGE SYSTEM ENHANCEMENTS
-- ===========================================

-- Enhanced exchanges table
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS invitation_settings JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS total_invitations_sent INTEGER DEFAULT 0;
ALTER TABLE public.exchanges ADD COLUMN IF NOT EXISTS total_participants_joined INTEGER DEFAULT 0;

-- Invitation templates for different exchange types
CREATE TABLE public.invitation_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('email_subject', 'email_body', 'sms_body')),
  exchange_type TEXT NOT NULL CHECK (exchange_type IN ('company', 'friend', 'family', 'world')),
  
  template_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb, -- Available template variables
  
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_by UUID REFERENCES public.users(id)
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Invitations indexes
CREATE INDEX idx_invitations_exchange_id ON public.invitations(exchange_id);
CREATE INDEX idx_invitations_inviter_id ON public.invitations(inviter_id);
CREATE INDEX idx_invitations_token ON public.invitations(token) WHERE token IS NOT NULL;
CREATE INDEX idx_invitations_status ON public.invitations(status);
CREATE INDEX idx_invitations_type ON public.invitations(invitation_type);
CREATE INDEX idx_invitations_created_at ON public.invitations(created_at);

-- Email logs indexes
CREATE INDEX idx_email_logs_invitation_id ON public.email_logs(invitation_id);
CREATE INDEX idx_email_logs_service_id ON public.email_logs(email_service_id);
CREATE INDEX idx_email_logs_recipient ON public.email_logs(recipient_email);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);

-- SMS logs indexes
CREATE INDEX idx_sms_logs_invitation_id ON public.sms_logs(invitation_id);
CREATE INDEX idx_sms_logs_service_id ON public.sms_logs(sms_service_id);
CREATE INDEX idx_sms_logs_recipient ON public.sms_logs(recipient_phone);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);

-- Analytics indexes
CREATE INDEX idx_invitation_analytics_invitation_id ON public.invitation_analytics(invitation_id);
CREATE INDEX idx_invitation_analytics_event_type ON public.invitation_analytics(event_type);
CREATE INDEX idx_invitation_analytics_created_at ON public.invitation_analytics(created_at);

-- ===========================================
-- ROW LEVEL SECURITY (RLS)
-- ===========================================

-- Enable RLS on all new tables
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_templates ENABLE ROW LEVEL SECURITY;

-- Invitations policies
CREATE POLICY "Users can manage their own invitations" ON public.invitations
  FOR ALL USING (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations they received via token" ON public.invitations
  FOR SELECT USING (token IS NOT NULL);

-- Email logs policies (only for invitation owners)
CREATE POLICY "Users can view their invitation email logs" ON public.email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invitations i 
      WHERE i.id = email_logs.invitation_id 
      AND i.inviter_id = auth.uid()
    )
  );

-- SMS logs policies (only for invitation owners)
CREATE POLICY "Users can view their invitation SMS logs" ON public.sms_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invitations i 
      WHERE i.id = sms_logs.invitation_id 
      AND i.inviter_id = auth.uid()
    )
  );

-- Analytics policies (only for invitation owners)
CREATE POLICY "Users can view their invitation analytics" ON public.invitation_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.invitations i 
      WHERE i.id = invitation_analytics.invitation_id 
      AND i.inviter_id = auth.uid()
    )
  );

-- Templates policies (public read, authenticated write)
CREATE POLICY "Anyone can view active templates" ON public.invitation_templates
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage templates" ON public.invitation_templates
  FOR ALL USING (auth.uid() IS NOT NULL);

-- ===========================================
-- FUNCTIONS AND TRIGGERS
-- ===========================================

-- Function to update invitation status based on events
CREATE OR REPLACE FUNCTION update_invitation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update invitation status based on analytics events
  IF NEW.event_type = 'delivered' THEN
    UPDATE public.invitations 
    SET status = 'delivered', delivered_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.invitation_id AND status = 'sent';
  ELSIF NEW.event_type = 'opened' THEN
    UPDATE public.invitations 
    SET status = 'opened', opened_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.invitation_id AND status IN ('sent', 'delivered');
  ELSIF NEW.event_type = 'clicked' THEN
    UPDATE public.invitations 
    SET status = 'clicked', clicked_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.invitation_id AND status IN ('sent', 'delivered', 'opened');
  ELSIF NEW.event_type = 'joined' THEN
    UPDATE public.invitations 
    SET status = 'joined', responded_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.invitation_id;
  ELSIF NEW.event_type = 'declined' THEN
    UPDATE public.invitations 
    SET status = 'declined', responded_at = NEW.created_at, updated_at = NOW()
    WHERE id = NEW.invitation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update invitation status
CREATE TRIGGER trigger_update_invitation_status
  AFTER INSERT ON public.invitation_analytics
  FOR EACH ROW EXECUTE FUNCTION update_invitation_status();

-- Function to increment invitation usage for links
CREATE OR REPLACE FUNCTION increment_link_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment for 'clicked' events on link-type invitations
  IF NEW.event_type = 'clicked' THEN
    UPDATE public.invitations 
    SET current_uses = current_uses + 1, updated_at = NOW()
    WHERE id = NEW.invitation_id 
    AND invitation_type = 'link';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track link usage
CREATE TRIGGER trigger_increment_link_usage
  AFTER INSERT ON public.invitation_analytics
  FOR EACH ROW EXECUTE FUNCTION increment_link_usage();

-- Function to update exchange statistics
CREATE OR REPLACE FUNCTION update_exchange_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update exchange invitation count
  IF TG_OP = 'INSERT' THEN
    UPDATE public.exchanges 
    SET total_invitations_sent = total_invitations_sent + 1, updated_at = NOW()
    WHERE id = NEW.exchange_id;
    
    -- Update participant count when someone joins
    IF NEW.status = 'joined' THEN
      UPDATE public.exchanges 
      SET total_participants_joined = total_participants_joined + 1, updated_at = NOW()
      WHERE id = NEW.exchange_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Track when invitation status changes to joined
    IF OLD.status != 'joined' AND NEW.status = 'joined' THEN
      UPDATE public.exchanges 
      SET total_participants_joined = total_participants_joined + 1, updated_at = NOW()
      WHERE id = NEW.exchange_id;
    ELSIF OLD.status = 'joined' AND NEW.status != 'joined' THEN
      UPDATE public.exchanges 
      SET total_participants_joined = total_participants_joined - 1, updated_at = NOW()
      WHERE id = NEW.exchange_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update exchange statistics
CREATE TRIGGER trigger_update_exchange_stats
  AFTER INSERT OR UPDATE ON public.invitations
  FOR EACH ROW EXECUTE FUNCTION update_exchange_stats();

-- ===========================================
-- DEFAULT INVITATION TEMPLATES
-- ===========================================

-- Insert default email templates
INSERT INTO public.invitation_templates (template_name, template_type, exchange_type, template_content, variables, is_default) VALUES
-- Company Exchange Templates
('Company Exchange Subject', 'email_subject', 'company', 'You''re invited to join {{company_name}} Gift Exchange!', '["company_name", "organizer_name"]', true),

('Company Exchange Body', 'email_body', 'company', 
'<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 32px;">🏺 EnkiConnect</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Ancient wisdom meets modern connections</p>
  </div>
  
  <div style="padding: 40px; background: white;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">You''re Invited!</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      {{organizer_name}} has invited you to join the <strong>{{company_name}}</strong> gift exchange on EnkiConnect.
    </p>
    
    {{#if personal_message}}
    <div style="background: #f8faff; border-left: 4px solid #4c63d2; padding: 20px; margin: 20px 0; font-style: italic;">
      "{{personal_message}}"
      <div style="text-align: right; margin-top: 10px; font-weight: 600;">- {{organizer_name}}</div>
    </div>
    {{/if}}
    
    <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">Exchange Details:</h3>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Company:</strong> {{company_name}}</p>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Budget Range:</strong> ${{min_budget}} - ${{max_budget}}</p>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Exchange Date:</strong> {{exchange_date}}</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{invite_link}}" style="background: #10b981; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
        Accept Invitation
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
      <p>This invitation expires in 7 days. If you have any questions, please contact {{organizer_name}}.</p>
      <p>© 2024 EnkiConnect. Connecting hearts across cultures.</p>
    </div>
  </div>
</div>', 
'["organizer_name", "company_name", "personal_message", "min_budget", "max_budget", "exchange_date", "invite_link"]', true),

-- Friend Exchange Templates
('Friend Exchange Subject', 'email_subject', 'friend', '{{organizer_name}} invited you to a Gift Exchange!', '["organizer_name"]', true),

('Friend Exchange Body', 'email_body', 'friend',
'<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
  <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px; text-align: center; color: white;">
    <h1 style="margin: 0; font-size: 32px;">🏺 EnkiConnect</h1>
    <p style="margin: 10px 0 0 0; opacity: 0.9;">Ancient wisdom meets modern connections</p>
  </div>
  
  <div style="padding: 40px; background: white;">
    <h2 style="color: #1f2937; margin: 0 0 20px 0;">You''re Invited to a Friend Exchange!</h2>
    
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
      Your friend <strong>{{organizer_name}}</strong> has invited you to join a gift exchange on EnkiConnect.
    </p>
    
    {{#if personal_message}}
    <div style="background: #fef7f7; border-left: 4px solid #f5576c; padding: 20px; margin: 20px 0; font-style: italic;">
      "{{personal_message}}"
      <div style="text-align: right; margin-top: 10px; font-weight: 600;">- {{organizer_name}}</div>
    </div>
    {{/if}}
    
    <div style="background: #f9fafb; border-radius: 10px; padding: 20px; margin: 30px 0;">
      <h3 style="color: #1f2937; margin: 0 0 15px 0;">Exchange Details:</h3>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Type:</strong> Friend Exchange</p>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Budget Range:</strong> ${{min_budget}} - ${{max_budget}}</p>
      <p style="margin: 5px 0; color: #4b5563;"><strong>Exchange Date:</strong> {{exchange_date}}</p>
    </div>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{invite_link}}" style="background: #f5576c; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; display: inline-block;">
        Join the Fun!
      </a>
    </div>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
      <p>This invitation expires in 7 days. Join now to start exchanging gifts with friends!</p>
      <p>© 2024 EnkiConnect. Connecting hearts across cultures.</p>
    </div>
  </div>
</div>',
'["organizer_name", "personal_message", "min_budget", "max_budget", "exchange_date", "invite_link"]', true),

-- SMS Templates
('Company SMS', 'sms_body', 'company', 'Hi! {{organizer_name}} invited you to join {{company_name}} gift exchange on EnkiConnect. Join here: {{invite_link}}', '["organizer_name", "company_name", "invite_link"]', true),

('Friend SMS', 'sms_body', 'friend', 'Hey! {{organizer_name}} invited you to a gift exchange on EnkiConnect. Join here: {{invite_link}}', '["organizer_name", "invite_link"]', true),

('Family SMS', 'sms_body', 'family', 'Hi! {{organizer_name}} invited you to our family gift exchange on EnkiConnect. Join here: {{invite_link}}', '["organizer_name", "invite_link"]', true),

('World SMS', 'sms_body', 'world', 'You''re invited to join a global gift exchange on EnkiConnect! Connect with someone amazing: {{invite_link}}', '["invite_link"]', true);

-- ===========================================
-- UTILITY FUNCTIONS
-- ===========================================

-- Function to get invitation statistics for an exchange
CREATE OR REPLACE FUNCTION get_invitation_stats(exchange_uuid UUID)
RETURNS TABLE (
  total_sent BIGINT,
  total_delivered BIGINT,
  total_opened BIGINT,
  total_clicked BIGINT,
  total_joined BIGINT,
  total_declined BIGINT,
  conversion_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE status IN ('delivered', 'opened', 'clicked', 'joined', 'declined')) as total_delivered,
    COUNT(*) FILTER (WHERE status IN ('opened', 'clicked', 'joined', 'declined')) as total_opened,
    COUNT(*) FILTER (WHERE status IN ('clicked', 'joined', 'declined')) as total_clicked,
    COUNT(*) FILTER (WHERE status = 'joined') as total_joined,
    COUNT(*) FILTER (WHERE status = 'declined') as total_declined,
    CASE 
      WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE status = 'joined'))::NUMERIC / COUNT(*)::NUMERIC * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM public.invitations
  WHERE exchange_id = exchange_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE public.invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE expires_at < NOW() 
  AND status IN ('sent', 'delivered', 'opened', 'clicked');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule cleanup function (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-invitations', '0 */6 * * *', 'SELECT cleanup_expired_invitations();');

COMMENT ON TABLE public.invitations IS 'Complete invitation tracking with real email/SMS integration';
COMMENT ON TABLE public.email_logs IS 'Email delivery tracking and analytics';
COMMENT ON TABLE public.sms_logs IS 'SMS delivery tracking and analytics';
COMMENT ON TABLE public.invitation_analytics IS 'Detailed invitation interaction analytics';
COMMENT ON TABLE public.invitation_templates IS 'Customizable email and SMS templates'; 