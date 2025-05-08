import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
// Remove unused import for initialProjects and initialBlogPosts
// import { projects as initialProjects, blogPosts as initialBlogPosts } from "../data/siteData";
import { ExtendedBlogPostType, SiteSettings, ViewStats, ContentStats, ActivityLog, MediaItem, HomePageContent, Task, TaskStatus } from "../types/content-types";
import { supabase } from "../lib/supabaseClient"; // Import Supabase client
import { getSupabaseStorageUrl } from "../lib/supabaseClient"; // Import URL helpers
import { PostgrestError } from "@supabase/supabase-js"; // Import PostgrestError type
import { toast } from "../hooks/use-toast";
import { trackVisit, getVisitorStats } from '../lib/visitorTracking';

type SupabaseBlogPost = Record<string, any>; 
type SupabaseMediaItem = Record<string, any>;
type SupabaseTask = Record<string, any>;

export interface AuthorProfile {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar: string;
  email: string;
  social: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

interface ContentContextType {
  // Data
  blogPosts: ExtendedBlogPostType[];
  homePageContent: HomePageContent;
  siteSettings: SiteSettings;
  mediaLibrary: MediaItem[];
  tasks: Task[];
  
  // Loading state
  isLoading: boolean;
  
  // Edit mode state
  isEditMode: boolean;
  setEditMode: (mode: boolean) => void;
  
  // Update methods
  updateHomePageContent: (content: Partial<HomePageContent>) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  
  // Blog methods (Make them async for Supabase operations)
  saveBlogPost: (post: Partial<ExtendedBlogPostType>) => Promise<void>; // Input can be partial for updates
  deleteBlogPost: (id: string) => Promise<void>;
  
  // Media methods
  uploadMedia: (media: { name: string; url: string; size: string; type: string }) => Promise<MediaItem>; // Now returns the uploaded media item
  deleteMedia: (id: string) => Promise<void>;
  updateMediaName: (id: string, name: string) => Promise<void>;
  
  // Task methods
  saveTask: (task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  
  // Analytics
  popularContent: ContentStats[];
  recentActivity: ActivityLog[];
  updateRating: (postId: string, rating: number, email?: string, name?: string) => Promise<void>;
  logActivity: (activity: ActivityLog) => void; // Keep sync if only updating local state/localStorage
  authorProfiles: AuthorProfile[];
  loadAuthorProfiles: () => Promise<void>;
  saveAuthorProfile: (profile: Partial<AuthorProfile>) => Promise<AuthorProfile>;
  deleteAuthorProfile: (id: string) => Promise<void>;
  visitorStats: {
    uniqueVisitors: number;
    totalVisits: number;
    uniqueIpAddresses?: number; // Add unique IP addresses count
    postVisits: Record<string, { unique: number; total: number }>;
  } | null;
  trackPostVisit: (postId: string) => Promise<boolean>;
}

const defaultHomePageContent: HomePageContent = {
  heroTitle: "Repeat",
  heroSubtitle: "Building intelligent applications that solve complex business challenges",
  aboutText: "I'm a fullstack developer specializing in AI-powered applications and Google Workspace automation. With a focus on creating practical solutions for businesses, I build tools that enhance productivity and streamline workflows.",
};

const defaultSiteSettings: SiteSettings = {
  siteTitle: "Repeat",
  siteDescription: "Professional portfolio of ASSAD, a fullstack developer specializing in AI-powered applications and Google Workspace automation.",
  githubUrl: "https://github.com",
  linkedinUrl: "https://linkedin.com",
  twitterUrl: "https://twitter.com",
  enableComments: true,
  enableAnalytics: true
};

export const ContentContext = createContext<ContentContextType>({
  blogPosts: [],
  homePageContent: defaultHomePageContent,
  siteSettings: defaultSiteSettings,
  mediaLibrary: [],
  tasks: [],
  isLoading: true,
  isEditMode: false,
  setEditMode: () => {},
  updateHomePageContent: () => {},
  updateSiteSettings: () => {},
  saveBlogPost: async () => {},
  deleteBlogPost: async () => {},
  uploadMedia: async () => ({ id: '', name: '', url: '', size: '', type: '' } as MediaItem),
  deleteMedia: async () => {},
  updateMediaName: async () => {},
  popularContent: [],
  recentActivity: [],
  updateRating: async () => {},
  logActivity: () => {},
  authorProfiles: [],
  loadAuthorProfiles: async () => {},
  saveAuthorProfile: async () => ({ id: '', name: '', role: '', bio: '', avatar: '', email: '', social: {}, created_at: '', updated_at: '' } as AuthorProfile),
  deleteAuthorProfile: async () => {},
  saveTask: async () => {},
  deleteTask: async () => {},
  updateTaskStatus: async () => {},
  visitorStats: null,
  trackPostVisit: async () => false,
});

// Fix: Export the hook separately from its definition
const useContentHook = (): ContentContextType => {
  const context = useContext(ContentContext);
  if (context === undefined) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

// Export the hook
export const useContent = useContentHook;

// Fix: Export the provider component separately
export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const CONTENT_ROW_ID = 1;
  
  // Clear any old localStorage data that might interfere with Supabase data
  useEffect(() => {
    // Remove any old content data from localStorage that we now store in Supabase
    localStorage.removeItem('homePageContent');
    localStorage.removeItem('siteSettings');
    // Keep other localStorage items that we still use
  }, []);

  // Initialize blogPosts state as empty, will be filled by Supabase fetch
  const [blogPosts, setBlogPosts] = useState<ExtendedBlogPostType[]>([]);
  
  // Initialize state with defaults, will be overwritten by Supabase fetch
  const [homePageContent, setHomePageContent] = useState<HomePageContent>(defaultHomePageContent);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(defaultSiteSettings);
  
  // Initialize mediaLibrary state as empty, will be filled by Supabase fetch
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]); 
  
