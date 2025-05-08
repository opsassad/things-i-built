import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";

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

const BlogPreview = () => {
  const { blogPosts } = useContent();

  // Get only project posts and limit to 3 for preview
  const latestPosts = blogPosts
    .filter(post => 
      (post.category === "Project" || post.id.startsWith('project/')) &&
      // Exclude system pages used for visitor tracking
      !['home', 'about', 'contact', 'blog', 'projects', 'test-post'].includes(post.id)
    )
    .slice(0, 3);

  // Helper function to get the correct URL for a post
  const getPostUrl = (post: any) => {
    const [type, ...slugParts] = post.id.split('/');
    return `/projects/${slugParts.join('/')}`;
  };

  return (
    <section id="blog" className="py-20 relative overflow-hidden">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white to-purple-50/30"></div>
        <div className="absolute top-0 -left-1/2 w-[1000px] h-[1000px] bg-blue-100 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
        <div className="absolute top-1/4 -right-1/2 w-[800px] h-[800px] bg-purple-100 rounded-full mix-blend-multiply filter blur-[96px] opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container-custom relative">
        {/* Section Header */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600">
            Git & Grit
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl">
            Explore my portfolio of AI-powered applications and automation solutions designed 
            to solve complex business challenges.
          </p>
        </div>

        {/* Project Posts List */}
        <div className="space-y-12">
          {latestPosts.map((post) => (
            <article 
              key={post.id} 
              className="group border-b border-zinc-100 pb-12 last:border-0 relative hover:bg-white/50 rounded-xl transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Project Image */}
                {(post.featuredImage || post.imageUrl) && (
                  <div className="md:col-span-1">
                    <Link to={getPostUrl(post)} className="block">
                      <div className="aspect-[4/3] rounded-lg overflow-hidden bg-zinc-100">
                        <img 
                          src={post.featuredImage || post.imageUrl} 
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    </Link>
                  </div>
                )}
                
                {/* Project Content */}
                <div className={`${(post.featuredImage || post.imageUrl) ? 'md:col-span-2' : 'md:col-span-3'}`}>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span>{formatDate(post.date)}</span>
                      <span>·</span>
                      <span>{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-zinc-800">
                      <Link 
                        to={getPostUrl(post)}
                        className="hover:text-zinc-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h3>
                    
                    <p className="text-zinc-600 leading-relaxed">
                      {post.excerpt}
                    </p>

                    {/* Project Tags */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {post.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-block bg-zinc-100 text-zinc-600 text-sm px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <Link
                        to={getPostUrl(post)}
                        className="inline-flex items-center text-zinc-800 hover:text-zinc-600 transition-colors text-sm"
                      >
                        View Project
                        <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* View All Projects Link */}
        <div className="mt-16 text-center">
          <Link
            to="/projects"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            View All Projects
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPreview;
