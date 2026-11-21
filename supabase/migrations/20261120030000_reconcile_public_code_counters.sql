WITH used_codes AS (
  SELECT 'TD'::text AS prefix, application_code AS code
  FROM public.student_applications
  UNION ALL
  SELECT 'ENQ', enquiry_code
  FROM public.donor_enquiries
  UNION ALL
  SELECT 'ENQ', enquiry_code
  FROM public.contact_enquiries
),
highest_used AS (
  SELECT
    prefix,
    MAX(substring(code FROM length(prefix) + 2)::bigint) AS last_value
  FROM used_codes
  WHERE code ~ '^(TD|ENQ)-[0-9]+$'
  GROUP BY prefix
),
counters_to_sync AS (
  SELECT
    prefixes.prefix,
    GREATEST(1001, COALESCE(highest_used.last_value, 1001)) AS last_value
  FROM (VALUES ('TD'::text), ('ENQ'::text)) AS prefixes(prefix)
  LEFT JOIN highest_used USING (prefix)
)
INSERT INTO public.id_counters (prefix, last_value)
SELECT prefix, last_value
FROM counters_to_sync
ON CONFLICT (prefix) DO UPDATE
SET last_value = GREATEST(public.id_counters.last_value, EXCLUDED.last_value);

NOTIFY pgrst, 'reload schema';
