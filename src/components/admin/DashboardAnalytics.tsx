import { useEffect, useMemo, useState } from "react";
import { useContent } from "../../context/ContentContext";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, PieChart, Pie, Cell, BarChart, Bar, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CalendarDays, Eye, ThumbsUp, TrendingUp, BookOpen, FileText, Briefcase, Clock, ChevronRight, ArrowUpRight, BarChart3, Pencil, Star, Filter, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { cn } from "../../lib/utils";
import { RatingActivity } from "./RatingActivity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format, isValid } from "date-fns";
import { Input } from "../ui/input";

// Helper to safely format a date or return fallback
const formatDateSafe = (date: Date | undefined, formatStr: string = "MMM d, y"): string => {
  if (!date || !isValid(date)) return "Date Range";
  try {
    return format(date, formatStr);
  } catch (e) {
    console.error("Error formatting date:", e);
    return "Invalid Date";
  }
};

// Helper to create a normalized Date object for consistent comparison
const toDate = (value: any): Date | undefined => {
  if (!value) return undefined;
  try {
    const date = new Date(value);
    if (!isValid(date)) return undefined;
    
    // Normalize to start of day for consistent comparison (removes time component)
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  } catch (e) {
    console.error("Invalid date value:", value);
    return undefined;
  }
};

