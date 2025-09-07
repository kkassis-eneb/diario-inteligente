-- Add new columns to entradas table for enhanced text management
ALTER TABLE public.entradas 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS improved_text TEXT,
ADD COLUMN IF NOT EXISTS improvement_status TEXT DEFAULT 'none';

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_entradas_texto_ocr_gin ON public.entradas USING gin(to_tsvector('spanish', texto_ocr));
CREATE INDEX IF NOT EXISTS idx_entradas_tags_gin ON public.entradas USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_entradas_private ON public.entradas (user_id, is_private);