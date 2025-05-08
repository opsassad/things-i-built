import { useState } from "react";
import { ArrowRight } from "lucide-react";

const EmailCapture = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setError("");
    
    // Simulate submission (replace with actual API call)
    setTimeout(() => {
      setSubmitted(true);
      setEmail("");
    }, 500);
  };

  return (
    <section className="bg-zinc-100 py-16">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto bg-white rounded-xl border border-zinc-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-display font-bold mb-3">Stay Updated</h2>
            <p className="text-zinc-600">
              Subscribe to receive updates on new projects, insights, and technology trends.
            </p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <p className="text-lg font-medium text-zinc-700 mb-2">Thank you for subscribing!</p>
              <p className="text-zinc-500">You'll be the first to know about new content and updates.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-grow px-4 py-3 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-400"
                    aria-label="Email address"
                  />
                  <button
                    type="submit"
                    className="bg-zinc-700 hover:bg-zinc-800 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    Subscribe
                    <ArrowRight size={18} />
                  </button>
                </div>
                {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
              </div>
              <p className="text-center text-xs text-zinc-500 mt-3">
                I respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default EmailCapture;
