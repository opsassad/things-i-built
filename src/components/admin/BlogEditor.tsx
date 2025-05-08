import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Link as LinkIcon, 
  Eye,
  Check,
  Briefcase,
  BookOpen,
  Save,
  X,
  ArrowLeft,
  FileText,
  ThumbsUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { toast } from "../../hooks/use-toast";
import { useContent } from "../../context/ContentContext";
import RichTextEditor from "./RichTextEditor";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { ExtendedBlogPostType } from "../../types/content-types";
import { generateSlug, ensureUniqueSlug, normalizeImageHtml } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";

interface BlogEditorProps {
  type?: 'blog' | 'project';
}

// Draft interface matching the editor state
interface EditorDraft {
  id: string | null;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImage: string;
  authorName: string;
  authorRole: string;
  authorImage: string;
  readTime: string;
  features: string[];
  technologies: string[];
  lastModified: number;
}

// Add additional URL validation helper function at the top of the file (after imports)
// This is a basic URL validation function
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // Empty URLs are considered valid (optional field)
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const BlogEditor = ({ type = 'blog' }: BlogEditorProps) => {
  const { blogPosts, saveBlogPost, deleteBlogPost, isEditMode } = useContent();
  
  // Filter posts by type (category)
  const filteredPosts = blogPosts.filter(post => {
    // Define system pages
    const systemPageIds = ['home', 'about', 'contact', 'blog', 'projects', 'test-post', 'website-landing'];
    
    // Exclude system pages
    if (systemPageIds.includes(post.id)) return false;
    
    // Filter by type
    return type === 'project' 
      ? post.category === 'Project'
      : post.category !== 'Project';
  });
  
  const [selectedPost, setSelectedPost] = useState<ExtendedBlogPostType | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState(type === 'project' ? 'Project' : 'Technology');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [authorName, setAuthorName] = useState("ASSAD");
  const [authorRole, setAuthorRole] = useState("AI & Automation Expert");
  const [authorImage, setAuthorImage] = useState("");
  const [readTime, setReadTime] = useState("5 min read");
  
  // Project-specific fields
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState("");
  
  // UI state
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [hasDraft, setHasDraft] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Add this new formErrors state
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    content?: string;
    excerpt?: string;
    featuredImage?: string;
    authorName?: string;
    authorImage?: string;
    slug?: string;
  }>({});
  
  // Add this new state variable near the top with other state declarations
  const [editorMounted, setEditorMounted] = useState(false);
  
  // Draft management functions
  const getDraftKey = (postId: string | null) => {
    return `blog_draft_${type}_${postId || 'new'}`;
  };
  
  const saveDraft = () => {
    if (!isEditMode) return;
    
    const draft: EditorDraft = {
      id: selectedPost?.id || null,
      title,
      content,
      excerpt,
      category,
      tags,
      featuredImage,
      authorName,
      authorRole,
      authorImage,
      readTime,
      features,
      technologies,
      lastModified: Date.now()
    };
    
    localStorage.setItem(getDraftKey(draft.id), JSON.stringify(draft));
    setHasDraft(true);
  };
  
  const loadDraft = (postId: string | null) => {
    const draftKey = getDraftKey(postId);
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      try {
        const draft: EditorDraft = JSON.parse(savedDraft);
        setTitle(draft.title);
        setContent(draft.content);
        setExcerpt(draft.excerpt);
        setCategory(draft.category);
        setTags(draft.tags);
        setFeaturedImage(draft.featuredImage);
        setAuthorName(draft.authorName);
        setAuthorRole(draft.authorRole);
        setAuthorImage(draft.authorImage);
        setReadTime(draft.readTime);
        setFeatures(draft.features);
        setTechnologies(draft.technologies);
        setHasDraft(true);
        
        toast({
          title: "Draft Loaded",
          description: "Your previous draft has been restored.",
        });
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };
  
  const clearDraft = (postId: string | null) => {
    localStorage.removeItem(getDraftKey(postId));
    setHasDraft(false);
  };
  
  // Auto-save draft every 30 seconds and when editor state changes
  useEffect(() => {
    if (!isEditMode) return;
    
    const autoSaveTimer = setInterval(saveDraft, 30000);
    return () => clearInterval(autoSaveTimer);
  }, [isEditMode, title, content, excerpt, category, tags, featuredImage, 
      authorName, authorRole, authorImage, readTime, features, technologies]);
  
  // Save draft when user switches tabs or closes window
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isEditMode) {
        saveDraft();
      }
    };
    
    const handleBeforeUnload = () => {
      if (isEditMode) {
        saveDraft();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isEditMode]);

  // Find the useEffect that manages selected post
  useEffect(() => {
    if (!isEditMode && selectedPost) {
      handleSelectPost(selectedPost);
    }
    
    // Add this to ensure editor is only mounted after the component is fully rendered
    setTimeout(() => {
      setEditorMounted(true);
    }, 0);
    
    return () => {
      // Clean up by unmounting editor when component unmounts
      setEditorMounted(false);
    };
  }, [isEditMode]);
  
  // Update the useEffect for edit mode to clear errors when switching to view mode
  useEffect(() => {
    if (!isEditMode) {
      // Clear any form errors when switching to view mode
      setFormErrors({});
    }
  }, [isEditMode]);
  
  const handleSelectPost = (post: ExtendedBlogPostType) => {
    if (!isEditMode && selectedPost?.id !== post.id) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to select a different post.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPost(post);
    
    // Check for existing draft
    const draftKey = getDraftKey(post.id);
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      loadDraft(post.id);
    } else {
      setTitle(post.title);
      setContent(post.content || "");
      setExcerpt(post.excerpt);
      setCategory(post.category);
      setTags(post.tags || []);
      setFeaturedImage(post.featuredImage || "");
      setAuthorName(post.authorName || "ASSAD");
      setAuthorRole(post.authorRole || "AI & Automation Expert");
      setAuthorImage(post.authorImage || "");
      setReadTime(post.readTime || "5 min read");
      setFeatures(post.features || []);
      setTechnologies(post.technologies || []);
      setHasDraft(false);
    }
  };
  
  const handleNewPost = () => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to create a new post.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedPost(null);
    setIsCreating(true);
    
    // Check for existing draft for new post
    const draftKey = getDraftKey(null);
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
      loadDraft(null);
    } else {
      setTitle("");
      setContent("");
      setExcerpt("");
      setCategory(type === 'project' ? 'Project' : 'Technology');
      setTags([]);
      setFeaturedImage("");
      setAuthorName("ASSAD");
      setAuthorRole("AI & Automation Expert");
      setAuthorImage("");
      setReadTime("5 min read");
      setFeatures([]);
      setTechnologies([]);
      setHasDraft(false);
    }
  };
  
  const handleAddTag = () => {
    if (!isEditMode) return;
    
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    if (!isEditMode) return;
    
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleAddFeature = () => {
    if (!isEditMode) return;
    
    if (featureInput && !features.includes(featureInput)) {
      setFeatures([...features, featureInput]);
      setFeatureInput("");
    }
  };
  
  const handleRemoveFeature = (featureToRemove: string) => {
    if (!isEditMode) return;
    
    setFeatures(features.filter(feature => feature !== featureToRemove));
  };
  
  const handleAddTechnology = () => {
    if (!isEditMode) return;
    
    if (techInput && !technologies.includes(techInput)) {
      setTechnologies([...technologies, techInput]);
      setTechInput("");
    }
  };
  
  const handleRemoveTechnology = (techToRemove: string) => {
    if (!isEditMode) return;
    
    setTechnologies(technologies.filter(tech => tech !== techToRemove));
  };
  
  // Add a utility function to scroll to the first error element
  const scrollToFirstError = (errors: {[key: string]: string}) => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const element = document.getElementById(firstErrorKey === 'authorImage' ? 'author-image' : firstErrorKey);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };
  
  const handleSavePost = () => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to save changes.",
        variant: "destructive",
      });
      return;
    }
    
    // Reset form errors first
    setFormErrors({});
    
    // Collect validation errors
    const errors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      errors.title = "Title is required";
    }
    
    if (!content.trim()) {
      errors.content = "Content cannot be empty";
    }
    
    if (!excerpt.trim()) {
      errors.excerpt = "A brief excerpt is required to summarize your post";
    }
    
    // URL validation for featured image
    if (featuredImage && !isValidUrl(featuredImage)) {
      errors.featuredImage = "Please enter a valid URL for the featured image";
    }
    
    // Author image URL validation
    if (authorImage && !isValidUrl(authorImage)) {
      errors.authorImage = "Please enter a valid URL for the author image";
    }
    
    // If we have any errors, set them and prevent form submission
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Scroll to the first error
      scrollToFirstError(errors);
      
      toast({
        title: "Validation Failed",
        description: `Please fix ${Object.keys(errors).length} error${Object.keys(errors).length > 1 ? 's' : ''} before saving.`,
        variant: "destructive",
      });
      return;
    }
    
    // Generate the slug
    const baseSlug = generateSlug(title, type);
    const existingSlugs = blogPosts
      .map(post => post.id)
      .filter(id => selectedPost?.id !== id); // Exclude current post
    
    const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
    
    // Process content to ensure proper image properties are preserved
    const processedContent = normalizeImageHtml(content);
    
    // Create post object according to ExtendedBlogPostType interface
    const postToSave: ExtendedBlogPostType = {
      id: selectedPost?.id || uniqueSlug,
      title,
      content: processedContent,
      excerpt,
      category,
      tags,
      date: selectedPost?.date || new Date().toISOString(),
      readTime,
      authorName,
      authorRole,
      
      // Required fields from interface
      slug: selectedPost?.slug || uniqueSlug.split('/').pop() || '',
      status: 'published', // Always published when using the Save/Publish button
      createdAt: selectedPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // Optional fields
      authorImage: authorImage || undefined,
      featuredImage: featuredImage || undefined,
      technologies: technologies || [],
      features: features || [],
      isDraft: false, // Always not a draft when using the Save/Publish button
      
      // Preserve metrics if they exist
      viewCount: selectedPost?.viewCount,
      likeCount: selectedPost?.likeCount
    };
    
    saveBlogPost(postToSave);

    setSelectedPost({
      ...postToSave,
      content: postToSave.content || ''
    });
    
    // Clear any drafts when successfully saved
    clearDraft(postToSave.id);
    
    toast({
      title: "Post Published",
      description: `${type === 'blog' ? 'Blog post' : 'Project'} has been published successfully.`,
    });
  };
  
  const handleSaveDraft = () => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to save drafts.",
        variant: "destructive",
      });
      return;
    }
    
    // For drafts, we'll just validate URLs if present, but not require any fields
    const errors: {[key: string]: string} = {};
    
    // URL validation for featured image
    if (featuredImage && !isValidUrl(featuredImage)) {
      errors.featuredImage = "Please enter a valid URL for the featured image";
    }
    
    // Author image URL validation
    if (authorImage && !isValidUrl(authorImage)) {
      errors.authorImage = "Please enter a valid URL for the author image";
    }
    
    // If we have any URL errors, show them but still allow saving to localStorage
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      
      // Scroll to the first error but more gently since it's just a warning
      scrollToFirstError(errors);
      
      // Still save to localStorage
      saveDraft();
    }
    
    // Save to local storage first (this lets the user continue editing later)
    saveDraft();
    
    // Also save to main storage as a draft
    if (title) {
      const baseSlug = generateSlug(title, type);
      const existingSlugs = blogPosts
        .filter(post => post.id !== selectedPost?.id)
        .map(post => post.id);
      const uniqueSlug = ensureUniqueSlug(baseSlug, existingSlugs);
      
      // Process content to ensure image sizes and alignments are properly preserved
      const processedContent = normalizeImageHtml(content);
      
      const draftPost: ExtendedBlogPostType = {
        id: selectedPost ? selectedPost.id : uniqueSlug,
        title,
        content: processedContent,
        excerpt,
        category,
        tags,
        date: selectedPost?.date || new Date().toISOString(),
        readTime,
        authorName,
        authorRole,
        authorImage,
        featuredImage,
        isDraft: true, // Explicitly mark as draft
        slug: selectedPost?.slug || uniqueSlug.split('/').pop() || '',
        status: "draft", // Explicitly set status to draft
        createdAt: selectedPost?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: selectedPost?.viewCount || 0,
        likeCount: selectedPost?.likeCount || 0
      };
      
      if (type === 'project') {
        draftPost.features = features;
        draftPost.technologies = technologies;
        draftPost.imageUrl = featuredImage;
      }
      
      saveBlogPost(draftPost);
    }
    
    toast({
      title: "Draft Saved",
      description: "Your draft has been saved. It will not be visible to visitors until published.",
    });
  };
  
  const handleDeletePost = (postId: string) => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: `Please enable edit mode to delete ${type}s.`,
        variant: "destructive",
      });
      return;
    }
    
    deleteBlogPost(postId);
    if (selectedPost && selectedPost.id === postId) {
      handleNewPost();
    }
    
    toast({
      title: `${type === 'project' ? 'Project' : 'Post'} Deleted`,
      description: `The ${type} has been deleted successfully.`,
      variant: "destructive",
    });
  };
  
  const renderPreview = () => {
    // Process HTML content to ensure image alignment is preserved
    let processedContent = normalizeImageHtml(content);
    
    // Additional preview-specific processing for displaying centered images correctly
    processedContent = processedContent
      .replace(/<img data-align="center"([^>]*)>/g, '<div style="text-align: center;"><img data-align="center"$1></div>')
      .replace(/<img([^>]*)style="[^"]*text-align:\s*center[^"]*"([^>]*)>/g, '<div style="text-align: center;"><img$1style="text-align: center;"$2></div>')
      // Add proper styling for left and right aligned images
      .replace(/<img data-align="left"([^>]*)>/g, '<img class="float-left mr-4 mb-2"$1>')
      .replace(/<img data-align="right"([^>]*)>/g, '<img class="float-right ml-4 mb-2"$1>');
    
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {featuredImage && (
            <div className="mb-6">
              <img src={featuredImage} alt={title} className="w-full h-64 object-cover rounded-lg" />
            </div>
          )}
          
          <h1>{title || "Untitled"}</h1>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">{category}</Badge>
            {tags.map(tag => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
          
          <div className="mb-6 text-zinc-600 dark:text-zinc-400">
            <p className="italic">{excerpt}</p>
          </div>
          
          <div dangerouslySetInnerHTML={{ __html: processedContent }} className="prose-content-preview" />
          
          {type === 'project' && (
            <>
              {features.length > 0 && (
                <div className="mt-8">
                  <h2>Key Features</h2>
                  <ul>
                    {features.map((feature, i) => (
                      <li key={i}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {technologies.length > 0 && (
                <div className="mt-8">
                  <h2>Technologies Used</h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {technologies.map((tech, i) => (
                      <Badge key={i} variant="outline" className="px-3 py-1">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // Filter posts based on search term
  const searchResults = filteredPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {!selectedPost && !isCreating ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder={`Search ${type === 'blog' ? 'blog posts' : 'projects'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            
            {isEditMode && (
              <Button 
                onClick={handleNewPost}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white"
              >
                <Plus size={16} />
                {type === 'blog' ? 'New Blog Post' : 'New Project'}
              </Button>
            )}
          </div>
          
          {searchResults.length === 0 ? (
            <div className="bg-white dark:bg-zinc-800/50 rounded-lg p-12 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                {type === 'blog' ? <BookOpen className="h-10 w-10 text-zinc-500" /> : <Briefcase className="h-10 w-10 text-zinc-500" />}
              </div>
              <h3 className="mt-6 text-lg font-medium">No {type === 'blog' ? 'blog posts' : 'projects'} found</h3>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {searchTerm ? `No results match "${searchTerm}"` : `Get started by creating a new ${type === 'blog' ? 'blog post' : 'project'}.`}
              </p>
              {isEditMode && searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={handleNewPost}
                >
                  Create New {type === 'blog' ? 'Blog Post' : 'Project'}
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((post) => (
                <Card 
                  key={post.id} 
                  className="group bg-white dark:bg-zinc-800/50 overflow-hidden hover:shadow-lg transition-all duration-300 border border-zinc-200 dark:border-zinc-700 rounded-xl flex flex-col"
                >
                  {post.featuredImage ? (
                    <div className="h-48 overflow-hidden relative">
                      <img 
                        src={post.featuredImage} 
                        alt={post.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-white/90 backdrop-blur-sm text-zinc-900 border border-zinc-300 font-medium px-3 py-1 shadow-sm">
                          {post.category}
                        </Badge>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-r from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                      <div className="text-zinc-400 dark:text-zinc-500 flex flex-col items-center">
                        <FileText size={32} />
                        <span className="mt-2 text-sm">No featured image</span>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-white/90 backdrop-blur-sm text-zinc-900 border border-zinc-300 font-medium px-3 py-1 shadow-sm">
                          {post.category}
                        </Badge>
                      </div>
                    </div>
                  )}
                  
                  <CardContent className="p-5 flex-grow flex flex-col">
                    <div className="mb-1 flex items-center">
                      <div className="flex-1">
                        {post.isDraft ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                            Draft
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400">
                            Published
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {new Date(post.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1 mt-1">{post.title}</h3>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-4">
                      {post.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="bg-zinc-100 dark:bg-zinc-700/50 text-xs px-2 py-0.5">{tag}</Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-700/50 text-xs">+{post.tags.length - 3}</Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <div className="mt-auto px-5 py-4 bg-zinc-50 dark:bg-zinc-800/90 border-t border-zinc-200 dark:border-zinc-700/50 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-400">
                        <Eye size={14} />
                        <span className="text-xs">{post.viewCount || 0}</span>
                      </div>
                      {post.likeCount > 0 && (
                        <div className="flex items-center space-x-1 text-zinc-500 dark:text-zinc-400">
                          <ThumbsUp size={14} />
                          <span className="text-xs">{post.likeCount || 0}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 h-8 w-8 p-0"
                        onClick={() => handleSelectPost(post)}
                      >
                        {isEditMode ? <Edit size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedPost(null);
                setIsCreating(false);
              }}
              className="flex items-center"
            >
              <ArrowLeft size={14} className="mr-1" /> Back to List
            </Button>
            {selectedPost && isEditMode && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleDeletePost(selectedPost.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>
            )}
          </div>

          <Card className="bg-white dark:bg-zinc-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <div>
                <CardTitle>{selectedPost ? (isEditMode ? 'Edit' : 'View') : 'Create New'} {type === 'blog' ? 'Blog Post' : 'Project'}</CardTitle>
                {selectedPost && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Last updated: {new Date(selectedPost.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {isEditMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveDraft}
                      className="flex items-center gap-1"
                    >
                      <Save size={14} /> Save Draft
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleSavePost}
                      className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white"
                    >
                      <Check size={14} /> {selectedPost ? 'Update' : 'Publish'}
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-6">
              <Tabs defaultValue={editorMode} className="w-full">
                <div className="flex justify-between items-center mb-6">
                  <TabsList>
                    <TabsTrigger 
                      value="edit" 
                      disabled={!isEditMode}
                      onClick={() => setEditorMode('edit')}
                    >
                      <Edit size={14} className="mr-2" /> Edit
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      onClick={() => setEditorMode('preview')}
                    >
                      <Eye size={14} className="mr-2" /> Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="edit" className="mt-0">
                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="title" className={formErrors.title ? "text-red-500" : ""}>
                          Title{formErrors.title && <span className="text-red-500">*</span>}
                        </Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => {
                            setTitle(e.target.value);
                            // Clear error when user starts typing
                            if (formErrors.title) {
                              setFormErrors(prev => ({ ...prev, title: undefined }));
                            }
                          }}
                          placeholder="Enter a title"
                          disabled={!isEditMode}
                          className={formErrors.title ? "border-red-500 focus-visible:ring-red-500" : ""}
                          aria-invalid={!!formErrors.title}
                          aria-describedby={formErrors.title ? "title-error" : undefined}
                        />
                        {formErrors.title && (
                          <p id="title-error" className="text-red-500 text-xs mt-1">{formErrors.title}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <select
                          id="category"
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          disabled={!isEditMode || type === 'project'}
                          className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 dark:focus:ring-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="Technology">Technology</option>
                          <option value="Design">Design</option>
                          <option value="Business">Business</option>
                          <option value="Project">Project</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="excerpt" className={formErrors.excerpt ? "text-red-500" : ""}>
                        Excerpt{formErrors.excerpt && <span className="text-red-500">*</span>}
                      </Label>
                      <Textarea
                        id="excerpt"
                        value={excerpt}
                        onChange={(e) => {
                          setExcerpt(e.target.value);
                          // Clear error when user starts typing
                          if (formErrors.excerpt) {
                            setFormErrors(prev => ({ ...prev, excerpt: undefined }));
                          }
                        }}
                        placeholder="Enter a brief excerpt"
                        disabled={!isEditMode}
                        className={`resize-none ${formErrors.excerpt ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        aria-invalid={!!formErrors.excerpt}
                        aria-describedby={formErrors.excerpt ? "excerpt-error" : undefined}
                      />
                      {formErrors.excerpt && (
                        <p id="excerpt-error" className="text-red-500 text-xs mt-1">{formErrors.excerpt}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <div className="flex flex-wrap gap-2 border border-zinc-200 dark:border-zinc-700 p-3 rounded-md min-h-[44px] bg-white dark:bg-zinc-900">
                        {tags.map((tag, index) => (
                          <Badge key={index} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
                            {tag}
                            {isEditMode && (
                              <button 
                                type="button" 
                                onClick={() => handleRemoveTag(tag)}
                                className="rounded-full h-4 w-4 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 ml-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </Badge>
                        ))}
                        
                        {isEditMode && (
                          <div className="flex">
                            <Input
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              placeholder="Add tag..."
                              className="h-8 text-sm min-w-[120px] max-w-[200px]"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddTag();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleAddTag}
                              className="h-8 px-2 ml-1"
                            >
                              <Plus size={14} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="featuredImage" className={formErrors.featuredImage ? "text-red-500" : ""}>
                        Featured Image URL{formErrors.featuredImage && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="featuredImage"
                          value={featuredImage}
                          onChange={(e) => {
                            setFeaturedImage(e.target.value);
                            // Clear error when user starts typing
                            if (formErrors.featuredImage) {
                              setFormErrors(prev => ({ ...prev, featuredImage: undefined }));
                            }
                          }}
                          disabled={!isEditMode}
                          placeholder="https://example.com/image.jpg"
                          className={formErrors.featuredImage ? "border-red-500 focus-visible:ring-red-500" : ""}
                          aria-invalid={!!formErrors.featuredImage}
                          aria-describedby={formErrors.featuredImage ? "featuredImage-error" : undefined}
                        />
                        {featuredImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 h-10 w-10"
                            onClick={() => window.open(featuredImage, '_blank')}
                          >
                            <Eye size={18} />
                          </Button>
                        )}
                      </div>
                      {formErrors.featuredImage && (
                        <p id="featuredImage-error" className="text-red-500 text-xs mt-1">{formErrors.featuredImage}</p>
                      )}
                      {featuredImage && (
                        <div className="mt-2 rounded-md overflow-hidden h-36 border border-zinc-200 dark:border-zinc-700">
                          <img 
                            src={featuredImage} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (!formErrors.featuredImage) {
                                setFormErrors(prev => ({ 
                                  ...prev, 
                                  featuredImage: "Unable to load image. Please check the URL."
                                }));
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <Label 
                        htmlFor="content" 
                        className={formErrors.content ? "text-red-500" : ""}
                      >
                        Content{formErrors.content && <span className="text-red-500">*</span>}
                      </Label>
                      <div className={formErrors.content ? "ring-1 ring-red-500 rounded-md" : ""}>
                        {editorMounted && (
                          <RichTextEditor
                            value={content}
                            onChange={(html) => {
                              setContent(html);
                              // Clear error when user adds content
                              if (formErrors.content && html.trim()) {
                                setFormErrors(prev => ({ ...prev, content: undefined }));
                              }
                            }}
                            readOnly={!isEditMode}
                          />
                        )}
                      </div>
                      {formErrors.content && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.content}</p>
                      )}
                    </div>
                    
                    {type === 'project' && (
                      <>
                        <div className="space-y-4">
                          <Label>Key Features</Label>
                          <div className="border border-zinc-200 dark:border-zinc-700 p-3 rounded-md bg-white dark:bg-zinc-900">
                            <div className="space-y-2">
                              {features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800 rounded-md">
                                  <span className="flex-1">{feature}</span>
                                  {isEditMode && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => handleRemoveFeature(feature)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              
                              {isEditMode && (
                                <div className="flex gap-2 mt-2">
                                  <Input
                                    value={featureInput}
                                    onChange={(e) => setFeatureInput(e.target.value)}
                                    placeholder="Add a key feature..."
                                    className="flex-1"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddFeature();
                                      }
                                    }}
                                  />
                                  <Button
                                    type="button"
                                    onClick={handleAddFeature}
                                    className="flex-shrink-0"
                                  >
                                    <Plus size={14} className="mr-1" /> Add
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <Label>Technologies Used</Label>
                          <div className="flex flex-wrap gap-2 border border-zinc-200 dark:border-zinc-700 p-3 rounded-md min-h-[44px] bg-white dark:bg-zinc-900">
                            {technologies.map((tech, index) => (
                              <Badge key={index} className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50">
                                {tech}
                                {isEditMode && (
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveTechnology(tech)}
                                    className="rounded-full h-4 w-4 flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 ml-1 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </Badge>
                            ))}
                            
                            {isEditMode && (
                              <div className="flex">
                                <Input
                                  value={techInput}
                                  onChange={(e) => setTechInput(e.target.value)}
                                  placeholder="Add technology..."
                                  className="h-8 text-sm min-w-[120px] max-w-[200px]"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddTechnology();
                                    }
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleAddTechnology}
                                  className="h-8 px-2 ml-1"
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="author-name">Author Name</Label>
                        <Input 
                          id="author-name" 
                          value={authorName}
                          onChange={(e) => setAuthorName(e.target.value)}
                          placeholder="Defaults to site owner"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="author-role">Author Role</Label>
                        <Input 
                          id="author-role" 
                          value={authorRole}
                          onChange={(e) => setAuthorRole(e.target.value)}
                          placeholder="Defaults to site owner role"
                          disabled={!isEditMode}
                        />
                      </div>
                      <div>
                        <Label htmlFor="read-time">Read Time</Label>
                        <Input 
                          id="read-time" 
                          value={readTime}
                          onChange={(e) => setReadTime(e.target.value)}
                          placeholder="e.g., 5 min read"
                          disabled={!isEditMode}
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="author-image" className={formErrors.authorImage ? "text-red-500" : ""}>
                        Author Image URL{formErrors.authorImage && <span className="text-red-500">*</span>}
                      </Label>
                      <div className="flex gap-2">
                        <Input 
                          id="author-image" 
                          type="url"
                          value={authorImage}
                          onChange={(e) => {
                            setAuthorImage(e.target.value);
                            // Clear error when user starts typing
                            if (formErrors.authorImage) {
                              setFormErrors(prev => ({ ...prev, authorImage: undefined }));
                            }
                          }}
                          disabled={!isEditMode}
                          placeholder="https://example.com/image.jpg"
                          className={formErrors.authorImage ? "border-red-500 focus-visible:ring-red-500" : ""}
                          aria-invalid={!!formErrors.authorImage}
                          aria-describedby={formErrors.authorImage ? "authorImage-error" : undefined}
                        />
                        {authorImage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="flex-shrink-0 h-10 w-10"
                            onClick={() => window.open(authorImage, '_blank')}
                          >
                            <Eye size={18} />
                          </Button>
                        )}
                      </div>
                      {formErrors.authorImage && (
                        <p id="authorImage-error" className="text-red-500 text-xs mt-1">{formErrors.authorImage}</p>
                      )}
                      {authorImage && (
                        <div className="mt-2 rounded-md overflow-hidden h-16 w-16 border border-zinc-200 dark:border-zinc-700">
                          <img 
                            src={authorImage} 
                            alt="Author Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (!formErrors.authorImage) {
                                setFormErrors(prev => ({ 
                                  ...prev, 
                                  authorImage: "Unable to load image. Please check the URL."
                                }));
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="mt-0">
                  {renderPreview()}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default BlogEditor;
