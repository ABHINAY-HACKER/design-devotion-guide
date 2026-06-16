
-- Explicitly deny SELECT/UPDATE/DELETE on contact_messages for anon/authenticated
CREATE POLICY "Deny select contact_messages" ON public.contact_messages
  FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny update contact_messages" ON public.contact_messages
  FOR UPDATE TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Deny delete contact_messages" ON public.contact_messages
  FOR DELETE TO anon, authenticated USING (false);

-- Restrict UPDATE on resumes bucket to file owner (first folder = uid)
CREATE POLICY "Users update own resumes" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[1] = auth.uid()::text);
