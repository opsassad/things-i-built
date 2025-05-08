import { getPublicMediaUrl } from './supabaseClient';

/**
 * Creates an API URL for accessing a media file through our proxy
 * 
 * @param bucket Supabase storage bucket name
 * @param path Path to the file within the bucket
 * @returns Proxied URL
 */
export const getMediaUrl = (bucket: string, path: string): string => {
  return `/api/media/${bucket}/${path}`;
};

/**
 * Get file type information from a file object
 * 
 * @param file File object
 * @returns Object with file information
 */
export const getFileInfo = (file: File) => {
  return {
    name: file.name,
    size: `${Math.round(file.size / 1024)} KB`,
    type: file.type
  };
};

/**
 * Convert a file to a data URL
 * 
 * @param file File object
 * @returns Promise resolving to a data URL string
 */
export const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      resolve(event.target.result as string);
    };
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    reader.readAsDataURL(file);
  });
}; 