import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const TermsOfService = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-24">
        <div className="container-custom">
          <Link 
            to="/"
            className="inline-flex items-center text-zinc-600 hover:text-zinc-900 transition-colors mb-8"
          >
            <ArrowLeft size={16} className="mr-1" />
            <span>Back to Home</span>
          </Link>

          <div className="prose prose-zinc max-w-3xl mx-auto">
            <h1 className="text-4xl font-display font-bold mb-8">Terms of Service</h1>
            
            <p className="text-lg text-zinc-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2>Agreement to Terms</h2>
              <p>
                By accessing and using Assad's AI Canvas website and services, you agree to be bound 
                by these Terms of Service. If you disagree with any part of these terms, you may not 
                access our services.
              </p>
            </section>

            <section className="mb-8">
              <h2>Intellectual Property</h2>
              <p>
                The content on our website, including text, graphics, logos, images, and software, 
                is the property of Things I Built and is protected by intellectual property laws.
              </p>
              <h3>Content Usage</h3>
              <ul>
                <li>Content is for personal, non-commercial use only</li>
                <li>Attribution is required when sharing or referencing our content</li>
                <li>Modification or redistribution requires written permission</li>
                <li>Commercial use of our content is prohibited without explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>User Responsibilities</h2>
              <p>When using our services, you agree to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account</li>
                <li>Not engage in any unlawful or prohibited activities</li>
                <li>Respect the rights of other users</li>
                <li>Not attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>Content Guidelines</h2>
              <p>When posting comments or interacting with our services, you must not:</p>
              <ul>
                <li>Post harmful, offensive, or inappropriate content</li>
                <li>Impersonate others or misrepresent your identity</li>
                <li>Spam or post promotional content without permission</li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>Disclaimer of Warranties</h2>
              <p>
                Our services are provided "as is" without any warranties, expressed or implied. 
                We do not guarantee that our services will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2>Limitation of Liability</h2>
              <p>
                Things I Built shall not be liable for any indirect, incidental, special, 
                consequential, or punitive damages resulting from your use or inability to use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2>Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any 
                changes by updating the "Last updated" date of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2>Governing Law</h2>
              <p>
                These terms shall be governed by and construed in accordance with the laws of the 
                jurisdiction in which Things I Built operates, without regard to its conflict of 
                law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2>Contact Information</h2>
              <p>
                For any questions about these Terms of Service, please contact us through{" "}
                <Link to="/contact" className="text-blue-600 hover:text-blue-800">
                  our contact page
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;
