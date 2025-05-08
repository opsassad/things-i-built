// Extended BlogPostType to include project-specific fields
export interface ExtendedBlogPostType {
  id: string;
  title: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags?: string[];
  date?: string;
  readTime?: string;
  authorName?: string;
  authorRole?: string;
  technologies?: string[];
  features?: string[];
  detailedDescription?: string;
  imageUrl?: string;
  featuredImage?: string;
  authorImage?: string;
  link?: string;
  isDraft: boolean;
  slug: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  likeCount?: number;
  seoScore?: number;
  averageRating?: number;
  totalRatings?: number;
}

export interface SiteSettings {
  siteTitle: string;
  siteDescription: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  enableComments: boolean;
  enableAnalytics: boolean;
  // SMTP Settings
  smtpHost?: string;
  smtpPort?: string;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpFromName?: string;
  smtpEncryption?: 'tls' | 'ssl' | 'none';
}

export interface ViewStats {
  date: string;
  views: number;
}

export interface ContentStats {
  title: string;
  category: string;
  averageRating: number;
  totalRatings: number;
}

export type ActivityLogType = 'publish' | 'draft' | 'edit' | 'view' | 'rating';

export interface ActivityLog {
  type: ActivityLogType;
  content: string;
  time: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

// Add MediaItem type
export type MediaItem = {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  date: string;
  bucket?: string;
  path?: string;
};

// Add HomePageContent type definition
export interface HomePageContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
}

// Task related types
export type TaskStatus = 'todo' | 'in-progress' | 'in-review' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  points: number;
  assignees: string[];
  viewCount: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

export interface TaskFilter {
  status?: TaskStatus[];
  assignee?: string[];
  dueDate?: string;
  search?: string;
}
