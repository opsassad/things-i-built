import { useParams, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ArrowRight, Tag, MessageSquare, Share2, Briefcase, Twitter, Linkedin, Copy, Check, Star, Maximize2, Minimize2, Sun, Send, AlertCircle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Slider } from "../components/ui/slider";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { cn } from "../lib/utils";
import { useEffect, useState, useRef, useCallback } from "react";
import { useContent } from "../context/ContentContext";
import { toast } from "../hooks/use-toast";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useHover,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import ReactDOM from "react-dom";
import { MarkdownPreview } from "../components/MarkdownPreview";
import { supabase } from "../lib/supabaseClient";
import { Alert, AlertTitle, AlertDescription } from "../components/ui/alert";
import { StarRating } from "../components/StarRating";
import { Label } from "../components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { normalizeImageHtml } from "../lib/utils";
import { getUserRating, submitRating, getPostRatings } from "../lib/ratingService";

// Format date to be more readable (e.g., "May 3, 2025" instead of ISO string)
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString; // Return original string if there's an error
  }
};

// Add type for Comment
interface Comment {
  id: number;
  created_at: string;
  name: string;
  content: string;
  // email is not selected for display
}

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts, isLoading: contentLoading, trackPostVisit } = useContent();
  const navigate = useNavigate();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  
  // --- Rating State --- 
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingCount, setRatingCount] = useState<number>(0);
  const [ratingsLoading, setRatingsLoading] = useState<boolean>(true);
  
  // --- Comment State --- 
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(false);
  const [commentData, setCommentData] = useState({ name: '', email: '', content: '' });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [hasCommentedLocally, setHasCommentedLocally] = useState<boolean>(false); // State for local comment status
  const [commentCount, setCommentCount] = useState<number>(0); // Track how many times user has commented
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warmth, setWarmth] = useState(50);
  
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isNewsletterSubmitting, setIsNewsletterSubmitting] = useState(false);
  const [newsletterMessage, setNewsletterMessage] = useState("");
  
  // Add keyboard event listener for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);
  
  // Determine content type based on pathname
  const determineContentType = useCallback(() => {
    if (location.pathname.startsWith('/thoughts')) {
      return 'thought';
    } else if (location.pathname.startsWith('/projects')) {
      return 'project';
    } else {
      console.warn(`BlogPost rendered with unexpected path: ${location.pathname}`);
      return null; // Indicate an issue or unknown type
    }
  }, [location.pathname]);

  const contentType = determineContentType();

  // Find post using contentType and slug from the context data
  const post = blogPosts.find(p => {
    if (!p || !p.id) return false; // Basic guard
    if (!contentType) return false; // Cannot find if type is unknown

    // Match by blog/ or project/ prefix (database ID format)
    const dbIdPrefix = contentType === 'project' ? 'project/' : 'blog/';
    if (p.id === `${dbIdPrefix}${slug}`) return true;
    
    // Fallback: check if the slug part matches, regardless of prefix
    const slugPart = p.id.split('/').pop(); // Get last part after any slashes
    if (slugPart === slug) return true;
    
    // Fallback: check if the ID itself is the slug
    if (p.id === slug) return true;
    
    return false;
  });

  // Get the correct post ID for tracking (ensuring we use the actual database ID)
  const trackPostId = post?.id || null;

  // Get the current URL for sharing
  const currentUrl = window.location.href;

  // Scroll to top on slug change (Keep this simple scroll behavior)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Calculate colors based on warmth
  const getWarmColors = (warmthLevel: number) => {
    // Convert warmth (0-100) to a ratio (0-1)
    const ratio = warmthLevel / 100;
    
    // Interpolate between cool and warm colors
    const backgroundColor = `rgb(${250 + (ratio * 5)}, ${249 + (ratio * 3)}, ${246 - (ratio * 10)})`;
    const textColor = `rgb(${44 + (ratio * 4)}, ${44 + (ratio * 2)}, ${44 - (ratio * 4)})`;
    const linkColor = `rgb(${43 + (ratio * 5)}, ${75 + (ratio * 2)}, ${126 - (ratio * 10)})`;
    const codeBackground = `rgb(${245 + (ratio * 5)}, ${242 + (ratio * 3)}, ${235 - (ratio * 10)})`;
    
    return {
      background: backgroundColor,
      text: textColor,
      link: linkColor,
      code: codeBackground
    };
  };

  const warmColors = getWarmColors(warmth);

  // Handle social sharing
  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy') => {
    const title = post?.title || '';
    const url = currentUrl;

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'copy':
        navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
          });
          setTimeout(() => setCopied(false), 2000);
        });
        break;
    }
  };

  // Handle rating submission
  const handleRatingSubmit = async (rating: number): Promise<void> => {
    if (!post?.id) return;

    try {
      await submitRating(post.id, rating);
      
      // Update local state
      setUserRating(rating);
      
      // Refresh ratings to update average (automatic via DB trigger, but ensures UI is updated)
      refreshRatings();
      
      toast({
        title: "Rating Submitted",
        description: `Thanks for rating ${rating} stars.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit rating",
        variant: "destructive",
      });
      throw error;
    }
  };
  
  // Function to refresh ratings
  const refreshRatings = async () => {
    if (!post?.id) return;
    
    try {
      const ratings = await getPostRatings(post.id);
      setAverageRating(ratings.average);
      setRatingCount(ratings.total);
    } catch (error) {
      console.error("Error refreshing ratings:", error);
    }
  };
  
  // Function to fetch comments
  const fetchComments = async () => {
    if (!post?.id) return;
    
    setCommentsLoading(true);
    try {
      // Check if comments are enabled in site settings first
      const { data: siteSettings, error: settingsError } = await supabase
        .from('site_settings')
        .select('enable_comments')
        .single();
        
      if (settingsError) throw settingsError;
      
      // If comments are disabled in site settings, don't load comments
      if (siteSettings && siteSettings.enable_comments === false) {
        setComments([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('comments')
        .select('id, created_at, name, content')
        .eq('post_id', post.id)
        .eq('approved', true) // Only get approved comments
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setComments(data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Check localStorage and load data on mount
  useEffect(() => {
    if (post?.id) {
      // Check if user has already rated this post (from localStorage)
      const savedRating = getUserRating(post.id);
      setUserRating(savedRating);
      
      // Fetch ratings
      setRatingsLoading(true);
      refreshRatings().finally(() => setRatingsLoading(false));
    }
  }, [post?.id]);

  // Track visitors when post is loaded
  useEffect(() => {
    if (trackPostId) {
      console.log(`BlogPost: Attempting to track visit for post ID: ${trackPostId}`);
      const key = `visit_tracked_${trackPostId}`;
      if (!sessionStorage.getItem(key)) {
        trackPostVisit(trackPostId)
          .then((success) => {
            if (success) {
              console.log(`BlogPost: Successfully tracked visit for ${trackPostId}`);
              sessionStorage.setItem(key, 'true');
            } else {
              console.error(`BlogPost: Failed to track visit for ${trackPostId}. Check console for details.`);
            }
          })
          .catch((error) => {
            console.error("BlogPost: Error tracking visit:", error);
          });
      } else {
        console.log(`BlogPost: Visit already tracked for ${trackPostId} in this session`);
      }
    }
  }, [trackPostId, trackPostVisit]);

  // Determine if this is a project-type post
  const isProject = post?.category === "Project" || post?.id?.startsWith('project/');

  // Find related posts (same category, excluding current post)
  const relatedPosts = post ? blogPosts
    .filter(p => {
      const isProjectPost = p.category === "Project" || p.id.startsWith('project/');
      return isProjectPost === isProject && p.id !== post.id;
    })
    .slice(0, 2) : [];

  // Get the correct URL for a post
  const getPostUrl = (post: any) => {
    // First check if the post is a project based on category or ID
    const isProjectPost = post.category === "Project" || post.id.startsWith('project/');
    
    if (post.id.includes('/')) {
      // If the ID contains a path separator, extract the slug
      const [type, ...slugParts] = post.id.split('/');
      // Use 'projects' for project posts and 'thoughts' for others
      const baseType = isProjectPost ? 'projects' : 'thoughts';
      return `/${baseType}/${slugParts.join('/')}`;
    } else {
      // For posts without a path separator, use the category to determine the type
      const postType = isProjectPost ? 'projects' : 'thoughts';
      return `/${postType}/${post.id}`;
    }
  };

  // Function to render content with proper HTML formatting
  const renderContent = () => {
    if (!post?.content) return <p>Content coming soon...</p>;

    // If the content is already HTML (from rich text editor), just return it
    if (post.content.includes('<') && post.content.includes('>')) {
      // Normalize the HTML to ensure image properties are consistently handled
      // The normalizeImageHtml function now handles all the alignment and formatting
      const processedContent = normalizeImageHtml(post.content);
      
      return (
        <div 
          className="prose-content max-w-none" 
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />
      );
    }

    // Use our MarkdownPreview component for markdown content
    return <MarkdownPreview content={post.content} />;
  };

  // Apply stylish underline effect to links after render
  useEffect(() => {
    // GUARD: Only run if post and post.content exist
    if (!post?.content) return; 

    // Find all external links
    const links = document.querySelectorAll<HTMLAnchorElement>('a[href^="http"]');
    
    // Apply custom styling to each link
    links.forEach(link => {
      // Add custom classes for the stylish underline effect
      link.classList.add('external-link', 'relative', 'inline-block');
      
      // Override any existing styles to add our custom styling
      link.style.color = '#3b82f6'; // blue-500
      link.style.textDecoration = 'none';
      link.style.fontWeight = '500';
      link.style.transition = 'all 0.2s ease';
      
      // Create the custom underline element
      const underline = document.createElement('span');
      underline.classList.add(
        'absolute', 'bottom-0', 'left-0', 'w-full', 'h-0.5', 'bg-blue-400/30',
        'transform', 'origin-left', 'transition-all', 'duration-200'
      );
      link.appendChild(underline);
      
      // Add hover effect
      link.addEventListener('mouseenter', () => {
        link.style.color = '#2563eb'; // blue-600
        underline.classList.add('h-1', 'bg-blue-500/50');
      });
      
      link.addEventListener('mouseleave', () => {
        link.style.color = '#3b82f6'; // blue-500
        underline.classList.remove('h-1', 'bg-blue-500/50');
      });
    });
    
    // Cleanup function
    return () => {
      links.forEach(link => {
        link.classList.remove('external-link', 'relative', 'inline-block');
        // Remove the underline element if it exists
        const underline = link.querySelector('span');
        if (underline) {
          link.removeChild(underline);
        }
        
        // Remove event listeners
        link.removeEventListener('mouseenter', () => {});
        link.removeEventListener('mouseleave', () => {});
      });
    };
  }, [post?.content]);

  // Update the related posts section to use the correct URLs
  const renderRelatedPosts = () => {
    if (relatedPosts.length === 0) return null;

    return (
      <div className="mb-12">
        <h2 className="text-2xl font-display font-bold mb-6">Related {isProject ? 'Projects' : 'Articles'}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {relatedPosts.map((relatedPost) => (
            <div key={relatedPost.id} className="group bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
                <span>{relatedPost.category}</span>
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                <span>{relatedPost.readTime}</span>
              </div>
              <h3 className="text-lg font-semibold mb-3 text-gray-700">
                <Link 
                  to={getPostUrl(relatedPost)} 
                  className="hover:text-primary transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-primary/20 after:origin-left after:scale-x-0 after:transition-transform after:duration-200 group-hover:after:scale-x-100"
                >
                  {relatedPost.title}
                </Link>
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{relatedPost.excerpt}</p>
              <Link
                to={getPostUrl(relatedPost)}
                className="inline-flex items-center text-gray-700 font-medium hover:text-primary transition-colors duration-200 group"
              >
                Read more
                <ArrowRight className="ml-2 w-4 h-4 transform transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const contentVariants = {
    normal: {
      maxWidth: "64rem",
      width: "100%",
      margin: "0 auto",
      padding: "1.5rem",
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    fullscreen: {
      maxWidth: "100%",
      width: "100%",
      padding: "0",
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.8
      }
    }
  };

  const articleVariants = {
    normal: {
      borderRadius: "0.75rem",
      boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      border: "1px solid rgb(229 231 235)",
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1
      }
    },
    fullscreen: {
      borderRadius: "0",
      boxShadow: "none",
      border: "none",
      y: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1
      }
    },
    exit: {
      y: 20,
      opacity: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        mass: 0.8
      }
    }
  };

  const navbarVariants = {
    initial: { y: -20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1
      }
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        duration: 0.3
      }
    }
  };

  const footerVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1
      }
    },
    exit: { 
      y: 20, 
      opacity: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 40,
        duration: 0.3
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  const contentAnimation = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      y: -20,
      transition: {
        duration: 0.3,
        ease: "easeIn"
      }
    }
  };
  
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsNewsletterSubmitting(true);
    setNewsletterMessage("");

    if (!newsletterEmail || !/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      setNewsletterMessage("Invalid email.");
      setIsNewsletterSubmitting(false);
      return;
    }

    try {
      // First check if email exists
      const { data } = await supabase
        .from('newsletter_subscriptions')
        .select('id')
        .eq('email', newsletterEmail)
        .maybeSingle();
      
      let error;
      
      if (data?.id) {
        // Email exists, do update
        const result = await supabase
          .from('newsletter_subscriptions')
          .update({ subscription_status: 'active' })
          .eq('email', newsletterEmail);
        
        error = result.error;
      } else {
        // New subscription, do insert
        const result = await supabase
          .from('newsletter_subscriptions')
          .insert([{
            email: newsletterEmail,
            subscription_status: 'active'
          }]);
        
        error = result.error;
      }

      if (error) {
        // Handle specific error cases
        if (error.message && error.message.includes("newsletter_subscriptions_email_key")) {
          setNewsletterMessage("You're already subscribed! Thank you for your interest.");
        } else {
          throw new Error(error.message || 'Failed.');
        }
      } else {
        setNewsletterMessage("Subscribed!");
        setNewsletterEmail("");
      }
    } catch (err: any) {
      setNewsletterMessage(err.message || "Error. Try again.");
    } finally {
      setIsNewsletterSubmitting(false);
    }
  };

  // Add back the comment form handlers (simplified since most logic is now in the dialog)
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCommentData(prev => ({ ...prev, [name]: value }));
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.id || hasCommentedLocally) return;
    
    // Validate comment data
    if (!commentData.name || !commentData.email || !commentData.content) {
      setCommentError("Please fill in all fields.");
      return;
    }
    
    // Validate email
    if (!/^\S+@\S+\.\S+$/.test(commentData.email)) {
      setCommentError("Please enter a valid email address.");
      return;
    }
    
    // Validate content length
    if (commentData.content.length < 10) {
      setCommentError("Your comment is too short. Please provide more details.");
      return;
    }
    
    if (commentData.content.length > 1000) {
      setCommentError("Your comment is too long. Please limit to 1000 characters.");
      return;
    }
    
    setIsSubmittingComment(true);
    setCommentError(null);

    try {
      // Check how many times this user has commented
      const { data: existingComments, error: countError } = await supabase
        .from('comments')
        .select('comment_count')
        .eq('post_id', post.id)
        .eq('email', commentData.email)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (countError) throw countError;
      
      const currentCommentCount = existingComments?.[0]?.comment_count || 0;
      
      // Check comment limit
      if (currentCommentCount >= 2) {
        toast({
          title: "Comment Limit Reached",
          description: "You've already submitted the maximum number of comments for this content.",
          variant: "destructive",
        });
        setIsSubmittingComment(false);
        return;
      }
      
      // Submit comment
      const { error } = await supabase
        .from('comments')
        .insert([{ 
          post_id: post.id, 
          name: commentData.name, 
          email: commentData.email, 
          content: commentData.content,
          comment_count: currentCommentCount + 1
        }]);

      if (error) throw error;

      // Save to localStorage
      const commentedPosts = JSON.parse(localStorage.getItem('commentedPosts') || '{}');
      commentedPosts[post.id] = true;
      localStorage.setItem('commentedPosts', JSON.stringify(commentedPosts));
      setHasCommentedLocally(true);
      setCommentCount(currentCommentCount + 1);

      toast({
        title: "Comment Submitted",
        description: "Your comment is awaiting approval.",
      });
      setCommentData({ name: '', email: '', content: '' }); // Clear form
      
      // Refresh comments list
      fetchComments();

    } catch (error: any) {
      console.error("Comment submission error:", error);
      setCommentError(error.message || "Failed to submit comment.");
      toast({ 
        title: "Error", 
        description: error.message || "Failed to submit comment.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Check loading state *after* all hooks have been called
  if (contentLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading content...</p></div>;
  }
  
  // Check if post exists *after* loading and *after* all hooks
  if (!post) {
    if (!contentType) {
      return <Navigate to="/not-found" replace />;
    }
    console.warn(`Post not found for contentType: ${contentType}, slug: ${slug}`);
    return <Navigate to={contentType === 'project' ? "/projects" : "/thoughts"} replace />;
  }

  return (
    <motion.div
      className={cn(
        "min-h-screen flex flex-col",
        isFullscreen 
          ? "transition-colors duration-500" 
          : "bg-gray-50"
      )}
      style={{
        backgroundColor: isFullscreen ? warmColors.background : undefined,
        backgroundImage: isFullscreen ? `
          url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
          url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5' numOctaves='5'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23paper)' opacity='0.015'/%3E%3C/svg%3E")
        ` : undefined,
      }}
    >
      <AnimatePresence mode="wait">
        {!isFullscreen && (
          <motion.div
            variants={navbarVariants}
            initial="initial"
            animate="animate"
            exit="exit"
          >
      <Navbar />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.main
        className="flex-grow relative"
        animate={{
          padding: isFullscreen ? 0 : "4rem 0",
        }}
        style={{
          backgroundColor: isFullscreen ? warmColors.background : undefined,
        }}
      >
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-4 bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl shadow-lg p-3"
            style={{
              WebkitBackdropFilter: 'blur(16px)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(255, 255, 255, 0.15)'
            }}
          >
            <div className="relative flex items-center gap-4">
              <Sun className="w-5 h-5 text-amber-500/80" />
              <div className="w-32 relative">
                <Slider
                  value={[warmth]}
                  onValueChange={(values) => setWarmth(values[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="absolute -bottom-4 left-0 right-0 flex justify-between text-[10px] text-gray-500/80">
                  <span>Cool</span>
                  <span>Warm</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={isFullscreen ? "fullscreen" : "normal"}
            variants={contentVariants}
            initial="normal"
            animate={isFullscreen ? "fullscreen" : "normal"}
            exit="exit"
            className="w-full"
            style={{
              backgroundColor: isFullscreen ? warmColors.background : undefined,
            }}
          >
            <AnimatePresence mode="wait">
              {!isFullscreen && (
                <motion.div
                  variants={contentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="mb-6"
                >
                  <Link 
                    to={isProject ? "/projects" : "/thoughts"} 
                    className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    <span>Back to {isProject ? "Projects" : "Thoughts"}</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.article
              variants={articleVariants}
              initial="normal"
              animate={isFullscreen ? "fullscreen" : "normal"}
              exit="exit"
              className={cn(
                isFullscreen ? "min-h-screen" : "bg-white"
              )}
              style={{
                backgroundColor: isFullscreen ? warmColors.background : undefined,
              }}
              layoutId="article"
            >
              <motion.button
                variants={buttonVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                onClick={toggleFullscreen}
                className={cn(
                  "fixed z-50 bottom-6 right-6 rounded-full w-12 h-12 shadow-lg flex items-center justify-center",
                  "bg-gray-900 hover:bg-gray-800 text-white",
                  "transition-all duration-300"
                )}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </motion.button>

              <AnimatePresence>
                {!isFullscreen && (post.featuredImage || post.imageUrl) && (
                  <motion.div
                    variants={contentAnimation}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="w-full h-64 md:h-96 bg-gray-200 overflow-hidden rounded-t-2xl"
                  >
                <img 
                  src={post.featuredImage || post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover" 
                />
                  </motion.div>
            )}
              </AnimatePresence>
            
              {!isFullscreen && (
            <div className="p-6 md:p-10 border-b border-gray-100">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-sm mb-4">
                  <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    {isProject ? <Briefcase size={14} /> : null}
                    {post.category}
                  </span>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{formatDate(post.date)}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{post.readTime}</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 text-gray-800 leading-tight">
                  {post.title}
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              
              <div className="flex items-center gap-4 py-4 border-t border-gray-100 mt-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                  {post.authorImage && (
                    <img src={post.authorImage} alt={post.authorName || "Author"} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{post.authorName || "ASSAD"}</div>
                  <div className="text-sm text-gray-500">{post.authorRole || "AI & Automation Expert"}</div>
                </div>
              </div>
            </div>
              )}
              
              <div 
                className={cn(
                  "transition-all duration-300",
                  isFullscreen 
                    ? [
                        "max-w-[90%] md:max-w-[85%] lg:max-w-[75%] mx-auto px-6 py-12",
                        "[&_*]:transition-colors",
                        "duration-500"
                      ].join(" ")
                    : "p-6 md:p-10"
                )}
                style={isFullscreen ? {
                  '--tw-prose-body': warmColors.text,
                  '--tw-prose-headings': warmColors.text,
                  '--tw-prose-links': warmColors.link,
                  '--tw-prose-code': warmColors.code,
                  '--tw-prose-pre-bg': warmColors.code,
                  color: warmColors.text,
                } as React.CSSProperties : undefined}
              >
                {isFullscreen && (
                  <motion.h1 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-8 text-gray-800 leading-tight"
                  >
                    {post.title}
                  </motion.h1>
                )}
                <motion.div 
                  className={cn(
                    "prose max-w-none text-gray-700",
                    isFullscreen 
                      ? "prose-2xl md:prose-2xl lg:prose-2xl !max-w-none" 
                      : "prose-base sm:prose-lg md:prose-xl !max-w-none",
                    // Custom typography overrides
                    "prose-headings:font-display prose-headings:font-bold prose-headings:text-gray-800",
                    "prose-h1:text-3xl sm:prose-h1:text-4xl md:prose-h1:text-5xl prose-h1:mb-8",
                    "prose-h2:text-2xl sm:prose-h2:text-3xl md:prose-h2:text-4xl prose-h2:mb-6",
                    "prose-h3:text-xl sm:prose-h3:text-2xl md:prose-h3:text-3xl prose-h3:mb-4",
                    "prose-p:text-base sm:prose-p:text-lg md:prose-p:text-xl prose-p:leading-relaxed",
                    "prose-ul:text-base sm:prose-ul:text-lg md:prose-ul:text-xl prose-ul:leading-relaxed",
                    "prose-ol:text-base sm:prose-ol:text-lg md:prose-ol:text-xl prose-ol:leading-relaxed",
                    "prose-li:mb-3",
                    "prose-blockquote:text-lg sm:prose-blockquote:text-xl md:prose-blockquote:text-2xl prose-blockquote:font-medium",
                    "prose-img:rounded-lg prose-img:shadow-md",
                    "prose-strong:font-semibold prose-strong:text-gray-800",
                    "prose-a:text-blue-600 prose-a:font-medium hover:prose-a:text-blue-700",
                    isFullscreen && [
                      "prose-p:text-lg sm:prose-p:text-xl md:prose-p:text-2xl",
                      "prose-ul:text-lg sm:prose-ul:text-xl md:prose-ul:text-2xl",
                      "prose-ol:text-lg sm:prose-ol:text-xl md:prose-ol:text-2xl",
                      "prose-blockquote:text-xl sm:prose-blockquote:text-2xl md:prose-blockquote:text-3xl",
                      "prose-code:text-lg sm:prose-code:text-xl md:prose-code:text-2xl"
                    ]
                  )}
                >
                {renderContent()}
                
                {/* Project-specific sections */}
                {isProject && (
                  <>
                    {post.features && post.features.length > 0 && (
                      <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Key Features</h2>
                        <ul className="list-disc pl-5 mb-8 space-y-2 text-zinc-600">
                          {post.features.map((feature, index) => (
                            <li key={index} className="ml-4">{feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {post.technologies && post.technologies.length > 0 && (
                      <div className="mt-12">
                        <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Technologies Used</h2>
                        <div className="flex flex-wrap gap-3">
                          {post.technologies.map((tech, index) => (
                            <span
                              key={index}
                              className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-lg"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                </motion.div>
            </div>
            
              {!isFullscreen && (
            <div className="p-6 md:p-10 bg-gray-50 border-t border-gray-200">
              {post.tags && post.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-gray-700 font-medium mb-3">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="bg-white border border-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <Tag size={12} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Social sharing and actions */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-gray-200 pt-6">
                <div className="flex items-center gap-3 mb-4 md:mb-0">
                  <span className="text-sm text-gray-500">Share this {isProject ? 'project' : 'article'}:</span>
                  <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full h-9 w-9 p-0"
                          onClick={() => handleShare('twitter')}
                        >
                          <Twitter size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full h-9 w-9 p-0"
                          onClick={() => handleShare('linkedin')}
                        >
                          <Linkedin size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full h-9 w-9 p-0"
                          onClick={() => handleShare('copy')}
                        >
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                    </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-full h-9 w-9 p-0"
                          onClick={() => setShowComments(!showComments)}
                        >
                      <MessageSquare size={16} />
                    </Button>
                  </div>
                </div>
                <Link
                  to={isProject ? "/projects" : "/thoughts"}
                  className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors",
                    "bg-gray-100 text-gray-700 hover:bg-gray-200 h-9 px-4 py-2"
                  )}
                >
                  <span>View All {isProject ? 'Projects' : 'Articles'}</span>
                  <ArrowRight size={16} className="ml-2" />
                </Link>
              </div>

                  {/* --- Rating System --- */}
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <h3 className="font-medium text-gray-900">Rate this post</h3>
                    <StarRating
                      postId={post.id}
                      userRating={userRating}
                      totalRatings={ratingCount}
                      averageRating={averageRating}
                      onRatingSubmit={handleRatingSubmit}
                      className="my-4"
                    />
                  </div>

                  {/* --- Comments Section --- */}
                  {showComments && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Comments</h4>
                      
                      {/* Comment Submission Form or Message */}
                      {hasCommentedLocally ? (
                         <Alert className="mb-8 border-green-300 bg-green-50/50 text-green-800">
                           <CheckCircle className="h-4 w-4 !text-green-600" />
                           <AlertTitle className="text-green-800 font-semibold">Comment Submitted</AlertTitle>
                           <AlertDescription className="text-green-700">
                              Thanks! Your comment is awaiting approval.
                           </AlertDescription>
                         </Alert>
                      ) : (
                        <form onSubmit={handleCommentSubmit} className="mb-8 space-y-4">
                          {commentError && (
                            <Alert variant="destructive" className="py-2">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{commentError}</AlertDescription>
                            </Alert>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 mb-1">Name</Label>
                              <Input 
                                id="comment-name"
                                name="name"
                                value={commentData.name}
                                onChange={handleCommentChange}
                                placeholder="Your Name"
                                className={commentError && !commentData.name ? "border-red-500" : ""}
                                required 
                               />
                            </div>
                            <div>
                              <Label htmlFor="comment-email" className="block text-sm font-medium text-gray-700 mb-1">Email</Label>
                              <Input 
                                id="comment-email"
                                name="email"
                                type="email"
                                value={commentData.email}
                                onChange={handleCommentChange}
                                placeholder="your@email.com (won't be published)"
                                className={commentError && (!commentData.email || !/^\S+@\S+\.\S+$/.test(commentData.email)) ? "border-red-500" : ""}
                                required 
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label htmlFor="comment-content" className="block text-sm font-medium text-gray-700">Comment</Label>
                              <span className={`text-xs ${commentData.content.length > 1000 ? "text-red-500 font-medium" : "text-gray-500"}`}>
                                {commentData.content.length}/1000 characters
                              </span>
                            </div>
                            <Textarea 
                              id="comment-content"
                              name="content"
                              rows={4}
                              value={commentData.content}
                              onChange={handleCommentChange}
                              placeholder="Share your thoughts..."
                              className={commentError && (!commentData.content || commentData.content.length < 10 || commentData.content.length > 1000) ? "border-red-500" : ""}
                              required
                             />
                             {commentData.content.length < 10 && commentData.content.length > 0 && (
                               <p className="mt-1 text-xs text-amber-600">Comment must be at least 10 characters.</p>
                             )}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                            <p>Your email address will not be published. Comments are moderated before appearing.</p>
                            <p className="mt-1">By submitting a comment, you agree to our <Link to="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.</p>
                          </div>
                          <Button type="submit" disabled={isSubmittingComment} className="w-full sm:w-auto">
                            {isSubmittingComment ? "Submitting..." : "Post Comment"}
                            {!isSubmittingComment && <Send size={16} className="ml-2"/>}
                          </Button>
                        </form>
                      )}
                      
                      {/* Display Comments */}
                      <div className="space-y-6">
                        {commentsLoading && <p className="text-gray-500">Loading comments...</p>}
                        {!commentsLoading && comments.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No comments yet. Be the first!</p>
                        )}
                        {!commentsLoading && comments.map((comment) => (
                          <div key={comment.id} className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0">
                             <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-500">
                               {comment.name.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex-1">
                               <div className="flex items-center justify-between mb-1">
                                 <span className="font-semibold text-gray-800">{comment.name}</span>
                                 <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                               </div>
                               <p className="text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
            </div>
              )}
            </motion.article>
          
            {!isFullscreen && (
              <>
          {/* Newsletter Signup */}
          <div className="mt-12 mb-12 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
            <form onSubmit={handleNewsletterSubmit}>
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="md:flex-1">
                  <h3 className="text-xl font-bold mb-2">Subscribe to my newsletter</h3>
                  <p className="text-gray-600 mb-4 md:mb-0">Get the latest insights on AI and automation delivered to your inbox.</p>
                </div>
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-start">
                  <div className="flex-grow w-full sm:w-auto">
                    <input 
                      type="email" 
                      placeholder="Your email" 
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200" 
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                    />
                     {newsletterMessage && <p className={`mt-1 text-xs ${newsletterMessage.includes("Error") || newsletterMessage.includes("Invalid") ? 'text-red-500' : 'text-green-600'}`}>{newsletterMessage}</p>}
                  </div>
                  <Button 
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700 w-full sm:w-auto text-white" 
                    disabled={isNewsletterSubmitting}
                  >
                    {isNewsletterSubmitting ? "Subscribing..." : "Subscribe"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
          
          {/* Related Posts */}
                {renderRelatedPosts()}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.main>

      {!isFullscreen && <Footer />}

      {/* Newsletter Signup */}
      <div className="mt-12 mb-12 bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
        <form onSubmit={handleNewsletterSubmit}>
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="md:flex-1">
              <h3 className="text-xl font-bold mb-2">Subscribe to my newsletter</h3>
              <p className="text-gray-600 mb-4 md:mb-0">Get the latest insights on AI and automation delivered to your inbox.</p>
            </div>
            <div className="w-full md:w-auto flex flex-col sm:flex-row gap-2 items-start">
              <div className="flex-grow w-full sm:w-auto">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                 {newsletterMessage && <p className={`mt-1 text-xs ${newsletterMessage.includes("Error") || newsletterMessage.includes("Invalid") ? 'text-red-500' : 'text-green-600'}`}>{newsletterMessage}</p>}
              </div>
              <Button 
                type="submit"
                className="bg-gray-800 hover:bg-gray-700 w-full sm:w-auto text-white" 
                disabled={isNewsletterSubmitting}
              >
                {isNewsletterSubmitting ? "Subscribing..." : "Subscribe"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BlogPost;