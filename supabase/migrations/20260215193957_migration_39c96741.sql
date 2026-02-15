-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Allow public insert if table empty" ON admin_users;

-- Create a security definer function to check if admin_users is empty
CREATE OR REPLACE FUNCTION public.is_admin_users_empty()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1);
$$;

-- Create new INSERT policy using the function
CREATE POLICY "Allow first admin creation"
ON admin_users
FOR INSERT
TO public
WITH CHECK (
  -- Allow insert if table is empty (for first admin)
  public.is_admin_users_empty()
);

-- Also add policy to allow admins to create other admins
CREATE POLICY "Admins can create other admins"
ON admin_users
FOR INSERT
TO public
WITH CHECK (
  -- Allow insert if current user is already an admin
  auth.uid() IN (SELECT id FROM admin_users)
);