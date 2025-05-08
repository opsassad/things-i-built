import { motion } from "framer-motion";
import { useState, useEffect } from "react";

// Format year only for timeline
const formatYear = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.getFullYear().toString();
  } catch {
    return '';
  }
};

// Format year and month
const formatYearMonth = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${month} ${year}`;
  } catch {
    return '';
  }
};

interface TimelineProps {
  posts: Array<{
    id: string;
    date?: string;
    createdAt?: string;
    title: string; // Not used in the component but included for type completeness
    [key: string]: any; // Allow other properties
  }>;
  activePostId: string | null;
  onTimelineItemClick: (postId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
  posts,
  activePostId,
  onTimelineItemClick
}) => {
  // Sort posts by date (newest first)
  const sortedPosts = [...posts].sort((a, b) => {
    return new Date(b.date || b.createdAt || '').getTime() - new Date(a.date || a.createdAt || '').getTime();
  });
  
  // Get unique year-month combinations for timeline
  const yearMonths = [...new Set(
    sortedPosts.map(post => formatYearMonth(post.date || post.createdAt || ''))
  )].filter(Boolean);
  
  if (yearMonths.length === 0) {
    return null;
  }
  
  return (
    <motion.div 
      className="hidden md:block sticky top-32 self-start ml-8 w-24 max-h-[calc(100vh-200px)]"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      style={{ marginBottom: '2rem' }}
    >
      <div className="relative">
        <div className="absolute left-3 top-0 bottom-0 w-px bg-zinc-200"></div>
        
        {sortedPosts.map((post) => {
          const postYearMonth = formatYearMonth(post.date || post.createdAt || '');
          const isActive = post.id === activePostId;
          
          // Only show the first post of each month in the timeline
          const isFirstOfYearMonth = sortedPosts.findIndex(p => 
            formatYearMonth(p.date || p.createdAt || '') === postYearMonth
          ) === sortedPosts.indexOf(post);
          
          if (!isFirstOfYearMonth) return null;
          
          // Extract month and year for display
          const dateObj = new Date(post.date || post.createdAt || '');
          const month = dateObj.toLocaleString('en-US', { month: 'short' });
          const year = dateObj.getFullYear();
          
          // Check if this is the first month of a new year in our sorted list
          const isFirstMonthOfYear = sortedPosts.findIndex(p => {
            const pDate = new Date(p.date || p.createdAt || '');
            return pDate.getFullYear() === year;
          }) === sortedPosts.indexOf(post);
          
          return (
            <div key={post.id} className={`relative ${isFirstMonthOfYear ? 'mt-6' : 'mt-4'}`}>
              {isFirstMonthOfYear && (
                <div className="mb-2 ml-8 font-medium text-zinc-800">
                  {year}
                </div>
              )}
              <button
                onClick={() => onTimelineItemClick(post.id)}
                className="flex items-center group"
              >
                <div 
                  className={`relative z-10 h-6 w-6 rounded-full border-2 flex items-center justify-center
                    ${isActive 
                      ? 'border-zinc-800 bg-white' 
                      : 'border-zinc-300 bg-white group-hover:border-zinc-400'
                    }`}
                >
                  <div 
                    className={`h-2 w-2 rounded-full ${isActive ? 'bg-zinc-800' : 'bg-zinc-300 group-hover:bg-zinc-400'}`}
                  ></div>
                </div>
                <div 
                  className={`ml-3 text-sm transition-colors whitespace-nowrap
                    ${isActive ? 'font-medium text-zinc-800' : 'text-zinc-400 group-hover:text-zinc-600'}`}
                >
                  {month}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Timeline; 