export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "super_admin";
  isEmailVerified?: boolean;
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
  defaultOrganizationId?: string;
  preferences?: {
    defaultAiProvider?: string;
    defaultTemplateId?: string;
    emailNotifications?: boolean;
    marketingEmails?: boolean;
    language?: string;
    timezone?: string;
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
  organizationId?: string;
  teamId?: string;
  currentVersion?: number;
  tags?: string[];
  targetRole?: string;
  targetCompany?: string;
  metadata?: {
    lastAiProvider?: string;
    lastAiModel?: string;
    totalAiEdits?: number;
    exportCount?: number;
    viewCount?: number;
  };
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

// ─── Enterprise Types ───

export type OrgRole = "owner" | "admin" | "recruiter" | "member" | "viewer";
export type OrgStatus = "active" | "suspended" | "trial" | "deactivated";
export type OrgPlan = "team" | "business" | "enterprise";

export interface Organization {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  status: OrgStatus;
  plan: OrgPlan;
  branding?: OrgBranding;
  settings?: OrgSettings;
  memberCount: number;
  maxMembers: number;
  totalCvsCreated: number;
  industry?: string;
  website?: string;
  size?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgBranding {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  customDomain?: string;
  companyName?: string;
  tagline?: string;
}

export interface OrgSettings {
  allowMemberInvites: boolean;
  allowPublicCvs: boolean;
  requireApprovalForPublish: boolean;
  enableAiTools: boolean;
  enforceTemplates: boolean;
  allowedTemplateIds: string[];
  preferredAiProvider: string;
}

export interface OrgMembership {
  _id: string;
  userId:
    | string
    | { _id: string; name: string; email: string; avatar?: string };
  organizationId: string;
  role: OrgRole;
  teamIds: string[];
  isActive: boolean;
  invitedBy?: string;
  invitedAt?: string;
  joinedAt?: string;
  permissions?: OrgPermissions;
  createdAt: string;
  updatedAt: string;
}

export interface OrgPermissions {
  canCreateCv: boolean;
  canPublishCv: boolean;
  canUseAi: boolean;
  canManageTemplates: boolean;
  canInviteMembers: boolean;
  canViewAnalytics: boolean;
  canManageBilling: boolean;
}

export interface Team {
  _id: string;
  organizationId: string;
  name: string;
  description?: string;
  slug: string;
  memberIds:
    | string[]
    | { _id: string; name: string; email: string; avatar?: string }[];
  leadId?:
    | string
    | { _id: string; name: string; email: string; avatar?: string };
  settings?: {
    defaultTemplateId?: string;
    maxCvsPerMember?: number;
    aiCreditsPool?: number;
    autoApprovePublish?: boolean;
  };
  color: string;
  icon?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CvVersion {
  _id: string;
  cvId: string;
  userId: string;
  version: number;
  label?: string;
  snapshot: {
    title: string;
    summary?: string;
    personalInfo?: Record<string, any>;
    sections: Record<string, any>[];
    theme?: Record<string, any>;
    templateId?: string;
  };
  changeDescription?: string;
  changeType:
    | "manual"
    | "ai-generated"
    | "auto-save"
    | "publish"
    | "restore"
    | "branch";
  diff?: {
    fieldsChanged: string[];
    sectionsAdded: string[];
    sectionsRemoved: string[];
    sectionsModified: string[];
  };
  branchName?: string;
  isBranch: boolean;
  sizeBytes?: number;
  createdAt: string;
}

export interface ApiKeyInfo {
  _id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  status: "active" | "revoked" | "expired";
  expiresAt?: string;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
}

export interface AiProviderHealth {
  provider: "openai" | "anthropic";
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  errorRate: number;
  consecutiveFailures: number;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
