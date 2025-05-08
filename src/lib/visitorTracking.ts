import { supabase } from './supabaseClient';

/**
 * VISITOR TRACKING SYSTEM
 * 
 * This module provides functionality to track visitors on different pages of the site.
 * 
 * IMPORTANT DATABASE REQUIREMENTS:
 * - The 'visitors' table has a foreign key constraint with 'blog_posts' table
 * - When tracking a page, the post_id must match an ID in the blog_posts table
 * - Standard page IDs available for tracking:
 *   - 'home' - Homepage
 *   - 'about' - About page
 *   - 'contact' - Contact page
 *   - 'blog' - Blog listing page
 *   - 'projects' - Projects listing page
 *   - 'test-post' - For testing purposes
 *   - Any actual blog post or project ID
 * 
 * If you need to track a new type of page, add an entry to the blog_posts table first.
 */

/**
 * Interface for visitor record structure
 */
interface VisitorRecord {
  id?: number;
  post_id: string;
  visitor_id: string;
  ip_address?: string | null;
  user_agent?: string | null;
  referrer?: string | null;
  country?: string | null;
  city?: string | null;
  device_type?: string | null;
  first_visit?: string | null;
  last_visit?: string | null;
  visit_count?: number;
}

/**
 * Generate a visitor ID based on available browser information
 * This is a simple implementation that combines several factors to create a reasonably unique ID
 */
