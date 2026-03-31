CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('user','editor','admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = target_user_id), 'user');
$$;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(auth.uid()) = 'admin';
$$;

CREATE OR REPLACE FUNCTION public.is_editor()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_role(auth.uid()) IN ('editor','admin');
$$;

GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_editor() TO anon;
GRANT EXECUTE ON FUNCTION public.is_editor() TO authenticated;

DROP POLICY IF EXISTS user_roles_select_admin ON public.user_roles;
CREATE POLICY user_roles_select_admin
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS user_roles_insert_admin ON public.user_roles;
CREATE POLICY user_roles_insert_admin
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS user_roles_update_admin ON public.user_roles;
CREATE POLICY user_roles_update_admin
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auth_users_role ON auth.users;
CREATE TRIGGER trg_auth_users_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_role();

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

INSERT INTO public.user_roles (user_id, role)
SELECT au.user_id, 'admin'
FROM public.admin_users au
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

DROP TABLE IF EXISTS public.admin_users;

CREATE OR REPLACE FUNCTION public.list_users_with_roles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  role TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id AS user_id,
    u.email AS email,
    u.created_at AS created_at,
    COALESCE(ur.role, 'user') AS role
  FROM auth.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  WHERE public.is_admin()
  ORDER BY u.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.set_user_role(target_user_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'not_admin';
  END IF;
  IF new_role NOT IN ('user','editor','admin') THEN
    RAISE EXCEPTION 'invalid_role';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_users_with_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_user_role(UUID, TEXT) TO authenticated;

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

DROP POLICY IF EXISTS model_issues_insert_editor ON public.model_issues;
CREATE POLICY model_issues_insert_editor
ON public.model_issues
FOR INSERT
TO authenticated
WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS model_issues_update_editor ON public.model_issues;
CREATE POLICY model_issues_update_editor
ON public.model_issues
FOR UPDATE
TO authenticated
USING (public.is_editor())
WITH CHECK (public.is_editor());

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

DROP POLICY IF EXISTS issue_solutions_insert_editor ON public.issue_solutions;
CREATE POLICY issue_solutions_insert_editor
ON public.issue_solutions
FOR INSERT
TO authenticated
WITH CHECK (public.is_editor());

DROP POLICY IF EXISTS issue_solutions_update_editor ON public.issue_solutions;
CREATE POLICY issue_solutions_update_editor
ON public.issue_solutions
FOR UPDATE
TO authenticated
USING (public.is_editor())
WITH CHECK (public.is_editor());

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

ALTER TABLE public.model_issue_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS model_issue_images_select_public ON public.model_issue_images;
CREATE POLICY model_issue_images_select_public
ON public.model_issue_images
FOR SELECT
USING (true);

DROP POLICY IF EXISTS model_issue_images_insert_editor ON public.model_issue_images;
CREATE POLICY model_issue_images_insert_editor
ON public.model_issue_images
FOR INSERT
TO authenticated
WITH CHECK (public.is_editor() AND auth.uid() = user_id);

DROP POLICY IF EXISTS model_issue_images_delete_own_or_admin ON public.model_issue_images;
CREATE POLICY model_issue_images_delete_own_or_admin
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'models'
      AND public.is_admin()
    )
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'models'
      AND public.is_admin()
    )
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
    (storage.foldername(name))[1] = auth.uid()::text
    OR (
      (storage.foldername(name))[1] = 'models'
      AND public.is_admin()
    )
  )
);
