CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS admin_users_select_admins ON public.admin_users;
CREATE POLICY admin_users_select_admins
ON public.admin_users
FOR SELECT
TO authenticated
USING (public.is_admin());

ALTER TABLE public.moto_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issue_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moto_models_select_public ON public.moto_models;
CREATE POLICY moto_models_select_public
ON public.moto_models
FOR SELECT
USING (true);

DROP POLICY IF EXISTS moto_models_insert_admin ON public.moto_models;
CREATE POLICY moto_models_insert_admin
ON public.moto_models
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS moto_models_update_admin ON public.moto_models;
CREATE POLICY moto_models_update_admin
ON public.moto_models
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS moto_models_delete_admin ON public.moto_models;
CREATE POLICY moto_models_delete_admin
ON public.moto_models
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS model_issues_select_public ON public.model_issues;
CREATE POLICY model_issues_select_public
ON public.model_issues
FOR SELECT
USING (true);

DROP POLICY IF EXISTS model_issues_insert_admin ON public.model_issues;
CREATE POLICY model_issues_insert_admin
ON public.model_issues
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS model_issues_update_admin ON public.model_issues;
CREATE POLICY model_issues_update_admin
ON public.model_issues
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS model_issues_delete_admin ON public.model_issues;
CREATE POLICY model_issues_delete_admin
ON public.model_issues
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS issue_solutions_select_public ON public.issue_solutions;
CREATE POLICY issue_solutions_select_public
ON public.issue_solutions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS issue_solutions_insert_admin ON public.issue_solutions;
CREATE POLICY issue_solutions_insert_admin
ON public.issue_solutions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS issue_solutions_update_admin ON public.issue_solutions;
CREATE POLICY issue_solutions_update_admin
ON public.issue_solutions
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS issue_solutions_delete_admin ON public.issue_solutions;
CREATE POLICY issue_solutions_delete_admin
ON public.issue_solutions
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS workshops_select_public ON public.workshops;
CREATE POLICY workshops_select_public
ON public.workshops
FOR SELECT
USING (true);

DROP POLICY IF EXISTS workshops_insert_admin ON public.workshops;
CREATE POLICY workshops_insert_admin
ON public.workshops
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS workshops_update_admin ON public.workshops;
CREATE POLICY workshops_update_admin
ON public.workshops
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS workshops_delete_admin ON public.workshops;
CREATE POLICY workshops_delete_admin
ON public.workshops
FOR DELETE
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS model_issue_images_delete_own ON public.model_issue_images;
CREATE POLICY model_issue_images_delete_own
ON public.model_issue_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS media_insert_authenticated ON storage.objects;
CREATE POLICY media_insert_authenticated
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voge-media'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = 'models'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

DROP POLICY IF EXISTS media_update_authenticated ON storage.objects;
CREATE POLICY media_update_authenticated
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'voge-media'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = 'models'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

DROP POLICY IF EXISTS media_delete_authenticated ON storage.objects;
CREATE POLICY media_delete_authenticated
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'voge-media'
  AND (
    public.is_admin()
    OR (storage.foldername(name))[1] = 'models'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);
