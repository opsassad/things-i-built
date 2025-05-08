# Supabase Storage Setup Guide

This document provides instructions for setting up the storage bucket permissions in your Supabase project.

## Media Bucket Policies

To correctly configure your "media" bucket for this application, you need to set up appropriate policies in the Supabase dashboard:

1. **Navigate to the Storage section** in your Supabase dashboard
   - Go to: https://supabase.com/dashboard/project/[your-project-id]/storage/buckets

2. **Select the "media" bucket**

3. **Go to the "Policies" tab**

4. **Add the following policies:**

### For Viewing Files (SELECT)
- Policy name: `Public Access`
- Allowed operation: `SELECT`
- Policy definition: `(bucket_id = 'media'::text)`
- Description: "Allow public access to all files"

### For Uploading Files (INSERT)
- Policy name: `Anon Upload`
- Allowed operation: `INSERT`
- Policy definition: `(bucket_id = 'media'::text)`
- Description: "Allow anonymous uploads to the media bucket"

### For Updating Files (UPDATE)
- Policy name: `Anon Update`
- Allowed operation: `UPDATE`
- Policy definition: `(bucket_id = 'media'::text)`
- Description: "Allow anonymous updates to the media bucket"

### For Deleting Files (DELETE)
- Policy name: `Anon Delete`
- Allowed operation: `DELETE`
- Policy definition: `(bucket_id = 'media'::text)`
- Description: "Allow anonymous deletes from the media bucket"

## Security Considerations

The policies above grant anonymous access to all operations on the media bucket. In a production environment, you should consider:

1. **Restricting uploads** to authenticated users only
2. **Adding size limitations** to prevent abuse
3. **Implementing file type restrictions**
4. **Using RLS policies that check the user's ID** to restrict access to specific files

For authenticated-only access, you can use a policy like:
```sql
(bucket_id = 'media'::text) AND (auth.role() = 'authenticated'::text)
```

## Troubleshooting

If you see errors like "new row violates row-level security policy" in the console, it means your current policies don't allow the operation you're trying to perform. Review and update your policies accordingly.

For more information on Supabase Storage policies, visit:
https://supabase.com/docs/guides/storage/security 


-- Create policy to allow public read access (SELECT)
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'media'::text);

-- Create policy to allow anonymous uploads (INSERT)
CREATE POLICY "Anon Upload" ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'media'::text);

-- Create policy to allow updating files (UPDATE)
CREATE POLICY "Anon Update" ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'media'::text)
  WITH CHECK (bucket_id = 'media'::text);

-- Create policy to allow deleting files (DELETE)
CREATE POLICY "Anon Delete" ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'media'::text);