// Improved DateRangePicker component with better UX and stability
const DateRangePicker = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dateState, setDateState] = useState(value);
  
  // Sync with parent state
  useEffect(() => {
    if (JSON.stringify(dateState) !== JSON.stringify(value)) {
      setDateState(value);
    }
  }, [value]);
  
  // Handle internal date changes with improved logic
  const handleSelect = (range) => {
    // Normalize dates to remove time component for consistency
    const normalizedRange = {
      from: range.from ? toDate(range.from) : undefined,
      to: range.to ? toDate(range.to) : undefined,
    };
    
    setDateState(normalizedRange);
    onChange(normalizedRange);
    
    // Close when complete range selected or cleared completely
    if ((normalizedRange.from && normalizedRange.to) || 
        (!normalizedRange.from && !normalizedRange.to)) {
      // Small delay to prevent UI glitches
      setTimeout(() => setIsOpen(false), 50);
    }
  };
  
  // Handle the case of manual dismissal
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    // If closing without selecting both dates, reset to previous complete selection
    if (!open && dateState.from && !dateState.to) {
      setDateState(value);
      onChange(value);
    }
  };
  
  const displayText = (() => {
    if (dateState.from && dateState.to) {
      return `${formatDateSafe(dateState.from)} - ${formatDateSafe(dateState.to)}`;
    } else if (dateState.from) {
      return formatDateSafe(dateState.from);
    } else {
      return "Date Range";
    }
  })();
  
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          <span>{displayText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-md" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={dateState.from || new Date()}
          selected={{ 
            from: dateState.from, 
            to: dateState.to 
          }}
          onSelect={handleSelect}
          className="bg-white dark:bg-zinc-800"
          classNames={{
            day_selected: "bg-zinc-900 text-white hover:bg-zinc-900 hover:text-white focus:bg-zinc-900 focus:text-white dark:bg-zinc-100 dark:text-zinc-900",
            day_range_middle: "aria-selected:bg-zinc-100 aria-selected:text-zinc-900 dark:aria-selected:bg-zinc-800 dark:aria-selected:text-zinc-100",
            day_today: "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100",
          }}
          disabled={{
            before: new Date(2000, 0, 1) // Prevent selecting dates before 2000
          }}
        />
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              const emptyRange = { from: undefined, to: undefined };
              handleSelect(emptyRange);
            }}
          >
            Clear
          </Button>
          <Button 
            size="sm"
            onClick={() => {
              // Set to last 30 days
              const to = toDate(new Date());
              const from = new Date();
              from.setDate(from.getDate() - 30);
              handleSelect({ from: toDate(from), to });
            }}
          >
            Last 30 days
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DashboardAnalytics = () => {
  const { blogPosts, popularContent, recentActivity, visitorStats } = useContent();
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Filter states
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: undefined,
    to: undefined
  });
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [contentTypeFilter, setContentTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewFilter, setViewFilter] = useState<string>("all");
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>("all");

  // Filter data based on selected filters with improved date comparison
  const filteredBlogPosts = useMemo(() => {
    return blogPosts.filter(post => {
      // Date filter with normalized comparison
      if (dateRange.from || dateRange.to) {
        const postDate = toDate(post.createdAt || post.date || "");
        
        // Skip posts without valid dates when filtering by date
        if (!postDate) return false;
        
        // Compare using normalized dates (removing time components)
        if (dateRange.from && postDate < dateRange.from) return false;
        if (dateRange.to) {
          // Include the entire "to" day by comparing with next day at midnight
          const nextDay = new Date(dateRange.to);
          nextDay.setDate(nextDay.getDate() + 1);
          if (postDate >= nextDay) return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && post.category !== categoryFilter) return false;

      // Search query
      if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [blogPosts, dateRange, categoryFilter, searchQuery]);

  // Filter activities with the same improved date comparison
  const filteredActivities = useMemo(() => {
    return recentActivity.filter(activity => {
      // Date filter with normalized comparison
      if (dateRange.from || dateRange.to) {
        const activityDate = toDate(activity.time);
        
        // Skip activities without valid dates when filtering by date
        if (!activityDate) return false;
        
        // Compare using normalized dates (removing time components)
        if (dateRange.from && activityDate < dateRange.from) return false;
        if (dateRange.to) {
          // Include the entire "to" day by comparing with next day at midnight
          const nextDay = new Date(dateRange.to);
          nextDay.setDate(nextDay.getDate() + 1);
          if (activityDate >= nextDay) return false;
        }
      }

      // Activity type filter
      if (activityTypeFilter !== "all" && activity.type !== activityTypeFilter) return false;

      // Search query
      if (searchQuery && !activity.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [recentActivity, dateRange, activityTypeFilter, searchQuery]);
  
  // Filter popular content
  const filteredPopularContent = useMemo(() => {
    return popularContent.filter(item => {
      // Category filter
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      return true;
    });
  }, [popularContent, categoryFilter, searchQuery]);

  // Create filtered visitor stats
  const filteredVisitorStats = useMemo(() => {
    if (!visitorStats) return null;
    
    // Create a copy of the visitor stats
    const filteredStats = { ...visitorStats };
    
    // Filter postVisits if they exist
    if (filteredStats.postVisits) {
      const filteredPostVisits: Record<string, { total: number; unique: number }> = {};
      
      Object.entries(filteredStats.postVisits).forEach(([postId, stats]) => {
        // Find the corresponding post
        const post = blogPosts.find(p => p.id === postId);
        
        // Skip if post doesn't exist
        if (!post) return;
        
        // Apply category filter
        if (categoryFilter !== "all" && post.category !== categoryFilter) return;
        
        // Apply search filter
        if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return;
        
        // Apply date filter
        if (dateRange.from || dateRange.to) {
          const postDate = toDate(post.createdAt || post.date || "");
          if (dateRange.from && postDate && postDate < dateRange.from) return;
          if (dateRange.to && postDate && postDate > dateRange.to) return;
        }
        
        // Include this post's stats
        filteredPostVisits[postId] = stats;
      });
      
      // Update the filtered stats
      filteredStats.postVisits = filteredPostVisits;
      
      // Recalculate totals
      filteredStats.totalVisits = Object.values(filteredPostVisits).reduce((sum, stats) => sum + stats.total, 0);
      filteredStats.uniqueVisitors = Object.values(filteredPostVisits).reduce((sum, stats) => sum + stats.unique, 0);
      
      // Unique IP addresses might not be recalculated perfectly since we don't have the raw data
      // Just use the ratio if it exists
      if (visitorStats.uniqueIpAddresses && visitorStats.uniqueVisitors) {
        const ratio = visitorStats.uniqueIpAddresses / visitorStats.uniqueVisitors;
        filteredStats.uniqueIpAddresses = Math.round(filteredStats.uniqueVisitors * ratio);
      }
    }
    
    return filteredStats;
  }, [visitorStats, blogPosts, dateRange, categoryFilter, searchQuery]);

  // Calculate analytics from filtered data
  const analytics = useMemo(() => {
    // Count published posts and drafts from filtered data
    const publishedPosts = filteredBlogPosts.filter(post => !post.isDraft && post.status === 'published');
    const draftPosts = filteredBlogPosts.filter(post => post.isDraft || post.status === 'draft');
    
    // Count projects from filtered data
    const projects = filteredBlogPosts.filter(post => post.category === 'Project' && !post.isDraft && post.status === 'published');
    
    // Calculate average rating and total ratings from filtered data
    const totalRatings = filteredBlogPosts.reduce((sum, post) => sum + (post.totalRatings || 0), 0);
    const weightedRatings = filteredBlogPosts.reduce((sum, post) => sum + ((post.averageRating || 0) * (post.totalRatings || 0)), 0);
    const overallRating = totalRatings > 0 ? weightedRatings / totalRatings : 0;
    
    return {
      publishedPosts: publishedPosts.length,
      draftPosts: draftPosts.length,
      projects: projects.length,
      totalRatings,
      overallRating,
      uniqueVisitors: filteredVisitorStats?.uniqueVisitors || 0,
      totalVisits: filteredVisitorStats?.totalVisits || 0,
      uniqueIpAddresses: filteredVisitorStats?.uniqueIpAddresses || 0,
    };
  }, [filteredBlogPosts, filteredVisitorStats]);

  // Data for ratings chart (last 7 days) using filtered data
  const ratingChartData = useMemo(() => {
    // Get published posts with ratings from filtered data
    const ratedPosts = filteredBlogPosts
      .filter(post => !post.isDraft && post.status === 'published' && post.totalRatings > 0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 7);
    
    // Create data points with different dates to show a trend
    return ratedPosts.map((post, index) => {
      // Create dates spanning the last week (one day apart)
      const date = new Date();
      date.setDate(date.getDate() - (ratedPosts.length - 1 - index));
      
      return {
        name: post.title,
        rating: post.averageRating || 0,
        total: post.totalRatings || 0,
        date: date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };
    });
  }, [filteredBlogPosts]);

  // Data for pie chart (content by category) using filtered data
  const categoryChartData = useMemo(() => {
    const categories = filteredBlogPosts.reduce((acc, post) => {
      if (!post.isDraft && post.status === 'published') {
        const category = post.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredBlogPosts]);

  // Create data for visitor chart using filtered data
  const visitorChartData = useMemo(() => {
    if (!filteredVisitorStats?.postVisits) return [];
    
    // Define system pages
    const systemPageIds = ['home', 'about', 'contact', 'blog', 'projects', 'test-post', 'website-landing'];
    
    // Get top posts by unique visitors
    return Object.entries(filteredVisitorStats.postVisits)
      .map(([postId, stats]) => {
        const post = blogPosts.find(p => p.id === postId);
        const isSystemPage = systemPageIds.includes(postId);
        
        // Get a display title for system pages
        const displayTitle = isSystemPage 
          ? postId.charAt(0).toUpperCase() + postId.slice(1) + ' Page'
          : post?.title || postId;
        
        return {
          name: displayTitle,
          unique: stats.unique,
          total: stats.total,
          type: isSystemPage ? 'system' : post?.category === 'Project' || post?.id?.startsWith('project/') ? 'project' : 'blog'
        };
      })
      .sort((a, b) => b.unique - a.unique)
      .slice(0, 5);
  }, [filteredVisitorStats, blogPosts]);

  // Calculate per-post analytics using filtered data
  const postAnalytics = useMemo(() => {
    if (!filteredBlogPosts || !filteredVisitorStats?.postVisits) return [];

    // Define system pages
    const systemPageIds = ['home', 'about', 'contact', 'blog', 'projects', 'test-post', 'website-landing'];

    return filteredBlogPosts
      .filter(post => !post.isDraft && post.status === 'published')
      .map(post => {
        const visits = filteredVisitorStats.postVisits[post.id] || { total: 0, unique: 0 };
        // Use the unique visitors for each post as a fallback for unique IPs
        // This assumes each visitor has a unique IP address
        const uniqueIps = visits.unique || 0;
        
        // Determine if this is a system page
        const isSystemPage = systemPageIds.includes(post.id);
        
        // Get a display title for system pages
        const displayTitle = isSystemPage 
          ? post.id.charAt(0).toUpperCase() + post.id.slice(1) + ' Page'
          : post.title;
        
        return {
          id: post.id,
          title: displayTitle,
          category: post.category || 'Uncategorized',
          totalVisits: visits.total,
          uniqueVisitors: visits.unique,
          uniqueIps: uniqueIps,
          averageRating: post.averageRating || 0,
          totalRatings: post.totalRatings || 0,
          engagementRate: visits.unique > 0 ? (visits.total / visits.unique).toFixed(2) : '0',
          isProject: post.category === 'Project' || post.id.startsWith('project/'),
          isSystemPage: isSystemPage
        };
      })
      .sort((a, b) => b.uniqueVisitors - a.uniqueVisitors);
  }, [filteredBlogPosts, filteredVisitorStats]);

  // Apply additional content type filter to the post analytics
  const filteredPostAnalytics = useMemo(() => {
    if (contentTypeFilter === "all") return postAnalytics;
    
    return postAnalytics.filter(post => {
      if (contentTypeFilter === "system") return post.isSystemPage;
      if (contentTypeFilter === "project") return post.isProject && !post.isSystemPage;
      if (contentTypeFilter === "blog") return !post.isProject && !post.isSystemPage;
      return true;
    });
  }, [postAnalytics, contentTypeFilter]);

  // Separate projects, blog posts, and system pages
  const projectAnalytics = useMemo(() => 
    postAnalytics.filter(post => post.isProject && !post.isSystemPage),
    [postAnalytics]
  );

  const blogAnalytics = useMemo(() => 
    postAnalytics.filter(post => !post.isProject && !post.isSystemPage),
    [postAnalytics]
  );
  
  const systemPageAnalytics = useMemo(() =>
    postAnalytics.filter(post => post.isSystemPage),
    [postAnalytics]
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Categories for filter dropdown
  const categories = useMemo(() => {
    const uniqueCategories = new Set(blogPosts.map(post => post.category || "Uncategorized"));
    return Array.from(uniqueCategories);
  }, [blogPosts]);

  // Filter component for date range
  const DateRangeFilter = () => (
    <div className="flex flex-wrap gap-2 mb-4">
      <DateRangePicker 
        value={dateRange} 
        onChange={setDateRange} 
      />

      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {activeTab === "content" && (
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50">
            <SelectValue placeholder="All Content Types" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="system">System Pages</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
            <SelectItem value="blog">Blog Posts</SelectItem>
          </SelectContent>
        </Select>
      )}

      <div className="relative w-full md:w-auto flex-1 md:flex-none md:min-w-[200px]">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50"
        />
      </div>

      {activeTab === "analytics" && (
        <Select value={viewFilter} onValueChange={setViewFilter}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            <SelectItem value="all">All Views</SelectItem>
            <SelectItem value="unique">Unique Visitors</SelectItem>
            <SelectItem value="total">Total Visits</SelectItem>
          </SelectContent>
        </Select>
      )}

      {activeTab === "activity" && (
        <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
          <SelectTrigger className="w-[150px] bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50">
            <SelectValue placeholder="Activity Type" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="publish">Published</SelectItem>
            <SelectItem value="edit">Edited</SelectItem>
            <SelectItem value="view">Views</SelectItem>
          </SelectContent>
        </Select>
      )}

      {(dateRange.from || dateRange.to || categoryFilter !== "all" || searchQuery || 
        contentTypeFilter !== "all" ||
        (activeTab === "analytics" && viewFilter !== "all") || 
        (activeTab === "activity" && activityTypeFilter !== "all")) && (
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-500 bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50"
          onClick={() => {
            setDateRange({ from: undefined, to: undefined });
            setCategoryFilter("all");
            setContentTypeFilter("all");
            setSearchQuery("");
            setViewFilter("all");
            setActivityTypeFilter("all");
          }}
        >
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900">
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900">
            Content Analytics
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900">
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-zinc-900 data-[state=active]:text-white dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900">
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <DateRangeFilter />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Stats Cards */}
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Published Posts
                </CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md">
                  <FileText className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.publishedPosts}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {analytics.draftPosts > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{analytics.draftPosts}</span> drafts pending
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Projects
                </CardTitle>
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-md">
                  <Briefcase className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.projects}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  <span className="flex items-center gap-1">
                    <span>{Math.round((analytics.projects / (analytics.publishedPosts || 1)) * 100)}%</span> of published content
                  </span>
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Total Ratings
                </CardTitle>
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-md">
                  <Eye className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.totalRatings.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {analytics.publishedPosts > 0 && (
                    <span className="flex items-center gap-1">
                      <span>{Math.round(analytics.totalRatings / analytics.publishedPosts)}</span> avg. per post
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Overall Rating
                </CardTitle>
                <div className="p-2 bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-md">
                  <ThumbsUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.overallRating.toFixed(2)}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {analytics.totalRatings > 0 && (
                    <span className="flex items-center gap-1">
                      <span>{((analytics.overallRating * 100).toFixed(1))}%</span> engagement rate
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Unique Visitors
                </CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md">
                  <Eye className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.uniqueVisitors.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {analytics.publishedPosts > 0 && (
                    <span className="flex items-center gap-1">
                      <span>{Math.round(analytics.uniqueVisitors / analytics.publishedPosts)}</span> avg. per post
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm hover:shadow-md transition-shadow rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  Unique IP Addresses
                </CardTitle>
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 rounded-md">
                  <Eye className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{analytics.uniqueIpAddresses.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {analytics.uniqueVisitors > 0 && (
                    <span className="flex items-center gap-1">
                      <span>{Math.round((analytics.uniqueIpAddresses / analytics.uniqueVisitors) * 100)}%</span> visitor-to-IP ratio
                    </span>
                  )}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-7">
            <Card className="md:col-span-4 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle>Rating Analytics</CardTitle>
                  <CardDescription>Post ratings over time</CardDescription>
                </div>
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={ratingChartData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                        }}
                        stroke="#9ca3af"
                        fontSize={12}
                      />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '0.375rem',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        }}
                        formatter={(value: number, name: string) => [
                          `${value} ${name === 'total' ? 'ratings' : 'avg rating'}`,
                          name === 'total' ? 'Total Ratings' : 'Average Rating'
                        ]}
                        labelFormatter={(label) => {
                          const date = new Date(label);
                          return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rating"
                        name="rating"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-3 bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <div>
                  <CardTitle>Content Categories</CardTitle>
                  <CardDescription>Distribution of published content</CardDescription>
                </div>
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-md">
                  <BarChart3 className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-zinc-500 dark:text-zinc-400">
                      <p>No published content yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Content Type Summary Card */}
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Content Type Summary</CardTitle>
              <CardDescription>Visitor metrics by content type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* System Pages */}
                <div className="p-4 border border-purple-200 dark:border-purple-700/50 rounded-lg bg-purple-50/50 dark:bg-purple-900/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-400">System Pages</h3>
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-md">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pages:</span>
                      <span className="font-medium">{systemPageAnalytics.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Visits:</span>
                      <span className="font-medium">
                        {systemPageAnalytics.reduce((sum, page) => sum + page.totalVisits, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors:</span>
                      <span className="font-medium">
                        {systemPageAnalytics.reduce((sum, page) => sum + page.uniqueVisitors, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div className="p-4 border border-cyan-200 dark:border-cyan-700/50 rounded-lg bg-cyan-50/50 dark:bg-cyan-900/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-cyan-700 dark:text-cyan-400">Projects</h3>
                    <div className="p-2 bg-cyan-100 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 rounded-md">
                      <Briefcase className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Projects:</span>
                      <span className="font-medium">{projectAnalytics.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Visits:</span>
                      <span className="font-medium">
                        {projectAnalytics.reduce((sum, project) => sum + project.totalVisits, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors:</span>
                      <span className="font-medium">
                        {projectAnalytics.reduce((sum, project) => sum + project.uniqueVisitors, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Blog Posts */}
                <div className="p-4 border border-emerald-200 dark:border-emerald-700/50 rounded-lg bg-emerald-50/50 dark:bg-emerald-900/10">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">Blog Posts</h3>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md">
                      <BookOpen className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Posts:</span>
                      <span className="font-medium">{blogAnalytics.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Total Visits:</span>
                      <span className="font-medium">
                        {blogAnalytics.reduce((sum, post) => sum + post.totalVisits, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Unique Visitors:</span>
                      <span className="font-medium">
                        {blogAnalytics.reduce((sum, post) => sum + post.uniqueVisitors, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle>Popular Content</CardTitle>
                <CardDescription>Highest rated content</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-4">
                    {filteredPopularContent.length > 0 ? (
                      filteredPopularContent.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <div className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                            item.category === 'Project' 
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" 
                              : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                          )}>
                            {item.category === 'Project' ? (
                              <Briefcase className="h-5 w-5" />
                            ) : (
                              <BookOpen className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                <Eye className="h-3 w-3 mr-1" />
                                {item.totalRatings}
                              </span>
                              {item.totalRatings > 0 && (
                                <span className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                  <ThumbsUp className="h-3 w-3 mr-1" />
                                  {item.totalRatings}
                                </span>
                              )}
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs",
                                  item.category === 'Project'
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30 dark:text-blue-400"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30 dark:text-emerald-400"
                                )}
                              >
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        <p>No view data available yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest content activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[220px] pr-4">
                  <div className="space-y-4">
                    {filteredActivities.length > 0 ? (
                      filteredActivities.map((activity, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                          <div className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                            activity.type === 'publish' 
                              ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                              : activity.type === 'edit'
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                          )}>
                            {activity.type === 'publish' ? (
                              <ArrowUpRight className="h-5 w-5" />
                            ) : activity.type === 'edit' ? (
                              <Pencil className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {activity.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(activity.time).toLocaleString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                        <p>No recent activity</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <DateRangeFilter />
          {/* Visitor analytics card */}
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Visitor Analytics</CardTitle>
              <CardDescription>Unique and total visitors by post</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {visitorChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visitorChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                        interval={0} 
                      />
                      <YAxis />
                      <ChartTooltip 
                        formatter={(value, name, props: any) => {
                          // Add the content type to the tooltip
                          if (!props || !props.payload) return [value, name];
                          
                          const type = props.payload.type;
                          const typeLabel = type === 'system' ? 'System Page' : type === 'project' ? 'Project' : 'Blog Post';
                          return [`${value} ${name}`, `${typeLabel}`];
                        }}
                      />
                      <Legend 
                        payload={[
                          { value: 'System Pages', type: 'square', color: '#9333ea' },
                          { value: 'Projects', type: 'square', color: '#0891b2' },
                          { value: 'Blog Posts', type: 'square', color: '#8884d8' }
                        ]}
                        layout="horizontal"
                        verticalAlign="top"
                        align="center"
                      />
                      <Bar 
                        dataKey="unique" 
                        name="Unique Visitors"
                        fill="#8884d8" // Default color
                      >
                        {
                          visitorChartData.map((entry, index) => {
                            let color = '#8884d8'; // Default purple
                            if (entry.type === 'system') color = '#9333ea'; // Purple
                            if (entry.type === 'project') color = '#0891b2'; // Cyan
                            
                            return <Cell key={`cell-unique-${index}`} fill={color} />;
                          })
                        }
                      </Bar>
                      <Bar 
                        dataKey="total" 
                        name="Total Visits"
                        fill="#82ca9d" // Default color
                      >
                        {
                          visitorChartData.map((entry, index) => {
                            let color = '#82ca9d'; // Default green
                            if (entry.type === 'system') color = '#d8b4fe'; // Light purple
                            if (entry.type === 'project') color = '#67e8f9'; // Light cyan
                            
                            return <Cell key={`cell-total-${index}`} fill={color} />;
                          })
                        }
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-zinc-500">
                    No visitor data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Add IP address analytics card */}
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>IP Address Analytics</CardTitle>
              <CardDescription>Unique visitor to IP address ratio metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Unique Visitors</h3>
                  <p className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/50">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Unique IP Addresses</h3>
                  <p className="text-2xl font-bold">{analytics.uniqueIpAddresses.toLocaleString()}</p>
                </div>
                
                <div className="p-4 bg-white dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/50 col-span-2">
                  <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Visitors per IP Address</h3>
                  <p className="text-2xl font-bold">
                    {analytics.uniqueIpAddresses > 0 
                      ? (analytics.uniqueVisitors / analytics.uniqueIpAddresses).toFixed(2) 
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Additional analytics content would go here */}
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Detailed Analytics</CardTitle>
              <CardDescription>Coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 mb-4">
                  <BarChart3 className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">Advanced Analytics</h3>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  Detailed analytics features are coming soon. This will include content performance metrics, reader demographics, and engagement analytics.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <DateRangeFilter />
          {/* Consolidated Content Analytics */}
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>Detailed analytics for all content types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Content</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Type</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Total Visits</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Unique Visitors</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Unique IPs</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Avg Rating</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Total Ratings</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Engagement Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPostAnalytics.length > 0 ? (
                      filteredPostAnalytics.map((content) => (
                        <tr key={content.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{content.title}</div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline" className={cn(
                              "text-xs",
                              content.isSystemPage 
                                ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/10 dark:border-purple-800/30 dark:text-purple-400"
                                : content.isProject
                                  ? "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/10 dark:border-cyan-800/30 dark:text-cyan-400"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30 dark:text-emerald-400"
                            )}>
                              {content.isSystemPage ? 'System Page' : content.isProject ? 'Project' : 'Blog Post'}
                            </Badge>
                          </td>
                          <td className="text-center py-3 px-4">{content.totalVisits.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">{content.uniqueVisitors.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">{content.uniqueIps.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span>{content.averageRating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">{content.totalRatings.toLocaleString()}</td>
                          <td className="text-center py-3 px-4">{content.engagementRate}x</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-gray-500">No content data available</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="activity" className="space-y-4">
          <DateRangeFilter />
          <Card className="bg-white dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 shadow-sm rounded-xl overflow-hidden">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent actions and events</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                        <div className={cn(
                          "flex items-center justify-center h-9 w-9 rounded-lg shrink-0",
                          activity.type === 'publish' 
                            ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400" 
                            : activity.type === 'edit'
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                              : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                        )}>
                          {activity.type === 'publish' ? (
                            <ArrowUpRight className="h-5 w-5" />
                          ) : activity.type === 'edit' ? (
                            <Pencil className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {activity.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="outline"
                              className={cn(
                                "text-xs",
                                activity.type === 'publish'
                                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/10 dark:border-green-800/30 dark:text-green-400"
                                  : activity.type === 'edit'
                                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30 dark:text-blue-400"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30 dark:text-amber-400"
                              )}
                            >
                              {activity.type === 'publish' ? 'Published' : activity.type === 'edit' ? 'Edited' : 'View Milestone'}
                            </Badge>
                            <span className="flex items-center text-xs text-zinc-500 dark:text-zinc-400">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(activity.time).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
                      <p>No activity logged yet</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <div className="grid gap-4">
            <RatingActivity />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardAnalytics; 