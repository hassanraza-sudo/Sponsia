CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.id_counters (
  prefix text PRIMARY KEY,
  last_value bigint NOT NULL CHECK (last_value >= 1001)
);

CREATE OR REPLACE FUNCTION public.next_public_code(prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  normalized_prefix text := upper(trim(prefix));
  next_value bigint;
BEGIN
  IF normalized_prefix NOT IN ('TD', 'ENQ') THEN
    RAISE EXCEPTION 'Unsupported reference prefix';
  END IF;

  INSERT INTO public.id_counters AS counters (prefix, last_value)
  VALUES (normalized_prefix, 1001)
  ON CONFLICT ON CONSTRAINT id_counters_pkey DO UPDATE
    SET last_value = counters.last_value + 1
  RETURNING last_value INTO next_value;

  RETURN normalized_prefix || '-' || next_value::text;
END;
$$;

CREATE TABLE IF NOT EXISTS public.student_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'archived')),
  full_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender text,
  guardian_name text NOT NULL,
  guardian_phone text NOT NULL,
  student_phone text,
  email text,
  city text NOT NULL,
  district text NOT NULL,
  address text NOT NULL,
  education_level text NOT NULL
    CHECK (education_level IN ('primary', 'middle', 'secondary', 'higher_secondary')),
  institution_name text NOT NULL,
  current_grade text NOT NULL,
  academic_performance text,
  educational_goal text NOT NULL,
  support_reason text NOT NULL,
  at_risk boolean NOT NULL DEFAULT false,
  expenses_monthly numeric(12, 2) CHECK (expenses_monthly IS NULL OR expenses_monthly > 0),
  expense_tuition numeric(12, 2) CHECK (expense_tuition IS NULL OR expense_tuition >= 0),
  expense_books numeric(12, 2) CHECK (expense_books IS NULL OR expense_books >= 0),
  expense_uniform numeric(12, 2) CHECK (expense_uniform IS NULL OR expense_uniform >= 0),
  expense_transport numeric(12, 2) CHECK (expense_transport IS NULL OR expense_transport >= 0),
  expense_other numeric(12, 2) CHECK (expense_other IS NULL OR expense_other >= 0),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE
    REFERENCES public.student_applications(id) ON DELETE CASCADE,
  confirm_accurate boolean NOT NULL DEFAULT false,
  guardian_consent boolean NOT NULL DEFAULT false,
  consent_name boolean NOT NULL DEFAULT false,
  consent_photo boolean NOT NULL DEFAULT false,
  consent_story boolean NOT NULL DEFAULT false,
  consent_school boolean NOT NULL DEFAULT false,
  consent_location boolean NOT NULL DEFAULT false,
  consent_progress_updates boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL
    REFERENCES public.student_applications(id) ON DELETE CASCADE,
  doc_type text NOT NULL
    CHECK (doc_type IN ('photo', 'fee_challan', 'academic_result', 'other')),
  storage_path text NOT NULL UNIQUE,
  original_filename text NOT NULL,
  mime_type text NOT NULL
    CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 5242880),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_public_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL UNIQUE
    REFERENCES public.student_applications(id) ON DELETE CASCADE,
  public_code text NOT NULL UNIQUE,
  display_mode text NOT NULL DEFAULT 'anonymous'
    CHECK (display_mode IN ('full_name', 'first_name', 'alias', 'anonymous')),
  display_name text,
  photo_path text,
  photo_public boolean NOT NULL DEFAULT false,
  education_level text NOT NULL DEFAULT 'secondary',
  show_education_level boolean NOT NULL DEFAULT false,
  show_grade boolean NOT NULL DEFAULT false,
  show_school boolean NOT NULL DEFAULT false,
  school_name text,
  current_grade text,
  show_city boolean NOT NULL DEFAULT false,
  show_district boolean NOT NULL DEFAULT false,
  city text,
  district text,
  show_story boolean NOT NULL DEFAULT false,
  story text,
  show_goal boolean NOT NULL DEFAULT false,
  goal text,
  show_background boolean NOT NULL DEFAULT false,
  background text,
  show_support boolean NOT NULL DEFAULT false,
  support_requirement text,
  show_amount boolean NOT NULL DEFAULT false,
  estimated_amount_pkr numeric(12, 2)
    CHECK (estimated_amount_pkr IS NULL OR estimated_amount_pkr >= 0),
  show_achievements boolean NOT NULL DEFAULT false,
  achievements text,
  support_category text NOT NULL DEFAULT 'general',
  publication_status text NOT NULL DEFAULT 'draft'
    CHECK (publication_status IN ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_support_category_check
    CHECK (support_category IN ('tuition', 'books', 'uniform', 'transport', 'general'))
);

