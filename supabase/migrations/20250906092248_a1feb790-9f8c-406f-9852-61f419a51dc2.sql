-- Security Fix: Add user authentication and proper RLS policies

-- First, add user_id columns to existing tables
ALTER TABLE public.entradas ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.archivos ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies to be user-specific

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on entradas" ON public.entradas;
DROP POLICY IF EXISTS "Allow all operations on archivos" ON public.archivos;

-- Create secure RLS policies for entradas
CREATE POLICY "Users can view their own entradas" 
ON public.entradas FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entradas" 
ON public.entradas FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entradas" 
ON public.entradas FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entradas" 
ON public.entradas FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create secure RLS policies for archivos
CREATE POLICY "Users can view their own archivos" 
ON public.archivos FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own archivos" 
ON public.archivos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own archivos" 
ON public.archivos FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own archivos" 
ON public.archivos FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Create secure RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Create secure storage policies for diario-fotos bucket
CREATE POLICY "Users can view their own files" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (bucket_id = 'diario-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload their own files" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'diario-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own files" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (bucket_id = 'diario-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own files" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id = 'diario-fotos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing data to set user_id (for demo purposes, set to a placeholder)
-- In production, you would need to properly assign these to actual users
-- For now, we'll leave them NULL and handle this in the application logic