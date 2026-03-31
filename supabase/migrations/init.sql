CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.moto_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  cc INT,
  year INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.model_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL,
  title TEXT NOT NULL,
  symptoms TEXT,
  severity TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.issue_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL,
  steps TEXT NOT NULL,
  parts TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  address TEXT,
  contact TEXT,
  tags TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.member_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('model','issue','workshop')),
  entity_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_member_comments_updated_at ON public.member_comments;
CREATE TRIGGER trg_member_comments_updated_at
BEFORE UPDATE ON public.member_comments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_model_issues_model_id ON public.model_issues(model_id);
CREATE INDEX IF NOT EXISTS idx_issue_solutions_issue_id ON public.issue_solutions(issue_id);
CREATE INDEX IF NOT EXISTS idx_member_comments_entity ON public.member_comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_member_comments_created_at ON public.member_comments(created_at DESC);

ALTER TABLE public.member_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_select_public ON public.member_comments;
CREATE POLICY comments_select_public
ON public.member_comments
FOR SELECT
USING (true);

DROP POLICY IF EXISTS comments_insert_own ON public.member_comments;
CREATE POLICY comments_insert_own
ON public.member_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS comments_update_own ON public.member_comments;
CREATE POLICY comments_update_own
ON public.member_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS comments_delete_own ON public.member_comments;
CREATE POLICY comments_delete_own
ON public.member_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT ON public.moto_models, public.model_issues, public.issue_solutions, public.workshops, public.member_comments TO anon;
GRANT ALL PRIVILEGES ON public.moto_models, public.model_issues, public.issue_solutions, public.workshops, public.member_comments TO authenticated;

INSERT INTO public.moto_models (slug, name, type, cc, year)
VALUES
  ('voge-300r', 'Voge 300R', 'Naked', 300, 2023),
  ('voge-500ds', 'Voge 500DS', 'Adventure', 500, 2022),
  ('voge-525dsx', 'Voge 525DSX', 'Adventure', 525, 2024)
ON CONFLICT (slug) DO NOTHING;

WITH m AS (
  SELECT id, slug FROM public.moto_models WHERE slug IN ('voge-300r','voge-500ds','voge-525dsx')
)
INSERT INTO public.model_issues (model_id, title, symptoms, severity)
SELECT
  (SELECT id FROM m WHERE slug = 'voge-300r'),
  'Batería se descarga rápido',
  'Arranque lento, voltaje bajo al día siguiente, accesorios conectados permanentemente.',
  'media'
UNION ALL
SELECT
  (SELECT id FROM m WHERE slug = 'voge-500ds'),
  'Vibración notable a ciertas RPM',
  'Se siente más vibración entre 5k–6k rpm, espejos tiemblan, fatiga en trayectos largos.',
  'baja'
UNION ALL
SELECT
  (SELECT id FROM m WHERE slug = 'voge-525dsx'),
  'Ruido metálico al frenar',
  'Chirrido o roce al frenar suave; aumenta en frío o lluvia.',
  'baja'
ON CONFLICT DO NOTHING;

WITH issues AS (
  SELECT mi.id, mm.slug AS model_slug, mi.title
  FROM public.model_issues mi
  JOIN public.moto_models mm ON mm.id = mi.model_id
)
INSERT INTO public.issue_solutions (issue_id, steps, parts)
SELECT
  (SELECT id FROM issues WHERE model_slug = 'voge-300r' AND title = 'Batería se descarga rápido'),
  '1) Medir consumo en reposo con multímetro.\n2) Revisar accesorios (alarma, USB, tracker) y desconectar para probar.\n3) Verificar estado de batería y carga del regulador/alternador.\n4) Si el consumo es alto: instalar relevador o desconexión automática para accesorios.',
  'Multímetro; relevador 12V; conectores; batería si está deteriorada.'
UNION ALL
SELECT
  (SELECT id FROM issues WHERE model_slug = 'voge-500ds' AND title = 'Vibración notable a ciertas RPM'),
  '1) Revisar apriete de soportes de motor y chasis con torque adecuado.\n2) Inspeccionar estado de gomas/soportes y manillar.\n3) Verificar alineación de cadena y tensión según manual.\n4) Balancear ruedas si hay vibración también en velocidad constante.',
  'Llave dinamométrica; contrapesos; kit balanceo si aplica.'
UNION ALL
SELECT
  (SELECT id FROM issues WHERE model_slug = 'voge-525dsx' AND title = 'Ruido metálico al frenar'),
  '1) Limpiar pinza y disco (sin contaminar pastillas).\n2) Revisar desgaste y asentamiento de pastillas.\n3) Aplicar grasa antichirrido (dorso) si corresponde.\n4) Si persiste: revisar guía de pinza y torque, o cambiar pastillas por compuesto diferente.',
  'Limpiafrenos; grasa antichirrido; pastillas si corresponde.'
ON CONFLICT DO NOTHING;

INSERT INTO public.workshops (name, city, address, contact, tags, notes)
VALUES
  (
    'Taller Ruta Norte',
    'Ciudad de ejemplo',
    'Av. Principal 123',
    'WhatsApp: +00 000 000 000',
    'oficial,diagnostico,servicio',
    'Recomendado para mantenimientos y revisiones generales.'
  ),
  (
    'MotoLab',
    'Ciudad de ejemplo',
    'Calle 45 #67-89',
    'Instagram: @motolab',
    'multimarca,electricidad',
    'Buena experiencia en temas eléctricos y accesorios.'
  )
ON CONFLICT DO NOTHING;

