import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useContent } from "../context/ContentContext";
import { useEffect } from "react";

const AboutPage = () => {
  const { homePageContent, trackPostVisit } = useContent();

  // Track visit to about page
  useEffect(() => {
    const key = `visit_tracked_about`;
    if (!sessionStorage.getItem(key)) {
      trackPostVisit('about')
        .then((success) => {
          if (success) {
            console.log(`AboutPage: Successfully tracked visit for about`);
            sessionStorage.setItem(key, 'true');
          } else {
            console.error(`AboutPage: Failed to track visit for about. Check console for details.`);
          }
        })
        .catch((error) => {
          console.error('AboutPage: Error tracking about page visit:', error);
        });
    } else {
      console.log(`AboutPage: Visit already tracked for about in this session`);
    }
  }, [trackPostVisit]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-24 flex items-center">
        <div className="max-w-2xl mx-auto px-6 w-full">
          <div className="min-h-[60vh] flex flex-col justify-between">
            <div>
              <h1 className="text-3xl font-light mb-20 text-zinc-800">About</h1>
              
              <div className="space-y-6 text-zinc-600 text-lg leading-relaxed">
                {homePageContent.aboutText.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-24 pt-12 border-t border-zinc-100">
              <Link
                to="/contact"
                className="inline-flex items-center text-zinc-800 hover:text-zinc-600 transition-colors"
              >
                Get in touch
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AboutPage;
