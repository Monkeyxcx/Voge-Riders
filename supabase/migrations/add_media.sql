CREATE TABLE IF NOT EXISTS public.model_issue_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_model_issue_images_issue_id ON public.model_issue_images(issue_id);

ALTER TABLE public.model_issue_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS model_issue_images_select_public ON public.model_issue_images;
CREATE POLICY model_issue_images_select_public
ON public.model_issue_images
FOR SELECT
USING (true);

DROP POLICY IF EXISTS model_issue_images_insert_own ON public.model_issue_images;
CREATE POLICY model_issue_images_insert_own
ON public.model_issue_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS model_issue_images_delete_own ON public.model_issue_images;
CREATE POLICY model_issue_images_delete_own
ON public.model_issue_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

ALTER TABLE public.moto_models
ADD COLUMN IF NOT EXISTS image_url TEXT;

GRANT SELECT ON public.model_issue_images TO anon;
GRANT ALL PRIVILEGES ON public.model_issue_images TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('voge-media', 'voge-media', true)
ON CONFLICT (id)
DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS media_select_public ON storage.objects;
CREATE POLICY media_select_public
ON storage.objects
FOR SELECT
USING (bucket_id = 'voge-media');

DROP POLICY IF EXISTS media_insert_authenticated ON storage.objects;
CREATE POLICY media_insert_authenticated
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'voge-media');

DROP POLICY IF EXISTS media_update_authenticated ON storage.objects;
CREATE POLICY media_update_authenticated
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'voge-media');

DROP POLICY IF EXISTS media_delete_authenticated ON storage.objects;
CREATE POLICY media_delete_authenticated
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'voge-media');
