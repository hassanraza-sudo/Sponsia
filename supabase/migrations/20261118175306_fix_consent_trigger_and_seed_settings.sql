/*
# Fix consent trigger + seed default website settings

1. Replace the invalid trigger implementation with checks against the existing
   `student_applications.date_of_birth`, `student_consents`, and public-profile columns.
2. Revoke profile visibility when its consent is removed or DOB becomes invalid/minor
   without guardian consent; sanitize existing published rows without deleting profile data.
3. Seed data
- `website_settings`: insert default row (id='general') with placeholder contact values the
  admin can edit in Settings.
*/

CREATE OR REPLACE FUNCTION public.enforce_profile_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c student_consents%ROWTYPE;
  dob date;
  application_found boolean;
  consent_found boolean;
BEGIN
  SELECT * INTO c
  FROM public.student_consents
  WHERE application_id = NEW.application_id;
  consent_found := FOUND;

  IF consent_found THEN
    IF c.consent_photo IS DISTINCT FROM TRUE THEN NEW.photo_public := false; END IF;
    IF c.consent_school IS DISTINCT FROM TRUE THEN NEW.show_school := false; END IF;
    IF c.consent_location IS DISTINCT FROM TRUE THEN
      NEW.show_city := false;
      NEW.show_district := false;
    END IF;
    IF c.consent_story IS DISTINCT FROM TRUE THEN
      NEW.show_story := false;
      NEW.show_goal := false;
      NEW.show_background := false;
      NEW.show_achievements := false;
      NEW.show_education_level := false;
      NEW.show_grade := false;
      NEW.show_support := false;
      NEW.show_amount := false;
    END IF;
    IF c.consent_name IS DISTINCT FROM TRUE THEN
      NEW.display_mode := 'anonymous';
      NEW.display_name := NULL;
    END IF;
  ELSE
    NEW.photo_public := false;
    NEW.show_school := false;
    NEW.show_city := false;
    NEW.show_district := false;
    NEW.show_story := false;
    NEW.show_goal := false;
    NEW.show_background := false;
    NEW.show_achievements := false;
    NEW.show_education_level := false;
    NEW.show_grade := false;
    NEW.show_support := false;
    NEW.show_amount := false;
    NEW.display_mode := 'anonymous';
    NEW.display_name := NULL;
  END IF;

  IF NEW.publication_status = 'published' THEN
    SELECT a.date_of_birth INTO dob
    FROM public.student_applications a
    WHERE a.id = NEW.application_id;
    application_found := FOUND;

    IF NOT application_found THEN
      RAISE EXCEPTION 'A matching application is required before publishing a profile';
    END IF;

    IF dob IS NULL
      OR dob > CURRENT_DATE
      OR date_part('year', age(dob)) < 18
    THEN
      IF NOT consent_found OR c.guardian_consent IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION 'Guardian consent is required before publishing a minor''s profile';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_consent_trigger ON public.student_public_profiles;
CREATE TRIGGER enforce_profile_consent_trigger
  BEFORE INSERT OR UPDATE ON public.student_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_consent();

CREATE OR REPLACE FUNCTION public.sync_profile_consent_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  application_found boolean;
  dob date;
  needs_guardian boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.student_public_profiles
    SET publication_status = 'draft',
        published_at = NULL,
        photo_public = false,
        show_school = false,
        show_city = false,
        show_district = false,
        show_story = false,
        show_goal = false,
        show_background = false,
        show_achievements = false,
        show_education_level = false,
        show_grade = false,
        show_support = false,
        show_amount = false,
        display_mode = 'anonymous',
        display_name = NULL
    WHERE application_id = OLD.application_id;
    RETURN OLD;
  END IF;

  SELECT a.date_of_birth INTO dob
  FROM public.student_applications a
  WHERE a.id = NEW.application_id;
  application_found := FOUND;
  needs_guardian := NOT application_found
    OR dob IS NULL
    OR dob > CURRENT_DATE
    OR date_part('year', age(dob)) < 18;

  UPDATE public.student_public_profiles p
  SET publication_status = CASE
        WHEN NOT application_found
          OR (needs_guardian AND NEW.guardian_consent IS DISTINCT FROM TRUE) THEN 'draft'
        ELSE p.publication_status
      END,
      published_at = CASE
        WHEN NOT application_found
          OR (needs_guardian AND NEW.guardian_consent IS DISTINCT FROM TRUE) THEN NULL
        ELSE p.published_at
      END,
      photo_public = p.photo_public IS TRUE AND NEW.consent_photo IS TRUE,
      show_school = p.show_school IS TRUE AND NEW.consent_school IS TRUE,
      show_city = p.show_city IS TRUE AND NEW.consent_location IS TRUE,
      show_district = p.show_district IS TRUE AND NEW.consent_location IS TRUE,
      show_story = p.show_story IS TRUE AND NEW.consent_story IS TRUE,
      show_goal = p.show_goal IS TRUE AND NEW.consent_story IS TRUE,
      show_background = p.show_background IS TRUE AND NEW.consent_story IS TRUE,
      show_achievements = p.show_achievements IS TRUE AND NEW.consent_story IS TRUE,
      show_education_level = p.show_education_level IS TRUE AND NEW.consent_story IS TRUE,
      show_grade = p.show_grade IS TRUE AND NEW.consent_story IS TRUE,
      show_support = p.show_support IS TRUE AND NEW.consent_story IS TRUE,
      show_amount = p.show_amount IS TRUE AND NEW.consent_story IS TRUE,
      display_mode = CASE
        WHEN NEW.consent_name IS DISTINCT FROM TRUE THEN 'anonymous'
        ELSE p.display_mode
      END,
      display_name = CASE
        WHEN NEW.consent_name IS DISTINCT FROM TRUE THEN NULL
        ELSE p.display_name
      END
  WHERE p.application_id = NEW.application_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_consent_change_trigger ON public.student_consents;
