-- Fix search path security warning by updating existing functions
CREATE OR REPLACE FUNCTION public.generate_unique_slug()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_slug TEXT;
  slug_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character alphanumeric string
    new_slug := array_to_string(
      ARRAY(
        SELECT substr('abcdefghijklmnopqrstuvwxyz0123456789', 
                     (random() * 35)::int + 1, 1)
        FROM generate_series(1, 8)
      ), 
      ''
    );
    
    -- Check if slug already exists
    SELECT EXISTS(SELECT 1 FROM public.sessions WHERE unique_url_slug = new_slug) INTO slug_exists;
    
    -- If slug is unique, exit loop
    IF NOT slug_exists THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_session_activity(session_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.sessions 
  SET last_activity_at = NOW() 
  WHERE id = session_uuid;
END;
$$;