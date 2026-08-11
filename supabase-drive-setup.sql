-- ============================================================
-- WEDDING APP — Google Drive Integration SQL
-- Josué & Ahinoam · Ejecutar DESPUÉS de supabase-setup.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. Nuevas columnas en la tabla photos
ALTER TABLE public.photos
  ADD COLUMN IF NOT EXISTS drive_file_id TEXT,
  ADD COLUMN IF NOT EXISTS media_type    TEXT DEFAULT 'image';

-- 2. Tabla de configuración de Drive (refresh token, folder ID)
--    Solo accesible por el service_role (no por anon/authenticated)
CREATE TABLE IF NOT EXISTS public.drive_config (
  id            INT  PRIMARY KEY DEFAULT 1,
  refresh_token TEXT NOT NULL,
  folder_id     TEXT NOT NULL,
  drive_email   TEXT,
  connected_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.drive_config ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas → solo service_role puede leer/escribir (bypasses RLS)

-- 3. Bucket privado para originales (antes de subirlos a Drive)
INSERT INTO storage.buckets (id, name, public)
VALUES ('wedding-originals', 'wedding-originals', false)
ON CONFLICT (id) DO NOTHING;

-- Invitados pueden subir originales (anon)
CREATE POLICY "Allow guest uploads to originals"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'wedding-originals');

-- service_role puede leer/borrar originales (bypasses RLS automáticamente)
-- No se necesitan políticas adicionales para service_role
