import { useState, useEffect, useRef } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Timeline from "../components/Timeline";
import { useContent } from "../context/ContentContext";

const MotionLink = motion.create(Link);

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

const ProjectsPage = () => {
  const { blogPosts, trackPostVisit } = useContent();
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const postRefs = useRef<PostRefObject>({});
  
  // Track visit to projects page
  useEffect(() => {
    const key = `visit_tracked_projects`;
    if (!sessionStorage.getItem(key)) {
      trackPostVisit('projects')
        .then((success) => {
          if (success) {
            console.log(`ProjectsPage: Successfully tracked visit for projects`);
            sessionStorage.setItem(key, 'true');
          } else {
            console.error(`ProjectsPage: Failed to track visit for projects. Check console for details.`);
          }
        })
        .catch((error) => {
          console.error('ProjectsPage: Error tracking projects page visit:', error);
        });
    } else {
      console.log(`ProjectsPage: Visit already tracked for projects in this session`);
    }
  }, [trackPostVisit]);
  
  // Filter only project posts (exclude system pages)
  const projectPosts = blogPosts.filter(post => 
    (post.category === "Project" || post.id.startsWith('project/')) &&
    // Exclude system pages used for visitor tracking
    !['home', 'about', 'contact', 'blog', 'projects', 'test-post'].includes(post.id)
  );
  
  // Sort posts by date (newest first)
  const sortedPosts = [...projectPosts].sort((a, b) => {
    return new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime();
  });
  
  // Get unique years for timeline grouping
  const years = [...new Set(sortedPosts.map(post => formatYear(post.date || post.createdAt || '')))].filter(Boolean);
  
  // Get unique year-month combinations for more granular timeline
  const yearMonths = [...new Set(sortedPosts.map(post => formatYearMonth(post.date || post.createdAt || '')))].filter(Boolean);

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
              Git & Grit
            </motion.h1>
            
            {/* Projects Grid */}
            <motion.div 
              className="space-y-24"
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
                      to={`/projects/${post.id.split('/').slice(1).join('/')}`}
                      className="block mb-8 aspect-[2/1] overflow-hidden rounded-2xl"
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
                  
                  <div className="space-y-6">
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
                          to={`/projects/${post.id.split('/').slice(1).join('/')}`}
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
                    </div>

                    {/* Features Section */}
                    {post.features && post.features.length > 0 && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 * (index + 2.6) }}
                      >
                        <h3 className="text-sm font-medium text-zinc-800">Features</h3>
                        <div className="flex flex-wrap gap-2">
                          {post.features.map((feature, i) => (
                            <span 
                              key={i}
                              className="inline-flex items-center text-xs text-zinc-600 border border-zinc-200 rounded-full px-3 py-1"
                            >
                              <Plus size={12} className="mr-1" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Technologies Section */}
                    {post.technologies && post.technologies.length > 0 && (
                      <motion.div 
                        className="space-y-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 * (index + 2.8) }}
                      >
                        <h3 className="text-sm font-medium text-zinc-800">Technologies</h3>
                        <div className="flex flex-wrap gap-2">
                          {post.technologies.map((tech, i) => (
                            <span 
                              key={i}
                              className="inline-flex items-center text-xs text-zinc-600 bg-zinc-50 rounded-full px-3 py-1"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4, delay: 0.2 * (index + 3) }}
                    >
                      <MotionLink
                        to={`/projects/${post.id.split('/').slice(1).join('/')}`}
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
            
            {projectPosts.length === 0 && (
              <motion.div 
                className="text-zinc-400 text-center py-16"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                No projects found.
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectsPage;
