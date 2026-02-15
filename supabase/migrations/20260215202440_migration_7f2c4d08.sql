-- Drop all existing RLS policies on admin_users
DROP POLICY IF EXISTS "Admins can view all admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can create other admins" ON admin_users;
DROP POLICY IF EXISTS "Admins can update admins" ON admin_users;
DROP POLICY IF EXISTS "Allow first admin creation" ON admin_users;

-- Create simpler, more direct RLS policies
-- Policy 1: Allow SELECT for authenticated admins
CREATE POLICY "admin_select_policy" ON admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()
    )
  );

-- Policy 2: Allow INSERT when table is empty (first admin)
CREATE POLICY "admin_insert_first_policy" ON admin_users
  FOR INSERT
  WITH CHECK (
    is_admin_users_empty()
  );

-- Policy 3: Allow INSERT for existing admins (creating other admins)
CREATE POLICY "admin_insert_policy" ON admin_users
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()
    )
  );

-- Policy 4: Allow UPDATE for existing admins
CREATE POLICY "admin_update_policy" ON admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au 
      WHERE au.id = auth.uid()
    )
  );

-- Verify RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;