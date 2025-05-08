import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withLink?: boolean;
  animated?: boolean;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  withLink = true, 
  animated = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  // Animation variants for the logo
  const containerVariants = {
    hover: {
      scale: 1.05,
      filter: "drop-shadow(0 0 8px rgba(0, 0, 0, 0.2))",
      transition: { 
        duration: 0.3,
        type: "spring", 
        stiffness: 300 
      }
    }
  };

  // For a more custom animation, we could create separate components for each triangle
  // and animate them separately, but for simplicity we'll use the SVG directly
  const LogoImage = () => (
    <motion.div 
      className={`relative ${sizeClasses[size]} ${className}`}
      variants={animated ? containerVariants : undefined}
      whileHover={animated ? "hover" : undefined}
      initial="initial"
      transition={{ duration: 0.3 }}
    >
      <img 
        src="/images/custom-logo.svg" 
        alt="Git & Grit Logo" 
        className="w-full h-full object-contain" 
      />
    </motion.div>
  );

  // Add a tooltip to display the brand name on hover (optional)
  const LogoWithTooltip = () => (
    <div className="group relative flex items-center">
      <LogoImage />
      {withLink && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          Git & Grit
        </div>
      )}
    </div>
  );

  if (withLink) {
    return (
      <Link to="/" className="flex items-center justify-center" aria-label="Home">
        <LogoWithTooltip />
      </Link>
    );
  }

  return <LogoWithTooltip />;
};

export default Logo; 