  // Initialize tasks state as empty
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [isEditMode, setEditMode] = useState(false);
  
  // Loading state - initially true while fetching data
  const [isLoading, setIsLoading] = useState(true);
  
  const [popularContent, setPopularContent] = useState<ContentStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  
  const [authorProfiles, setAuthorProfiles] = useState<AuthorProfile[]>([]);
  
  const [visitorStats, setVisitorStats] = useState<{
    uniqueVisitors: number;
    totalVisits: number;
    uniqueIpAddresses?: number; // Add unique IP addresses count
    postVisits: Record<string, { unique: number; total: number }>;
  } | null>(null);
  
  // Fetch ALL initial data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("ContentContext: Fetching initial data from Supabase...");
        
        // --- Fetch Home Page Content ---
        try {
          const { data: homeData, error: homeError } = await supabase
            .from('home_page_content') // Replace with your actual table name if different
            .select('*')
            .eq('id', CONTENT_ROW_ID) // Assuming a row with id=1 exists
            .single(); // Fetch a single row

          if (homeError) {
            console.error("ContentContext: Error fetching home page content:", homeError.message);
            // Keep default state on error
          } else if (homeData) {
            console.log("ContentContext: Successfully fetched home page content.", homeData);
            // Map the snake_case fields from Supabase to camelCase fields
            const mappedHomeData = {
              heroTitle: homeData.hero_title,
              heroSubtitle: homeData.hero_subtitle,
              aboutText: homeData.about_text,
            };
            setHomePageContent(mappedHomeData);
          } else {
              console.warn("ContentContext: No home page content found in Supabase for id=", CONTENT_ROW_ID, ". Using defaults.");
              // Optionally seed default data if none exists
              // seedDefaultHomePageContent(); 
          }
        } catch (error) {
          console.error("ContentContext: Unexpected error fetching home page content:", error);
        }

        // --- Fetch Site Settings ---
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from('site_settings') // Replace with your actual table name if different
            .select('*')
            .eq('id', CONTENT_ROW_ID) // Assuming a row with id=1 exists
            .single();

