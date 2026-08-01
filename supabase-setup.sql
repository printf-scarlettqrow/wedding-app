-- ============================================================
-- WEDDING APP — Supabase Setup SQL
-- Josué & Ahinoam · 29 agosto 2026
-- Ejecutar en: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Tabla principal de fotos
CREATE TABLE IF NOT EXISTS public.photos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path  TEXT NOT NULL,
  public_url    TEXT NOT NULL,
  uploader_name TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Índice para ordenar por fecha de manera eficiente
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON public.photos (uploaded_at DESC);

-- 3. Habilitar Row Level Security
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- 4. Política: cualquiera puede leer las fotos (galería pública)
CREATE POLICY "Allow public read"
  ON public.photos
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 5. Política: cualquiera puede insertar fotos (invitados sin cuenta)
CREATE POLICY "Allow public insert"
  ON public.photos
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 6. Política: cualquiera puede borrar fotos
--    (la protección real la hace la clave en la UI del admin)
CREATE POLICY "Allow public delete"
  ON public.photos
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- 7. Habilitar Realtime en la tabla
ALTER PUBLICATION supabase_realtime ADD TABLE public.photos;

-- ============================================================
-- NOTA SOBRE EL BUCKET DE STORAGE
-- El bucket "wedding-photos" se puede crear desde la UI o con:
-- ============================================================

-- 8. Política de Storage: cualquiera puede subir/leer/borrar
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-photos', 'wedding-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Allow public uploads"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'wedding-photos');

CREATE POLICY "Allow public reads"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'wedding-photos');

CREATE POLICY "Allow public deletes"
  ON storage.objects
  FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'wedding-photos');
