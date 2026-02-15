-- Secure Bootstrap Policy for Admin Users
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert into admin_users IF the table is empty
CREATE POLICY "Allow public insert if table empty" 
ON admin_users 
FOR INSERT 
WITH CHECK (
  (SELECT count(*) FROM admin_users) = 0
);

-- Allow admins to view all admin users
CREATE POLICY "Admins can view all admins" 
ON admin_users 
FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM admin_users)
);

-- Allow admins to update admin users
CREATE POLICY "Admins can update admins" 
ON admin_users 
FOR UPDATE 
USING (
  auth.uid() IN (SELECT id FROM admin_users)
);