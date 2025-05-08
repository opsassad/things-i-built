import React, { useState, useEffect } from 'react';
import { Star, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { cn } from '../lib/utils';

interface RatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    rating: number;
    email: string;
    name: string;
    comment?: string;
  }) => Promise<void>;
  initialRating: number;
  postTitle: string;
}

const RatingDialog: React.FC<RatingDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialRating,
  postTitle,
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>(''); // Keep this for internal use only
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
  }>({});

  // Extract name from email when email changes
  useEffect(() => {
    if (email) {
      // Simple extraction: take part before @ and format as name
      const namePart = email.split('@')[0];
      if (namePart) {
        // Convert john.doe or john_doe to John Doe
        const formattedName = namePart
          .replace(/[._]/g, ' ') // Replace . or _ with space
          .replace(/\b\w/g, (c) => c.toUpperCase()); // Capitalize first letter of each word
        
        setName(formattedName);
      }
    } else {
      setName(''); // Reset name if email is empty
    }
  }, [email]);

  const validateForm = (): boolean => {
    const newErrors: {
      email?: string;
    } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      await onSubmit({
        rating,
        email,
        name, // Automatically extracted name
        comment: comment.trim() || undefined, // Only send comment if not empty
      });
      
      // Reset form
      setEmail('');
      setComment('');
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
      setIsSubmitting(false);
      // Error is handled by parent component
    }
  };

  const renderStars = () => {
    const stars = [];
    // Show hovered rating if available, or selected rating
    const displayRating = hoveredRating ?? rating ?? 0;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className={cn(
            "transition-all duration-150",
            i <= displayRating ? "text-yellow-400" : "text-gray-300",
            "hover:scale-110 text-3xl"
          )}
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(null)}
          onClick={() => setRating(i)}
          aria-label={`Rate ${i} stars`}
        >
          <Star
            size={36}
            fill={i <= displayRating ? "currentColor" : "none"}
            strokeWidth={i <= displayRating ? 1 : 2}
          />
        </button>
      );
    }
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-semibold text-gray-800">Rate this content</DialogTitle>
          <DialogDescription className="text-gray-600">
            Share your feedback on "{postTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 py-4">
            {renderStars()}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Your Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={cn(
                "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                errors.email ? "border-red-500" : "border-gray-300"
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              Comment <span className="text-gray-400">(optional)</span>
            </label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts..."
              rows={3}
              className="focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!rating || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
              {!isSubmitting && <Send size={16} className="ml-1" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RatingDialog; 