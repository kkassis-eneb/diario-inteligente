-- PHASE 1: CRITICAL DATA INTEGRITY FIXES (continued)
-- Remove orphaned rows first
DELETE FROM public.archivos WHERE user_id IS NULL;
DELETE FROM public.entradas WHERE user_id IS NULL;

-- Enforce NOT NULL constraints
ALTER TABLE public.entradas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.archivos ALTER COLUMN user_id SET NOT NULL;

-- Create trigger function to auto-fill user_id from JWT (safety net)
CREATE OR REPLACE FUNCTION public.set_user_id_from_jwt()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- Attach BEFORE INSERT triggers for safety
DROP TRIGGER IF EXISTS trg_set_user_id_on_entradas ON public.entradas;
CREATE TRIGGER trg_set_user_id_on_entradas
  BEFORE INSERT ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_from_jwt();

DROP TRIGGER IF EXISTS trg_set_user_id_on_archivos ON public.archivos;
CREATE TRIGGER trg_set_user_id_on_archivos
  BEFORE INSERT ON public.archivos
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_from_jwt();

-- PHASE 2: STORAGE SECURITY - Remove overly permissive policies
DROP POLICY IF EXISTS "public bucket read" ON storage.objects;
DROP POLICY IF EXISTS "public bucket write" ON storage.objects;
DROP POLICY IF EXISTS "public bucket delete" ON storage.objects;
DROP POLICY IF EXISTS "folder based read" ON storage.objects;
DROP POLICY IF EXISTS "folder based write" ON storage.objects;
DROP POLICY IF EXISTS "folder based delete" ON storage.objects;

-- Create secure metadata-based policies
DROP POLICY IF EXISTS "read own files" ON storage.objects;
CREATE POLICY "read own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

DROP POLICY IF EXISTS "write own files" ON storage.objects;
CREATE POLICY "write own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

DROP POLICY IF EXISTS "delete own files" ON storage.objects;
CREATE POLICY "delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

-- PHASE 3: PROFILE PRIVACY - Restrict to owner-only access
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;

CREATE POLICY "read own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());