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

REVOKE ALL ON FUNCTION public.next_public_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.next_public_code(text) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
