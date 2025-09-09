-- Fix security warning: Function Search Path Mutable
-- Update the trigger function to have proper search_path
CREATE OR REPLACE FUNCTION public.set_user_id_from_jwt()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;