CREATE TABLE IF NOT EXISTS public.donor_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_code text NOT NULL UNIQUE DEFAULT public.next_public_code('ENQ'),
  application_id uuid REFERENCES public.student_applications(id) ON DELETE SET NULL,
  student_public_code text,
  student_name text,
  donor_name text NOT NULL,
  donor_email text NOT NULL,
  country text NOT NULL,
  donor_phone text,
  proposed_amount_pkr numeric(12, 2)
    CHECK (proposed_amount_pkr IS NULL OR proposed_amount_pkr >= 0),
  sponsorship_type text NOT NULL
    CHECK (sponsorship_type IN ('one_student', 'educational_expenses', 'general_support', 'partnership')),
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'interested', 'closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_code text NOT NULL UNIQUE DEFAULT public.next_public_code('ENQ'),
  full_name text NOT NULL,
  email text NOT NULL,
  country text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'interested', 'closed')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.website_settings (
  id text PRIMARY KEY,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_applications_set_updated_at ON public.student_applications;
CREATE TRIGGER student_applications_set_updated_at
  BEFORE UPDATE ON public.student_applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS student_public_profiles_set_updated_at ON public.student_public_profiles;
CREATE TRIGGER student_public_profiles_set_updated_at
  BEFORE UPDATE ON public.student_public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS donor_enquiries_set_updated_at ON public.donor_enquiries;
CREATE TRIGGER donor_enquiries_set_updated_at
  BEFORE UPDATE ON public.donor_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS contact_enquiries_set_updated_at ON public.contact_enquiries;
CREATE TRIGGER contact_enquiries_set_updated_at
  BEFORE UPDATE ON public.contact_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS website_settings_set_updated_at ON public.website_settings;
CREATE TRIGGER website_settings_set_updated_at
  BEFORE UPDATE ON public.website_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_student_applications_status_created
  ON public.student_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_student_documents_application
  ON public.student_documents(application_id, created_at);
CREATE INDEX IF NOT EXISTS idx_student_profiles_publication
  ON public.student_public_profiles(publication_status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_donor_enquiries_status_created
  ON public.donor_enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_enquiries_status_created
  ON public.contact_enquiries(status, created_at DESC);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.id_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
REVOKE ALL ON TABLE public.admin_users, public.id_counters FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE
  public.student_applications, public.student_consents, public.student_documents,
  public.student_public_profiles, public.donor_enquiries, public.contact_enquiries,
  public.website_settings
FROM PUBLIC, anon, authenticated;

GRANT SELECT, UPDATE, DELETE ON TABLE
  public.student_applications, public.student_consents, public.student_documents,
  public.student_public_profiles, public.donor_enquiries, public.contact_enquiries,
  public.website_settings
TO authenticated;
GRANT INSERT ON TABLE public.student_public_profiles TO authenticated;

GRANT INSERT (
  id, application_code, full_name, date_of_birth, gender, guardian_name, guardian_phone,
  student_phone, email, city, district, address, education_level, institution_name,
  current_grade, academic_performance, educational_goal, support_reason, at_risk,
  expenses_monthly, expense_tuition, expense_books, expense_uniform, expense_transport,
  expense_other
) ON TABLE public.student_applications TO anon, authenticated;

GRANT INSERT (
  application_id, confirm_accurate, guardian_consent, consent_name, consent_photo,
  consent_story, consent_school, consent_location, consent_progress_updates
) ON TABLE public.student_consents TO anon, authenticated;

GRANT INSERT (
  application_id, doc_type, storage_path, original_filename, mime_type, size_bytes
) ON TABLE public.student_documents TO anon, authenticated;

GRANT INSERT (
  student_public_code, student_name, donor_name, donor_email, country, donor_phone,
  proposed_amount_pkr, sponsorship_type, message
) ON TABLE public.donor_enquiries TO anon, authenticated;

GRANT INSERT (full_name, email, country, subject, message)
  ON TABLE public.contact_enquiries TO anon, authenticated;

GRANT SELECT ON TABLE public.website_settings TO anon, authenticated;
GRANT UPDATE (data) ON TABLE public.website_settings TO authenticated;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_public_code(text) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.next_public_code(text) FROM PUBLIC;

DROP POLICY IF EXISTS student_applications_public_insert ON public.student_applications;
CREATE POLICY student_applications_public_insert
  ON public.student_applications FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending' AND admin_notes IS NULL);
DROP POLICY IF EXISTS student_applications_admin_all ON public.student_applications;
CREATE POLICY student_applications_admin_all
  ON public.student_applications FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_consents_public_insert ON public.student_consents;
CREATE POLICY student_consents_public_insert
  ON public.student_consents FOR INSERT TO anon, authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS student_consents_admin_all ON public.student_consents;
CREATE POLICY student_consents_admin_all
  ON public.student_consents FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_documents_public_insert ON public.student_documents;
CREATE POLICY student_documents_public_insert
  ON public.student_documents FOR INSERT TO anon, authenticated
  WITH CHECK (
    split_part(storage_path, '/', 1) = application_id::text
  );
DROP POLICY IF EXISTS student_documents_admin_all ON public.student_documents;
CREATE POLICY student_documents_admin_all
  ON public.student_documents FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS student_public_profiles_admin_all ON public.student_public_profiles;
CREATE POLICY student_public_profiles_admin_all
  ON public.student_public_profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS donor_enquiries_public_insert ON public.donor_enquiries;
CREATE POLICY donor_enquiries_public_insert
  ON public.donor_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND admin_notes IS NULL);
DROP POLICY IF EXISTS donor_enquiries_admin_all ON public.donor_enquiries;
CREATE POLICY donor_enquiries_admin_all
  ON public.donor_enquiries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS contact_enquiries_public_insert ON public.contact_enquiries;
CREATE POLICY contact_enquiries_public_insert
  ON public.contact_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'new' AND admin_notes IS NULL);
