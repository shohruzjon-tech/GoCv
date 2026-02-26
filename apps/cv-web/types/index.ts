export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  avatar?: string;
  username?: string;
  bio?: string;
  headline?: string;
  location?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
  };
}

export interface CvSection {
  type: string;
  title: string;
  content: Record<string, any>;
  order: number;
  visible: boolean;
}

export interface Cv {
  _id: string;
  userId: string;
  title: string;
  summary?: string;
  status: "draft" | "published" | "archived";
  slug?: string;
  sections: CvSection[];
  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  theme?: {
    primaryColor?: string;
    fontFamily?: string;
    layout?: string;
  };
  templateId?: string;
  aiGeneratedHtml?: string;
  lastAiPrompt?: string;
  isPublic: boolean;
  publicUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectImage {
  url: string;
  key: string;
  caption?: string;
  order: number;
}

export interface Project {
  _id: string;
  userId: string;
  cvId?: string;
  title: string;
  description?: string;
  longDescription?: string;
  technologies: string[];
  images: ProjectImage[];
  liveUrl?: string;
  sourceUrl?: string;
  startDate?: string;
  endDate?: string;
  isFeatured: boolean;
  isVisible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  _id: string;
  userId: string | { name: string; email: string };
  token: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCvs: number;
  totalSessions: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