CREATE TRIGGER sync_profile_consent_change_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.student_consents
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_consent_change();

CREATE OR REPLACE FUNCTION public.unpublish_profile_when_dob_requires_guardian()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guardian_consent boolean;
  consent_found boolean;
BEGIN
  IF NEW.date_of_birth IS NOT DISTINCT FROM OLD.date_of_birth THEN
    RETURN NEW;
  END IF;

  SELECT c.guardian_consent INTO guardian_consent
  FROM public.student_consents c
  WHERE c.application_id = NEW.id;
  consent_found := FOUND;

  IF NEW.date_of_birth IS NULL
    OR NEW.date_of_birth > CURRENT_DATE
    OR date_part('year', age(NEW.date_of_birth)) < 18
  THEN
    IF NOT consent_found OR guardian_consent IS DISTINCT FROM TRUE THEN
      UPDATE public.student_public_profiles
      SET publication_status = 'draft',
          published_at = NULL
      WHERE application_id = NEW.id
        AND publication_status = 'published';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS unpublish_profile_when_dob_requires_guardian_trigger ON public.student_applications;
CREATE TRIGGER unpublish_profile_when_dob_requires_guardian_trigger
  AFTER UPDATE OF date_of_birth ON public.student_applications
  FOR EACH ROW EXECUTE FUNCTION public.unpublish_profile_when_dob_requires_guardian();

UPDATE public.student_public_profiles p
SET publication_status = 'draft',
    published_at = NULL
WHERE p.publication_status = 'published'
  AND (
    NOT EXISTS (
      SELECT 1
      FROM public.student_consents c
      WHERE c.application_id = p.application_id
    )
    OR NOT EXISTS (
      SELECT 1
      FROM public.student_applications a
      WHERE a.id = p.application_id
    )
    OR (
      NOT EXISTS (
        SELECT 1
        FROM public.student_applications a
        WHERE a.id = p.application_id
          AND a.date_of_birth IS NOT NULL
          AND a.date_of_birth <= CURRENT_DATE
          AND date_part('year', age(a.date_of_birth)) >= 18
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.student_consents c
        WHERE c.application_id = p.application_id
          AND c.guardian_consent IS TRUE
      )
    )
  );

UPDATE public.student_public_profiles
SET photo_public = photo_public
WHERE publication_status = 'published';

INSERT INTO website_settings (id, data)
VALUES (
  'general',
  '{
    "site_name": "Sponsia",
    "tagline": "Every Student Deserves a Chance.",
    "site_description": "We connect financially struggling students with individuals, donors and organisations who believe that every child deserves access to education.",
    "hero_heading": "Every Student Deserves a Chance.",
    "hero_description": "Financial difficulties should never decide a child''s future. Sponsia connects students who need educational support with people who believe in the power of education.",
    "hero_image_url": "",
    "mission_content": "",
    "about_content": "",
    "contact_email": "[Edit in Settings: official email]",
    "contact_phone": "[Edit in Settings: phone number]",
    "contact_whatsapp": "[Edit in Settings: WhatsApp number]",
    "office_address": "[Edit in Settings: office address]",
    "facebook_url": "",
    "instagram_url": "",
    "linkedin_url": "",
    "twitter_url": "",
    "youtube_url": ""
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE
SET data = COALESCE(website_settings.data, '{}'::jsonb)
  || jsonb_build_object(
    'site_name', 'Sponsia',
    'hero_description', replace(
      COALESCE(website_settings.data ->> 'hero_description', EXCLUDED.data ->> 'hero_description'),
      'Taleem Dost',
      'Sponsia'
    )
  );