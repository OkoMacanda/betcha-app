-- Create storage buckets for file uploads

-- KYC Documents Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Evidence Bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence',
  'evidence',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for KYC documents
CREATE POLICY "Users can upload own KYC documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own KYC documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own KYC documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own KYC documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'kyc-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for evidence
CREATE POLICY "Bet participants can upload evidence"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = (storage.foldername(name))[1]::uuid
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Bet participants can read evidence"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence' AND
    EXISTS (
      SELECT 1 FROM public.bets
      WHERE bets.id = (storage.foldername(name))[1]::uuid
      AND (bets.creator_id = auth.uid() OR bets.opponent_id = auth.uid())
    )
  );

CREATE POLICY "Evidence owners can delete evidence"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );
