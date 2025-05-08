import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PrivacyPolicy = () => {
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
            <h1 className="text-4xl font-display font-bold mb-8">Privacy Policy</h1>
            
            <p className="text-lg text-zinc-600 mb-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2>Introduction</h2>
              <p>
                This Privacy Policy describes how Things I Built ("we," "us," or "our") collects, uses, 
                and protects your personal information when you use our website and services.
              </p>
            </section>

            <section className="mb-8">
              <h2>Information We Collect</h2>
              <h3>Information You Provide</h3>
              <p>We may collect the following information when you use our services:</p>
              <ul>
                <li>Name and email address when you subscribe to our newsletter</li>
                <li>Comments and feedback you provide on blog posts</li>
                <li>Messages you send through our contact form</li>
                <li>Any other information you choose to provide</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>We automatically collect certain information when you visit our website:</p>
              <ul>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
                <li>Usage data and analytics</li>
                <li>Cookies and similar technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>How We Use Your Information</h2>
              <p>We use the collected information for the following purposes:</p>
              <ul>
                <li>Provide and maintain our services</li>
                <li>Send you newsletters and updates</li>
                <li>Respond to your comments and inquiries</li>
                <li>Improve our website and services</li>
                <li>Analyze usage patterns and trends</li>
                <li>Protect against unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>Data Protection</h2>
              <p>
                We implement appropriate security measures to protect your personal information 
                against unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section className="mb-8">
              <h2>Third-Party Services</h2>
              <p>
                We may use third-party services that collect, monitor, and analyze data. 
                These services have their own privacy policies regarding data handling.
              </p>
            </section>

            <section className="mb-8">
              <h2>Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to data processing</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2>Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any 
                changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2>Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us at{" "}
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

export default PrivacyPolicy;