export function generateVisitorId(): string {
  console.log("🔍 visitorTracking: generateVisitorId called");

  // Check if visitor ID already exists in sessionStorage
  const existingId = sessionStorage.getItem('visitor_id');
  if (existingId) {
    console.log(`🔍 visitorTracking: Found existing visitor ID in sessionStorage: ${existingId}`);
    return existingId;
  }

  console.log("🔍 visitorTracking: No existing visitor ID found, generating new one");
  
  // Collect browser data
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const language = navigator.language || '';
  const platform = navigator.platform || '';
  const userAgent = navigator.userAgent || '';
  
  console.log(`🔍 visitorTracking: Browser data collected for fingerprinting - Screen: ${screenInfo}, TimeZone: ${timeZone}, Platform: ${platform}`);
  
  // Combine data points to create a fingerprint
  const dataToHash = [
    screenInfo,
    timeZone,
    language,
    platform,
    // Add some randomness to make it more unique
    Math.random().toString(36).substring(2, 15),
    // Add date-based component (will change periodically but remain same within a session)
    new Date().toISOString().slice(0, 10)
  ].join('|');
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < dataToHash.length; i++) {
    const char = dataToHash.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  // Create URL-friendly visitor ID without special characters
  const visitorId = `visitor_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
  
  console.log(`🔍 visitorTracking: Generated new visitor ID: ${visitorId}`);
  
  // Store in sessionStorage for consistency within the session
  try {
    sessionStorage.setItem('visitor_id', visitorId);
    console.log(`🔍 visitorTracking: Successfully stored visitor ID in sessionStorage`);
  } catch (e) {
    console.error(`🔍 visitorTracking: Error storing visitor ID in sessionStorage:`, e);
  }
  
  return visitorId;
}

/**
 * Get the client's IP address and location data using a public API
 * This uses a free, no-API-key service with fallback to ensure tracking works
 * even when IPinfo rate limits are reached
 * @returns Promise with IP address and location data
 */
export async function getClientLocationData(): Promise<{
  ip: string | null;
  country: string | null;
  city: string | null;
}> {
  try {
    // Try IPinfo.io first - their basic plan allows 50k requests/month without an API key
    // Use a timeout to prevent long waits if the service is slow
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://ipinfo.io/json', { 
      signal: controller.signal
    }).catch(err => {
      console.log('IPinfo fetch failed', err);
      return null;
    });
    
    clearTimeout(timeoutId); // Clear timeout to prevent memory leaks
    
    if (response && response.ok) {
      const data = await response.json();
      return {
        ip: data.ip || null,
        country: data.country || null,
        city: data.city || null
      };
    }
    
    // Fallback to a simple browser fingerprint if IPinfo fails or is rate limited
    console.log('IPinfo request failed or rate limited, using fallback for visitor tracking');
    
    // Use a simple hash of user-agent as fallback IP
    // This isn't a real IP but allows tracking to work
    const userAgent = navigator.userAgent || '';
    let ipFallback = 'local-' + simpleHash(userAgent).toString(16);
    
    return {
      ip: ipFallback,
      country: 'Unknown',
      city: 'Unknown'
    };
  } catch (error) {
    console.error('Error fetching IP and location data:', error);
    
    // Fallback when completely failed
    const userAgent = navigator.userAgent || '';
    let ipFallback = 'local-' + simpleHash(userAgent).toString(16);
    
    return { 
      ip: ipFallback, 
      country: 'Unknown', 
      city: 'Unknown' 
    };
  }
}

// Simple hash function for creating a fingerprint from user agent
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get the client's IP address using a public API
 * @deprecated Use getClientLocationData instead for full location info
 */
export async function getClientIpAddress(): Promise<string | null> {
  const locationData = await getClientLocationData();
  return locationData.ip;
}

// Time periods for unique visitor counting
export enum VisitorTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ALL_TIME = 'all_time'
}

/**
 * Check if a visitor should be counted as unique within a timeframe
 * @param lastVisitTime The timestamp of the visitor's last visit
 * @param timeframe The timeframe to check against (daily, weekly, monthly, all_time)
 * @returns Boolean indicating if this should count as a unique visit for the timeframe
 */
function isUniqueInTimeframe(lastVisitTime: string | null, timeframe: VisitorTimeframe): boolean {
  if (!lastVisitTime) {
    return true; // First visit is always unique
  }
  
  const lastVisit = new Date(lastVisitTime);
  const now = new Date();
  
  switch (timeframe) {
    case VisitorTimeframe.DAILY:
      // Check if last visit was on a different day
      return lastVisit.toDateString() !== now.toDateString();
      
    case VisitorTimeframe.WEEKLY:
      // Check if last visit was in a different week
      // Use startOfWeek = current date - day of week to get start of the week
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);
      return lastVisit < startOfWeek;
      
    case VisitorTimeframe.MONTHLY:
      // Check if last visit was in a different month
      return lastVisit.getMonth() !== now.getMonth() || 
             lastVisit.getFullYear() !== now.getFullYear();
      
    case VisitorTimeframe.ALL_TIME:
      // For all-time, visitor is only unique on first visit ever
      return false; // Since we already have a last visit time, not unique
      
    default:
      return true; // Default to counting as unique if timeframe is not specified
  }
}

/**
 * Detect device type from user agent string
 * @param userAgent The browser's user agent string
 * @returns The device type (desktop, mobile, tablet, etc.)
 */
export function detectDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'unknown';
  
  const ua = userAgent.toLowerCase();
  
  // Check for mobile devices
  if (
    /android.*mobile|mobile.*android|iphone|ipod|blackberry|iemobile|opera mini|samsung.*mobile|mobile.*firefox|windows phone/.test(ua)
  ) {
    return 'mobile';
  }

  // Check for tablets
  if (
    /ipad|android(?!.*mobile)|tablet|kindle|playbook|silk|tablet.*firefox/.test(ua)
  ) {
    return 'tablet';
  }

  // Check for smart TVs
  if (
    /smart-tv|smarttv|hbbtv|appletv|tvos|webos|netcast|tizen|roku|vizio|chromecast|android tv/.test(ua)
  ) {
    return 'smart-tv';
  }

  // Check for game consoles
  if (
    /playstation|xbox|nintendo switch|nintendo 3ds/.test(ua)
  ) {
    return 'game-console';
  }

  // Default to desktop for anything else
  return 'desktop';
}

/**
 * Track a visit to a specific post with improved error handling and timeframe-based unique counting
 * @param postId The ID of the blog post being viewed. IMPORTANT: Must match an ID in blog_posts table
 *               due to foreign key constraint. Standard page IDs: 'home', 'about', 'contact', 'blog', 'projects'.
 * @param timeframe The timeframe to use for unique visitor counting
 * @returns Promise<boolean> Success status
 */
export async function trackVisit(
  postId: string,
  timeframe: VisitorTimeframe = VisitorTimeframe.DAILY
): Promise<boolean> {
  console.log(`🔍 visitorTracking: trackVisit called for post ${postId}`);
  try {
    // CRITICAL FIX: Check if the post_id exists in blog_posts table first
    console.log(`🔍 visitorTracking: Verifying post_id exists in blog_posts table`);
    const { data: postExists, error: postCheckError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();
    
    if (postCheckError) {
      console.error('🔍 visitorTracking: Error checking post existence:', postCheckError);
      console.error('🔍 visitorTracking: Full error details:', JSON.stringify(postCheckError, null, 2));
      return false;
    }
    
    if (!postExists) {
      console.error(`🔍 visitorTracking: Post ID "${postId}" does not exist in blog_posts table. Tracking failed due to foreign key constraint.`);
      console.error(`🔍 visitorTracking: Allowed IDs include: 'home', 'about', 'contact', 'blog', 'projects', 'test-post', or any post ID in the blog_posts table.`);
      return false;
    }
    
    // Get or generate visitor ID
    console.log(`🔍 visitorTracking: Generating visitor ID`);
    const visitorId = generateVisitorId();
    console.log(`🔍 visitorTracking: Generated visitor ID: ${visitorId}`);
    
    // Get additional information
    const referrer = document.referrer || null;
    const userAgent = navigator.userAgent || null;
    const deviceType = detectDeviceType(userAgent);
    
    // Get the client's IP address and location data
    console.log(`🔍 visitorTracking: Fetching client location data`);
    const locationData = await getClientLocationData();
    console.log(`🔍 visitorTracking: Client IP: ${locationData.ip}, Country: ${locationData.country}, City: ${locationData.city}`);
    
    console.log(`🔍 visitorTracking: Tracking visit for post ${postId} with visitor ID ${visitorId} on ${deviceType} device`);
    
    // First check if a record already exists for this visitor and post
    console.log(`🔍 visitorTracking: Checking for existing visit record in Supabase`);
    const { data: existingVisit, error: queryError } = await supabase
      .from('visitors')
      .select('*') // Select all fields to have the complete record
      .filter('post_id', 'eq', postId)
      .filter('visitor_id', 'eq', visitorId)
      .maybeSingle() as { data: VisitorRecord | null, error: any };
    
    if (queryError) {
      console.error('🔍 visitorTracking: Error querying visitor record:', queryError);
      console.error('🔍 visitorTracking: Full error details:', JSON.stringify(queryError, null, 2));
      return false; // Return false to indicate failure - changed from original
    }

    // Calculate new visit count and determine if this is a unique visit for the timeframe
    const isFirstTimeVisit = !existingVisit;
    const isUniqueForTimeframe = existingVisit 
      ? isUniqueInTimeframe(existingVisit.last_visit, timeframe)
      : true;
    
    // Calculate new visit count (always increment regardless of uniqueness)
    const visitCount = existingVisit ? (existingVisit.visit_count || 0) + 1 : 1;
    
    console.log(`🔍 visitorTracking: Visit count for this visitor: ${visitCount} (${isFirstTimeVisit ? 'new' : 'existing'} visitor)`);
    console.log(`🔍 visitorTracking: Is unique for ${timeframe} timeframe: ${isUniqueForTimeframe}`);
    
    // Instead of upsert which can fail, use separate insert/update logic
    if (isFirstTimeVisit) {
      // First visit for this visitor to this post - insert new record
      console.log(`🔍 visitorTracking: Inserting new visitor record to Supabase`);
      const visitorData = {
        post_id: postId,
        visitor_id: visitorId,
        user_agent: userAgent,
        referrer: referrer,
        ip_address: locationData.ip,
        country: locationData.country,
        city: locationData.city,
        device_type: deviceType,
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        visit_count: 1
      };
      
      console.log('🔍 visitorTracking: Data to insert:', JSON.stringify(visitorData, null, 2));
      
      const { error: insertError } = await supabase.from('visitors').insert(visitorData);
      
      if (insertError) {
        console.error('🔍 visitorTracking: Error inserting visitor record:', insertError);
        console.error('🔍 visitorTracking: Full error details:', JSON.stringify(insertError, null, 2));
        // Changed to return false to indicate failure
        return false;
      } else {
        console.log(`🔍 visitorTracking: Successfully tracked new visit for post ${postId}`);
        return true;
      }
    } else {
      // Returning visitor - update the record
      console.log(`🔍 visitorTracking: Updating existing visitor record in Supabase`);
      const updateData = {
        last_visit: new Date().toISOString(),
        visit_count: visitCount,
        // Only update these if they're not already set - fix the linter errors with safe access
        user_agent: userAgent || existingVisit?.user_agent || null,
        referrer: referrer || existingVisit?.referrer || null,
        ip_address: locationData.ip || existingVisit?.ip_address || null,
        country: locationData.country || existingVisit?.country || null,
        city: locationData.city || existingVisit?.city || null,
        device_type: deviceType || existingVisit?.device_type || null
      };
      
      console.log('🔍 visitorTracking: Data to update:', JSON.stringify(updateData, null, 2));
      
      const { error: updateError } = await supabase.from('visitors')
        .update(updateData)
        .match({ post_id: postId, visitor_id: visitorId });
      
      if (updateError) {
        console.error('🔍 visitorTracking: Error updating visitor record:', updateError);
        console.error('🔍 visitorTracking: Full error details:', JSON.stringify(updateError, null, 2));
        return false; // Changed to return false to indicate failure
      } else {
        console.log(`🔍 visitorTracking: Successfully updated visit count for post ${postId}`);
        return true;
      }
    }
  } catch (error) {
    console.error('🔍 visitorTracking: Exception tracking visitor:', error);
    // Changed to return false to indicate failure
    return false;
  }
}

/**
 * Get visitor statistics for a specific post or all posts
 * @param postId Optional post ID to filter statistics
 * @param timeframe The timeframe to use for unique visitor counting
 * @returns Visitor statistics
 */
export async function getVisitorStats(postId?: string, timeframe: VisitorTimeframe = VisitorTimeframe.ALL_TIME) {
  try {
    let query = supabase.from('visitors').select('post_id, visitor_id, last_visit, first_visit, visit_count, ip_address');
    
    if (postId) {
      query = query.filter('post_id', 'eq', postId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting visitor stats:', error);
      console.error('Full error details:', JSON.stringify(error));
      return null;
    }
    
    if (!data || data.length === 0) {
      return {
        uniqueVisitors: 0,
        totalVisits: 0,
        uniqueIpAddresses: 0,
        postVisits: {}
      };
    }
    
    // Calculate current date for timeframe comparisons
    const now = new Date();
    
    // Filter visitors based on timeframe
    const filteredData = data.filter(visitor => {
      if (!visitor.last_visit) return false;
      
      const lastVisit = new Date(visitor.last_visit);
      
      switch (timeframe) {
        case VisitorTimeframe.DAILY:
          return lastVisit.toDateString() === now.toDateString();
          
        case VisitorTimeframe.WEEKLY:
          const dayOfWeek = now.getDay();
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - dayOfWeek);
          startOfWeek.setHours(0, 0, 0, 0);
          return lastVisit >= startOfWeek;
          
        case VisitorTimeframe.MONTHLY:
          return lastVisit.getMonth() === now.getMonth() && 
                 lastVisit.getFullYear() === now.getFullYear();
                 
        case VisitorTimeframe.ALL_TIME:
        default:
          return true; // Include all visits
      }
    });
    
    // Process the data to get unique visitors and total visits
    const stats = {
      uniqueVisitors: new Set(filteredData.map(v => v.visitor_id)).size,
      totalVisits: filteredData.reduce((sum, v) => sum + (v.visit_count || 0), 0),
      uniqueIpAddresses: new Set(filteredData.filter(v => v.ip_address).map(v => v.ip_address)).size,
      postVisits: {} as Record<string, { unique: number, total: number }>
    };
    
    // Group by post_id
    filteredData.forEach(visit => {
      if (!stats.postVisits[visit.post_id]) {
        stats.postVisits[visit.post_id] = { unique: 0, total: 0 };
      }
      stats.postVisits[visit.post_id].total += visit.visit_count || 0;
      stats.postVisits[visit.post_id].unique = (stats.postVisits[visit.post_id].unique || 0) + 1;
    });
    
    return stats;
  } catch (error) {
    console.error('Exception getting visitor stats:', error);
    return null;
  }
}

// A test function to verify that Supabase permissions are working
export async function testVisitorTracking(): Promise<boolean> {
  console.log("🔍 visitorTracking: Running test function");
  
  try {
    // First, check if we can read from the database
    console.log("🔍 visitorTracking: Testing read access to visitors table");
    const { data: readData, error: readError } = await supabase
      .from('visitors')
      .select('count(*)')
      .limit(1);
      
    if (readError) {
      console.error("🔍 visitorTracking: Read test failed:", readError);
    } else {
      console.log("🔍 visitorTracking: Read test succeeded:", readData);
    }
    
    // Now test if we can write to the database with a test record
    // IMPORTANT: post_id must match an ID in the blog_posts table due to foreign key constraint
    // We've added 'test-post', 'home', 'about', 'contact', 'projects', and 'blog' as valid IDs
    console.log("🔍 visitorTracking: Testing write access to visitors table");
    const testVisitorId = `test-visitor-${Date.now()}`;
    const { error: writeError } = await supabase
      .from('visitors')
      .insert({
        post_id: 'test-post', // This ID must exist in blog_posts table
        visitor_id: testVisitorId,
        ip_address: '127.0.0.1',
        user_agent: 'Test Agent',
        country: 'Test Country',
        city: 'Test City',
        device_type: 'test',
        first_visit: new Date().toISOString(),
        last_visit: new Date().toISOString(),
        visit_count: 1
      });
      
    if (writeError) {
      console.error("🔍 visitorTracking: Write test failed:", writeError);
      return false;
    } else {
      console.log("🔍 visitorTracking: Write test succeeded for visitor ID:", testVisitorId);
      
      // Try a second test with 'home' post ID
      const homeTestVisitorId = `home-test-visitor-${Date.now()}`;
      const { error: homeWriteError } = await supabase
        .from('visitors')
        .insert({
          post_id: 'home', // Using the 'home' ID which exists in blog_posts table
          visitor_id: homeTestVisitorId,
          ip_address: '127.0.0.2',
          user_agent: 'Home Test Agent',
          country: 'Test Country',
          city: 'Test City',
          device_type: 'test',
          first_visit: new Date().toISOString(),
          last_visit: new Date().toISOString(),
          visit_count: 1
        });
        
      if (homeWriteError) {
        console.error("🔍 visitorTracking: Home write test failed:", homeWriteError);
        return false;
      } else {
        console.log("🔍 visitorTracking: Home write test succeeded for visitor ID:", homeTestVisitorId);
        return true;
      }
    }
  } catch (error) {
    console.error("🔍 visitorTracking: Test function encountered an error:", error);
    return false;
  }
} 