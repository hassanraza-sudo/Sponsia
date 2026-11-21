/*
# Profile enhancements and consent enforcement

1. Modified tables
- `student_public_profiles`: add `support_category` (tuition/books/uniform/transport/general)
  so Explore Students can filter by support category.
2. Functions
- Grant EXECUTE on `next_public_code(prefix)` to anon + authenticated so public forms and
  the admin editor can generate TD-1001 / ENQ-1001 reference codes.
3. Storage
- Keep `public-profiles` private. Signed URLs are issued only for published images with
  explicit photo consent; admins alone can manage objects in this bucket.
- `application-documents` remains a separate private bucket.
*/

ALTER TABLE student_public_profiles ADD COLUMN IF NOT EXISTS support_category text NOT NULL DEFAULT 'general';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_support_category_check'
      AND conrelid = 'public.student_public_profiles'::regclass
  ) THEN
    ALTER TABLE student_public_profiles
      ADD CONSTRAINT profiles_support_category_check
      CHECK (support_category IN ('tuition','books','uniform','transport','general'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_support_category ON student_public_profiles(support_category);

GRANT EXECUTE ON FUNCTION public.next_public_code(text) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public-profiles',
  'public-profiles',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.can_read_public_profile_photo(object_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_public_profiles p
    JOIN public.student_consents c ON c.application_id = p.application_id
    JOIN public.student_applications a ON a.id = p.application_id
    WHERE p.photo_path = object_name
      AND p.photo_public IS TRUE
      AND p.publication_status = 'published'
      AND c.consent_photo IS TRUE
      AND (
        (
          a.date_of_birth IS NOT NULL
          AND a.date_of_birth <= CURRENT_DATE
          AND date_part('year', age(a.date_of_birth)) >= 18
        )
        OR c.guardian_consent IS TRUE
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.is_profile_photo_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND public.is_admin());
$$;

REVOKE ALL ON FUNCTION public.can_read_public_profile_photo(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_public_profile_photo(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.is_profile_photo_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_photo_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "public_read_public_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_approved_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "admin_read_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "restrict_profile_photo_select" ON storage.objects;
DROP POLICY IF EXISTS "restrict_profile_photo_insert" ON storage.objects;
DROP POLICY IF EXISTS "restrict_profile_photo_update" ON storage.objects;
DROP POLICY IF EXISTS "restrict_profile_photo_delete" ON storage.objects;
DROP POLICY IF EXISTS "admin_insert_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "admin_update_profile_photos" ON storage.objects;
DROP POLICY IF EXISTS "admin_delete_profile_photos" ON storage.objects;

CREATE POLICY "public_read_approved_profile_photos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'public-profiles'
    AND public.can_read_public_profile_photo(name)
  );

CREATE POLICY "admin_read_profile_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'public-profiles'
    AND public.is_profile_photo_admin()
  );

CREATE POLICY "admin_insert_profile_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'public-profiles'
    AND public.is_profile_photo_admin()
  );

CREATE POLICY "admin_update_profile_photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'public-profiles'
    AND public.is_profile_photo_admin()
  )
  WITH CHECK (
    bucket_id = 'public-profiles'
    AND public.is_profile_photo_admin()
  );

CREATE POLICY "admin_delete_profile_photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'public-profiles'
    AND public.is_profile_photo_admin()
  );

CREATE POLICY "restrict_profile_photo_select" ON storage.objects
  AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (
    bucket_id <> 'public-profiles'
    OR public.is_profile_photo_admin()
    OR public.can_read_public_profile_photo(name)
  );

CREATE POLICY "restrict_profile_photo_insert" ON storage.objects
  AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id <> 'public-profiles'
    OR (auth.role() = 'authenticated' AND public.is_profile_photo_admin())
  );

CREATE POLICY "restrict_profile_photo_update" ON storage.objects
  AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (
    bucket_id <> 'public-profiles'
    OR (auth.role() = 'authenticated' AND public.is_profile_photo_admin())
  )
  WITH CHECK (
    bucket_id <> 'public-profiles'
    OR (auth.role() = 'authenticated' AND public.is_profile_photo_admin())
  );

CREATE POLICY "restrict_profile_photo_delete" ON storage.objects
  AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (
    bucket_id <> 'public-profiles'
    OR (auth.role() = 'authenticated' AND public.is_profile_photo_admin())
  );