import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, Tag, ThumbsUp, Eye } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useContent } from '../context/ContentContext';
import { ExtendedBlogPostType } from '../types/content-types';

interface BlogPostProps {
  post: ExtendedBlogPostType;
  isPreview?: boolean;
}

const BlogPost = ({ post, isPreview = false }: BlogPostProps) => {
  const { updateViewCount, updateLikeCount } = useContent();
  
  // Track view when the post is viewed (not in preview mode)
  useEffect(() => {
    if (!isPreview) {
      updateViewCount(post.id);
    }
  }, [post.id, isPreview, updateViewCount]);

  const handleLike = () => {
    updateLikeCount(post.id);
  };

  return (
    <article className="bg-white rounded-lg shadow-sm border p-6">
      {post.featuredImage && (
        <div className="mb-6">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-48 object-cover rounded-md"
          />
        </div>
      )}
      
      <header className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant="secondary">{post.category}</Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock size={14} />
            <span>{post.readTime || '5 min read'}</span>
          </div>
          {!isPreview && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye size={14} />
                <span>{post.viewCount || 0} views</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-sm"
                onClick={handleLike}
              >
                <ThumbsUp size={14} />
                <span>{post.likeCount || 0}</span>
              </Button>
            </>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mb-2">
          {isPreview ? (
            post.title
          ) : (
            <Link to={`/blog/${post.slug}`} className="hover:text-primary">
              {post.title}
            </Link>
          )}
        </h2>
        
        {post.tags && post.tags.length > 0 && (
          <div className="flex items-center gap-2 mb-2">
            <Tag size={14} className="text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {post.authorImage && (
            <img
              src={post.authorImage}
              alt={post.authorName}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{post.authorName}</div>
            {post.authorRole && (
              <div className="text-sm text-muted-foreground">{post.authorRole}</div>
            )}
          </div>
          {post.updatedAt && (
            <div className="text-sm text-muted-foreground ml-auto">
              {format(new Date(post.updatedAt), 'MMM d, yyyy')}
            </div>
          )}
        </div>
      </header>
      
      <div className="prose prose-zinc max-w-none">
        {isPreview ? (
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        ) : (
          <p className="text-muted-foreground">{post.excerpt}</p>
        )}
      </div>
      
      {!isPreview && (
        <div className="mt-4">
          <Link to={`/blog/${post.slug}`}>
            <Button>Read More</Button>
          </Link>
        </div>
      )}
    </article>
  );
};

export default BlogPost; 