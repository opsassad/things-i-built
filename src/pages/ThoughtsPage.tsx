import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Timeline from "../components/Timeline";
import { useContent } from "../context/ContentContext";

const MotionLink = motion(Link);

// Format date to be more readable (e.g., "May 3, 2025" instead of ISO string)
const formatDate = (dateString: string): string => {
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

// Format year only for timeline
const formatYear = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.getFullYear().toString();
  } catch {
    return '';
  }
};

// Add a function to format year and month
const formatYearMonth = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  } catch {
    return '';
  }
};

interface PostRefObject {
  [key: string]: HTMLElement | null;
}

const ThoughtsPage = () => {
  const { blogPosts, trackPostVisit } = useContent();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const postRefs = useRef<PostRefObject>({});
  
  // Track visit to thoughts page
  useEffect(() => {
    const key = `visit_tracked_blog`;
    if (!sessionStorage.getItem(key)) {
      trackPostVisit('blog')
        .then((success) => {
          if (success) {
            console.log(`ThoughtsPage: Successfully tracked visit for blog`);
            sessionStorage.setItem(key, 'true');
          } else {
            console.error(`ThoughtsPage: Failed to track visit for blog. Check console for details.`);
          }
        })
        .catch((error) => {
          console.error('ThoughtsPage: Error tracking thoughts page visit:', error);
        });
    } else {
      console.log(`ThoughtsPage: Visit already tracked for blog in this session`);
    }
  }, [trackPostVisit]);
  
  // Filter only blog posts (exclude projects and system pages)
  const thoughtPosts = blogPosts.filter(post => 
    (post.category === "Blog" || post.id.startsWith('blog/')) && 
    // Exclude system pages used for visitor tracking
    !['home', 'about', 'contact', 'blog', 'projects', 'test-post'].includes(post.id)
  );
  
  // Sort posts by date (newest first)
  const sortedPosts = [...thoughtPosts].sort((a, b) => {
    return new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime();
  });
  
  // Setup intersection observer to track which post is in view
  useEffect(() => {
    if (sortedPosts.length === 0) return;
    
    const observerOptions = {
      root: null, 
      rootMargin: '-20% 0px -60% 0px', // Consider post in view when in middle 20% of viewport
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          setActivePostId(entry.target.dataset.postId || null);
        }
      });
    }, observerOptions);
    
    // Observe all post elements
    Object.values(postRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      Object.values(postRefs.current).forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [sortedPosts]);
  
  // Scroll to post when clicking timeline item
  const scrollToPost = (postId: string) => {
    const element = postRefs.current[postId];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-24 relative">
        <div className="flex flex-row max-w-7xl mx-auto">
          {/* Timeline component */}
          <div className="hidden md:block w-24 relative">
            <Timeline 
              posts={sortedPosts}
              activePostId={activePostId}
              onTimelineItemClick={scrollToPost}
            />
          </div>
          
          <motion.div 
            className="flex-1 max-w-3xl mx-auto px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1 
              className="text-3xl font-light mb-12 text-zinc-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Thoughts
            </motion.h1>
            
            {/* Blog Posts Grid */}
            <motion.div 
              className="space-y-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {sortedPosts.map((post, index) => (
                <motion.article 
                  key={post.id} 
                  className="group"
                  ref={el => postRefs.current[post.id] = el as HTMLElement}
                  data-post-id={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.6,
                    delay: 0.2 * (index + 1),
                    ease: [0.23, 1, 0.32, 1]
                  }}
                >
                  {(post.featuredImage || post.imageUrl) && (
                    <MotionLink 
                      to={`/thoughts/${post.id.split('/').slice(1).join('/')}`}
                      className="block mb-6 aspect-[2/1] overflow-hidden rounded-xl"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    >
                      <motion.img 
                        src={post.featuredImage || post.imageUrl} 
                        alt={post.title}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                      />
                    </MotionLink>
                  )}
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="text-sm text-zinc-400"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 * (index + 2) }}
                    >
                      {formatDate(post.date || post.createdAt || '')} · {post.readTime}
                    </motion.div>
                    
                    <motion.h2 
                      className="text-xl text-zinc-800"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 * (index + 2.2) }}
                    >
                      <Link 
                        to={`/thoughts/${post.id.split('/').slice(1).join('/')}`}
                        className="hover:text-zinc-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </motion.h2>
                    
                    <motion.p 
                      className="text-zinc-600 leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 * (index + 2.4) }}
                    >
                      {post.excerpt}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 * (index + 3) }}
                    >
                      <MotionLink
                        to={`/thoughts/${post.id.split('/').slice(1).join('/')}`}
                        className="inline-flex items-center text-zinc-800 hover:text-zinc-600 transition-colors text-sm"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        Read more
                        <ArrowRight size={16} className="ml-1" />
                      </MotionLink>
                    </motion.div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
            
            {thoughtPosts.length === 0 && (
              <motion.div 
                className="text-zinc-400 text-center py-16"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                No thoughts published yet.
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThoughtsPage; 