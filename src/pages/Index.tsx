import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BlogPreview from "../components/BlogPreview";
import StayUpdated from "../components/StayUpdated";
import Footer from "../components/Footer";
import { useEffect } from "react";
import { useContent } from "../context/ContentContext";

// Define a constant for the home page ID
// IMPORTANT: This ID must match an entry in the blog_posts table due to foreign key constraint
// We've added several standard pages including 'home', 'about', 'contact', etc.
const HOME_PAGE_ID = "home";

const Index = () => {
  const { trackPostVisit } = useContent();

  // Track visit to landing page
  useEffect(() => {
    console.log("Index page mounted - Attempting to track visit");
    const key = `visit_tracked_${HOME_PAGE_ID}`;
    
    if (!sessionStorage.getItem(key)) {
      console.log(`Tracking visit for ${HOME_PAGE_ID} - key not found in sessionStorage`);
      trackPostVisit(HOME_PAGE_ID)
        .then((success) => {
          if (success) {
            console.log(`Successfully tracked visit for ${HOME_PAGE_ID}`);
            sessionStorage.setItem(key, 'true');
          } else {
            console.error(`Failed to track visit for ${HOME_PAGE_ID}. Check console for details.`);
          }
        })
        .catch((error) => {
          console.error('Error tracking home page visit:', error);
        });
    } else {
      console.log(`Visit already tracked for ${HOME_PAGE_ID} in this session - skipping`);
    }
  }, [trackPostVisit]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <BlogPreview />
        <StayUpdated />
      </main>
      <Footer />
    </div>
  );
};
// This is the landing page
export default Index;


