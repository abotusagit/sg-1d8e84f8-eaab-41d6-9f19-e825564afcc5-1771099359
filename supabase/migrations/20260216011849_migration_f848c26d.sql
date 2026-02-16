-- Force PostgREST cache refresh by toggling RLS
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE admin_user_privileges DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_user_privileges ENABLE ROW LEVEL SECURITY;

ALTER TABLE admin_privileges DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_privileges ENABLE ROW LEVEL SECURITY;

-- Verify the schema is correct
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema = 'public'
    AND c.table_name = 'admin_users'
ORDER BY c.ordinal_position;