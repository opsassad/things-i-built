import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(title: string, type: 'blog' | 'project' = 'blog'): string {
  // Convert to lowercase and replace spaces and special characters with hyphens
  const baseSlug = title
    .toLowerCase()
    // Replace special characters with spaces
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    .trim()
    // Replace spaces with hyphens
    .replace(/\s/g, '-');
  
  // Add prefix based on type
  return `${type}/${baseSlug}`;
}

// Function to ensure unique slug
export function ensureUniqueSlug(
  baseSlug: string, 
  existingSlugs: string[]
): string {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
}

/**
 * Normalizes HTML content to ensure proper handling of image attributes
 * This ensures that image width, height, and alignment properties are
 * consistently preserved when saving to and retrieving from the database
 */
export function normalizeImageHtml(htmlContent: string): string {
  if (!htmlContent) return '';
  
  let processedContent = htmlContent;
  
  // Convert inline width styles to width attributes for better consistency
  processedContent = processedContent.replace(
    /<img(?![^>]*width=)([^>]*)style="[^"]*width:\s*([0-9]+)px[^"]*"([^>]*)>/g, 
    (match, before, width, after) => {
      return match.replace('<img', `<img width="${width}"`);
    }
  );
  
  // Ensure proper data-align attributes are added from wrapper alignment
  processedContent = processedContent.replace(
    /<(figure|div)[^>]*class="[^"]*image-resizer-wrapper[^"]*"[^>]*data-alignment="(left|center|right)"[^>]*>(\s*)<img(?![^>]*data-align)/g,
    (match, tag, align, spacing) => {
      return match.replace('<img', `<img data-align="${align}"`);
    }
  );
  
  // Convert non-standard 'alignment' attribute to data-align attribute
  processedContent = processedContent.replace(
    /<img([^>]*)alignment="(left|center|right)"([^>]*)>/g,
    '<img$1data-align="$2"$3>'
  );
  
  // Ensure wrapper width is transferred to the img if missing
  processedContent = processedContent.replace(
    /<(figure|div)[^>]*class="[^"]*image-resizer-wrapper[^"]*"[^>]*style="[^"]*width:\s*([0-9]+)px[^"]*"[^>]*>(\s*)<img(?![^>]*width=)/g,
    (match, tag, width, spacing) => {
      return match.replace('<img', `<img width="${width}"`);
    }
  );
  
  // Pre-wrap images with alignment to ensure they display correctly
  processedContent = processedContent
    .replace(/<img([^>]*)data-align="center"([^>]*)>/g, 
             '<div style="text-align: center; width: 100%;"><img$1data-align="center"$2 style="margin: 0 auto;"></div>')
    .replace(/<img([^>]*)data-align="left"([^>]*)>/g, 
             '<div style="text-align: left; width: 100%;"><img$1data-align="left"$2 style="float: left; margin-right: 1rem; margin-bottom: 0.5rem;"></div>')
    .replace(/<img([^>]*)data-align="right"([^>]*)>/g, 
             '<div style="text-align: right; width: 100%;"><img$1data-align="right"$2 style="float: right; margin-left: 1rem; margin-bottom: 0.5rem;"></div>');
  
  // Add classes for text alignment if not already present
  processedContent = processedContent.replace(
    /<p style="text-align: (left|center|right);">/g, 
    '<p class="text-$1" style="text-align: $1;">'
  );
  
  return processedContent;
}
