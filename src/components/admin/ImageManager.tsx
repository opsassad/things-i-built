import { useState, useRef } from "react";
import { 
  Upload, 
  Trash2, 
  Copy, 
  Pencil,
  Check,
  X,
  Loader,
  Image as ImageIcon,
  Search,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { toast } from "../../hooks/use-toast";
import { useContent } from "../../context/ContentContext";
import { getPublicMediaUrl } from '@/lib/supabaseClient';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from "../ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "@/lib/utils";

const ImageManager = () => {
  const { mediaLibrary, uploadMedia, deleteMedia, updateMediaName, isEditMode } = useContent();
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'newest'|'oldest'|'name'|'size'>('newest');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to upload images.",
        variant: "destructive",
      });
      return;
    }
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      try {
        setIsUploading(true);

        // We need file info for the upload function
        const fileInfo = {
          name: file.name,
          size: `${(file.size / 1024).toFixed(2)} KB`, // Calculate size
          type: file.type
        }
        
        // The uploadMedia function in ContentContext now handles storage directly
        // It expects an object with name, url (as data/blob), size, type
        const dataUrl = await fileToDataUrl(file); // Need to convert to data URL for the upload function

        const uploadedMedia = await uploadMedia({
          name: fileInfo.name,
          url: dataUrl, 
          size: fileInfo.size,
          type: fileInfo.type
        });
        
        // No need to check for fallback here, uploadMedia handles DB insertion
        toast({
          title: "Image Uploaded",
          description: "Your image has been uploaded successfully.",
          variant: "default",
        });
        
        setIsUploading(false);
        setSelectedFile(null);
        
        // Reset the file input
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error: any) {
        console.error('Error uploading file', error);
        setIsUploading(false);
        setSelectedFile(null);
        
        toast({
          title: "Upload Failed",
          description: error.message || "There was an error uploading your image.",
          variant: "destructive",
        });
        // Reset the file input on failure too
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };
  
  const handleDeleteImage = async (id: string) => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to delete images.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await deleteMedia(id);
      setImageToDelete(null);
      setShowDeleteDialog(false);
      toast({
        title: "Image Deleted",
        description: "The image has been deleted successfully.",
        variant: "destructive",
      });
    } catch (error) {
      console.error('Error deleting image', error);
      toast({
        title: "Delete Failed",
        description: "There was an error deleting the image.",
        variant: "destructive",
      });
    }
  };
  
  const confirmDelete = (id: string) => {
    setImageToDelete(id);
    setShowDeleteDialog(true);
  };
  
  const handleCopyUrl = (url: string) => {
    // Transform the URL to the masked version before copying
    const maskedUrl = getPublicMediaUrl(url);
    
    // Use absolute URL with origin for proper copying from any location
    const absoluteUrl = window.location.origin + maskedUrl;
    
    navigator.clipboard.writeText(absoluteUrl);
    toast({
      title: "URL Copied",
      description: "Image URL copied to clipboard.",
      variant: "default",
    });
  };
  
  const startEditingImage = (id: string, name: string) => {
    if (!isEditMode) {
      toast({
        title: "Edit Mode Required",
        description: "Please enable edit mode to rename images.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingImage(id);
    setEditedName(name);
  };
  
  const saveImageName = async (id: string) => {
    try {
      await updateMediaName(id, editedName);
      setEditingImage(null);
      toast({
        title: "Image Renamed",
        description: "The image has been renamed successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error renaming image', error);
      toast({
        title: "Rename Failed",
        description: "There was an error renaming the image.",
        variant: "destructive",
      });
    }
  };

  // Filter and sort media library
  const filteredMedia = mediaLibrary
    .filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.size.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'oldest':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          // Extract number from size string (e.g., "128.45 KB" becomes 128.45)
          const sizeA = parseFloat(a.size.split(' ')[0]);
          const sizeB = parseFloat(b.size.split(' ')[0]);
          return sizeB - sizeA; // Larger files first
        default:
          return 0;
      }
    });
  
  return (
    <Card className="bg-white dark:bg-zinc-800/50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <CardTitle>Media Library</CardTitle>
            <CardDescription className="mt-1">
              Manage images and media files for your website
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "w-10 p-0",
                viewMode === 'grid' ? "bg-zinc-900 text-white hover:bg-zinc-800" : "hover:text-zinc-900"
              )}
              onClick={() => setViewMode('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
              </svg>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "w-10 p-0",
                viewMode === 'list' ? "bg-zinc-900 text-white hover:bg-zinc-800" : "hover:text-zinc-900"
              )}
              onClick={() => setViewMode('list')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" x2="21" y1="6" y2="6" />
                <line x1="3" x2="21" y1="12" y2="12" />
                <line x1="3" x2="21" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Upload section */}
          <div className="bg-zinc-50 dark:bg-zinc-800/30 p-5 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-700">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-zinc-100 dark:bg-zinc-700 p-3 mb-1">
                <Upload size={20} className="text-zinc-600 dark:text-zinc-300" />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
                Drag and drop image files, or click to browse your device
              </p>
              <input 
                ref={fileInputRef}
                id="image-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                disabled={!isEditMode || isUploading}
              />
              <Button 
                type="button"
                disabled={!isEditMode || isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2"
                variant={isEditMode ? "default" : "outline"}
              >
                {isUploading ? (
                  <>
                    <Loader size={16} className="mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
              {!isEditMode && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                  Enable edit mode to upload files
                </p>
              )}
            </div>
          </div>
          
          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <div className="relative w-full sm:max-w-[320px]">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search media library..."
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown size={16} />
                  Sort by:
                  <span className="font-medium">
                    {sortBy === 'newest' ? 'Newest' : 
                     sortBy === 'oldest' ? 'Oldest' : 
                     sortBy === 'name' ? 'Name' : 'Size'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-md">
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('size')}>
                  Size (Largest)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Media library display */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-12 border border-zinc-200 dark:border-zinc-700 rounded-md bg-zinc-50 dark:bg-zinc-800/30">
              <ImageIcon className="h-12 w-12 mx-auto text-zinc-400" />
              <h3 className="mt-4 text-lg font-medium">No media found</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {searchTerm ? `No results match "${searchTerm}"` : "Your media library is empty. Upload some images to get started."}
              </p>
              {isEditMode && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={16} className="mr-2" />
                  Upload Images
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((image) => (
                <Card key={image.id} className="group overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                  <div 
                    className="relative h-36 overflow-hidden cursor-pointer"
                    onClick={() => setPreviewImage(image.url)}
                  >
                    <img 
                      src={image.url} 
                      alt={image.name} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
                        <Search size={14} className="mr-1" /> Preview
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3">
                    {editingImage === image.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="text-sm h-8"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600"
                          onClick={() => saveImageName(image.id)}
                        >
                          <Check size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setEditingImage(null)}
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 truncate">
                          <p className="text-sm font-medium truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {image.size} • {new Date(image.date).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleCopyUrl(image.url)}
                                >
                                  <Copy size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copy URL</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            {isEditMode && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => startEditingImage(image.id, image.name)}
                                    >
                                      <Pencil size={14} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Rename</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => confirmDelete(image.id)}
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Delete</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </TooltipProvider>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="border rounded-md border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <table className="w-full">
                <thead className="bg-zinc-50 dark:bg-zinc-800">
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Image</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden sm:table-cell">Size</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300 hidden md:table-cell">Date</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {filteredMedia.map((image) => (
                    <tr key={image.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/70">
                      <td className="py-3 px-4">
                        <div 
                          className="h-12 w-12 rounded overflow-hidden cursor-pointer"
                          onClick={() => setPreviewImage(image.url)}
                        >
                          <img 
                            src={image.url} 
                            alt={image.name} 
                            className="h-full w-full object-cover" 
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        {editingImage === image.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="text-sm h-8"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-green-600"
                              onClick={() => saveImageName(image.id)}
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600"
                              onClick={() => setEditingImage(null)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        ) : (
                          <div className="truncate">
                            <p className="font-medium truncate">{image.name}</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">{image.type}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 hidden sm:table-cell">{image.size}</td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 hidden md:table-cell">
                        {new Date(image.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleCopyUrl(image.url)}
                          >
                            <Copy size={14} />
                          </Button>
                          
                          {isEditMode && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => startEditingImage(image.id, image.name)}
                              >
                                <Pencil size={14} />
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => confirmDelete(image.id)}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-white dark:bg-zinc-900 border shadow-lg">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            {imageToDelete && (
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded overflow-hidden flex-shrink-0">
                  <img 
                    src={mediaLibrary.find(img => img.id === imageToDelete)?.url || ''} 
                    alt="Image to delete" 
                    className="h-full w-full object-cover" 
                  />
                </div>
                <div>
                  <p className="font-medium">{mediaLibrary.find(img => img.id === imageToDelete)?.name || 'Unnamed'}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {mediaLibrary.find(img => img.id === imageToDelete)?.size || ''}
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => imageToDelete && handleDeleteImage(imageToDelete)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image preview dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="sm:max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-4 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            {previewImage && (
              <img 
                src={previewImage} 
                alt="Preview" 
                className="max-h-[70vh] max-w-full object-contain" 
              />
            )}
          </div>
          <DialogFooter>
            {previewImage && (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => handleCopyUrl(previewImage)}
                  className="mr-auto"
                >
                  <Copy size={16} className="mr-2" />
                  Copy URL
                </Button>
                <Button onClick={() => setPreviewImage(null)}>
                  Close
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default ImageManager;