          if (settingsError) {
            console.error("ContentContext: Error fetching site settings:", settingsError.message);
            // Keep default state on error
          } else if (settingsData) {
            console.log("ContentContext: Successfully fetched site settings.", settingsData);
            // Map the snake_case fields from Supabase to camelCase fields
            const mappedSettingsData = {
              siteTitle: settingsData.site_title,
              siteDescription: settingsData.site_description,
              githubUrl: settingsData.github_url,
              linkedinUrl: settingsData.linkedin_url,
              twitterUrl: settingsData.twitter_url,
              enableComments: settingsData.enable_comments,
              enableAnalytics: settingsData.enable_analytics,
            };
            setSiteSettings(mappedSettingsData);
          } else {
              console.warn("ContentContext: No site settings found in Supabase for id=", CONTENT_ROW_ID, ". Using defaults.");
              // Optionally seed default settings if none exists
              // seedDefaultSiteSettings(); 
          }
        } catch (error) {
          console.error("ContentContext: Unexpected error fetching site settings:", error);
        }

        // --- Fetch Blog Posts ---
        console.log("ContentContext: Fetching blog posts...");
        try {
          const { data: postsData, error: postsError } = await supabase
            .from('blog_posts') // Use your actual table name
            .select('*') // Select all columns
            .order('created_at', { ascending: false }); // Order by creation date, newest first

          if (postsError) {
            console.error("ContentContext: Error fetching blog posts:", postsError.message);
            // Handle error - maybe set an error state? For now, logs error.
          } else if (postsData) {
            console.log(`ContentContext: Successfully fetched ${postsData.length} blog posts.`);
            // Use the mapping function
            const mappedPosts = postsData.map(mapSupabaseToBlogPost);
            setBlogPosts(mappedPosts);
          } else {
             console.log("ContentContext: No blog posts found in Supabase.");
             setBlogPosts([]); // Set to empty array if no data
          }
        } catch (error) {
          console.error("ContentContext: Unexpected error fetching blog posts:", error);
        }
        
        // --- Fetch Media Library --- 
        console.log("ContentContext: Fetching media library...");
        try {
          const { data: mediaData, error: mediaError } = await supabase
            .from('media_library') // Use the new table name
            .select('*')
            .order('created_at', { ascending: false });

          if (mediaError) {
            console.error("ContentContext: Error fetching media library:", mediaError.message);
          } else if (mediaData) {
            console.log(`ContentContext: Successfully fetched ${mediaData.length} media items.`);
            // Map Supabase data (snake_case) to frontend type (camelCase)
            const mappedMedia = mediaData.map(mapSupabaseToMediaItem);
            setMediaLibrary(mappedMedia);
          } else {
            console.log("ContentContext: No media items found in Supabase.");
            setMediaLibrary([]); // Set to empty array if no data
          }
        } catch (error) {
          console.error("ContentContext: Unexpected error fetching media library:", error);
        }
        
        // --- Fetch Tasks ---
        console.log("ContentContext: Fetching tasks...");
        try {
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false });

          if (tasksError) {
            console.error("ContentContext: Error fetching tasks:", tasksError.message);
          } else if (tasksData) {
            console.log(`ContentContext: Successfully fetched ${tasksData.length} tasks.`);
            // Map Supabase data to frontend type
            const mappedTasks = tasksData.map(mapSupabaseToTask);
            setTasks(mappedTasks);
          } else {
            console.log("ContentContext: No tasks found in Supabase.");
            setTasks([]); // Set to empty array if no data
          }
        } catch (error) {
          console.error("ContentContext: Unexpected error fetching tasks:", error);
        }
        
      } catch (error) {
        console.error("ContentContext: Error during data fetching:", error);
      } finally {
        // Set loading to false after all data fetching is complete
        setIsLoading(false);
        console.log("ContentContext: Initial data loading complete");
      }
    };

    fetchData();
  }, []);
  
  // Remove useEffects persisting data to localStorage that's now in Supabase
  // useEffect(() => { localStorage.setItem('homePageContent', ...); }, [homePageContent]); // REMOVE
  // useEffect(() => { localStorage.setItem('siteSettings', ...); }, [siteSettings]); // REMOVE
  
  // Keep localStorage persistence for things NOT yet in Supabase
  useEffect(() => {
    localStorage.setItem('activityLog', JSON.stringify(recentActivity));
  }, [recentActivity]);
  
  // Handler functions
  const updateHomePageContent = async (content: Partial<HomePageContent>) => {
    // Optimistically update local state first for better UX
    const previousContent = homePageContent;
    setHomePageContent(prev => ({ ...prev, ...content }));

    // Map camelCase to snake_case for Supabase
    const supabaseContent = {
      ...(content.heroTitle !== undefined && { hero_title: content.heroTitle }),
      ...(content.heroSubtitle !== undefined && { hero_subtitle: content.heroSubtitle }),
      ...(content.aboutText !== undefined && { about_text: content.aboutText }),
    };

    console.log("ContentContext: Attempting to update home page content in Supabase...", supabaseContent);
    try {
        const { data, error } = await supabase
            .from('home_page_content') // Replace with your actual table name if different
            .update(supabaseContent) // Use snake_case version
            .eq('id', CONTENT_ROW_ID)
            .select() // Select the updated row to confirm
            .single();

        if (error) {
            console.error("ContentContext: Error updating home page content in Supabase:", error.message);
            // Revert optimistic update on error
            setHomePageContent(previousContent);
            // Optionally show an error toast to the user
        } else {
            console.log("ContentContext: Successfully updated home page content in Supabase.", data);
            // Update state with the potentially modified data from Supabase
            // Map the returned snake_case data back to camelCase for our state
            const mappedData = {
              ...previousContent,
              heroTitle: data.hero_title,
              heroSubtitle: data.hero_subtitle,
              aboutText: data.about_text,
            };
            setHomePageContent(mappedData);
        }
    } catch (error) {
        console.error("ContentContext: Unexpected error updating home page content:", error);
        // Revert optimistic update on error
        setHomePageContent(previousContent);
    }
  };
  
  const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
    // Optimistically update local state
    const previousSettings = siteSettings;
    setSiteSettings(prev => ({ ...prev, ...settings }));

    // Map camelCase to snake_case for Supabase
    const supabaseSettings = {
      ...(settings.siteTitle !== undefined && { site_title: settings.siteTitle }),
      ...(settings.siteDescription !== undefined && { site_description: settings.siteDescription }),
      ...(settings.githubUrl !== undefined && { github_url: settings.githubUrl }),
      ...(settings.linkedinUrl !== undefined && { linkedin_url: settings.linkedinUrl }),
      ...(settings.twitterUrl !== undefined && { twitter_url: settings.twitterUrl }),
      ...(settings.enableComments !== undefined && { enable_comments: settings.enableComments }),
      ...(settings.enableAnalytics !== undefined && { enable_analytics: settings.enableAnalytics }),
      // Add other fields as needed
    };

    console.log("ContentContext: Attempting to update site settings in Supabase...", supabaseSettings);
    try {
        const { data, error } = await supabase
            .from('site_settings') // Replace with your actual table name if different
            .update(supabaseSettings) // Use snake_case version
            .eq('id', CONTENT_ROW_ID)
            .select()
            .single();

        if (error) {
            console.error("ContentContext: Error updating site settings in Supabase:", error.message);
            // Revert optimistic update
            setSiteSettings(previousSettings);
        } else {
            console.log("ContentContext: Successfully updated site settings in Supabase.", data);
            // Map the returned snake_case data back to camelCase for our state
            const mappedData = {
              ...previousSettings,
              siteTitle: data.site_title,
              siteDescription: data.site_description,
              githubUrl: data.github_url,
              linkedinUrl: data.linkedin_url,
              twitterUrl: data.twitter_url,
              enableComments: data.enable_comments,
              enableAnalytics: data.enable_analytics,
              // Add other fields as needed
            };
            setSiteSettings(mappedData);
        }
    } catch (error) {
        console.error("ContentContext: Unexpected error updating site settings:", error);
        setSiteSettings(previousSettings);
    }
  };
  
  // logActivity function definition moved up
  const logActivity = (activity: ActivityLog) => {
    setRecentActivity(prev => {
      const newActivity = [activity, ...prev].slice(0, 50); // Keep last 50 activities
      return newActivity;
    });
  };
  
  // --- Modified Blog Post Handlers ---
  const saveBlogPost = async (postData: Partial<ExtendedBlogPostType>) => {
    // Determine if it's an insert or update based on presence of an ID and if it exists locally
    const existingPost = postData.id ? blogPosts.find(p => p.id === postData.id) : undefined;
    const isUpdate = !!existingPost;

    console.log(`ContentContext: Attempting to ${isUpdate ? 'update' : 'create'} blog post ${isUpdate ? postData.id : ''}...`, postData);

    // Make sure is_draft and status are in sync - if one is set, set the other to match
    if (postData.status !== undefined && postData.isDraft === undefined) {
      postData.isDraft = postData.status === 'draft';
    } else if (postData.isDraft !== undefined && postData.status === undefined) {
      postData.status = postData.isDraft ? 'draft' : 'published';
    } else if (postData.status !== undefined && postData.isDraft !== undefined) {
      // If both are set but not in sync, status takes precedence as it's more specific
      if ((postData.status === 'draft' && !postData.isDraft) || 
          (postData.status === 'published' && postData.isDraft)) {
        postData.isDraft = postData.status === 'draft';
      }
    }

    // Prepare data for Supabase (map camelCase to snake_case)
    // Ensure essential fields like 'id', 'slug', 'status', 'created_at' are handled correctly
    const dataToSave: Partial<SupabaseBlogPost> = {
        // Map fields from postData to Supabase column names
        title: postData.title,
        excerpt: postData.excerpt,
        content: postData.content,
        category: postData.category,
        tags: postData.tags,
        date: postData.date, // Ensure correct format for Supabase timestamp
        read_time: postData.readTime,
        author_name: postData.authorName,
        author_role: postData.authorRole,
        technologies: postData.technologies,
        features: postData.features,
        detailed_description: postData.detailedDescription,
        image_url: postData.imageUrl,
        featured_image: postData.featuredImage,
        author_image: postData.authorImage,
        link: postData.link,
        is_draft: postData.isDraft,
        slug: postData.slug, // Crucial for updates and potentially new posts
        status: postData.status,
        // viewCount, likeCount are usually updated separately
        seo_score: postData.seoScore,
        // id is used for matching, not usually in the update payload itself unless upserting
        // createdAt is set by default in DB
        // updatedAt is set by trigger or manually here if needed: updated_at: new Date().toISOString() 
    };

    // Remove undefined fields to avoid overwriting existing values with null in Supabase update
    Object.keys(dataToSave).forEach(key => dataToSave[key] === undefined && delete dataToSave[key]);

    let savedPost: ExtendedBlogPostType | null = null;
    let error: PostgrestError | null = null;

    try {
      if (isUpdate && postData.id) {
        // --- Update existing post ---
        console.log(`ContentContext: Updating post ID ${postData.id}`);
        // Optimistic update: Update local state first
        const previousPosts = blogPosts;
        setBlogPosts(prevPosts => {
            const index = prevPosts.findIndex(p => p.id === postData.id);
            if (index === -1) return prevPosts; // Should not happen if isUpdate is true
            const updatedPosts = [...prevPosts];
            // Merge existing data with new partial data
            updatedPosts[index] = { ...updatedPosts[index], ...postData, updatedAt: new Date().toISOString() }; 
            return updatedPosts;
        });

        const { data, error: updateError } = await supabase
          .from('blog_posts')
          .update(dataToSave)
          .eq('id', postData.id)
          .select()
          .single();

        if (updateError) {
           error = updateError;
           // Revert optimistic update
           setBlogPosts(previousPosts);
        } else if (data) {
           savedPost = data as ExtendedBlogPostType; // Add mapping if needed
           // Optionally update local state again with confirmed data from Supabase
    setBlogPosts(prevPosts => {
                const index = prevPosts.findIndex(p => p.id === savedPost!.id);
                if (index === -1) return [...prevPosts, savedPost!]; // Should exist, but fallback
        const updatedPosts = [...prevPosts];
                updatedPosts[index] = savedPost!; 
        return updatedPosts;
           });
        }

      } else {
        // --- Create new post ---
        console.log("ContentContext: Creating new post");
        
        // Ensure category is properly set before creating ID
        const inferredCategory = postData.category || 'Blog'; // Default to Blog if not specified
        
        // Prepare new post object with defaults
        const newPostDefaults = {
            id: postData.id || `${inferredCategory.toLowerCase()}/${postData.slug || Date.now()}`, // Generate ID with consistent category prefix
            slug: postData.slug || `post-${Date.now()}`,
            date: new Date().toISOString(),
            // Remove snake_case fields from defaults (used in frontend React state)
            isDraft: postData.isDraft ?? true,
            status: postData.status ?? 'draft',
            viewCount: 0,
            likeCount: 0,
            tags: [],
            technologies: [],
            features: [],
            category: inferredCategory, // Ensure category is set consistently
            // ... other required fields with defaults
        };
        const newPostData = { ...newPostDefaults, ...postData }; // Merge defaults with provided data
        
        // Add snake_case fields for Supabase and convert camelCase to snake_case
        const newPostSupabaseData = { 
            ...dataToSave, 
            id: newPostData.id,
            // Add these additional fields specific to new posts
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            view_count: 0,
            like_count: 0,
        }; // Prepare Supabase data including ID

        // Optimistic update
        const previousPosts = blogPosts;
        // Cast to ExtendedBlogPostType to satisfy linter, assuming defaults + input are sufficient
        setBlogPosts(prevPosts => [...prevPosts, newPostData as ExtendedBlogPostType]);

        const { data, error: insertError } = await supabase
          .from('blog_posts')
          .insert(newPostSupabaseData)
          .select()
          .single();

        if (insertError) {
          error = insertError;
          // Revert optimistic update
          setBlogPosts(previousPosts);
        } else if (data) {
          // Map the returned Supabase data (snake_case) to ExtendedBlogPostType (camelCase)
          const confirmedPost = mapSupabaseToBlogPost(data as SupabaseBlogPost);
          savedPost = confirmedPost; 
          // Update local state with confirmed data
           setBlogPosts(prevPosts => {
                // Remove the optimistically added post (might have temporary ID)
                const filteredPosts = prevPosts.filter(p => p.id !== newPostData.id);
                return [...filteredPosts, confirmedPost]; // Add the confirmed post
           });
        }
      }

      if (error) {
        console.error(`ContentContext: Error ${isUpdate ? 'updating' : 'creating'} blog post:`, error.message);
        // Handle error (e.g., show toast)
      } else if (savedPost) {
        console.log(`ContentContext: Successfully ${isUpdate ? 'updated' : 'created'} blog post ID: ${savedPost.id}`);
    // Log activity
    logActivity({
            type: savedPost.status === 'published' ? 'publish' : 'draft',
            content: `${savedPost.status === 'published' ? 'Published' : 'Saved draft'}: ${savedPost.title}`,
      time: new Date().toISOString()
    });
      }

    } catch (catchError) {
      console.error(`ContentContext: Unexpected error ${isUpdate ? 'updating' : 'creating'} blog post:`, catchError);
      // Handle error (e.g., show toast)
      // Potentially revert optimistic update if not already done
    }
  };
  
  const deleteBlogPost = async (id: string) => {
    console.log(`ContentContext: Attempting to delete blog post ID: ${id}...`);
    
    // Find the post for logging before deleting
    const postToDelete = blogPosts.find(p => p.id === id);

    // Optimistic update: Remove from local state first
    const previousPosts = blogPosts;
    setBlogPosts(prev => prev.filter(post => post.id !== id));
    
    try {
        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("ContentContext: Error deleting blog post:", error.message);
            // Revert optimistic update
            setBlogPosts(previousPosts);
            // Handle error (e.g., show toast)
        } else {
            console.log(`ContentContext: Successfully deleted blog post ID: ${id}`);
            // Log activity if post was found
            if (postToDelete) {
      logActivity({
                type: 'edit', // Or a specific 'delete' type if you add it
                content: `Deleted: ${postToDelete.title}`,
        time: new Date().toISOString()
      });
            }
        }
    } catch (catchError) {
        console.error("ContentContext: Unexpected error deleting blog post:", catchError);
        // Revert optimistic update
        setBlogPosts(previousPosts);
        // Handle error (e.g., show toast)
    }
  };
  
  // --- Media Handlers (Updated to use Supabase DB + Storage) ---
  const uploadMedia = async (media: { name: string; url: string; size: string; type: string }) => {
    console.log("ContentContext: Attempting to upload media...");
    
    // Only handle local file uploads (blob/data URLs)
    if (!media.url.startsWith('blob:') && !media.url.startsWith('data:')) {
      console.warn("ContentContext: uploadMedia called with non-local URL, skipping storage upload:", media.url);
      // Decide if you want to handle non-local URLs differently (e.g., just add to DB?)
      // For now, returning a basic MediaItem representation
      const nonLocalMedia: MediaItem = {
      id: `media-${Date.now()}`,
        name: media.name,
        url: media.url,
        size: media.size,
        type: media.type,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    };
      // Optionally, insert into DB even if not uploaded?
      // await insertMediaItemToDb(nonLocalMedia); 
      // setMediaLibrary(prev => [...prev, nonLocalMedia]);
      // return nonLocalMedia;
      throw new Error("Cannot upload non-local files through this function.");
    }

    let storagePath = '';
    let storageBucket = 'media'; // Assuming 'media' bucket
    let uploadedFileUrl = '';
    const timestamp = Date.now();
    const generatedId = `media-${timestamp}`;

    try {
      // 1. Upload to Supabase Storage
      console.log("ContentContext: Uploading file to Supabase Storage...");
      const response = await fetch(media.url);
      const blob = await response.blob();
      storagePath = `${timestamp}-${media.name}`; // Consistent path generation
      
      const { data: storageData, error: storageError } = await supabase.storage
        .from(storageBucket)
        .upload(storagePath, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: media.type
        });

      if (storageError) {
        console.error("ContentContext: Error uploading to Supabase Storage:", storageError.message);
        // Check for permission errors specifically
        if (storageError.message.includes("policy") || storageError.message.includes("permission")) {
           console.warn("ContentContext: Supabase Storage permission issue. Check policies.");
        }
        throw storageError; // Rethrow to stop the process
      }
      
      console.log("ContentContext: File uploaded to Storage successfully:", storagePath);
      // Get the public URL
      uploadedFileUrl = getSupabaseStorageUrl(storageBucket, storagePath);
      console.log("ContentContext: Public URL:", uploadedFileUrl);

      // 2. Insert Metadata into Supabase Database Table
      console.log("ContentContext: Inserting metadata into media_library table...");
      const mediaToInsert: SupabaseMediaItem = {
        id: generatedId,
        name: media.name,
        url: uploadedFileUrl,
        size: media.size,
        type: media.type,
        bucket: storageBucket,
        path: storagePath,
        // created_at is set by default in the DB
      };

      const { data: dbData, error: dbError } = await supabase
        .from('media_library')
        .insert(mediaToInsert)
        .select()
        .single();

      if (dbError) {
        console.error("ContentContext: Error inserting media metadata into DB:", dbError.message);
        // Attempt to clean up storage if DB insert fails
        console.log("ContentContext: Attempting to remove file from Storage due to DB error...");
        await supabase.storage.from(storageBucket).remove([storagePath]);
        throw dbError; // Rethrow to stop the process
      }

      // 3. Update Local State
      const newMediaItem = mapSupabaseToMediaItem(dbData); // Map the returned DB data
      setMediaLibrary(prev => [newMediaItem, ...prev]); // Add to the beginning
      console.log("ContentContext: Successfully uploaded media and saved metadata:", newMediaItem);
      return newMediaItem;

    } catch (error) {
      console.error("ContentContext: Full upload process failed:", error);
      // Return a minimal object or throw error to indicate failure
      // Depending on where the error occurred, cleanup might be needed
      // For now, rethrow the error to be handled by the caller
      throw error; 
    }
  };
  
  const deleteMedia = async (id: string) => {
    console.log(`ContentContext: Attempting to delete media ID: ${id}...`);
    const mediaToDelete = mediaLibrary.find(media => media.id === id);

    if (!mediaToDelete) {
      console.warn(`ContentContext: Media with ID ${id} not found in local state.`);
      return; // Exit if not found locally
    }

    // Optimistic update: Remove from local state first
    const previousMediaLibrary = mediaLibrary;
    setMediaLibrary(prev => prev.filter(media => media.id !== id));

    let dbErrorOccurred = false;
    let storageErrorOccurred = false;

    try {
      // 1. Delete from Database
      console.log(`ContentContext: Deleting metadata from media_library for ID: ${id}...`);
      const { error: dbError } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id);

      if (dbError) {
        console.error("ContentContext: Error deleting media metadata from DB:", dbError.message);
        dbErrorOccurred = true;
        // Decide if you want to proceed with storage deletion even if DB fails
      } else {
         console.log(`ContentContext: Successfully deleted metadata from DB for ID: ${id}`);
      }

      // 2. Delete from Storage (only if path and bucket exist)
      if (mediaToDelete.bucket && mediaToDelete.path) {
        console.log(`ContentContext: Deleting file from Storage: ${mediaToDelete.path}...`);
        const { error: storageError } = await supabase.storage
          .from(mediaToDelete.bucket)
          .remove([mediaToDelete.path]);
        
        if (storageError) {
          console.error("ContentContext: Error deleting media from Supabase Storage:", storageError.message);
          storageErrorOccurred = true;
        }
        else {
          console.log(`ContentContext: Successfully deleted media from Supabase Storage: ${mediaToDelete.path}`);
        }
      }
      else {
         console.warn(`ContentContext: Skipping storage deletion for ID ${id} as bucket/path info is missing.`);
      }

      // If any error occurred, revert the optimistic update
      if (dbErrorOccurred || storageErrorOccurred) {
        console.warn("ContentContext: Reverting local state due to deletion error.");
        setMediaLibrary(previousMediaLibrary);
        throw new Error("Failed to delete media completely."); // Throw an error to indicate failure
      }

      console.log(`ContentContext: Successfully deleted media ID: ${id} completely.`);

    } catch (error) {
      console.error("ContentContext: Unexpected error during media deletion process:", error);
      // Ensure state is reverted on unexpected errors too
      if (!dbErrorOccurred && !storageErrorOccurred) { // Avoid double revert if caught above
         setMediaLibrary(previousMediaLibrary);
      }
      // Rethrow or handle as needed
      throw error;
    }
  };
  
  const updateMediaName = async (id: string, name: string) => {
    console.log(`ContentContext: Attempting to update name for media ID: ${id}...`);
    const mediaToUpdate = mediaLibrary.find(media => media.id === id);

    if (!mediaToUpdate) {
      console.warn(`ContentContext: Media with ID ${id} not found in local state.`);
      return;
    }

    // Optimistic update locally
    const previousMediaLibrary = mediaLibrary;
    setMediaLibrary(prev => 
      prev.map(media => media.id === id ? { ...media, name } : media)
    );

    try {
      // Update the name in the database
      console.log(`ContentContext: Updating name in media_library for ID: ${id}...`);
      const { data, error } = await supabase
        .from('media_library')
        .update({ name: name })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("ContentContext: Error updating media name in DB:", error.message);
        // Revert optimistic update
        setMediaLibrary(previousMediaLibrary);
        throw error; // Rethrow
      }

      console.log(`ContentContext: Successfully updated name in DB for media ID: ${id}`, data);
      // Optional: Update local state with the exact data returned from DB if needed
      // const updatedItem = mapSupabaseToMediaItem(data);
      // setMediaLibrary(prev => prev.map(media => media.id === id ? updatedItem : media));

    } catch (error) {
      console.error("ContentContext: Unexpected error updating media name:", error);
       // Ensure state is reverted if not already done
       setMediaLibrary(previousMediaLibrary);
      throw error; // Rethrow
    }
  };
  
  // Filter out drafts for public views
  const getPublicPosts = () => {
    return blogPosts.filter(post => !post.isDraft);
  };
  
  // Replace updateViewCount with updateRating
  const updateRating = async (postId: string, rating: number, email?: string, name?: string) => {
    console.log(`ContentContext: Attempting to add rating for post ID: ${postId}`);
    
    try {
      // Insert the rating
      const { error } = await supabase
        .from('ratings')
        .insert({
          post_id: postId,
          rating,
          email,
          name
        });

      if (error) {
        console.error("ContentContext: Error adding rating:", error.message);
        toast({
          title: "Error",
          description: "Failed to add rating",
          variant: "destructive",
        });
        return;
      }

      // The trigger will automatically update the blog_posts table
      // Fetch the updated post to get the new average
      const { data: updatedPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('average_rating, total_ratings')
        .eq('id', postId)
        .single();

      if (fetchError) {
        console.error("ContentContext: Error fetching updated post:", fetchError.message);
        return;
      }

      // Update local state
      setBlogPosts(prevPosts => {
        return prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              averageRating: updatedPost.average_rating,
              totalRatings: updatedPost.total_ratings
            };
          }
          return post;
        });
      });

      // Log activity for rating milestones
      if (updatedPost.total_ratings && updatedPost.total_ratings % 10 === 0) {
        const post = blogPosts.find(p => p.id === postId);
        if (post) {
          logActivity({
            type: 'rating',
            content: `${updatedPost.total_ratings} ratings milestone: ${post.title} (Avg: ${updatedPost.average_rating})`,
            time: new Date().toISOString()
          });
        }
      }

      console.log(`ContentContext: Successfully added rating for post ID: ${postId}`);
      
    } catch (error) {
      console.error("ContentContext: Unexpected error adding rating:", error);
      toast({
        title: "Error",
        description: "Failed to add rating",
        variant: "destructive",
      });
    }
  };
  
  // Update popular content whenever blog posts change
  useEffect(() => {
    const popular = blogPosts
      .filter(post => post.status === 'published')
      .sort((a, b) => {
        // Sort by average rating first, then by total ratings
        if ((b.averageRating || 0) === (a.averageRating || 0)) {
          return (b.totalRatings || 0) - (a.totalRatings || 0);
        }
        return (b.averageRating || 0) - (a.averageRating || 0);
      })
      .slice(0, 5)
      .map(post => ({
        title: post.title,
        category: post.category || 'Uncategorized',
        averageRating: post.averageRating || 0,
        totalRatings: post.totalRatings || 0
      }));
    
    setPopularContent(popular);
  }, [blogPosts]);
  
  // Task management functions
  const saveTask = async (taskData: Partial<Task>) => {
    try {
      // Check if this is an update (has ID) or create (no ID)
      const isUpdate = Boolean(taskData.id);
      
      if (isUpdate) {
        // Map task data to Supabase format
        const supabaseTaskData = {
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          points: taskData.points,
          assignees: taskData.assignees,
          due_date: taskData.dueDate,
          updated_at: new Date().toISOString()
        };
        
        // Update existing task
        const { error } = await supabase
          .from('tasks')
          .update(supabaseTaskData)
          .eq('id', taskData.id);
          
        if (error) {
          throw error;
        }
        
        // Update local state
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskData.id
              ? { ...task, ...taskData, updatedAt: new Date().toISOString() }
              : task
          )
        );
        
        console.log(`Task updated: ${taskData.id}`);
        
      } else {
        // Generate ID for new task
        const newTaskId = crypto.randomUUID();
        const currentTime = new Date().toISOString();
        
        // Create new task object
        const newTask: Task = {
          id: newTaskId,
          title: taskData.title || 'Untitled Task',
          description: taskData.description || '',
          status: taskData.status || 'todo',
          points: taskData.points || 0,
          assignees: taskData.assignees || [],
          viewCount: 0,
          comments: 0,
          createdAt: currentTime,
          updatedAt: currentTime,
          dueDate: taskData.dueDate
        };
        
        // Map task to Supabase format
        const supabaseTaskData = {
          id: newTask.id,
          title: newTask.title,
          description: newTask.description,
          status: newTask.status,
          points: newTask.points,
          assignees: newTask.assignees,
          view_count: newTask.viewCount,
          comments: newTask.comments,
          created_at: newTask.createdAt,
          updated_at: newTask.updatedAt,
          due_date: newTask.dueDate
        };
        
        // Insert into Supabase
        const { error } = await supabase
          .from('tasks')
          .insert(supabaseTaskData);
          
        if (error) {
          throw error;
        }
        
        // Update local state
        setTasks(prevTasks => [newTask, ...prevTasks]);
        
        console.log(`New task created: ${newTask.id}`);
      }
      
      // Log activity
      logActivity({
        type: 'edit',
        content: `Task ${isUpdate ? 'updated' : 'created'}: ${taskData.title}`,
        time: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };
  
  const deleteTask = async (id: string) => {
    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
      
      console.log(`Task deleted: ${id}`);
      
      // Log activity
      logActivity({
        type: 'edit',
        content: `Task deleted: ${id}`,
        time: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };
  
  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    try {
      // Update status in Supabase
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === id
            ? { ...task, status, updatedAt: new Date().toISOString() }
            : task
        )
      );
      
      console.log(`Task status updated: ${id} -> ${status}`);
      
      // Log activity
      logActivity({
        type: 'edit',
        content: `Task status changed to ${status}`,
        time: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Load author profiles
  const loadAuthorProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_profile')  // Changed from 'author_profiles'
        .select('*')
        .single();  // Changed to single() since we only want one profile

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }
      
      setAuthorProfiles(data ? [data] : []); // Wrap in array since we're maintaining compatibility
    } catch (error) {
      console.error('Error loading admin profile:', error);
      toast({
        title: "Error",
        description: "Failed to load admin profile",
        variant: "destructive",
      });
    }
  };

  // Save author profile
  const saveAuthorProfile = async (profile: Partial<AuthorProfile>): Promise<AuthorProfile> => {
    try {
      // Check if we have an existing profile
      const { data: existingProfile } = await supabase
        .from('admin_profile')
        .select('*')
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('admin_profile')
          .update({
            name: profile.name,
            role: profile.role,
            bio: profile.bio,
            avatar: profile.avatar,
            email: profile.email,
            social: profile.social
          })
          .eq('id', existingProfile.id)
          .select()
          .single();

        if (error) throw error;
        
        setAuthorProfiles([data]); // Update state with array containing single profile
        return data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('admin_profile')
          .insert([{
            name: profile.name,
            role: profile.role,
            bio: profile.bio,
            avatar: profile.avatar,
            email: profile.email,
            social: profile.social
          }])
          .select()
          .single();

        if (error) throw error;

        setAuthorProfiles([data]); // Update state with array containing single profile
        return data;
      }
    } catch (error) {
      console.error('Error saving admin profile:', error);
      throw error;
    }
  };

  // Delete author profile (keeping for compatibility but should not be used)
  const deleteAuthorProfile = async (id: string) => {
    console.warn('deleteAuthorProfile is deprecated as this is a single admin profile system');
    return;
  };

  // Load author profiles on mount
  useEffect(() => {
    loadAuthorProfiles();
  }, []);

  // Add tracking function
  const trackPostVisit = async (postId: string) => {
    /**
     * Track a visit to a specific page/post.
     * IMPORTANT: The postId must exist in the blog_posts table due to foreign key constraints.
     * Valid IDs include: 'home', 'about', 'contact', 'blog', 'projects', 'test-post', 
     * or any actual blog post IDs from the database.
     */
    console.log(`ContentContext: trackPostVisit called for post ID: ${postId}`);
    try {
      // FIX: Check for invalid post IDs and adjust them to the correct format if needed
      let trackingId = postId;
      
      // Handle routes that need mapping to database IDs
      if (postId.startsWith('thoughts/')) {
        // Map /thoughts/post-slug to blog/post-slug in database
        trackingId = `blog/${postId.split('/')[1]}`;
        console.log(`ContentContext: Mapped thoughts/ URL path to database ID: ${trackingId}`);
      } else if (postId.startsWith('projects/')) {
        // Map /projects/project-slug to project/project-slug in database
        trackingId = `project/${postId.split('/')[1]}`;
        console.log(`ContentContext: Mapped projects/ URL path to database ID: ${trackingId}`);
      }
      
      console.log(`ContentContext: Calling trackVisit function with ID: ${trackingId}`);
      const result = await trackVisit(trackingId);
      console.log(`ContentContext: trackVisit returned: ${result}`);
      
      if (!result) {
        console.error(`ContentContext: Failed to track visit for ${trackingId}. Check console for details.`);
        
        // Try to verify if this postId exists in the blog_posts table
        console.log(`ContentContext: Checking if ${trackingId} exists in blog_posts table...`);
        const { data, error } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('id', trackingId)
          .single();
          
        if (error) {
          console.error(`ContentContext: Error checking blog_posts table:`, error);
        } else if (data) {
          console.log(`ContentContext: Post ID ${trackingId} found in blog_posts table`);
        } else {
          console.error(`ContentContext: Post ID ${trackingId} NOT FOUND in blog_posts table!`);
          console.error(`ContentContext: Visit tracking failed due to foreign key constraint.`);
          console.error(`ContentContext: Standard page IDs are: 'home', 'about', 'contact', 'blog', 'projects', 'test-post'`);
        }
        
        return false;
      }
      
      // Log activity at certain milestones
      console.log(`ContentContext: Fetching visitor stats for milestones`);
      const stats = await getVisitorStats(trackingId);
      console.log(`ContentContext: Visitor stats retrieved:`, stats ? 'success' : 'null');
      
      if (stats && stats.postVisits[trackingId]) {
        const uniqueVisits = stats.postVisits[trackingId].unique;
        console.log(`ContentContext: Unique visits for ${trackingId}: ${uniqueVisits}`);
        
        if (uniqueVisits > 0 && uniqueVisits % 10 === 0) {
          console.log(`ContentContext: Milestone reached! ${uniqueVisits} unique visitors`);
          // Log activity for every 10 unique visitors
          const post = blogPosts.find(p => p.id === trackingId);
          if (post) {
            logActivity({
              type: 'view',
              content: `"${post.title}" reached ${uniqueVisits} unique visitors!`,
              time: new Date().toISOString(),
              severity: 'info'
            });
            console.log(`ContentContext: Activity logged for milestone`);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error('ContentContext: Error tracking visit:', error);
      return false;
    }
  };

  // Add effect to fetch visitor stats periodically
  useEffect(() => {
    const fetchVisitorStats = async () => {
      const stats = await getVisitorStats();
      if (stats) {
        setVisitorStats(stats);
      }
    };
    
    fetchVisitorStats();
    
    // Refresh stats every 5 minutes
    const interval = setInterval(fetchVisitorStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const value = {
    blogPosts: !isEditMode ? getPublicPosts() : blogPosts,
    homePageContent,
    siteSettings,
    mediaLibrary,
    tasks,
    isLoading,
    isEditMode,
    setEditMode,
    updateHomePageContent,
    updateSiteSettings,
    saveBlogPost,
    deleteBlogPost,
    uploadMedia,
    deleteMedia,
    updateMediaName,
    popularContent,
    recentActivity,
    updateRating,
    logActivity,
    saveTask,
    deleteTask,
    updateTaskStatus,
    authorProfiles,
    loadAuthorProfiles,
    saveAuthorProfile,
    deleteAuthorProfile,
    visitorStats,
    trackPostVisit,
  };
  
  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

// Add a helper function to map Supabase data to frontend type
// This centralizes the mapping logic used during fetch and save operations
const mapSupabaseToBlogPost = (post: SupabaseBlogPost): ExtendedBlogPostType => {
  // Infer category from post ID if not explicitly set
  let category = post.category;
  if (!category && post.id) {
    if (post.id.startsWith('blog/')) {
      category = 'Blog';
    } else if (post.id.startsWith('project/')) {
      category = 'Project';
    }
  }

  // Ensure isDraft and status are in sync
  let status = post.status || 'draft';
  let isDraft = post.is_draft;
  
  // If only one field is set, derive the other
  if (isDraft === undefined && status !== undefined) {
    isDraft = status === 'draft';
  } else if (status === undefined && isDraft !== undefined) {
    status = isDraft ? 'draft' : 'published';
  } else if (isDraft !== undefined && status !== undefined) {
    // If both are set but inconsistent, status takes precedence (more specific)
    if ((status === 'draft' && !isDraft) || (status === 'published' && isDraft)) {
      isDraft = status === 'draft';
    }
  }

  return {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    category: category || 'Blog', // Default to Blog if we couldn't determine category
    tags: post.tags || [],
    date: post.date,
    readTime: post.read_time || post.readTime || "", // Provide default empty string
    authorName: post.author_name || post.authorName || "", // Provide default empty string
    authorRole: post.author_role || post.authorRole || "", // Provide default empty string
    technologies: post.technologies || [],
    features: post.features || [],
    detailedDescription: post.detailed_description || post.detailedDescription,
    imageUrl: post.image_url || post.imageUrl,
    featuredImage: post.featured_image || post.featuredImage,
    authorImage: post.author_image || post.authorImage,
    link: post.link,
    isDraft, // Use the synced value we calculated above
    slug: post.slug,
    status, // Use the synced value we calculated above
    createdAt: post.created_at || post.createdAt,
    updatedAt: post.updated_at || post.updatedAt,
    viewCount: post.view_count || post.viewCount || 0,
    likeCount: post.like_count || post.likeCount || 0,
    seoScore: post.seo_score || post.seoScore,
    averageRating: post.average_rating || 0,
    totalRatings: post.total_ratings || 0,
  };
};

// Add a helper function to map Supabase media_library data to frontend type
const mapSupabaseToMediaItem = (item: SupabaseMediaItem): MediaItem => {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    size: item.size,
    type: item.type,
    date: item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
    bucket: item.bucket,
    path: item.path,
  };
};

// Add a helper function to map Supabase tasks to frontend type
const mapSupabaseToTask = (task: SupabaseTask): Task => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    points: task.points,
    assignees: task.assignees || [],
    viewCount: task.view_count || 0,
    comments: task.comments || 0,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
    dueDate: task.due_date
  };
};
