import { useState, useEffect } from "react";
import { ArrowRight, Briefcase, BookOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useContent } from "../context/ContentContext";

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

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date?: string;
  readTime?: string;
  imageUrl?: string;
  featuredImage?: string;
  tags?: string[];
}

const BlogPage = () => {
  const { blogPosts } = useContent();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [filter, setFilter] = useState<string | null>(initialCategory);
  
  // Handle URL parameter changes
  useEffect(() => {
    if (filter) {
      setSearchParams({ category: filter });
    } else {
      setSearchParams({});
    }
  }, [filter, setSearchParams]);
  
  // Get unique categories from all blog posts
  const categories = Array.from(new Set(blogPosts.map((post: BlogPost) => post.category)));
  
  // Filter posts based on selected category
  const filteredPosts = filter
    ? blogPosts.filter((post: BlogPost) => post.category === filter)
    : blogPosts;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container-custom">
          <div className="mb-12">
            <h1 className="text-4xl font-display font-bold mb-6 text-zinc-700">
              {filter === 'Project' ? 'Projects' : filter || 'All Content'}
            </h1>
            <p className="text-zinc-600 max-w-2xl text-lg">
              {filter === 'Project' 
                ? 'Explore my portfolio of AI-powered applications and automation solutions designed to solve complex business challenges.'
                : 'Thoughts and perspectives on AI development, automation, and technology trends.'}
            </p>
          </div>
          
          {/* Category filter */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setFilter(null)}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${!filter ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}
              >
                <BookOpen size={16} /> All
              </button>
              {categories.map((category: string) => (
                <button
                  key={category}
                  onClick={() => setFilter(category)}
                  className={`px-4 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === category ? 'bg-zinc-700 text-white' : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'}`}
                >
                  {category === 'Project' ? <Briefcase size={16} /> : <BookOpen size={16} />}
                  {category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Display as different layouts based on category */}
          {filter === 'Project' ? (
            // Project-style grid layout
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post: BlogPost) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="h-full flex flex-col">
                    {post.imageUrl && (
                      <div className="h-40 mb-4 bg-zinc-100 rounded-lg overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-xl font-semibold mb-3 text-zinc-700">{post.title}</h3>
                    <p className="text-zinc-600 mb-4 flex-grow">{post.excerpt}</p>
                    <div className="mb-4">
                      {post.tags?.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-block bg-zinc-100 text-zinc-600 text-sm px-3 py-1 rounded-full mr-2 mb-2"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/projects/${post.id}`}
                      className="flex items-center text-zinc-700 font-medium group-hover:text-zinc-900 transition-colors"
                    >
                      <span>View Project</span>
                      <ArrowRight size={16} className="ml-1 group-hover:ml-2 transition-all" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Blog-style list layout
            <div className="space-y-12">
              {filteredPosts.map((post: BlogPost) => (
                <div key={post.id} className="border-b border-zinc-200 pb-10 last:border-0">
                  <div className="flex flex-col-reverse md:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 text-sm text-zinc-500 mb-3">
                        <span>{post.category}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>{formatDate(post.date || '')}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>{post.readTime}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-semibold mb-3 text-zinc-700">
                        <Link to={`/thoughts/${post.id}`} className="hover:text-zinc-900 transition-colors">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-zinc-600 mb-4">{post.excerpt}</p>
                      <Link
                        to={`/thoughts/${post.id}`}
                        className="inline-flex items-center text-zinc-700 font-medium hover:text-zinc-900 transition-colors"
                      >
                        <span>Read more</span>
                        <ArrowRight size={16} className="ml-1 group-hover:ml-2 transition-all" />
                      </Link>
                    </div>
                    
                    {(post.featuredImage || post.imageUrl) && (
                      <div className="md:w-64 lg:w-80">
                        <div className="aspect-video bg-zinc-100 rounded-lg overflow-hidden">
                          <img 
                            src={post.featuredImage || post.imageUrl} 
                            alt={post.title} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {filteredPosts.length === 0 && (
            <div className="text-center p-10 border border-dashed border-zinc-300 rounded-xl">
              <p className="text-zinc-500">No content found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPage;