DROP POLICY IF EXISTS contact_enquiries_admin_all ON public.contact_enquiries;
CREATE POLICY contact_enquiries_admin_all
  ON public.contact_enquiries FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS website_settings_public_read ON public.website_settings;
CREATE POLICY website_settings_public_read
  ON public.website_settings FOR SELECT TO anon, authenticated
  USING (true);
DROP POLICY IF EXISTS website_settings_admin_update ON public.website_settings;
CREATE POLICY website_settings_admin_update
  ON public.website_settings FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_read_application_documents ON storage.objects;
CREATE POLICY admin_read_application_documents
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'application-documents' AND public.is_admin());
DROP POLICY IF EXISTS admin_update_application_documents ON storage.objects;
CREATE POLICY admin_update_application_documents
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'application-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'application-documents' AND public.is_admin());
DROP POLICY IF EXISTS admin_delete_application_documents ON storage.objects;
CREATE POLICY admin_delete_application_documents
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'application-documents' AND public.is_admin());

DROP POLICY IF EXISTS restrict_application_documents_select ON storage.objects;
CREATE POLICY restrict_application_documents_select
  ON storage.objects AS RESTRICTIVE FOR SELECT TO anon, authenticated
  USING (bucket_id <> 'application-documents' OR public.is_admin());
DROP POLICY IF EXISTS restrict_application_documents_insert ON storage.objects;
CREATE POLICY restrict_application_documents_insert
  ON storage.objects AS RESTRICTIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    bucket_id <> 'application-documents'
    OR public.is_admin()
    OR (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  );
DROP POLICY IF EXISTS restrict_application_documents_update ON storage.objects;
CREATE POLICY restrict_application_documents_update
  ON storage.objects AS RESTRICTIVE FOR UPDATE TO anon, authenticated
  USING (bucket_id <> 'application-documents' OR public.is_admin())
  WITH CHECK (bucket_id <> 'application-documents' OR public.is_admin());
DROP POLICY IF EXISTS restrict_application_documents_delete ON storage.objects;
CREATE POLICY restrict_application_documents_delete
  ON storage.objects AS RESTRICTIVE FOR DELETE TO anon, authenticated
  USING (bucket_id <> 'application-documents' OR public.is_admin());

NOTIFY pgrst, 'reload schema';
