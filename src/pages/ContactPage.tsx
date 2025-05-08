import { useState, useEffect } from "react";
import { useToast } from "../hooks/use-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabaseClient";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Terminal } from "lucide-react";
import { useContent } from "../context/ContentContext";

const ContactPage = () => {
  const { toast } = useToast();
  const { trackPostVisit } = useContent();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmittedContactLocally, setHasSubmittedContactLocally] = useState(false);

  // Track visit to contact page
  useEffect(() => {
    const key = `visit_tracked_contact`;
    if (!sessionStorage.getItem(key)) {
      trackPostVisit('contact')
        .then((success) => {
          if (success) {
            console.log(`ContactPage: Successfully tracked visit for contact`);
            sessionStorage.setItem(key, 'true');
          } else {
            console.error(`ContactPage: Failed to track visit for contact. Check console for details.`);
          }
        })
        .catch((error) => {
          console.error('ContactPage: Error tracking contact page visit:', error);
        });
    } else {
      console.log(`ContactPage: Visit already tracked for contact in this session`);
    }
  }, [trackPostVisit]);

  useEffect(() => {
    if (localStorage.getItem('hasSubmittedContact') === 'true') {
        setHasSubmittedContactLocally(true);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasSubmittedContactLocally) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([formData]);

      if (error) {
        throw new Error(error.message || 'Failed to send message. Please try again.');
      }
      
      localStorage.setItem('hasSubmittedContact', 'true');
      setHasSubmittedContactLocally(true);

      toast({
        title: "Message sent",
        description: "Thank you for your message. I'll get back to you soon.",
      });
      
    } catch (error: any) {
      console.error("Contact form submission error:", error);
      toast({
        title: "Error",
        description: error.message || "Could not send message. Please try again later.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-24">
        <div className="max-w-2xl mx-auto px-6">
          <h1 className="text-3xl font-light mb-12 text-zinc-800">Contact</h1>
          
          {hasSubmittedContactLocally ? (
             <Alert className="mb-8 border-green-300 bg-green-50/50 text-green-800">
               <Terminal className="h-4 w-4 !text-green-600" />
               <AlertTitle className="text-green-800 font-semibold">Message Sent!</AlertTitle>
               <AlertDescription className="text-green-700">
                 Thank you, I have received your message and will get back to you soon.
               </AlertDescription>
             </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-sm text-zinc-600 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-400 focus:ring-0 text-zinc-800"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm text-zinc-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-400 focus:ring-0 text-zinc-800"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm text-zinc-600 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-0 py-3 bg-transparent border-0 border-b border-zinc-200 focus:border-zinc-400 focus:ring-0 text-zinc-800 resize-none"
                  placeholder="What's on your mind?"
                ></textarea>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || hasSubmittedContactLocally}
                  className="text-zinc-800 hover:text-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Sending..." : "Send message"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-24 text-zinc-500 text-sm">
            <p>You can also reach me at <a href="mailto:contact.mdassaduzzaman@gmail.com" className="text-zinc-800 hover:text-zinc-600 transition-colors">contact.mdassaduzzaman@gmail.com</a></p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
