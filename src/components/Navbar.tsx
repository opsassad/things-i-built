import { useState, useEffect } from "react";
import { Menu, X, Home, Rocket, PenTool, User, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { motion } from "framer-motion";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Determine if we've scrolled enough to change navbar appearance
      if (currentScrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      // Determine scroll direction and hide/show navbar
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        // Scrolling down & past threshold - hide navbar
        setHidden(true);
      } else {
        // Scrolling up or at top - show navbar
        setHidden(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/projects", label: "Git & Grit", icon: Rocket },
    { path: "/thoughts", label: "Thoughts", icon: PenTool },
    { path: "/about", label: "About", icon: User },
    { path: "/contact", label: "Contact", icon: Mail },
  ];

  return (
    <nav
      className={cn(
        "fixed w-full z-50 transition-all duration-300",
        scrolled 
          ? "py-2" 
          : "py-4",
        "flex justify-center items-center px-4",
        hidden ? "-translate-y-full" : "translate-y-0"
      )}
    >
      {/* Glass Container */}
      <div
        className={cn(
          "rounded-full transition-all duration-300",
          scrolled
            ? "bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/20"
            : "bg-white/50 backdrop-blur-sm"
        )}
      >
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200",
                  isActive(item.path)
                    ? "bg-gray-900 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                )}
              >
                <Icon size={16} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "md:hidden p-2 rounded-full transition-all duration-200",
            isOpen ? "bg-gray-100" : ""
          )}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 md:hidden">
          <div className="mx-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/20 overflow-hidden">
            <div className="p-2 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                      isActive(item.path)
                        ? "bg-gray-900 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
