/*
# Add education_level to public profiles

1. Modified tables
- `student_public_profiles`: add `education_level` (text, not null, default 'secondary')
  so public pages can show the approved education level without reading the private
  application (anon cannot SELECT from student_applications).
2. Data
- Backfill from the linked student application's education_level.
3. Public access
- Expose a consent-filtered `published_student_profiles` view to public clients, and limit
  direct table reads to admins.
4. Notes
- The admin profile editor sets this value when preparing the public profile.
*/

ALTER TABLE student_public_profiles
  ADD COLUMN IF NOT EXISTS education_level text NOT NULL DEFAULT 'secondary';

UPDATE student_public_profiles p
SET education_level = a.education_level
FROM student_applications a
WHERE p.application_id = a.id;

CREATE OR REPLACE VIEW public.published_student_profiles
WITH (security_barrier = true)
AS
SELECT
  p.id,
  p.public_code,
  CASE WHEN c.consent_name IS TRUE THEN p.display_mode ELSE 'anonymous' END AS display_mode,
  CASE WHEN c.consent_name IS TRUE THEN p.display_name ELSE NULL END AS display_name,
  CASE
    WHEN p.photo_public IS TRUE AND c.consent_photo IS TRUE THEN p.photo_path
    ELSE NULL
  END AS photo_path,
  p.photo_public IS TRUE AND c.consent_photo IS TRUE AS photo_public,
  CASE
    WHEN p.show_education_level IS TRUE AND c.consent_story IS TRUE THEN p.education_level
    ELSE 'secondary'
  END AS education_level,
  p.show_education_level IS TRUE AND c.consent_story IS TRUE AS show_education_level,
  p.show_grade IS TRUE AND c.consent_story IS TRUE AS show_grade,
  CASE WHEN p.show_grade IS TRUE AND c.consent_story IS TRUE THEN p.current_grade ELSE NULL END AS current_grade,
  p.show_school IS TRUE AND c.consent_school IS TRUE AS show_school,
  CASE WHEN p.show_school IS TRUE AND c.consent_school IS TRUE THEN p.school_name ELSE NULL END AS school_name,
  p.show_city IS TRUE AND c.consent_location IS TRUE AS show_city,
  p.show_district IS TRUE AND c.consent_location IS TRUE AS show_district,
  CASE WHEN p.show_city IS TRUE AND c.consent_location IS TRUE THEN p.city ELSE NULL END AS city,
  CASE WHEN p.show_district IS TRUE AND c.consent_location IS TRUE THEN p.district ELSE NULL END AS district,
  p.show_story IS TRUE AND c.consent_story IS TRUE AS show_story,
  CASE WHEN p.show_story IS TRUE AND c.consent_story IS TRUE THEN p.story ELSE NULL END AS story,
  p.show_goal IS TRUE AND c.consent_story IS TRUE AS show_goal,
  CASE WHEN p.show_goal IS TRUE AND c.consent_story IS TRUE THEN p.goal ELSE NULL END AS goal,
  p.show_background IS TRUE AND c.consent_story IS TRUE AS show_background,
  CASE WHEN p.show_background IS TRUE AND c.consent_story IS TRUE THEN p.background ELSE NULL END AS background,
  p.show_support IS TRUE AND c.consent_story IS TRUE AS show_support,
  CASE WHEN p.show_support IS TRUE AND c.consent_story IS TRUE THEN p.support_requirement ELSE NULL END AS support_requirement,
  p.show_amount IS TRUE AND c.consent_story IS TRUE AS show_amount,
  CASE WHEN p.show_amount IS TRUE AND c.consent_story IS TRUE THEN p.estimated_amount_pkr ELSE NULL END AS estimated_amount_pkr,
  p.show_achievements IS TRUE AND c.consent_story IS TRUE AS show_achievements,
  CASE WHEN p.show_achievements IS TRUE AND c.consent_story IS TRUE THEN p.achievements ELSE NULL END AS achievements,
  CASE WHEN p.show_support IS TRUE AND c.consent_story IS TRUE THEN p.support_category ELSE 'general' END AS support_category,
  p.publication_status,
  p.published_at
FROM public.student_public_profiles p
JOIN public.student_consents c ON c.application_id = p.application_id
JOIN public.student_applications a ON a.id = p.application_id
WHERE p.publication_status = 'published'
  AND (
    (
      a.date_of_birth IS NOT NULL
      AND a.date_of_birth <= CURRENT_DATE
      AND date_part('year', age(a.date_of_birth)) >= 18
    )
    OR c.guardian_consent IS TRUE
  );

REVOKE SELECT ON TABLE public.student_public_profiles FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.student_public_profiles TO authenticated;
GRANT SELECT ON TABLE public.published_student_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "restrict_public_profile_select_to_admin" ON public.student_public_profiles;
CREATE POLICY "restrict_public_profile_select_to_admin"
  ON public.student_public_profiles
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated
  USING (public.is_profile_photo_admin());