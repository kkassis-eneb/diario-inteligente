-- Create storage bucket for diary photos
INSERT INTO storage.buckets (id, name, public) VALUES ('diario-fotos', 'diario-fotos', false);

-- Create Entradas table first (without foreign key reference)
CREATE TABLE public.entradas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    año INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM fecha)) STORED,
    mes INTEGER GENERATED ALWAYS AS (EXTRACT(MONTH FROM fecha)) STORED,
    dia_semana INTEGER GENERATED ALWAYS AS (EXTRACT(DOW FROM fecha)) STORED,
    texto_ocr TEXT,
    fuente TEXT CHECK (fuente IN ('foto', 'pdf')) NOT NULL,
    emocion_principal TEXT,
    emociones_secundarias TEXT[],
    valencia TEXT CHECK (valencia IN ('bienestar', 'neutro', 'malestar')),
    intensidad INTEGER CHECK (intensidad >= 1 AND intensidad <= 3),
    color_hex TEXT,
    emoji TEXT,
    tags_comportamiento TEXT[],
    tags_tema TEXT[],
    ubicacion_lat DECIMAL,
    ubicacion_lon DECIMAL,
    lugar_nombre TEXT,
    lugar_tipo TEXT CHECK (lugar_tipo IN ('punto_interes', 'barrio', 'ciudad', 'region', 'país', 'natural')),
    origen_ubicacion TEXT CHECK (origen_ubicacion IN ('texto', 'dispositivo', 'manual')),
    confianza_ubicacion DECIMAL CHECK (confianza_ubicacion >= 0 AND confianza_ubicacion <= 1),
    pais TEXT,
    region TEXT,
    ciudad TEXT,
    estado_validacion TEXT CHECK (estado_validacion IN ('pending', 'validated')) DEFAULT 'pending',
    hash_archivo TEXT,
    confianza_modelo DECIMAL CHECK (confianza_modelo >= 0 AND confianza_modelo <= 1),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create Archivos table with foreign key
CREATE TABLE public.archivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entrada_id UUID REFERENCES public.entradas(id) ON DELETE CASCADE,
    tipo TEXT CHECK (tipo IN ('imagen', 'pdf')) NOT NULL,
    url_privada TEXT NOT NULL,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entradas ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for archivos (for now allowing all operations)
CREATE POLICY "Allow all operations on archivos" ON public.archivos FOR ALL USING (true) WITH CHECK (true);

-- Create RLS policies for entradas (for now allowing all operations)  
CREATE POLICY "Allow all operations on entradas" ON public.entradas FOR ALL USING (true) WITH CHECK (true);

-- Storage policies for diario-fotos bucket
CREATE POLICY "Allow uploads to diario-fotos bucket" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diario-fotos');

CREATE POLICY "Allow reads from diario-fotos bucket" ON storage.objects FOR SELECT USING (bucket_id = 'diario-fotos');

CREATE POLICY "Allow updates to diario-fotos bucket" ON storage.objects FOR UPDATE USING (bucket_id = 'diario-fotos');

CREATE POLICY "Allow deletes from diario-fotos bucket" ON storage.objects FOR DELETE USING (bucket_id = 'diario-fotos');