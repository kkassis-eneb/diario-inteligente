-- PHASE 1: CRITICAL DATA INTEGRITY FIXES
-- 1.a) Inspect current NULL user_id rows (for logging)
SELECT 'entradas' as table_name, COUNT(*) as null_user_id_count
FROM public.entradas WHERE user_id IS NULL
UNION ALL
SELECT 'archivos' as table_name, COUNT(*)
FROM public.archivos WHERE user_id IS NULL;

-- 1.b) Remove orphaned rows (safest approach for security)
DELETE FROM public.archivos WHERE user_id IS NULL;
DELETE FROM public.entradas WHERE user_id IS NULL;

-- 1.c) Enforce NOT NULL going forward to prevent future issues
ALTER TABLE public.entradas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.archivos ALTER COLUMN user_id SET NOT NULL;

-- 1.d) Add foreign key constraints for referential integrity
ALTER TABLE public.entradas ADD CONSTRAINT entradas_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.archivos ADD CONSTRAINT archivos_user_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1.e) Create trigger function to auto-fill user_id from JWT
CREATE OR REPLACE FUNCTION public.set_user_id_from_jwt()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

-- 1.f) Attach BEFORE INSERT triggers
DROP TRIGGER IF EXISTS trg_set_user_id_on_entradas ON public.entradas;
CREATE TRIGGER trg_set_user_id_on_entradas
  BEFORE INSERT ON public.entradas
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_from_jwt();

DROP TRIGGER IF EXISTS trg_set_user_id_on_archivos ON public.archivos;
CREATE TRIGGER trg_set_user_id_on_archivos
  BEFORE INSERT ON public.archivos
  FOR EACH ROW EXECUTE FUNCTION public.set_user_id_from_jwt();

-- PHASE 2: STORAGE SECURITY FIXES
-- 2.a) Remove overly-permissive policies
DROP POLICY IF EXISTS "public bucket read" ON storage.objects;
DROP POLICY IF EXISTS "public bucket write" ON storage.objects;
DROP POLICY IF EXISTS "public bucket delete" ON storage.objects;
DROP POLICY IF EXISTS "folder based read" ON storage.objects;
DROP POLICY IF EXISTS "folder based write" ON storage.objects;
DROP POLICY IF EXISTS "folder based delete" ON storage.objects;
DROP POLICY IF EXISTS "read any file" ON storage.objects;
DROP POLICY IF EXISTS "delete any file" ON storage.objects;

-- 2.b) Create strict owner-only policies using metadata.owner
DROP POLICY IF EXISTS "read own files" ON storage.objects;
DROP POLICY IF EXISTS "write own files" ON storage.objects;
DROP POLICY IF EXISTS "update own files" ON storage.objects;
DROP POLICY IF EXISTS "delete own files" ON storage.objects;

CREATE POLICY "read own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

CREATE POLICY "write own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

CREATE POLICY "update own files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
) WITH CHECK (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

CREATE POLICY "delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'diario-fotos' AND (metadata ->> 'owner')::uuid = auth.uid()
);

-- PHASE 3: PROFILE PRIVACY FIXES
-- Drop open-read policies and create owner-only access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "read own profile" ON public.profiles;
DROP POLICY IF EXISTS "update own profile" ON public.profiles;

CREATE POLICY "read own profile" ON public.profiles
FOR SELECT USING (id = auth.uid());

CREATE POLICY "update own profile" ON public.profiles
FOR UPDATE USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Keep the existing insert policy as it's already secure
CREATE POLICY "insert own profile" ON public.profiles
FOR INSERT WITH CHECK (id = auth.uid());