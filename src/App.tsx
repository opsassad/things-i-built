import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import ProjectsPage from "./pages/ProjectsPage";
import ThoughtsPage from "./pages/ThoughtsPage";
import BlogPost from "./pages/BlogPost";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/AdminPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { ContentProvider, useContent } from "./context/ContentContext";
import { AuthProvider } from "./context/AuthContext";
import ExamplePage from './pages/ExamplePage';
import Logo from "./components/Logo";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

// Helper component for redirecting legacy blog slugs
const BlogSlugRedirect = () => {
  const params = useParams();
  // Redirect /blog/:slug to /thoughts/:slug permanently
  return <Navigate to={`/thoughts/${params.slug}`} replace />; 
};

// Global loading overlay component
const LoadingOverlay = () => {
  const { isLoading } = useContent();
  const [minimumTimeElapsed, setMinimumTimeElapsed] = useState(false);
  
  // Track if minimum display time has elapsed
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinimumTimeElapsed(true);
    }, 2500); // Minimum display time: 2.5 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  // Only hide when both actual loading is complete AND minimum time has elapsed
  const shouldShowLoading = isLoading || !minimumTimeElapsed;
  
  return (
    <AnimatePresence>
      {shouldShowLoading && (
        <motion.div 
          className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { 
              duration: 0.8,
              ease: "easeInOut"
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ 
              scale: 1,
              opacity: 1,
              transition: { 
                duration: 1.2, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut"
              }
            }}
            className="relative"
          >
            <Logo size="lg" withLink={false} className="mb-8" />
            
            {/* Loading indicator */}
            <motion.div 
              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-4 mt-6"
              initial={{ width: 0 }}
              animate={{ 
                width: "100%",
                transition: { 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
            >
              <div className="h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70"></div>
            </motion.div>
          </motion.div>
          
          {/* Optional: Add a branded tagline */}
          <motion.p 
            className="text-zinc-400 text-sm mt-12 font-light tracking-widest"
            initial={{ opacity: 0, y: 10 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: 0.5, duration: 0.8 }
            }}
          >
            THINGS I BUILT
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Wrap the app content to access the useContent hook
const AppContent = () => {
  return (
    <>
      <LoadingOverlay />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/thoughts" element={<ThoughtsPage />} />
          <Route path="/thoughts/:slug" element={<BlogPost />} />
          <Route path="/projects/:slug" element={<BlogPost />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/blog" element={<Navigate to="/thoughts" replace />} />
          <Route path="/blog/:slug" element={<BlogSlugRedirect />} />
          <Route path="/examples" element={<ExamplePage />} />
          
          {/* Protected admin routes */}
          <Route element={<ProtectedRoute redirectPath="/login" />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>
          
          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <AppContent />
      </ContentProvider>
    </AuthProvider>
  );
}

export default App;
