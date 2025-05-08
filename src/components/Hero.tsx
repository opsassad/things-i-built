import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useContent } from "../context/ContentContext";

const Hero = () => {
  const { homePageContent } = useContent();
  
  return (
    <section className="min-h-screen flex items-center justify-center relative bg-white overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-zinc-50 via-purple-50/30 to-blue-50/20 opacity-70"></div>
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] bg-purple-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute top-2/3 right-1/3 translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-blue-100 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-[40rem] h-[40rem] bg-zinc-200 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container-custom relative">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="space-y-8 relative">
            {/* Enhanced typography for main heading */}
            <div className="space-y-6">
              <div className="relative inline-block">
                <h1 className="relative z-10">
                  <span className="block text-[2.5rem] sm:text-5xl lg:text-6xl font-display font-bold tracking-normal leading-tight text-zinc-800">
                    {homePageContent.heroTitle}
                  </span>
                </h1>
                
                <div className="mt-4">
                  <div className="relative">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-normal tracking-wide leading-relaxed text-zinc-600">
                      {homePageContent.heroSubtitle}
                    </h2>
                    
                    {/* Subtle gradient line */}
                    <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-36 h-0.5">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-400 to-transparent opacity-50"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-300 to-transparent blur-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA buttons with enhanced mobile styling */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center px-6 sm:px-0">
              <Link
                to="/projects"
                className="group bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 text-sm rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md w-full sm:w-auto min-w-[140px] font-medium"
              >
                Read
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="bg-white hover:bg-zinc-50 text-zinc-800 px-6 py-3 text-sm rounded-lg flex items-center justify-center transition-all duration-300 border border-zinc-200 hover:border-zinc-300 shadow-sm hover:shadow-md w-full sm:w-auto min-w-[140px] font-medium"
              >
                Get In Touch
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
