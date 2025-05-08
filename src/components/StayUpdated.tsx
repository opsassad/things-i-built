import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { motion } from "framer-motion";

const StayUpdated = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setMessage("Please enter a valid email address.");
      setIsSubmitting(false);
      return;
    }

    try {
      // First check if the email already exists
      const { data } = await supabase
        .from('newsletter_subscriptions')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      let error;
      
      if (data?.id) {
        // Email exists, do update
        const result = await supabase
          .from('newsletter_subscriptions')
          .update({ 
            name: name || null,
            subscription_status: 'active' 
          })
          .eq('email', email);
        
        error = result.error;
      } else {
        // New subscription, do insert
        const result = await supabase
          .from('newsletter_subscriptions')
          .insert([{
            email,
            name: name || null,
            subscription_status: 'active'
          }]);
        
        error = result.error;
      }

      if (error) {
        // Handle specific error cases
        if (error.message && error.message.includes("newsletter_subscriptions_email_key")) {
          setMessage("You're already subscribed! Thank you for your interest.");
        } else {
          throw new Error(error.message || 'Subscription failed. Please try again.');
        }
      } else {
        setMessage("Thank you for subscribing!");
        setEmail("");
        setName("");
      }

    } catch (error: any) {
      setMessage(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/40 via-pink-50/30 to-transparent"></div>
        <div className="absolute top-0 -right-1/2 w-[800px] h-[800px] bg-purple-100 rounded-full mix-blend-multiply filter blur-[80px] opacity-30 animate-blob"></div>
        <div className="absolute -bottom-1/4 left-1/4 w-[600px] h-[600px] bg-pink-100 rounded-full mix-blend-multiply filter blur-[50px] opacity-30 animate-blob animation-delay-2000"></div>
      </div>
      
      {/* Logo as design element */}
      <motion.div 
        className="absolute top-24 right-[5%] w-[260px] h-[260px] pointer-events-none"
        initial={{ opacity: 0, x: 40, rotate: -5 }}
        animate={{ opacity: 0.3, x: 0, rotate: 0 }}
        transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
        whileInView={{ scale: [1, 1.02, 1], transition: { repeat: Infinity, duration: 5 } }}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-400/10 to-pink-300/5 rounded-full filter blur-[30px]"></div>
        <img 
          src="/images/custom-logo.svg" 
          alt="" 
          className="w-full h-full object-contain drop-shadow-xl filter saturate-150 contrast-125" 
        />
      </motion.div>
      
      <motion.div 
        className="absolute -top-10 left-[5%] w-[200px] h-[200px] pointer-events-none"
        initial={{ opacity: 0, y: -30, rotate: 10 }}
        animate={{ opacity: 0.25, y: 0, rotate: 5 }}
        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
        whileInView={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 6 } }}
      >
        <div className="absolute inset-0 bg-gradient-to-bl from-blue-400/10 to-purple-300/5 rounded-full filter blur-[25px]"></div>
        <img 
          src="/images/custom-logo.svg" 
          alt="" 
          className="w-full h-full object-contain drop-shadow-xl filter saturate-150 contrast-125" 
        />
      </motion.div>

      <motion.div 
        className="absolute bottom-20 right-[20%] w-[180px] h-[180px] pointer-events-none"
        initial={{ opacity: 0, y: 30, rotate: -8 }}
        animate={{ opacity: 0.28, y: 0, rotate: -4 }}
        transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
        whileInView={{ scale: [1, 1.03, 1], transition: { repeat: Infinity, duration: 4.5 } }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/10 to-orange-300/5 rounded-full filter blur-[20px]"></div>
        <img 
          src="/images/custom-logo.svg" 
          alt="" 
          className="w-full h-full object-contain drop-shadow-xl filter saturate-150 contrast-125" 
        />
      </motion.div>

      <motion.div 
        className="absolute bottom-40 left-[15%] w-[150px] h-[150px] pointer-events-none"
        initial={{ opacity: 0, x: -30, rotate: 15 }}
        animate={{ opacity: 0.22, x: 0, rotate: 8 }}
        transition={{ duration: 1.5, delay: 0.9, ease: "easeOut" }}
        whileInView={{ scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 5.5 } }}
      >
        <div className="absolute inset-0 bg-gradient-to-tl from-indigo-400/10 to-blue-300/5 rounded-full filter blur-[18px]"></div>
        <img 
          src="/images/custom-logo.svg" 
          alt="" 
          className="w-full h-full object-contain drop-shadow-xl filter saturate-150 contrast-125" 
        />
      </motion.div>

      {/* Additional sparkle elements */}
      <motion.div
        className="absolute top-[30%] right-[30%] w-3 h-3 bg-white rounded-full shadow-glow"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.9, 0], 
          scale: [0, 1.2, 0],
          transition: { repeat: Infinity, duration: 3, delay: 1.2 }
        }}
      />
      <motion.div
        className="absolute top-[60%] right-[10%] w-2 h-2 bg-white rounded-full shadow-glow"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.8, 0], 
          scale: [0, 1, 0],
          transition: { repeat: Infinity, duration: 2.5, delay: 0.8 }
        }}
      />
      <motion.div
        className="absolute top-[20%] left-[25%] w-2 h-2 bg-white rounded-full shadow-glow"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.85, 0], 
          scale: [0, 1.1, 0],
          transition: { repeat: Infinity, duration: 3.5, delay: 2 }
        }}
      />
      <motion.div
        className="absolute top-[75%] left-[30%] w-3 h-3 bg-white rounded-full shadow-glow"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 0.9, 0], 
          scale: [0, 1.2, 0],
          transition: { repeat: Infinity, duration: 4, delay: 1.5 }
        }}
      />

      <div className="container-custom relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            {/* Logo above the heading */}
            <motion.div 
              className="relative w-32 h-32 mx-auto mb-6 bg-white/40 backdrop-blur-md rounded-full p-4 shadow-2xl"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
              whileHover={{ 
                scale: 1.05, 
                boxShadow: "0 10px 40px rgba(31, 38, 135, 0.25)",
                rotate: [0, 2, -2, 0],
                transition: { duration: 2, ease: "easeInOut", rotate: { repeat: Infinity, duration: 2, ease: "easeInOut" } }
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 to-white/10 opacity-70 mix-blend-overlay"></div>
              {/* Subtle light ring effect */}
              <div className="absolute inset-0 rounded-full border-[1px] border-white/50 -m-1 opacity-60"></div>
              <div className="absolute inset-0 rounded-full border-[3px] border-white/20 -m-3 opacity-40"></div>
              <div className="absolute inset-0 rounded-full border-[6px] border-white/10 -m-6 opacity-20"></div>
              
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-100/50 to-transparent opacity-50 mix-blend-overlay"></div>
                <img 
                  src="/images/custom-logo.svg" 
                  alt="Git & Grit Logo" 
                  className="w-[85%] h-[85%] object-contain drop-shadow-2xl filter saturate-125" 
                />
              </div>
            </motion.div>
            
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-600">
              Stay Updated
            </h2>
            <p className="text-lg text-zinc-600">
              Get exclusive insights on AI, automation, and tech trends delivered straight to your inbox.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-zinc-100/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-zinc-800">
                  What you'll receive:
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <span className="text-zinc-600">Weekly insights on emerging AI technologies</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <span className="text-zinc-600">Practical automation strategies and tutorials</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center mt-1">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                    <span className="text-zinc-600">Early access to new projects and tools</span>
                  </li>
                </ul>
              </div>

              <div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                      Email address
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      placeholder="Your name"
                      className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-200 transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 group disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Subscribing..." : "Subscribe to newsletter"}
                    {!isSubmitting && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
                <p className="mt-4 text-sm text-zinc-500 text-center">
                  {message ? message : "No spam, unsubscribe at any time."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StayUpdated; 