import { useState, useEffect } from "react";
import {
  MessageSquare,
  Check,
  X,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  Trash2,
  UserCheck,
  AlertTriangle,
  ArrowUpDown,
  Eye,
  Link as LinkIcon,
  ExternalLink
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { useContent } from "../../context/ContentContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { toast } from "../../hooks/use-toast";
import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface Comment {
  id: number;
  post_id: string;
  name: string;
  email: string;
  content: string;
  created_at: string;
  approved: boolean;
  comment_count: number;
  post_title?: string;  // Joined from blog_posts
}

const CommentManager = () => {
  // Comments state
  const [comments, setComments] = useState<Comment[]>([]);
  const [pendingComments, setPendingComments] = useState<Comment[]>([]);
  const [approvedComments, setApprovedComments] = useState<Comment[]>([]);
  const [rejectedComments, setRejectedComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  
  // Filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "post">("newest");
  const [filterByPost, setFilterByPost] = useState<string | null>(null);
  
  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  
  // Comment detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  
  // Content context to access blog posts
  const { blogPosts } = useContent();

  // Fetch all comments with post title
  const fetchComments = async () => {
    setIsLoading(true);
    try {
      // Fetch all comments with admin access - this should work with the new admin policy
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id, 
          post_id, 
          name, 
          email, 
          content, 
          created_at, 
          approved, 
          comment_count
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Raw comments data count:", data?.length || 0);
      console.log("Comments fetched directly:", data);
      
      // Check if any comments have null or undefined comment_count
      const nullCommentCount = data.filter(c => c.comment_count === null || c.comment_count === undefined);
      console.log("Comments with null/undefined comment_count:", nullCommentCount);
      
      // Check which comments should be pending (approved=false, comment_count !== -1)
      const shouldBePending = data.filter(c => c.approved === false && (c.comment_count !== -1 && c.comment_count !== null && c.comment_count !== undefined));
      console.log("Comments that SHOULD be pending:", shouldBePending);
      
      // Add post titles to comments
      const enhancedComments = data.map(comment => {
        const post = blogPosts.find(post => post.id === comment.post_id);
        return {
          ...comment,
          post_title: post?.title || "Unknown Post"
        };
      });
      
      setComments(enhancedComments);
      
      // Separate comments by status
      // In our database, comments are simply marked as approved=true/false
      // There's no separate "rejected" state using comment_count=-1
      setPendingComments(enhancedComments.filter(c => c.approved === false)); 
      setApprovedComments(enhancedComments.filter(c => c.approved === true));
      // For future use, but currently we don't have any
      setRejectedComments([]); 
      
      console.log("Comments loaded:", {
        all: enhancedComments.length,
        pending: enhancedComments.filter(c => c.approved === false).length,
        approved: enhancedComments.filter(c => c.approved === true).length,
        rejected: 0, // No rejected comments currently
      });
      
      // Debug logs for comments that are failing to show in pending list
      const nonRejectedUnapprovedComments = enhancedComments.filter(c => c.approved === false && c.comment_count !== -1);
      console.log("Non-rejected, unapproved comments:", nonRejectedUnapprovedComments);
      
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load comments on component mount
  useEffect(() => {
    fetchComments();
  }, [blogPosts]);

  // Handle approving a comment
  const handleApproveComment = async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ approved: true })
        .eq('id', comment.id);

      if (error) throw error;
      
      toast({
        title: "Comment Approved",
        description: "The comment is now publicly visible.",
      });
      
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error approving comment:", error);
      toast({
        title: "Error",
        description: "Failed to approve comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle rejecting a comment
  const handleRejectComment = async (comment: Comment) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          approved: false
          // We're not using comment_count to mark rejected comments
        })
        .eq('id', comment.id);

      if (error) throw error;
      
      toast({
        title: "Comment Rejected",
        description: "The comment has been rejected.",
      });
      
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error rejecting comment:", error);
      toast({
        title: "Error",
        description: "Failed to reject comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentToDelete.id);

      if (error) throw error;
      
      toast({
        title: "Comment Deleted",
        description: "The comment has been permanently deleted.",
      });
      
      setShowDeleteDialog(false);
      setCommentToDelete(null);
      fetchComments(); // Refresh comments
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Show comment details
  const showCommentDetails = (comment: Comment) => {
    setSelectedComment(comment);
    setShowDetailDialog(true);
  };

  // Format comment creation date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get filtered and sorted comments based on active tab
  const getFilteredComments = () => {
    let filteredComments = [];
    
    switch (activeTab) {
      case "pending":
        filteredComments = [...pendingComments];
        break;
      case "approved":
        filteredComments = [...approvedComments];
        break;
      default:
        filteredComments = [...comments];
    }
    
    // Apply search filter
    if (searchTerm) {
      filteredComments = filteredComments.filter(comment => 
        comment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comment.post_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply post filter
    if (filterByPost) {
      filteredComments = filteredComments.filter(comment => 
        comment.post_id === filterByPost
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case "newest":
        filteredComments.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        break;
      case "oldest":
        filteredComments.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case "post":
        filteredComments.sort((a, b) => 
          (a.post_title || "").localeCompare(b.post_title || "")
        );
        break;
    }
    
    return filteredComments;
  };

  // Get unique posts for filtering
  const getUniquePosts = () => {
    const uniquePosts = Array.from(new Set(comments.map(comment => comment.post_id)))
      .map(postId => {
        const post = blogPosts.find(post => post.id === postId);
        return {
          id: postId,
          title: post?.title || "Unknown Post"
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
    
    return uniquePosts;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>Pending</span>
              {pendingComments.length > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 h-5">
                  {pendingComments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle size={16} />
              <span>Approved</span>
              {approvedComments.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 h-5">
                  {approvedComments.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search comments..."
                className="pl-8 w-[200px] md:w-[300px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter size={16} />
                  <span>Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md">
                <DropdownMenuItem className="font-medium text-xs text-muted-foreground">
                  FILTER BY POST
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setFilterByPost(null)}
                  className={cn("flex items-center gap-2", !filterByPost && "font-semibold")}
                >
                  {!filterByPost && <Check size={16} className="text-green-600" />}
                  <span>All Posts</span>
                </DropdownMenuItem>
                {getUniquePosts().map(post => (
                  <DropdownMenuItem 
                    key={post.id}
                    onClick={() => setFilterByPost(post.id)}
                    className={cn("flex items-center gap-2", filterByPost === post.id && "font-semibold")}
                  >
                    {filterByPost === post.id && <Check size={16} className="text-green-600" />}
                    <span className="truncate">{post.title}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown size={16} />
                  <span>Sort</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md">
                <DropdownMenuItem 
                  onClick={() => setSortBy("newest")}
                  className={cn("flex items-center gap-2", sortBy === "newest" && "font-semibold")}
                >
                  {sortBy === "newest" && <Check size={16} className="text-green-600" />}
                  <span>Newest First</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("oldest")}
                  className={cn("flex items-center gap-2", sortBy === "oldest" && "font-semibold")}
                >
                  {sortBy === "oldest" && <Check size={16} className="text-green-600" />}
                  <span>Oldest First</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("post")}
                  className={cn("flex items-center gap-2", sortBy === "post" && "font-semibold")}
                >
                  {sortBy === "post" && <Check size={16} className="text-green-600" />}
                  <span>Group by Post</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <TabsContent value="pending" className="mt-0">
          <CommentsTable 
            comments={getFilteredComments()} 
            isLoading={isLoading}
            onApprove={handleApproveComment}
            onReject={handleRejectComment}
            onDelete={(comment) => {
              setCommentToDelete(comment);
              setShowDeleteDialog(true);
            }}
            onViewDetails={showCommentDetails}
            emptyMessage="No pending comments to review."
            className="bg-card border rounded-lg shadow-sm"
          />
        </TabsContent>

        <TabsContent value="approved" className="mt-0">
          <CommentsTable 
            comments={getFilteredComments()} 
            isLoading={isLoading}
            onApprove={handleApproveComment}
            onReject={handleRejectComment}
            onDelete={(comment) => {
              setCommentToDelete(comment);
              setShowDeleteDialog(true);
            }}
            onViewDetails={showCommentDetails}
            emptyMessage="No approved comments."
            className="bg-card border rounded-lg shadow-sm"
          />
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-background border shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {commentToDelete && (
            <div className="my-4 p-4 bg-muted rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{commentToDelete.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium leading-none">{commentToDelete.name}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(commentToDelete.created_at)}</p>
                </div>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap">{commentToDelete.content}</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="gap-2" onClick={handleDeleteComment}>
              <Trash2 size={16} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-lg p-0">
          <DialogHeader className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <DialogTitle className="text-xl font-semibold">Comment Details</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              Review and manage this comment
            </DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <div className="px-6 py-4">
              {/* Header info: Author and Date */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-700">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 bg-primary/10 border border-primary/20">
                    <AvatarFallback className="font-medium text-primary">{selectedComment.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedComment.name}</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">{selectedComment.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Posted on</span>
                  <p className="font-medium">{formatDate(selectedComment.created_at)}</p>
                </div>
              </div>

              {/* Post information */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">On Post</h3>
                <div className="flex items-center justify-between rounded-md bg-zinc-50 dark:bg-zinc-700/50 p-3 border border-zinc-200 dark:border-zinc-700">
                  <span className="font-medium">{selectedComment.post_title}</span>
                  <Link 
                    to={`/${selectedComment.post_id}`} 
                    target="_blank"
                    className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-sm"
                  >
                    <ExternalLink size={14} />
                    <span>View Post</span>
                  </Link>
                </div>
              </div>

              {/* Comment content */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Comment</h3>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-700/30 rounded-md whitespace-pre-wrap border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200">
                  {selectedComment.content}
                </div>
              </div>

              {/* Status */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Status</h3>
                {selectedComment.approved ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-500 border-green-200 dark:border-green-800 flex items-center gap-1 px-2.5 py-1">
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Approved</span>
                    </Badge>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">This comment is visible to visitors</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                    <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-800 flex items-center gap-1 px-2.5 py-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Pending</span>
                    </Badge>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">This comment is awaiting approval</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="flex px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 gap-2">
            {selectedComment && !selectedComment.approved && (
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white gap-2 flex-1 py-5" 
                onClick={() => {
                  handleApproveComment(selectedComment);
                  setShowDetailDialog(false);
                }}
              >
                <Check size={16} />
                Approve
              </Button>
            )}
            
            {selectedComment && !selectedComment.approved && (
              <Button 
                variant="outline" 
                className="gap-2 flex-1 py-5" 
                onClick={() => {
                  handleRejectComment(selectedComment);
                  setShowDetailDialog(false);
                }}
              >
                <X size={16} />
                Reject
              </Button>
            )}
            
            {selectedComment && selectedComment.approved && (
              <Button 
                variant="outline" 
                className="gap-2 flex-1 py-5" 
                onClick={() => {
                  handleRejectComment(selectedComment);
                  setShowDetailDialog(false);
                }}
              >
                <X size={16} />
                Unapprove
              </Button>
            )}
            
            <Button 
              variant="destructive" 
              className="gap-2 flex-1 py-5" 
              onClick={() => {
                if (selectedComment) {
                  setCommentToDelete(selectedComment);
                  setShowDetailDialog(false);
                  setShowDeleteDialog(true);
                }
              }}
            >
              <Trash2 size={16} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Comments Table Component
interface CommentsTableProps {
  comments: Comment[];
  isLoading: boolean;
  onApprove: (comment: Comment) => void;
  onReject: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onViewDetails: (comment: Comment) => void;
  emptyMessage: string;
  className?: string;
}

const CommentsTable: React.FC<CommentsTableProps> = ({ 
  comments, 
  isLoading, 
  onApprove, 
  onReject, 
  onDelete,
  onViewDetails,
  emptyMessage,
  className
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-12 text-muted-foreground", className)}> 
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin">
            <MessageSquare size={24} />
          </div>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-12 border rounded-md bg-muted/50 text-muted-foreground", className)}> 
        <div className="flex flex-col items-center gap-2">
          <MessageSquare size={24} />
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}> 
      <table className="w-full text-sm bg-white dark:bg-zinc-900">
        <thead>
          <tr className="bg-muted">
            <th className="text-left p-3 font-medium text-muted-foreground">Comment</th>
            <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Post</th>
            <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
            <th className="p-3 font-medium text-muted-foreground text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {comments.map((comment) => (
            <tr key={comment.id} className="bg-white dark:bg-zinc-900 hover:bg-muted/50">
              <td className="p-3 align-top">
                <div className="flex items-start gap-3">
                  <Avatar className="w-8 h-8 border">
                    <AvatarFallback>{comment.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-card-foreground">{comment.name}</span>
                      <span className="text-xs text-muted-foreground hidden md:inline">
                        • {comment.email}
                      </span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{comment.content}</p>
                  </div>
                </div>
              </td>
              <td className="p-3 hidden md:table-cell align-top">
                <span className="truncate max-w-[200px] inline-block text-card-foreground">
                  {comment.post_title}
                </span>
              </td>
              <td className="p-3 text-muted-foreground hidden md:table-cell align-top">
                {formatDate(comment.created_at)}
              </td>
              <td className="p-3 text-right align-top">
                <div className="flex items-center justify-end gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => onViewDetails(comment)}>
                          <Eye size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>View Details</TooltipContent>
                    </Tooltip>

                    {!comment.approved && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onApprove(comment)}
                          >
                            <Check size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve</TooltipContent>
                      </Tooltip>
                    )}

                    {comment.approved && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                            onClick={() => onReject(comment)}
                          >
                            <X size={18} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Unapprove</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDelete(comment)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CommentManager; 