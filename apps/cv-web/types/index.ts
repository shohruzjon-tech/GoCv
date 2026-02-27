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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ─── Template Types ───

export interface TemplateColorTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  heading: string;
}

export interface Template {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: "minimal" | "corporate" | "creative" | "tech" | "executive";
  status: "active" | "draft" | "archived";
  thumbnail?: string;
  previewImage?: string;
  htmlTemplate: string;
  cssStyles: string;
  colorThemes: TemplateColorTheme[];
  supportedFonts: string[];
  layoutConfig: Record<string, any>;
  isPremium: boolean;
  isEnterprise: boolean;
  usageCount: number;
  rating: number;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Subscription Types ───

export type SubscriptionPlan = "free" | "premium" | "enterprise";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export interface SubscriptionLimits {
  maxCvs: number;
  maxProjects: number;
  maxAiCreditsPerMonth: number;
  maxPdfExportsPerMonth: number;
  hasCustomDomain: boolean;
  hasAdvancedAiTools: boolean;
  hasPremiumTemplates: boolean;
  hasCustomBranding: boolean;
  hasPrioritySupport: boolean;
}

export interface SubscriptionUsage {
  aiCreditsUsed: number;
  pdfExportsUsed: number;
  cvsCreated: number;
  projectsCreated: number;
}

export interface Subscription {
  _id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  limits: SubscriptionLimits;
  currentUsage: SubscriptionUsage;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd?: boolean;
  pricing?: {
    monthly: number;
    yearly: number;
    currency: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PlanInfo {
  plan: SubscriptionPlan;
  name: string;
  description?: string;
  monthlyPrice: number;
  yearlyPrice: number;
  popular?: boolean;
  limits: SubscriptionLimits;
  features: string[];
}

export interface PlanConfig {
  _id: string;
  plan: SubscriptionPlan;
  name: string;
  description: string;
  monthlyPrice: number; // in cents
  yearlyPrice: number; // in cents
  currency: string;
  limits: SubscriptionLimits;
  features: string[];
  displayOrder: number;
  popular: boolean;
  isActive: boolean;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  number: string | null;
  status: string | null;
  amount: number;
  currency: string;
  date: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

// ─── AI Tool Types ───

export interface AiEnhanceResult {
  originalSections: Record<string, any>;
  enhancedSections: Record<string, any>;
  improvements: string[];
  overallScore: number;
}

export interface AiTailorResult {
  tailoredSections: Record<string, any>;
  matchScore: number;
  suggestions: string[];
  keywordsAdded: string[];
}

export interface AiBulletResult {
  original: string[];
  improved: string[];
  tips: string[];
}

export interface AiSummaryResult {
  summary: string;
  alternatives: string[];
  wordCount: number;
}

export interface AiSkillGapResult {
  currentSkills: string[];
  requiredSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  matchPercentage: number;
}

export interface AiAtsResult {
  score: number;
  issues: { severity: string; message: string; suggestion: string }[];
  keywords: { found: string[]; missing: string[] };
  formatting: { score: number; issues: string[] };
  overall: string;
}

export interface AiInterviewResult {
  questions: { question: string; tip: string; sampleAnswer: string }[];
  preparationTips: string[];
  focusAreas: string[];
}

export interface AiUsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCostMills: number;
  byTool: Record<string, { count: number; tokens: number }>;
}

// ─── Notification Types ───

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "upgrade";
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

// ─── Feature Flag Types ───

export interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedPlans: SubscriptionPlan[];
}

// ─── Audit Log Types ───

export interface AuditLog {
  _id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

// ─── Dashboard Stats (Enhanced) ───

export interface DashboardStats {
  totalUsers: number;
  totalCvs: number;
  totalSessions: number;
  subscriptions?: {
    total: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
  };
  aiUsage?: {
    totalRequests: number;
    totalTokens: number;
    totalCostUsd: number;
  };
  estimatedMrr?: number;
}
