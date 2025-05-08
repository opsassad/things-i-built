import { createClient } from '@supabase/supabase-js';

// Properly typed env variables for Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Read Supabase URL and Anon Key from environment variables
// Ensure you have a .env file in the root with these variables defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Basic validation to ensure environment variables are set
if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL environment variable is not set.');
  throw new Error('Supabase URL is not configured. Please check your .env file.');
}
if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY environment variable is not set.');
  throw new Error('Supabase Anon Key is not configured. Please check your .env file.');
}

// Initialize and export the Supabase client
console.log("🔍 Initializing Supabase client with URL:", supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true
  },
  global: {
    headers: {
      'x-admin-access': 'true', // Custom header to identify admin requests
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation' // Ensures Supabase returns data after mutations
    }
  }
});

// We assume the 'media' bucket exists and policies are configured correctly.
// The previous check using getBucket often fails with anon keys due to permissions
// for listing/getting buckets, even if object operations are allowed by policy.
// Removing the check simplifies initialization and avoids confusing 400/404 errors.
console.log("🔍 Supabase client initialized. Testing Supabase connection...");

// Add a quick test to verify connection
(async () => {
  try {
    // Fix: use proper Supabase count syntax
    const { count, error } = await supabase.from('visitors').select('*', { count: 'exact', head: true });
    if (error) {
      console.error("🔍 Supabase connection test error:", error);
    } else {
      console.log("🔍 Supabase connection test successful. Visitor count:", count);
    }
  } catch (e) {
    console.error("🔍 Supabase connection test exception:", e);
  }
})();

// Restore the getPublicMediaUrl function
/**
 * Transforms a Supabase storage URL into a proxied URL or returns the original URL.
 * @param supabaseUrl - The URL from Supabase storage (e.g., https://<id>.supabase.co/storage/v1/object/public/media/filename.jpg)
 *                      or potentially a local URL (blob:, data:).
 * @returns The transformed URL (e.g., /api/media/media/filename.jpg) or the original URL if no transformation is needed.
 */
export const getPublicMediaUrl = (supabaseUrl: string | null | undefined): string => {
  // console.log('[getPublicMediaUrl] Input URL:', supabaseUrl); // Keep logs commented out unless debugging

  if (!supabaseUrl || typeof supabaseUrl !== 'string') {
    // console.log('[getPublicMediaUrl] Invalid input, returning empty string.');
    return ''; // Return empty string for invalid input
  }

  // If it's already a relative path, a data URL, or blob URL, return it directly
  if (supabaseUrl.startsWith('/') || supabaseUrl.startsWith('data:') || supabaseUrl.startsWith('blob:')) {
    // console.log('[getPublicMediaUrl] Already relative or local, returning as is:', supabaseUrl);
    return supabaseUrl;
  }

  try {
    // Check if it's a Supabase storage URL pattern
    const supabaseStoragePattern = /storage\/v1\/object\/public\//;
    if (!supabaseStoragePattern.test(supabaseUrl)) {
      // console.log('[getPublicMediaUrl] Not a Supabase storage URL, returning as is:', supabaseUrl);
      return supabaseUrl; // Not a standard Supabase public URL, return as is
    }

    // Extract the path part after "storage/v1/object/public/"
    const urlParts = supabaseUrl.split(supabaseStoragePattern);
    if (urlParts.length !== 2 || !urlParts[1]) {
      console.warn('[getPublicMediaUrl] Could not extract storage path from URL:', supabaseUrl);
      return supabaseUrl; // Unexpected format, return original
    }

    const storagePath = urlParts[1]; // e.g., "media/filename.jpg"
    // Ensure the proxy path starts with /api/media/ followed by the storage path
    const maskedUrl = `/api/media/${storagePath}`;

    // console.log('[getPublicMediaUrl] Transformed URL:', maskedUrl);
    return maskedUrl;

  } catch (error) {
    console.error('[getPublicMediaUrl] Error transforming Supabase URL:', supabaseUrl, error);
    return supabaseUrl; // Return original URL on error
  }
};

/**
 * Get a storage URL from Supabase for a bucket and path
 * 
 * @param bucket - Storage bucket name
 * @param path - File path within the bucket
 * @returns Public URL for the file
 */
export const getSupabaseStorageUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}; 