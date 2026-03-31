DROP POLICY IF EXISTS media_insert_authenticated ON storage.objects;
CREATE POLICY media_insert_authenticated
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'voge-media'
  AND (
    (storage.foldername(name))[1] = 'models'
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
    (storage.foldername(name))[1] = 'models'
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
    (storage.foldername(name))[1] = 'models'
    OR (storage.foldername(name))[1] = auth.uid()::text
  )
);
