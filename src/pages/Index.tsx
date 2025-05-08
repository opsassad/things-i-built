import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import BlogPreview from "../components/BlogPreview";
import StayUpdated from "../components/StayUpdated";
import Footer from "../components/Footer";
import { useEffect, useState } from "react";
import { useContent } from "../context/ContentContext";
import { testVisitorTracking } from "../lib/visitorTracking";

// Define a constant for the home page ID
// IMPORTANT: This ID must match an entry in the blog_posts table due to foreign key constraint
// We've added several standard pages including 'home', 'about', 'contact', etc.
const HOME_PAGE_ID = "home";

const Index = () => {
  const { trackPostVisit } = useContent();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failure'>('idle');

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

  // Handle click on test button
  const handleTestTracking = async () => {
    setTestStatus('testing');
    try {
      console.log("Running manual test for visitor tracking");
      const result = await testVisitorTracking();
      setTestStatus(result ? 'success' : 'failure');
      console.log("Manual test result:", result);
    } catch (error) {
      console.error("Error in manual test:", error);
      setTestStatus('failure');
    }
  };

  // Function to render test button
  const renderTestButton = () => {
    let buttonText = 'Test Visitor Tracking';
    let buttonColor = 'bg-blue-500 hover:bg-blue-600';
    
    if (testStatus === 'testing') {
      buttonText = 'Testing...';
      buttonColor = 'bg-yellow-500';
    } else if (testStatus === 'success') {
      buttonText = 'Test Successful ✓';
      buttonColor = 'bg-green-500';
    } else if (testStatus === 'failure') {
      buttonText = 'Test Failed ✗';
      buttonColor = 'bg-red-500';
    }
    
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button 
          onClick={handleTestTracking}
          disabled={testStatus === 'testing'}
          className={`${buttonColor} text-white font-semibold py-2 px-4 rounded shadow-lg transition-colors`}
        >
          {buttonText}
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <BlogPreview />
        <StayUpdated />
        {renderTestButton()}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
