import { useEditor, EditorContent, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Typography from '@tiptap/extension-typography';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { useContent } from '../../context/ContentContext';
import { toast } from '../../hooks/use-toast';
import { Separator } from '../ui/separator';
import { Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, ListOrdered, Image as ImageIcon, Link as LinkIcon, Crop as CropIcon, Maximize } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { normalizeImageHtml } from '../../lib/utils';

// For the cropping functionality
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';

// Add global CSS for the editor
const editorStyles = `
.ProseMirror {
  min-height: 150px;
  position: relative;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  transition: all 0.1s ease-in-out;
}

.ProseMirror img.ProseMirror-selectednode {
  outline: 2px solid #68CEF8;
}

/* Alignment styles for images */
.ProseMirror div[style*="text-align: center"] img {
  margin: 0 auto;
  display: block;
}

.ProseMirror div[style*="text-align: left"] img {
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  float: left;
}

.ProseMirror div[style*="text-align: right"] img {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
  float: right;
}

/* Handle images with data-align attributes */
.ProseMirror img[data-align="center"] {
  margin: 0 auto;
  display: block;
}

.ProseMirror img[data-align="left"] {
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  float: left;
}

.ProseMirror img[data-align="right"] {
  margin-left: 1rem;
  margin-bottom: 0.5rem;
  float: right;
}

.ProseMirror p.image-container {
  display: flex;
  justify-content: center;
  margin: 1em 0;
}

.ProseMirror .resize-tooltip {
  position: absolute;
  top: -30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  margin: 0 auto;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  color: #475569;
}

/* Basic wrapper styles remain */
.image-resizer-wrapper {
  position: relative;
  display: block;
  max-width: 100%;
  margin: 1em 0;
  clear: both;
}

/* Alignment styles for resizer wrapper */
.image-resizer-wrapper[data-alignment="center"] {
  text-align: center;
  margin-left: auto;
  margin-right: auto;
}

.image-resizer-wrapper[data-alignment="left"] {
  text-align: left;
  float: left;
  margin-right: 1em;
  margin-bottom: 0.5em;
}

.image-resizer-wrapper[data-alignment="right"] {
  text-align: right;
  float: right;
  margin-left: 1em;
  margin-bottom: 0.5em;
}

/* Basic resizer styles remain */
.image-resizer {
  display: inline-block;
  position: relative;
  max-width: 100%;
  vertical-align: middle;
}

/* Basic image styles remain */
.image-resizer img {
  cursor: pointer;
  max-width: 100%;
  height: auto;
  display: block;
}

.image-resizer.selected img {
  cursor: move;
}

/* Resize handles styles remain */
.image-resizer .resize-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background: white;
  border: 1px solid #68CEF8;
  border-radius: 2px;
}

.image-resizer .resize-handle.br {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.image-resizer .resize-handle.tl {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.image-resizer .resize-handle.tr {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.image-resizer .resize-handle.bl {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

/* Controls styles remain */
.image-resizer .image-controls {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  padding: 2px;
  z-index: 10;
}

.image-resizer .image-controls button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: #64748b;
}

.image-resizer .image-controls button:hover {
  background: #f1f5f9;
  color: #334155;
}

.image-resizer .image-controls button.active {
  background: #e0f2fe;
  color: #0284c7;
}

/* Preview mode styles */
.preview-content img {
  max-width: 100%;
  height: auto;
}

.preview-content img[data-align="center"],
.preview-content div[style*="text-align: center"] img {
  margin: 0 auto;
  display: block;
}

.preview-content img[data-align="left"],
.preview-content div[style*="text-align: left"] img {
  float: left;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
}

.preview-content img[data-align="right"],
.preview-content div[style*="text-align: right"] img {
  float: right;
  margin-left: 1rem;
  margin-bottom: 0.5rem;
}

/* Clear floats after floating images */
.preview-content div[style*="text-align"],
.ProseMirror div[style*="text-align"] {
  overflow: auto;
  width: 100%;
}
`;

// Helper function to create a cropped image
const createCroppedImage = (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  rotation = 0
): Promise<string> => {
  const image = new window.Image(); // Use window.Image to avoid conflict with @tiptap/extension-image
  
  // Handle cross-origin images
  image.crossOrigin = "anonymous";
  image.src = imageSrc;
  
  return new Promise((resolve, reject) => {
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Calculate the size of the cropped image
        const scaleX = image.naturalWidth / image.width;
        const scaleY = image.naturalHeight / image.height;
        
        const pixelCrop = {
          x: crop.x * scaleX,
          y: crop.y * scaleY,
          width: crop.width * scaleX,
          height: crop.height * scaleY,
        };
        
        // Set canvas size to the cropped size
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        
        // Draw the cropped image
        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height
        );
        
        // Convert canvas to data URL
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve(dataUrl);
        } catch (e) {
          // If toDataURL fails (usually due to CORS), fall back to the original image
          console.warn('Failed to get image data, using original image due to CORS restrictions', e);
          resolve(imageSrc);
        }
      } catch (e) {
        reject(e);
      }
    };
    
    image.onerror = () => {
      reject(new Error('Error loading image for crop'));
    };
  });
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

