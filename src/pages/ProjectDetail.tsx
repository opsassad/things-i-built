import { useParams, Link, Navigate } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, ArrowRight, Tag, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useContent } from "../context/ContentContext";

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { blogPosts } = useContent();
  
  // Find project post with improved ID matching
  const project = blogPosts.find(p => {
    // Check if the post ID matches any of these patterns:
    // 1. Exact match with project/slug
    // 2. Just the slug portion matches
    // 3. The full ID matches the slug
    const [postType, ...slugParts] = p.id.split('/');
    const postSlug = slugParts.join('/');
    
    return (p.id === `project/${slug}` || // Full path match
           postSlug === slug || // Slug portion matches
           p.id === slug) && // Direct ID match
           p.category === "Project"; // Ensure it's a project
  });
  
  // If project not found, redirect to projects page
  if (!project) {
    return <Navigate to="/projects" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-6">
            <Link 
              to="/projects" 
              className="flex items-center text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ArrowLeft size={16} className="mr-1" />
              <span>Back to Projects</span>
            </Link>
          </div>

          <motion.article 
            className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Cover Image */}
            {(project.featuredImage || project.imageUrl) && (
              <div className="w-full h-64 md:h-96 bg-gray-100 overflow-hidden">
                <img 
                  src={project.featuredImage || project.imageUrl} 
                  alt={project.title}
                  className="w-full h-full object-cover" 
                />
              </div>
            )}

            {/* Project Header */}
            <div className="p-6 md:p-10 border-b border-gray-100">
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-3 text-zinc-500 text-sm mb-4">
                  <span className="bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                    <Briefcase size={14} />
                    {project.category}
                  </span>
                  <div className="flex items-center">
                    <Calendar size={14} className="mr-1" />
                    <span>{project.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock size={14} className="mr-1" />
                    <span>{project.readTime}</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-6 text-gray-800 leading-tight">
                  {project.title}
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  {project.excerpt}
                </p>
              </div>
              
              <div className="flex items-center gap-4 py-4 border-t border-gray-100 mt-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                  {project.authorImage && (
                    <img src={project.authorImage} alt={project.authorName || "Author"} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{project.authorName || "ASSAD"}</div>
                  <div className="text-sm text-gray-500">{project.authorRole || "AI & Automation Expert"}</div>
                </div>
              </div>
            </div>

            {/* Project Content */}
            <div className="p-6 md:p-10">
              <div className="prose prose-lg max-w-none">
                <div className="mb-12">
                  <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Overview</h2>
                  <div className="text-zinc-600 text-lg leading-relaxed">
                    {project.detailedDescription && (
                      <div dangerouslySetInnerHTML={{ __html: project.detailedDescription }} />
                    )}
                  </div>
                </div>
                
                {project.features && project.features.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Key Features</h2>
                    <ul className="list-disc pl-5 space-y-2 text-zinc-600">
                      {project.features.map((feature, index) => (
                        <li key={index} className="ml-4">{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {project.technologies && project.technologies.length > 0 && (
                  <div className="mb-12">
                    <h2 className="text-2xl font-semibold mb-4 text-zinc-700">Technologies Used</h2>
                    <div className="flex flex-wrap gap-3">
                      {project.technologies.map((tech, index) => (
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

                {project.content && (
                  <div className="mt-8">
                    <div dangerouslySetInnerHTML={{ __html: project.content }} />
                  </div>
                )}
              </div>
            </div>

            {/* Footer Section */}
            <div className="p-6 md:p-10 bg-gray-50 border-t border-gray-200">
              {project.tags && project.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-gray-700 font-medium mb-3">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map(tag => (
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
            </div>
          </motion.article>

          {/* Call to Action */}
          <div className="mt-12 text-center">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Interested in this project? Let's talk
              <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProjectDetail;
