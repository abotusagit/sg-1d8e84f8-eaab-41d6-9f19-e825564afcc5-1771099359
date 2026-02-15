-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status ticket_status DEFAULT 'open',
  priority ticket_priority DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global Messages
CREATE TABLE global_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  target_type message_target_type NOT NULL,
  target_ids UUID[], -- Array of user IDs or group IDs
  sent_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES global_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help Documents
CREATE TABLE help_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marriage Registry
CREATE TABLE marriage_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
  marriage_date DATE NOT NULL,
  location TEXT NOT NULL,
  status registry_status DEFAULT 'pending',
  gift_sent BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT different_registry_users CHECK (user1_id <> user2_id)
);

-- Admin Management
CREATE TABLE admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role admin_role NOT NULL DEFAULT 'custom_admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

CREATE TABLE admin_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category privilege_category NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE admin_user_privileges (
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  privilege_id UUID REFERENCES admin_privileges(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, privilege_id)
);

-- Insert default privileges
INSERT INTO admin_privileges (name, description, category) VALUES
('manage_users', 'Can view and edit user profiles', 'user_management'),
('manage_payments', 'Can view payments and refunds', 'payment'),
('manage_support', 'Can respond to support tickets', 'support'),
('manage_registry', 'Can manage marriage registry', 'registry'),
('manage_messages', 'Can send global messages', 'messaging'),
('view_reports', 'Can view system reports', 'reporting'),
('manage_matching', 'Can perform test matches', 'matching');