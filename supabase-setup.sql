-- 🏺 EnkiConnect Database Schema
-- Run this in Supabase SQL Editor after project setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Profile information
  country TEXT DEFAULT 'US',
  currency TEXT DEFAULT 'USD',
  date_of_birth DATE,
  phone TEXT,
  
  -- Address information
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  
  -- Preferences
  gift_preferences JSONB DEFAULT '[]'::jsonb,
  
  -- Verification status
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  
  PRIMARY KEY (id)
);

-- Gift Exchanges table
CREATE TABLE public.exchanges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Exchange details
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('company', 'friends', 'family', 'world')),
  status TEXT DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'matching', 'completed', 'cancelled')),
  
  -- Organizer
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Budget settings
  min_budget DECIMAL(10,2),
  max_budget DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Timing
  signup_deadline TIMESTAMP WITH TIME ZONE,
  exchange_date TIMESTAMP WITH TIME ZONE,
  
  -- Company-specific
  company_name TEXT,
  company_domain TEXT,
  delivery_address JSONB,
  
  -- Settings
  allow_self_gifting BOOLEAN DEFAULT false,
  require_verification BOOLEAN DEFAULT true
);

-- Exchange Participants table
CREATE TABLE public.exchange_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Relations
  exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Participation details
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'paid', 'matched', 'completed')),
  budget_amount DECIMAL(10,2),
  
  -- Gift preferences for this exchange
  preferences JSONB DEFAULT '[]'::jsonb,
  
  -- Payment information
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_id TEXT,
  payment_amount DECIMAL(10,2),
  payment_date TIMESTAMP WITH TIME ZONE,
  
  -- Family-specific
  parent_id UUID REFERENCES public.users(id),
  is_minor BOOLEAN DEFAULT false,
  
  UNIQUE(exchange_id, user_id)
);

-- Gift Matches table
CREATE TABLE public.gift_matches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Match details
  exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
  giver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Gift information
  gift_suggestion TEXT,
  gift_purchased BOOLEAN DEFAULT false,
  gift_url TEXT,
  gift_price DECIMAL(10,2),
  
  -- Delivery
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'ordered', 'shipped', 'delivered')),
  tracking_number TEXT,
  delivery_date TIMESTAMP WITH TIME ZONE,
  
  -- AI/Algorithm data
  match_score DECIMAL(3,2),
  match_reasoning TEXT,
  
  UNIQUE(exchange_id, giver_id),
  UNIQUE(exchange_id, receiver_id)
);

-- Chat Messages table
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Message details
  match_id UUID REFERENCES public.gift_matches(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  
  -- Chat session
  session_start TIMESTAMP WITH TIME ZONE,
  session_end TIMESTAMP WITH TIME ZONE,
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false
);

-- Invitations table
CREATE TABLE public.invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Invitation details
  exchange_id UUID REFERENCES public.exchanges(id) ON DELETE CASCADE NOT NULL,
  inviter_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Recipient information
  email TEXT,
  phone TEXT,
  name TEXT,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'opened', 'joined', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  opened_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE
);

-- Row Level Security Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Exchange policies
CREATE POLICY "Users can view exchanges they participate in" ON public.exchanges
  FOR SELECT USING (
    auth.uid() = organizer_id OR 
    auth.uid() IN (
      SELECT user_id FROM public.exchange_participants 
      WHERE exchange_id = exchanges.id
    )
  );

CREATE POLICY "Organizers can manage their exchanges" ON public.exchanges
  FOR ALL USING (auth.uid() = organizer_id);

-- Participant policies
CREATE POLICY "Users can view participants in their exchanges" ON public.exchange_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT organizer_id FROM public.exchanges 
      WHERE id = exchange_id
    ) OR
    auth.uid() IN (
      SELECT user_id FROM public.exchange_participants p2 
      WHERE p2.exchange_id = exchange_participants.exchange_id
    )
  );

CREATE POLICY "Users can manage their own participation" ON public.exchange_participants
  FOR ALL USING (auth.uid() = user_id);

-- Gift match policies  
CREATE POLICY "Users can view their gift matches" ON public.gift_matches
  FOR SELECT USING (auth.uid() = giver_id OR auth.uid() = receiver_id);

-- Chat policies
CREATE POLICY "Users can view messages in their matches" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT giver_id FROM public.gift_matches WHERE id = match_id
      UNION
      SELECT receiver_id FROM public.gift_matches WHERE id = match_id
    )
  );

CREATE POLICY "Users can send messages in their matches" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    auth.uid() IN (
      SELECT giver_id FROM public.gift_matches WHERE id = match_id
      UNION
      SELECT receiver_id FROM public.gift_matches WHERE id = match_id
    )
  );

-- Invitation policies
CREATE POLICY "Users can view invitations they sent" ON public.invitations
  FOR SELECT USING (auth.uid() = inviter_id);

CREATE POLICY "Users can manage invitations they sent" ON public.invitations
  FOR ALL USING (auth.uid() = inviter_id);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_exchanges_updated_at
  BEFORE UPDATE ON public.exchanges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Insert user profile when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sample data for testing (optional)
-- INSERT INTO public.exchanges (title, type, organizer_id, min_budget, max_budget) 
-- VALUES ('Test Company Exchange', 'company', 'your-user-id-here', 20.00, 50.00); 