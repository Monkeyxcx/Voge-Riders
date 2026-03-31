ALTER TABLE public.moto_models
ADD COLUMN IF NOT EXISTS image_path TEXT;

ALTER TABLE public.model_issue_images
ADD COLUMN IF NOT EXISTS object_path TEXT;
