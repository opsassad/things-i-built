import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Eye, 
  Pencil, 
  Save, 
  FileText, 
  ImagePlus, 
  Tag, 
  Settings,
  Check,
  Briefcase,
  Clock,
  RefreshCcw,
  BookOpen,
  LayoutDashboard,
  Mail,
  Menu,
  X,
  MessageSquare,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Home,
  ListTodo,
  Users
} from "lucide-react";
import Footer from "../components/Footer";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { toast } from "../hooks/use-toast";
import { Badge } from "../components/ui/badge";
import BlogEditor from "../components/admin/BlogEditor";
import ImageManager from "../components/admin/ImageManager";
import DashboardAnalytics from "../components/admin/DashboardAnalytics";
import { useContent } from "../context/ContentContext";
import { useAuth } from "../context/AuthContext";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import CommentManager from "../components/admin/CommentManager";
import TaskManager from "../components/admin/TaskManager";
import ProfileManager from "../components/admin/ProfileManager";

const AdminPage = () => {
  const { 
    isEditMode, 
    setEditMode, 
    homePageContent, 
    updateHomePageContent,
    siteSettings,
    updateSiteSettings,
    blogPosts,
    saveBlogPost
  } = useContent();
  
  const { user, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState(() => {
    // Try to get the active tab from localStorage, default to "dashboard" if not found
    return localStorage.getItem('adminActiveTab') || "dashboard";
  });
  const [pendingHomeContent, setPendingHomeContent] = useState(() => homePageContent);
  const [pendingSiteSettings, setPendingSiteSettings] = useState(() => siteSettings);
  const [hasDraft, setHasDraft] = useState(() => {
    return localStorage.getItem('draftHomeContent') !== null || localStorage.getItem('draftSiteSettings') !== null;
  });
  
  // For switching blog editor mode (regular blog vs project)
  const [blogEditorMode, setBlogEditorMode] = useState<'blog' | 'project'>('blog');
  
  const [pendingSMTPSettings, setPendingSMTPSettings] = useState({
    host: siteSettings.smtpHost || '',
    port: siteSettings.smtpPort || '587',
    username: siteSettings.smtpUsername || '',
    password: siteSettings.smtpPassword || '',
    fromEmail: siteSettings.smtpFromEmail || '',
    fromName: siteSettings.smtpFromName || '',
    encryption: siteSettings.smtpEncryption || 'tls'
  });
  
  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem('adminSidebarCollapsed') === 'true';
  });
  
  // Update pending content when Supabase data changes
  useEffect(() => {
    console.log("Updating pending content from homePageContent:", homePageContent);
    setPendingHomeContent(homePageContent);
    
    // Clear any stale drafts on initial load to prevent them from overriding fresh Supabase data
    const savedDraftContent = localStorage.getItem('draftHomeContent');
    if (savedDraftContent) {
      // Check if the draft is older than the Supabase data
      // For simplicity, just clear it on page load when Supabase data is available
      localStorage.removeItem('draftHomeContent');
      setHasDraft(prevHasDraft => {
        // Only update hasDraft if this was the only draft
        const hasSiteSettingsDraft = localStorage.getItem('draftSiteSettings') !== null;
        return hasSiteSettingsDraft;
      });
    }
  }, [homePageContent]);
  
  // Update pending settings when Supabase data changes
  useEffect(() => {
    console.log("Updating pending settings from siteSettings:", siteSettings);
    setPendingSiteSettings(siteSettings);
    // Also update SMTP settings
    setPendingSMTPSettings({
      host: siteSettings.smtpHost || '',
      port: siteSettings.smtpPort || '587',
      username: siteSettings.smtpUsername || '',
      password: siteSettings.smtpPassword || '',
      fromEmail: siteSettings.smtpFromEmail || '',
      fromName: siteSettings.smtpFromName || '',
      encryption: siteSettings.smtpEncryption || 'tls'
    });
    
    // Clear any stale drafts on initial load
    const savedDraftSettings = localStorage.getItem('draftSiteSettings');
    if (savedDraftSettings) {
      localStorage.removeItem('draftSiteSettings');
      setHasDraft(prevHasDraft => {
        // Only update hasDraft if this was the only draft
        const hasHomeContentDraft = localStorage.getItem('draftHomeContent') !== null;
        return hasHomeContentDraft;
      });
    }
  }, [siteSettings]);
  
  // Save sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);
  
  const toggleEditMode = () => {
    setEditMode(!isEditMode);
    toast({
      title: isEditMode ? "View Mode Activated" : "Edit Mode Activated",
      description: isEditMode 
        ? "You're now viewing the site as visitors would see it." 
        : "You can now edit site content.",
      variant: "default",
    });
  };
  
  const handleSaveDraft = () => {
    // Save the current pending changes to localStorage but don't publish
    localStorage.setItem('draftHomeContent', JSON.stringify(pendingHomeContent));
    localStorage.setItem('draftSiteSettings', JSON.stringify(pendingSiteSettings));
    
    setHasDraft(true);
    
    toast({
      title: "Draft Saved",
      description: "Your changes have been saved as a draft.",
      variant: "default",
    });
  };
  
  const handleLoadDraft = () => {
    const savedDraftContent = localStorage.getItem('draftHomeContent');
    const savedDraftSettings = localStorage.getItem('draftSiteSettings');
    
    if (savedDraftContent) {
      setPendingHomeContent(JSON.parse(savedDraftContent));
    }
    
    if (savedDraftSettings) {
      setPendingSiteSettings(JSON.parse(savedDraftSettings));
    }
    
    toast({
      title: "Draft Loaded",
      description: "Your draft has been loaded.",
      variant: "default",
    });
  };
  
  const handlePublish = () => {
    // Update the actual content
    updateHomePageContent(pendingHomeContent);
    updateSiteSettings(pendingSiteSettings);
    
    // Clear drafts after publishing
    localStorage.removeItem('draftHomeContent');
    localStorage.removeItem('draftSiteSettings');
    setHasDraft(false);
    
    toast({
      title: "Changes Published",
      description: "Your changes are now live on the site.",
      variant: "default",
    });
  };
  
  const handleContentChange = (field: keyof typeof pendingHomeContent, value: string) => {
    setPendingHomeContent(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSettingsChange = (field: keyof typeof pendingSiteSettings, value: any) => {
    setPendingSiteSettings(prev => ({ ...prev, [field]: value }));
  };
  
  // Update the tab types to include profiles
  type AdminTab = "dashboard" | "content" | "blogs" | "projects" | "media" | "comments" | "settings" | "tasks" | "profiles";
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex relative">
        {/* Mobile Sidebar Toggle - Only visible on mobile */}
        <Button 
          variant="secondary"
          size="icon" 
          className="lg:hidden fixed top-4 left-4 z-[60] flex items-center justify-center shadow-md transition-all h-12 w-12 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-700"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu size={24} />
        </Button>

        {/* Sidebar Backdrop Overlay (mobile only) */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "bg-white dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 fixed inset-y-0 z-50 transition-all duration-300 ease-in-out shadow-md",
          // Mobile behavior
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // Desktop behavior - collapsed or expanded
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        )}>
          <div className="h-full overflow-y-auto flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
              {!sidebarCollapsed && <h1 className="text-xl font-bold">Admin Panel</h1>}
              <div className="flex items-center gap-2 ml-auto">
                {/* Close button (mobile only) */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={18} />
                </Button>
                
                {/* Collapse toggle button (desktop only) */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-9 w-9 hidden lg:flex"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                >
                  {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </Button>
              </div>
            </div>
            
            {/* User info */}
            {!sidebarCollapsed && (
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex flex-col">
                  <span className="font-medium">{user?.email}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Administrator</span>
                </div>
              </div>
            )}
            
            {/* Sidebar Content */}
            <div className={cn(
              "flex-1 py-4 space-y-4",
              sidebarCollapsed ? "px-2" : "px-4"
            )}>
              {/* Edit Mode Toggle */}
              {!sidebarCollapsed ? (
                <div className="flex items-center gap-2">
                  <Badge variant={isEditMode ? "default" : "outline"} className={isEditMode ? "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700" : ""}>
                    {isEditMode ? "Edit Mode" : "View Mode"}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="ml-auto"
                    onClick={toggleEditMode}
                  >
                    {isEditMode ? <Eye size={14} /> : <Pencil size={14} />}
                  </Button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-10 w-10", 
                      isEditMode && "bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white border-amber-500 dark:border-amber-600"
                    )}
                    onClick={toggleEditMode}
                  >
                    {isEditMode ? <Eye size={16} /> : <Pencil size={16} />}
                  </Button>
                </div>
              )}

              <Separator />

              <nav className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab("dashboard");
                    localStorage.setItem('adminActiveTab', "dashboard");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "dashboard"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <LayoutDashboard size={18} />
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("content");
                    localStorage.setItem('adminActiveTab', "content");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "content"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <FileText size={18} />
                  {!sidebarCollapsed && <span>Content</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("blogs");
                    setBlogEditorMode('blog');
                    localStorage.setItem('adminActiveTab', "blogs");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "blogs"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <BookOpen size={18} />
                  {!sidebarCollapsed && <span>Blog Posts</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("projects");
                    setBlogEditorMode('project');
                    localStorage.setItem('adminActiveTab', "projects");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "projects"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <Briefcase size={18} />
                  {!sidebarCollapsed && <span>Projects</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("media");
                    localStorage.setItem('adminActiveTab', "media");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "media"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <ImagePlus size={18} />
                  {!sidebarCollapsed && <span>Media</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("comments");
                    localStorage.setItem('adminActiveTab', "comments");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "comments"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <MessageSquare size={18} />
                  {!sidebarCollapsed && <span>Comments</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    localStorage.setItem('adminActiveTab', "settings");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "settings"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <Settings size={18} />
                  {!sidebarCollapsed && <span>Settings</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("tasks");
                    localStorage.setItem('adminActiveTab', "tasks");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "tasks"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <ListTodo size={18} />
                  {!sidebarCollapsed && <span>Tasks</span>}
                </button>
                <button
                  onClick={() => {
                    setActiveTab("profiles");
                    localStorage.setItem('adminActiveTab', "profiles");
                    if (window.innerWidth < 1024) setSidebarOpen(false);
                  }}
                  className={cn(
                    "flex items-center w-full gap-3 py-2 text-sm rounded-md transition-colors",
                    sidebarCollapsed ? "justify-center px-2" : "px-3",
                    activeTab === "profiles"
                      ? "bg-zinc-100 dark:bg-zinc-700/50 text-zinc-900 dark:text-zinc-50 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-50"
                  )}
                >
                  <Users size={18} />
                  {!sidebarCollapsed && <span>Author Profiles</span>}
                </button>
              </nav>
              
              {isEditMode && !sidebarCollapsed && hasDraft && (
                <>
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full justify-start gap-2"
                      onClick={handleLoadDraft}
                    >
                      <RefreshCcw size={14} />
                      Load Draft
                    </Button>
                  </div>
                </>
              )}
              
              {isEditMode && sidebarCollapsed && hasDraft && (
                <>
                  <Separator />
                  
                  <div className="flex justify-center">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleLoadDraft}
                      title="Load Draft"
                    >
                      <RefreshCcw size={16} />
                    </Button>
                  </div>
                </>
              )}
            </div>
            
            {/* Sidebar Footer with Exit Button */}
            <div className="p-4 mt-auto border-t border-zinc-200 dark:border-zinc-700">
              <Link to="/" className={cn(
                "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 mb-2",
                sidebarCollapsed && "justify-center"
              )}>
                <Home size={18} />
                {!sidebarCollapsed && <span className="text-sm">Go to Site</span>}
              </Link>
              <button 
                onClick={signOut}
                className={cn(
                  "flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors py-2 px-3 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 w-full",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <LogOut size={18} />
                {!sidebarCollapsed && <span className="text-sm">Exit Admin</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 pb-16 bg-zinc-50 dark:bg-zinc-900 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
          !sidebarOpen && "pl-0"
        )}>
          <div className="p-6 max-w-6xl mx-auto">
            <header className="mb-8 mt-8 lg:mt-0">
              <h1 className="text-2xl font-display font-bold text-zinc-900 dark:text-zinc-50">
                {activeTab === "dashboard" ? "Dashboard" : 
                 activeTab === "content" ? "Website Content" : 
                 activeTab === "blogs" ? "Blog Posts" : 
                 activeTab === "projects" ? "Projects" : 
                 activeTab === "media" ? "Media Library" : 
                 activeTab === "comments" ? "Comment Management" :
                 activeTab === "tasks" ? "Task Management" :
                 activeTab === "profiles" ? "Author Profiles" :
                 "Settings"}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                {activeTab === "dashboard" ? "Overview of your website performance and activity" : 
                 activeTab === "content" ? "Manage your home page and website content" : 
                 activeTab === "blogs" ? "Create and manage your blog posts" : 
                 activeTab === "projects" ? "Showcase your project portfolio" : 
                 activeTab === "media" ? "Upload and manage your images and media files" : 
                 activeTab === "comments" ? "Review, approve, and moderate user comments on your content" :
                 activeTab === "tasks" ? "Monitor all of your tasks here" :
                 activeTab === "profiles" ? "Manage your blog authors and their profiles" :
                 "Configure your website preferences and settings"}
              </p>
            </header>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "dashboard" && <DashboardAnalytics />}
              
              {activeTab === "content" && (
                <Card className="bg-white dark:bg-zinc-800/50 shadow-sm">
                  <CardHeader>
                    <CardTitle>Edit Website Content</CardTitle>
                    <CardDescription>Update the content displayed on your website's home page</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Hero Section</h3>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hero-title">Hero Title</Label>
                            <Input 
                              id="hero-title" 
                              value={pendingHomeContent.heroTitle}
                              onChange={(e) => handleContentChange('heroTitle', e.target.value)}
                              disabled={!isEditMode}
                              placeholder="Enter the main headline for your site"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                            <Textarea 
                              id="hero-subtitle" 
                              value={pendingHomeContent.heroSubtitle}
                              onChange={(e) => handleContentChange('heroSubtitle', e.target.value)}
                              disabled={!isEditMode}
                              placeholder="Enter a brief description that appears below the headline"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">About Section</h3>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="about-text">About Text</Label>
                            <Textarea 
                              id="about-text" 
                              rows={5} 
                              value={pendingHomeContent.aboutText}
                              onChange={(e) => handleContentChange('aboutText', e.target.value)}
                              disabled={!isEditMode}
                              placeholder="Tell visitors about yourself or your business"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  {isEditMode && (
                    <CardFooter className="flex justify-end bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-700/50 px-6 py-4">
                      <div className="flex gap-2">
                        <Button 
                          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white"
                          onClick={handlePublish}
                        >
                          <Check size={16} />
                          Publish Changes
                        </Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              )}
              
              {activeTab === "blogs" && <BlogEditor type="blog" />}
              
              {activeTab === "projects" && <BlogEditor type="project" />}
              
              {activeTab === "media" && <ImageManager />}
              
              {activeTab === "settings" && (
                <div className="grid gap-6">
                  <Card className="bg-white dark:bg-zinc-800/50 shadow-sm">
                    <CardHeader>
                      <CardTitle>Website Settings</CardTitle>
                      <CardDescription>Configure general settings for your website</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">SEO Settings</h3>
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="site-title">Site Title</Label>
                              <Input 
                                id="site-title" 
                                value={pendingSiteSettings.siteTitle}
                                onChange={(e) => handleSettingsChange('siteTitle', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="Your website's title (appears in browser tabs)"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="site-description">Site Description</Label>
                              <Textarea 
                                id="site-description" 
                                value={pendingSiteSettings.siteDescription}
                                onChange={(e) => handleSettingsChange('siteDescription', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="A brief description of your website for search engines"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Social Media</h3>
                          <div className="grid gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="github-url">GitHub URL</Label>
                              <Input 
                                id="github-url" 
                                type="url" 
                                value={pendingSiteSettings.githubUrl}
                                onChange={(e) => handleSettingsChange('githubUrl', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="https://github.com/yourusername"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="linkedin-url">LinkedIn URL</Label>
                              <Input 
                                id="linkedin-url" 
                                type="url" 
                                value={pendingSiteSettings.linkedinUrl}
                                onChange={(e) => handleSettingsChange('linkedinUrl', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="https://linkedin.com/in/yourprofile"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="twitter-url">Twitter URL</Label>
                              <Input 
                                id="twitter-url" 
                                type="url" 
                                value={pendingSiteSettings.twitterUrl}
                                onChange={(e) => handleSettingsChange('twitterUrl', e.target.value)}
                                disabled={!isEditMode}
                                placeholder="https://twitter.com/yourusername"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Visibility Settings</h3>
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md">
                              <Switch 
                                id="comments-enabled" 
                                checked={pendingSiteSettings.enableComments}
                                onCheckedChange={(checked) => handleSettingsChange('enableComments', checked)}
                                disabled={!isEditMode}
                              />
                              <div>
                                <Label htmlFor="comments-enabled" className="text-sm font-medium">Enable Blog Comments</Label>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Allow visitors to comment on your blog posts</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-md">
                              <Switch 
                                id="analytics-enabled" 
                                checked={pendingSiteSettings.enableAnalytics}
                                onCheckedChange={(checked) => handleSettingsChange('enableAnalytics', checked)}
                                disabled={!isEditMode}
                              />
                              <div>
                                <Label htmlFor="analytics-enabled" className="text-sm font-medium">Enable Analytics</Label>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Track visitor statistics and page views</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    {isEditMode && (
                      <CardFooter className="flex justify-end bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-100 dark:border-zinc-700/50 px-6 py-4">
                        <div className="flex gap-2">
                          <Button 
                            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white"
                            onClick={handlePublish}
                          >
                            <Check size={16} />
                            Publish Settings
                          </Button>
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                  
                  {/* SMTP Settings Card */}
                  <Card className="bg-white dark:bg-zinc-800/50 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>SMTP Settings</CardTitle>
                      </div>
                      <CardDescription>Configure email delivery settings for your website</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="smtp-host">SMTP Host</Label>
                          <Input 
                            id="smtp-host" 
                            value={pendingSMTPSettings.host}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              host: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="smtp.example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-port">SMTP Port</Label>
                          <Input 
                            id="smtp-port" 
                            value={pendingSMTPSettings.port}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              port: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="587"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-username">SMTP Username</Label>
                          <Input 
                            id="smtp-username" 
                            value={pendingSMTPSettings.username}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              username: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="username@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-password">SMTP Password</Label>
                          <Input 
                            id="smtp-password" 
                            type="password"
                            value={pendingSMTPSettings.password}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              password: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="••••••••••••"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-from-email">From Email</Label>
                          <Input 
                            id="smtp-from-email" 
                            value={pendingSMTPSettings.fromEmail}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              fromEmail: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="noreply@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="smtp-from-name">From Name</Label>
                          <Input 
                            id="smtp-from-name" 
                            value={pendingSMTPSettings.fromName}
                            onChange={(e) => setPendingSMTPSettings({
                              ...pendingSMTPSettings,
                              fromName: e.target.value
                            })}
                            disabled={!isEditMode}
                            placeholder="Your Website"
                          />
                        </div>
                      </div>
                      {isEditMode && (
                        <div className="mt-6 flex justify-end">
                          <Button 
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <Mail size={14} className="mr-1" />
                            Test Connection
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === "comments" && (
                <CommentManager />
              )}

              {activeTab === "tasks" && (
                <TaskManager />
              )}

              {activeTab === "profiles" && (
                <ProfileManager />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
