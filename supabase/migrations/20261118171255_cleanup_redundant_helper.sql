/*
# Cleanup: drop redundant helper and sequences

The existing schema uses is_admin() (admin_users.id = auth.uid()) and id_counters for
reference codes. This removes the duplicate is_platform_admin() function and unused
sequences created by a prior migration attempt in this session.
*/

DROP FUNCTION IF EXISTS public.is_platform_admin();
DROP SEQUENCE IF EXISTS application_ref_seq;
DROP SEQUENCE IF EXISTS enquiry_ref_seq;