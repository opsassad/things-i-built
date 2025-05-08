import { Github, Twitter, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useContent } from "../context/ContentContext";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { siteSettings } = useContent();
  
  const socialLinks = [
    {
      icon: Github,
      href: siteSettings.githubUrl,
      label: "GitHub"
    },
    {
      icon: Twitter,
      href: siteSettings.twitterUrl,
      label: "Twitter"
    },
    {
      icon: Linkedin,
      href: siteSettings.linkedinUrl,
      label: "LinkedIn"
    },
    {
      icon: Mail,
      href: "mailto:contact.mdassaduzzaman@gmail.com",
      label: "Email"
    }
  ];

  const footerLinks = [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Contact", href: "/contact" }
  ];

  return (
    <footer className="border-t border-zinc-100 bg-zinc-50/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-12">
          {/* Main footer content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Brand section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Logo size="sm" withLink={true} animated={true} />
                <h3 className="text-lg font-display font-semibold text-zinc-800">
                  Things I Built
                </h3>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                Exploring the intersection of AI, automation, and human creativity through thoughtful articles and innovative projects.
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-800">Quick Links</h4>
              <ul className="space-y-3">
                {footerLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social links */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-800">Connect</h4>
              <div className="flex gap-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-zinc-900 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-6 border-t border-zinc-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-zinc-500">
                © {currentYear} Things I Built. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link
                  to="/privacy-policy"
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Privacy Policy
                </Link>
                <Link
                  to="/terms-of-service"
                  className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
