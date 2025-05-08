import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";

const Projects = () => {
  const { blogPosts } = useContent();
  
  // Get only project posts and limit to 3 for preview
  const projects = blogPosts
    .filter(post => post.category === "Project")
    .slice(0, 3);

  // Helper function to get the correct URL for a post
  const getPostUrl = (post: any) => {
    const [type, ...slugParts] = post.id.split('/');
    return `/${type}/${slugParts.join('/')}`;
  };

  return (
    <section className="py-16 sm:py-24 bg-zinc-50">
      <div className="container-custom">
        <div className="mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4 text-zinc-700">
            Featured Projects
          </h2>
          <p className="text-lg text-zinc-600 max-w-2xl">
            Explore my portfolio of AI-powered applications and automation solutions designed 
            to solve complex business challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-xl p-6 border border-zinc-200 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="h-full flex flex-col">
                {project.imageUrl && (
                  <div className="h-40 mb-4 bg-zinc-100 rounded-lg overflow-hidden">
                    <img 
                      src={project.imageUrl} 
                      alt={project.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-3 text-zinc-700">{project.title}</h3>
                <p className="text-zinc-600 mb-4 flex-grow">{project.excerpt}</p>
                <div className="mb-4">
                  {project.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block bg-zinc-100 text-zinc-600 text-sm px-3 py-1 rounded-full mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  to={getPostUrl(project)}
                  className="flex items-center text-zinc-700 font-medium group-hover:text-zinc-900 transition-colors"
                >
                  <span>View Project</span>
                  <ArrowRight size={16} className="ml-1 group-hover:ml-2 transition-all" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            to="/blog?category=Project"
            className="bg-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            View All Projects
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Projects; 