import { supabase } from './supabaseClient';
import { getClientLocationData } from './visitorTracking';

/**
 * Interface representing a rating entry
 */
export interface Rating {
  id?: number;
  post_id: string;
  rating: number;
  created_at?: string;
  updated_at?: string;
  client_identifier?: string;
  email?: string;
  name?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Generate a unique session ID if not already stored
 */
export const getSessionId = (): string => {
  const storageKey = 'rating_session_id';
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : 
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
};

/**
 * Check if the user is allowed to rate now (not too soon after a previous rating)
 */
export const checkRateLimit = (postId: string): boolean => {
  const rateKey = `rate_limit_${postId}`;
  const lastRated = localStorage.getItem(rateKey);
  
  if (lastRated) {
    const timeDiff = Date.now() - new Date(lastRated).getTime();
    // Rate limit: one rating per 30 minutes per post
    if (timeDiff < 1800000) {
      return false;
    }
  }
  
  return true;
};

/**
 * Save the timestamp of when a user rated to enforce rate limiting
 */
export const updateRateLimit = (postId: string): void => {
  const rateKey = `rate_limit_${postId}`;
  localStorage.setItem(rateKey, new Date().toISOString());
};

/**
 * Retrieve the user's previous rating for a post from local storage
 */
export const getUserRating = (postId: string): number | null => {
  try {
    const ratedPosts = JSON.parse(localStorage.getItem('ratedPosts') || '{}');
    return ratedPosts[postId] || null;
  } catch (error) {
    console.error('Error retrieving user rating:', error);
    return null;
  }
};

/**
 * Save the user's rating to local storage for persistence
 */
export const saveUserRating = (postId: string, rating: number): void => {
  try {
    const ratedPosts = JSON.parse(localStorage.getItem('ratedPosts') || '{}');
    ratedPosts[postId] = rating;
    localStorage.setItem('ratedPosts', JSON.stringify(ratedPosts));
  } catch (error) {
    console.error('Error saving user rating:', error);
  }
};

/**
 * Submit a rating to the server
 */
export const submitRating = async (postId: string, rating: number, email?: string, name?: string): Promise<void> => {
  if (!postId || rating < 1 || rating > 5) {
    throw new Error('Invalid rating parameters');
  }
  
  // Check rate limiting
  if (!checkRateLimit(postId)) {
    throw new Error('Please wait before rating again');
  }
  
  // Get the session ID
  const sessionId = getSessionId();
  
  // Get location data including IP address
  const locationData = await getClientLocationData();
  
  // Get user agent
  const userAgent = navigator.userAgent;
  
  // Prepare the rating data
  const ratingData: Rating = {
    post_id: postId,
    rating,
    session_id: sessionId,
    ip_address: locationData?.ip,
    user_agent: userAgent
  };
  
  // Add optional fields if provided
  if (email) ratingData.email = email;
  if (name) ratingData.name = name;
  
  try {
    // Try to insert a new rating first
    const { error } = await supabase
      .from('ratings')
      .insert([ratingData]);
    
    if (error) {
      // If unique constraint violation, try to update instead
      if (error.code === '23505') {
        const { error: updateError } = await supabase
          .from('ratings')
          .update({ 
            rating, 
            updated_at: new Date().toISOString() 
          })
          .match({ 
            post_id: postId,
            session_id: sessionId 
          });
        
        if (updateError) throw updateError;
      } else {
        throw error;
      }
    }
    
    // Record successful rating time for rate limiting
    updateRateLimit(postId);
    
    // Save rating in local storage for persistence
    saveUserRating(postId, rating);
    
  } catch (error) {
    console.error('Error submitting rating:', error);
    throw error;
  }
};

/**
 * Get the post's current rating statistics
 */
export const getPostRatings = async (postId: string): Promise<{ average: number, total: number }> => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('average_rating, total_ratings')
      .eq('id', postId)
      .single();
    
    if (error) throw error;
    
    return {
      average: data?.average_rating || 0,
      total: data?.total_ratings || 0
    };
  } catch (error) {
    console.error('Error fetching post ratings:', error);
    return { average: 0, total: 0 };
  }
}; 