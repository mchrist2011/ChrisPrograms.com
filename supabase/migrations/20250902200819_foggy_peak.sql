/*
  # Create storage bucket for game files

  1. Storage
    - Create `game-files` bucket for file uploads
    - Set up policies for file access

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access to files
*/

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-files', 'game-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'game-files');

-- Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'game-files');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'game-files' AND auth.uid()::text = (storage.foldername(name))[1]);