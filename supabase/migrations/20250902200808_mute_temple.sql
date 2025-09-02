/*
  # Create files table for file uploads

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `original_name` (text)
      - `file_name` (text, unique)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `storage_path` (text)
      - `uploaded_by` (uuid, foreign key to users)
      - `download_count` (integer, default 0)
      - `is_public` (boolean, default true)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `files` table
    - Add policies for file access and management
*/

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_name text NOT NULL,
  file_name text UNIQUE NOT NULL,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE CASCADE,
  download_count integer DEFAULT 0,
  is_public boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Anyone can read public files
CREATE POLICY "Anyone can read public files"
  ON files
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Users can read their own files
CREATE POLICY "Users can read own files"
  ON files
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Users can upload files
CREATE POLICY "Users can upload files"
  ON files
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update own files"
  ON files
  FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Admins can manage all files
CREATE POLICY "Admins can manage all files"
  ON files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND is_admin = true
    )
  );