// Add an interface for the image cropper component props
interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

// Image cropper component
const ImageCropper = ({ src, onCropComplete, onCancel }: ImageCropperProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | undefined>(16 / 9);
  const [selectedRatio, setSelectedRatio] = useState<string>("16:9");

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onCropAreaChange = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleAspectRatioChange = (ratio: number | undefined, label: string) => {
    setAspectRatio(ratio);
    setSelectedRatio(label);
    // Reset crop position when changing aspect ratio
    setCrop({ x: 0, y: 0 });
  };

  const handleCrop = async () => {
    try {
      setLoading(true);
      const croppedImage = await createCroppedImage(
        src,
        croppedAreaPixels,
        rotation
      );
      
      onCropComplete(croppedImage);
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: 'Error',
        description: 'Failed to crop the image.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="image-cropper-container">
      <div className="relative h-80 bg-zinc-800 rounded overflow-hidden">
        {aspectRatio !== undefined ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            rotation={rotation}
            onRotationChange={onRotationChange}
            objectFit="contain"
            classes={{
              containerClassName: 'h-full',
              mediaClassName: 'h-full',
            }}
          />
        ) : (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropAreaChange}
            rotation={rotation}
            onRotationChange={onRotationChange}
            objectFit="contain"
            classes={{
              containerClassName: 'h-full',
              mediaClassName: 'h-full',
            }}
          />
        )}
      </div>
      
      <div className="mt-4 space-y-4">
        {/* Aspect ratio selector */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedRatio === "Free" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(undefined, "Free")}
            >
              Free
            </Button>
            <Button 
              variant={selectedRatio === "1:1" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(1 / 1, "1:1")}
            >
              1:1
            </Button>
            <Button 
              variant={selectedRatio === "4:3" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(4 / 3, "4:3")}
            >
              4:3
            </Button>
            <Button 
              variant={selectedRatio === "3:4" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(3 / 4, "3:4")}
            >
              3:4
            </Button>
            <Button 
              variant={selectedRatio === "16:9" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(16 / 9, "16:9")}
            >
              16:9
            </Button>
            <Button 
              variant={selectedRatio === "9:16" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleAspectRatioChange(9 / 16, "9:16")}
            >
              9:16
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-800 dark:text-zinc-200">Rotation</label>
          <input
            type="range"
            value={rotation}
            min={0}
            max={360}
            step={1}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={loading}>
            {loading ? 'Processing...' : 'Apply Crop'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Create a React component for the resizable image 
const ResizableImageComponent = (props: any) => {
  const { editor, node, updateAttributes, selected } = props;
  const [size, setSize] = useState({
    width: node.attrs.width || undefined,
    height: node.attrs.height || undefined,
  });
  const [resizing, setResizing] = useState(false);
  const [showSizeInfo, setShowSizeInfo] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [alignment, setAlignment] = useState(node.attrs.alignment || 'center');

  // Store the original size to use for calculating aspect ratio
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  // Use a standard ref without any callback
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle image loading in a separate useEffect
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
    
    const handleLoad = () => {
      setOriginalSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    // If image is already loaded
    if (img.complete && img.naturalWidth) {
      handleLoad();
    } else {
      // Add event listener for when image loads
      img.addEventListener('load', handleLoad);
      // Clean up event listener
      return () => img.removeEventListener('load', handleLoad);
    }
  }, [node.attrs.src]); // Re-run when image source changes

  // Update alignment state when node attribute changes (for external updates)
  useEffect(() => {
    if (node.attrs.alignment !== alignment) {
      setAlignment(node.attrs.alignment || 'center');
    }
  }, [node.attrs.alignment]);

  const resetSize = () => {
    updateAttributes({ width: null, height: null });
    setSize({ width: undefined, height: undefined });
  };

  const handleAlignmentChange = (newAlignment: string) => {
    setAlignment(newAlignment);
    updateAttributes({ alignment: newAlignment });
  };

  const startResizing = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    
    // Only allow resizing in edit mode
    if (!editor.isEditable) return;
    
    const startX = e.pageX;
    const startY = e.pageY;
    
    // Get current width and height
    const startWidth = size.width || originalSize.width || 100;
    const startHeight = size.height || originalSize.height || 100;
    
    // Calculate aspect ratio if needed
    const aspectRatio = originalSize.width / originalSize.height || 1;
    
    setResizing(true);
    setShowSizeInfo(true);
    
    const onMouseMove = (e: MouseEvent) => {
      const currentX = e.pageX;
      const currentY = e.pageY;
      
      // Calculate horizontal difference
      const diffX = currentX - startX;
      
      let newWidth, newHeight;
      
      if (corner.includes('r')) { // Right side handles
        newWidth = Math.max(50, startWidth + diffX);
      } else { // Left side handles
        newWidth = Math.max(50, startWidth - diffX);
      }
      
      // Calculate height based on aspect ratio
      newHeight = Math.round(newWidth / aspectRatio);
      
      // Safely update states with non-zero values
      if (newWidth > 0 && newHeight > 0) {
        setSize({ width: newWidth, height: newHeight });
        
        // Use a timeout to avoid too many rapid updates
        const safeUpdate = () => {
          if (newWidth > 10 && newHeight > 10) {
            // Use requestAnimationFrame to safely schedule DOM updates outside React's rendering cycle
            requestAnimationFrame(() => {
              updateAttributes({ width: newWidth, height: newHeight });
            });
          }
        };
        
        // Debounce the update for better performance
        safeUpdate();
      }
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      
      // Ensure final update happens
      const finalWidth = size.width;
      const finalHeight = size.height;
      
      if (finalWidth && finalHeight && finalWidth > 10 && finalHeight > 10) {
        // Use requestAnimationFrame to ensure this happens outside React's rendering cycle
        requestAnimationFrame(() => {
          updateAttributes({ width: finalWidth, height: finalHeight });
        });
      }
      
      // Use requestAnimationFrame for state updates to avoid React warnings
      requestAnimationFrame(() => {
        setResizing(false);
        setShowSizeInfo(false);
      });
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  // For selecting the image on click
  const selectImage = () => {
    if (editor.isEditable) {
      try {
        // Use requestAnimationFrame to move this operation outside of React's rendering cycle
        // This avoids the flushSync warning
        requestAnimationFrame(() => {
          // Fixed approach to select the node
          const { view } = editor;
          const nodePos = props.getPos();
          
          if (typeof nodePos === 'number') {
            const position = nodePos;
            const { state } = view;
            const { tr } = state;
            
            view.dispatch(tr.setSelection(NodeSelection.create(state.doc, position)));
            editor.commands.focus();
          }
        });
      } catch (error) {
        console.error("Error selecting image node:", error);
      }
    }
  };

  const handleCropClick = () => {
    setIsCropping(true);
  };

  const handleCropComplete = (croppedImageUrl: string) => {
    // Update the image source with the cropped version
    updateAttributes({ 
      src: croppedImageUrl,
      // Reset width and height after cropping to let the image display naturally
      width: null,
      height: null
    });
    setSize({ width: undefined, height: undefined });
    setIsCropping(false);
    
    toast({
      title: "Image Cropped",
      description: "Your image has been cropped successfully.",
      variant: "default",
    });
  };

  const handleCropCancel = () => {
    setIsCropping(false);
  };

  const width = size.width;
  const height = size.height;

  return (
    <NodeViewWrapper 
      className="image-resizer-wrapper" 
      data-alignment={alignment}
    >
      <div 
        className={`image-resizer ${selected ? 'selected' : ''}`}
        style={{ 
          maxWidth: '100%',
          width: width ? `${width}px` : 'auto'
        }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          width={width}
          height={height}
          onClick={selectImage}
          style={{
            maxWidth: '100%',
            display: 'block',
            width: '100%',
            height: 'auto',
            margin: alignment === 'center' ? '0 auto' : '0'
          }}
        />
        
        {selected && editor.isEditable && (
          <>
            <div 
              className="resize-handle tl" 
              onMouseDown={(e) => startResizing(e, 'tl')}
            />
            <div 
              className="resize-handle tr" 
              onMouseDown={(e) => startResizing(e, 'tr')}
            />
            <div 
              className="resize-handle bl" 
              onMouseDown={(e) => startResizing(e, 'bl')}
            />
            <div 
              className="resize-handle br" 
              onMouseDown={(e) => startResizing(e, 'br')}
            />
            
            <div className="image-controls">
              <button onClick={resetSize} title="Reset to original size">
                <Maximize size={14} />
              </button>
              <button onClick={handleCropClick} title="Crop image">
                <CropIcon size={14} />
              </button>
              <button 
                onClick={() => handleAlignmentChange('left')} 
                title="Align left"
                className={alignment === 'left' ? 'active' : ''}
              >
                <AlignLeft size={14} />
              </button>
              <button 
                onClick={() => handleAlignmentChange('center')} 
                title="Align center"
                className={alignment === 'center' ? 'active' : ''}
              >
                <AlignCenter size={14} />
              </button>
              <button 
                onClick={() => handleAlignmentChange('right')} 
                title="Align right"
                className={alignment === 'right' ? 'active' : ''}
              >
                <AlignRight size={14} />
              </button>
            </div>
            
            {showSizeInfo && (
              <div className="resize-tooltip">
                {width}×{Math.round(height || 0)}px
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={isCropping} onOpenChange={setIsCropping}>
        <DialogContent 
          className="sm:max-w-[700px] bg-white dark:bg-zinc-900"
        >
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Adjust the crop area, zoom, and rotation to customize your image.
            </DialogDescription>
          </DialogHeader>
          <ImageCropper 
            src={node.attrs.src} 
            onCropComplete={handleCropComplete}
            onCancel={handleCropCancel}
          />
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  );
};

// Create a custom image extension
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      alignment: {
        default: 'center',
      }
    };
  },
  
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

// Import needed for the NodeViewRenderer and NodeSelection
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeSelection } from 'prosemirror-state';

// Add this wrapper component above the main RichTextEditor component
const EditorWrapper = ({ editor }: { editor: any }) => {
  const [shouldRender, setShouldRender] = useState(false);
  
  // Only render the actual EditorContent after component mount is complete
  useEffect(() => {
    // Use setTimeout with 0ms delay to push to next event loop tick
    const timer = setTimeout(() => {
      setShouldRender(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <div className="min-h-[200px] bg-white" />;
  }

  // Actual editor content only rendered after component is fully mounted
  return <EditorContent editor={editor} className="prose prose-zinc max-w-none" />;
};

const RichTextEditor = ({ value, onChange, placeholder, readOnly = false }: RichTextEditorProps) => {
  const { mediaLibrary, isEditMode } = useContent();
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [mounted, setMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Typography,
      ResizableImage.configure({
        HTMLAttributes: {
          class: 'resizable-image',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    editable: !readOnly && isEditMode,
    onUpdate: ({ editor }) => {
      // Use queueMicrotask to defer the update outside of React's rendering cycle
      // This prevents flushSync from being called during React's render phase
      queueMicrotask(() => {
        const html = editor.getHTML();
        // Apply normalizeImageHtml to ensure alignment attributes are properly handled
        onChange(normalizeImageHtml(html));
      });
    },
    autofocus: true,
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Use requestAnimationFrame to ensure editor updates happen *after* the current paint cycle
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return; // Check if editor is still valid
        editor.commands.setContent(value || '', false); // Pass false to prevent triggering onUpdate
      });
    }
  }, [value, editor]);

  // Update editor editability when readOnly or isEditMode changes
  useEffect(() => {
    if (editor) {
      // Use requestAnimationFrame to ensure editor updates happen *after* the current paint cycle
      requestAnimationFrame(() => {
        if (editor.isDestroyed) return; // Check if editor is still valid
        editor.setEditable(!readOnly && isEditMode);
      });
    }
  }, [editor, readOnly, isEditMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const insertImage = useCallback((url: string) => {
    if (!editor) return;

    // Use queueMicrotask to ensure editor updates happen outside React's render cycle
    queueMicrotask(() => {
      // First insert the image with basic attributes
      editor
        .chain()
        .focus()
        .setImage({ 
          src: url,
          alt: 'Inserted image'
        })
        .run();
      
      // Find the newly inserted image node and set alignment
      // This uses editor state directly to avoid TypeScript constraints with the setImage command
      const { state } = editor;
      const { tr } = state;
      const currentPos = state.selection.anchor;
      
      // Look for the image node at or before current position
      let imageFound = false;
      state.doc.nodesBetween(Math.max(0, currentPos - 5), currentPos + 5, (node, pos) => {
        if (imageFound) return false; // Skip if already found
        if (node.type.name === 'image' && node.attrs.src === url) {
          // Found the image, update its attributes
          tr.setNodeMarkup(pos, undefined, {
            ...node.attrs,
            alignment: 'center',
          });
          editor.view.dispatch(tr);
          imageFound = true;
          return false; // Stop searching
        }
        return true; // Keep searching
      });
      
      setShowImageSelector(false);
      
      toast({
        title: "Image Inserted",
        description: "The image has been added to your content. Click on it to resize or crop.",
        variant: "default",
      });
    });
  }, [editor]);

  const handleImageButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any default behavior
    e.stopPropagation(); // Stop event propagation
    
    if (!readOnly && isEditMode) {
      setShowImageSelector(prev => !prev);
    }
  }, [readOnly, isEditMode]);

  if (!mounted) {
    return <div className="min-h-[300px] bg-white border rounded-md p-4">Loading editor...</div>;
  }

  return (
    <div className="rich-text-editor">
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      <Tabs 
        value={editorMode} 
        onValueChange={(value) => setEditorMode(value as 'edit' | 'preview')}
        className="mb-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Bold size={16} />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <AlignLeft size={16} />
            Preview
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-0">
          <div className="bg-white border rounded-md mb-3">
            <div className="flex items-center gap-1 p-2 flex-wrap border-b sticky top-20 bg-white z-10 shadow-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                data-active={editor?.isActive('bold')}
                disabled={!isEditMode || readOnly}
              >
                <Bold size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                data-active={editor?.isActive('italic')}
                disabled={!isEditMode || readOnly}
              >
                <Italic size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                data-active={editor?.isActive('underline')}
                disabled={!isEditMode || readOnly}
              >
                <UnderlineIcon size={16} />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().setTextAlign('left').run()}
                data-active={editor?.isActive({ textAlign: 'left' })}
                disabled={!isEditMode || readOnly}
              >
                <AlignLeft size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().setTextAlign('center').run()}
                data-active={editor?.isActive({ textAlign: 'center' })}
                disabled={!isEditMode || readOnly}
              >
                <AlignCenter size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().setTextAlign('right').run()}
                data-active={editor?.isActive({ textAlign: 'right' })}
                disabled={!isEditMode || readOnly}
              >
                <AlignRight size={16} />
              </Button>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                data-active={editor?.isActive('orderedList')}
                disabled={!isEditMode || readOnly}
              >
                <ListOrdered size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleImageButtonClick}
                disabled={!isEditMode || readOnly}
                type="button"
              >
                <ImageIcon size={16} />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  if (!editor || !isEditMode || readOnly) return;
                  const url = window.prompt('Enter the URL:');
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run();
                  }
                }}
                data-active={editor?.isActive('link')}
                disabled={!isEditMode || readOnly}
              >
                <LinkIcon size={16} />
              </Button>
            </div>
            <div className={`p-4 min-h-[200px] ${readOnly || !isEditMode ? 'opacity-80' : ''}`}>
              {editor && <EditorWrapper editor={editor} />}
              {isEditMode && !readOnly && (
                <div className="text-xs text-gray-500 mt-2">
                  <span className="font-medium">Tip:</span> Click on an image to select it, then use the controls to resize or crop it.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-0">
          <div className="bg-white border rounded-md p-6 min-h-[300px] prose prose-zinc max-w-none">
            <div 
              className="preview-content" 
              dangerouslySetInnerHTML={{ __html: value ? normalizeImageHtml(value) : '' }} 
            />
            {!value && (
              <p className="text-gray-400 italic">No content to preview yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {showImageSelector && (
        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Select an image</h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowImageSelector(false)}
              type="button"
            >
              Close
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto">
            {mediaLibrary.map(image => (
              <div 
                key={image.id}
                className="aspect-square bg-white border rounded-md overflow-hidden hover:border-zinc-400 cursor-pointer transition-colors"
                onClick={() => insertImage(image.url)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    insertImage(image.url);
                  }
                }}
              >
                <img 
                  src={image.url} 
                  alt={image.name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ))}
            
            {mediaLibrary.length === 0 && (
              <div className="col-span-4 p-8 text-center text-zinc-500">
                No images available. Add images in the Media Library.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
