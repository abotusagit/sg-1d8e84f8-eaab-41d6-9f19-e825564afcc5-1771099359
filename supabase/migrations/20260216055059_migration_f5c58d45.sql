-- Drop old function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS init_admin_account(text, uuid);
DROP FUNCTION IF EXISTS setup_first_admin(text, uuid);

-- Create the robust initialization function
CREATE OR REPLACE FUNCTION init_admin_account(
  p_email text,
  p_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Bypass RLS
AS $$
DECLARE
  v_privilege_id uuid;
BEGIN
  -- 1. Insert into admin_users (if not exists)
  INSERT INTO admin_users (id, email, role)
  VALUES (p_id, p_email, 'full_admin')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Grant ALL privileges
  FOR v_privilege_id IN SELECT id FROM admin_privileges
  LOOP
    INSERT INTO admin_user_privileges (user_id, privilege_id, granted_by)
    VALUES (p_id, v_privilege_id, p_id) -- granted by self for the first admin
    ON CONFLICT (user_id, privilege_id) DO NOTHING;
  END LOOP;
END;
$$;

-- Force Schema Refresh
NOTIFY pgrst, 'reload schema';