import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "../hooks/use-toast";

interface StarRatingProps {
  postId: string;
  initialRating?: number;
  userRating?: number | null;
  totalRatings: number;
  averageRating: number;
  onRatingSubmit: (rating: number) => Promise<void>;
  className?: string;
}

export const StarRating = ({
  postId,
  initialRating = 0,
  userRating = null,
  totalRatings,
  averageRating,
  onRatingSubmit,
  className
}: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [currentRating, setCurrentRating] = useState<number | null>(userRating);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimisticAvg, setOptimisticAvg] = useState(averageRating);
  const [optimisticTotal, setOptimisticTotal] = useState(totalRatings);
  
  // Update state when props change (e.g., when data is loaded)
  useEffect(() => {
    setCurrentRating(userRating);
    setOptimisticAvg(averageRating);
    setOptimisticTotal(totalRatings);
  }, [userRating, averageRating, totalRatings]);
  
  // Calculate displayed rating (prioritize hover > user rating > average)
  const displayRating = hoveredRating ?? currentRating ?? 0;
  
  // Handle rating submission with optimistic updates
  const handleRating = async (rating: number) => {
    if (isSubmitting || currentRating) return; // Prevent multiple submissions or re-rating
    
    setIsSubmitting(true);
    
    // Calculate optimistic updates
    const newTotal = currentRating ? optimisticTotal : optimisticTotal + 1;
    const oldSum = optimisticAvg * optimisticTotal;
    const newSum = currentRating ? (oldSum - currentRating + rating) : (oldSum + rating);
    const newAvg = newSum / newTotal;
    
    // Optimistically update UI
    setCurrentRating(rating);
    setOptimisticAvg(newAvg);
    setOptimisticTotal(newTotal);
    
    try {
      await onRatingSubmit(rating);
      toast({
        title: "Rating submitted!",
        description: "Thanks for your feedback.",
      });
    } catch (error) {
      // Revert optimistic updates on error
      setCurrentRating(userRating);
      setOptimisticAvg(averageRating);
      setOptimisticTotal(totalRatings);
      toast({
        title: "Error submitting rating",
        description: "Please try again later.",
        variant: "destructive",
      });
      console.error("Rating error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={!!currentRating || isSubmitting}
            className={cn(
              "transition-all duration-200",
              currentRating ? "cursor-default" : "cursor-pointer hover:scale-110",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded"
            )}
            onMouseEnter={() => !currentRating && setHoveredRating(rating)}
            onMouseLeave={() => setHoveredRating(null)}
            onClick={() => handleRating(rating)}
            aria-label={`Rate ${rating} stars`}
          >
            <Star
              size={24}
              className={cn(
                rating <= displayRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300",
                isSubmitting && "opacity-50"
              )}
            />
          </button>
        ))}
      </div>
      <div className="text-sm text-center space-y-1">
        {currentRating ? (
          <p className="font-medium text-green-600">Your rating: {currentRating} stars</p>
        ) : (
          <p className="text-gray-500">Click to rate</p>
        )}
        {optimisticTotal > 0 && (
          <p className="text-gray-500">
            Average: {optimisticAvg.toFixed(1)} ({optimisticTotal} {optimisticTotal === 1 ? 'rating' : 'ratings'})
          </p>
        )}
      </div>
    </div>
  );
}; 