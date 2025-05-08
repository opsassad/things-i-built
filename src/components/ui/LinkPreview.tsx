import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkPreviewProps {
  href: string;
  children: React.ReactNode;
}

export const LinkPreview = ({ href, children }: LinkPreviewProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewData, setPreviewData] = useState<{
    title: string;
    description: string;
    image: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMouseEnter = async () => {
    setIsHovered(true);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(href)}`);
      const data = await response.json();

      if (data.status === 'success') {
        setPreviewData({
          title: data.data.title || '',
          description: data.data.description || '',
          image: data.data.image?.url || null
        });
      } else {
        setError('Could not load preview');
      }
    } catch (err) {
      setError('Error loading preview');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:text-primary/80 underline decoration-primary/30 hover:decoration-primary/60 transition-all duration-200"
      >
        {children}
      </a>
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2"
          >
            <div className="w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              {isLoading ? (
                <div className="p-4">
                  <div className="animate-pulse space-y-2">
                    <div className="h-32 bg-gray-200 rounded-md w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : error ? (
                <div className="p-4">
                  <p className="text-gray-500">{error}</p>
                </div>
              ) : previewData ? (
                <>
                  {previewData.image && (
                    <div className="w-full h-32 bg-gray-100">
                      <img
                        src={previewData.image}
                        alt={previewData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {previewData.title}
                    </h4>
                    {previewData.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {previewData.description}
                      </p>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 