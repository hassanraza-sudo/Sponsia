/*
# Admin helper function + reference-ID sequences

1. Existing tables
- `admin_users` already exists (id, email, created_at). Reused as-is; the admin allowlist
  is keyed by email.
2. New function
- `public.is_platform_admin()` returns true when the caller's email is in admin_users.
  SECURITY DEFINER so RLS policies can evaluate it without recursion.
3. New sequences
- `application_ref_seq` (starts 1001) backs TD-1001 style IDs.
- `enquiry_ref_seq` (starts 1001) backs ENQ-1001 style IDs.
4. Security
- is_platform_admin is executable by authenticated + service_role only, not anon/PUBLIC.
*/

CREATE SEQUENCE IF NOT EXISTS application_ref_seq START 1001;
CREATE SEQUENCE IF NOT EXISTS enquiry_ref_seq START 1001;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users a
    WHERE lower(a.email) = lower(coalesce(auth.email(), ''))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated, service_role;