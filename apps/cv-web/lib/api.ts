import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ========== Auth API ==========
export const authApi = {
  adminLogin: (email: string, password: string) =>
    api.post("/api/auth/admin/login", { email, password }),

  getProfile: () => api.get("/api/auth/profile"),

  logout: () => api.post("/api/auth/logout"),
};

// ========== CV API ==========
export const cvApi = {
  getAll: () => api.get("/api/cv"),

  getById: (id: string) => api.get(`/api/cv/${id}`),

  create: (data: any) => api.post("/api/cv", data),

  update: (id: string, data: any) => api.put(`/api/cv/${id}`, data),

  delete: (id: string) => api.delete(`/api/cv/${id}`),

  getPublic: (slug: string) => api.get(`/api/cv/public/${slug}`),

  aiGenerate: (data: { prompt: string; cvId?: string; context?: any }) =>
    api.post("/api/cv/ai/generate", data),

  aiEditSection: (
    cvId: string,
    data: { prompt: string; sectionType: string; currentContent?: any },
  ) => api.post(`/api/cv/${cvId}/ai/edit-section`, data),

  regenerateHtml: (cvId: string) =>
    api.post(`/api/cv/${cvId}/ai/regenerate-html`),

  publish: (cvId: string) => api.post(`/api/cv/${cvId}/publish`),
};

// ========== Projects API ==========
export const projectsApi = {
  getAll: () => api.get("/api/projects"),

  getById: (id: string) => api.get(`/api/projects/${id}`),

  getByCv: (cvId: string) => api.get(`/api/projects/cv/${cvId}`),

  create: (data: any) => api.post("/api/projects", data),

  update: (id: string, data: any) => api.put(`/api/projects/${id}`, data),

  delete: (id: string) => api.delete(`/api/projects/${id}`),

  addImages: (id: string, formData: FormData) =>
    api.post(`/api/projects/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  removeImage: (id: string, imageIndex: number) =>
    api.delete(`/api/projects/${id}/images/${imageIndex}`),

  reorderImages: (id: string, order: number[]) =>
    api.put(`/api/projects/${id}/images/reorder`, { order }),
};

// ========== Upload API ==========
export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return api.post("/api/upload/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ========== AI API ==========
export const aiApi = {
  chat: (messages: { role: string; content: string }[], cvContext?: any) =>
    api.post("/api/ai/chat", { messages, cvContext }),

  enhance: (cvData: any) => api.post("/api/ai/enhance", { cvData }),

  tailor: (cvData: any, jobDescription: string) =>
    api.post("/api/ai/tailor", { cvData, jobDescription }),

  improveBullets: (bulletPoints: string[], context: string) =>
    api.post("/api/ai/improve-bullets", { bulletPoints, context }),

  generateSummary: (cvData: any, tone: string) =>
    api.post("/api/ai/generate-summary", { cvData, tone }),

  skillGap: (cvData: any, targetRole: string) =>
    api.post("/api/ai/skill-gap", { cvData, targetRole }),

  atsScore: (cvData: any, jobDescription?: string) =>
    api.post("/api/ai/ats-score", { cvData, jobDescription }),

  interviewPrep: (cvData: any, jobDescription: string) =>
    api.post("/api/ai/interview-prep", { cvData, jobDescription }),

  getUsage: () => api.get("/api/ai/usage"),

  getUsageHistory: () => api.get("/api/ai/usage/history"),
};

// ========== PDF API ==========
export const pdfApi = {
  download: (cvId: string) =>
    api.get(`/api/pdf/${cvId}`, { responseType: "blob" }),
};

// ========== Templates API ==========
export const templatesApi = {
  getAll: (category?: string) =>
    api.get("/api/templates", { params: { category } }),

  getById: (id: string) => api.get(`/api/templates/${id}`),

  getBySlug: (slug: string) => api.get(`/api/templates/slug/${slug}`),

  getForMyPlan: () => api.get("/api/templates/my-plan"),
};

// ========== Subscriptions API ==========
export const subscriptionsApi = {
  getMy: () => api.get("/api/subscriptions/my"),

  getPlans: () => api.get("/api/subscriptions/plans"),

  getUsage: () => api.get("/api/subscriptions/usage"),

  upgrade: (plan: string, billingCycle?: string) =>
    api.post("/api/subscriptions/upgrade", { plan, billingCycle }),

  cancel: (reason?: string) =>
    api.post("/api/subscriptions/cancel", { reason }),

  getBillingPortal: () => api.post("/api/subscriptions/billing-portal"),

  getInvoices: () => api.get("/api/subscriptions/invoices"),
};

// ========== Notifications API ==========
export const notificationsApi = {
  getAll: () => api.get("/api/notifications"),

  getUnreadCount: () => api.get("/api/notifications/count"),

  markAsRead: (id: string) => api.put(`/api/notifications/${id}/read`),

  markAllAsRead: () => api.put("/api/notifications/read-all"),

  delete: (id: string) => api.delete(`/api/notifications/${id}`),
};

// ========== Feature Flags API ==========
export const featureFlagsApi = {
  check: (key: string) => api.get(`/api/feature-flags/check/${key}`),

  getClientFlags: () => api.get("/api/feature-flags/client"),
};

// ========== Organizations API ==========
export const organizationsApi = {
  getAll: () => api.get("/api/organizations"),

  getById: (id: string) => api.get(`/api/organizations/${id}`),

  getBySlug: (slug: string) => api.get(`/api/organizations/slug/${slug}`),

  create: (data: {
    name: string;
    description?: string;
    industry?: string;
    website?: string;
    size?: string;
  }) => api.post("/api/organizations", data),

  update: (id: string, data: any) => api.put(`/api/organizations/${id}`, data),

  delete: (id: string) => api.delete(`/api/organizations/${id}`),

  updateBranding: (id: string, data: any) =>
    api.put(`/api/organizations/${id}/branding`, data),

  updateSettings: (id: string, data: any) =>
    api.put(`/api/organizations/${id}/settings`, data),

  // Members
  getMembers: (id: string, page = 1, limit = 20) =>
    api.get(`/api/organizations/${id}/members`, { params: { page, limit } }),

  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post(`/api/organizations/${id}/members/invite`, data),

  updateMemberRole: (id: string, userId: string, role: string) =>
    api.put(`/api/organizations/${id}/members/${userId}/role`, { role }),

  removeMember: (id: string, userId: string) =>
    api.delete(`/api/organizations/${id}/members/${userId}`),

  transferOwnership: (id: string, newOwnerId: string) =>
    api.post(`/api/organizations/${id}/transfer-ownership`, { newOwnerId }),

  // Teams
  getTeams: (id: string) => api.get(`/api/organizations/${id}/teams`),

  createTeam: (
    id: string,
    data: { name: string; description?: string; color?: string; icon?: string },
  ) => api.post(`/api/organizations/${id}/teams`, data),

  updateTeam: (id: string, teamId: string, data: any) =>
    api.put(`/api/organizations/${id}/teams/${teamId}`, data),

  deleteTeam: (id: string, teamId: string) =>
    api.delete(`/api/organizations/${id}/teams/${teamId}`),

  getStats: (id: string) => api.get(`/api/organizations/${id}/stats`),
};

// ========== CV Versions API ==========
export const cvVersionsApi = {
  getVersions: (cvId: string, page = 1, limit = 20) =>
    api.get(`/api/cv/${cvId}/versions`, { params: { page, limit } }),

  getVersion: (cvId: string, version: number) =>
    api.get(`/api/cv/${cvId}/versions/${version}`),

  restoreVersion: (cvId: string, version: number) =>
    api.post(`/api/cv/${cvId}/versions/${version}/restore`),

  createSnapshot: (
    cvId: string,
    data: { label?: string; changeDescription?: string },
  ) => api.post(`/api/cv/${cvId}/versions/snapshot`, data),

  createBranch: (
    cvId: string,
    data: { branchName: string; version?: number },
  ) => api.post(`/api/cv/${cvId}/versions/branch`, data),

  getBranches: (cvId: string) => api.get(`/api/cv/${cvId}/versions/branches`),

  compareVersions: (cvId: string, v1: number, v2: number) =>
    api.get(`/api/cv/${cvId}/versions/compare`, { params: { v1, v2 } }),
};

// ========== API Keys API ==========
export const apiKeysApi = {
  getAll: () => api.get("/api/auth/api-keys"),

  create: (data: {
    name: string;
    scopes: string[];
    expiresIn?: number;
    allowedIps?: string[];
  }) => api.post("/api/auth/api-keys", data),

  revoke: (id: string) => api.post(`/api/auth/api-keys/${id}/revoke`),

  rotate: (id: string) => api.post(`/api/auth/api-keys/${id}/rotate`),
};

// ========== Admin API ==========
export const adminApi = {
  getDashboard: () => api.get("/api/admin/dashboard"),

  // Users
  getUsers: (page = 1, limit = 20) =>
    api.get(`/api/admin/users?page=${page}&limit=${limit}`),

  getUser: (id: string) => api.get(`/api/admin/users/${id}`),

  getUserDetail: (id: string) => api.get(`/api/admin/users/${id}/detail`),

  toggleUserActive: (id: string, isActive: boolean) =>
    api.put(`/api/admin/users/${id}/toggle-active`, { isActive }),

  changeUserRole: (id: string, role: string) =>
    api.put(`/api/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  impersonateUser: (id: string) =>
    api.post(`/api/admin/users/${id}/impersonate`),

  // Sessions
  getSessions: (page = 1, limit = 20) =>
    api.get(`/api/admin/sessions?page=${page}&limit=${limit}`),

  getUserSessions: (userId: string) =>
    api.get(`/api/admin/sessions/user/${userId}`),

  terminateSession: (id: string) => api.delete(`/api/admin/sessions/${id}`),

  terminateAllUserSessions: (userId: string) =>
    api.delete(`/api/admin/sessions/user/${userId}`),

  // CVs
  getAllCvs: (page = 1, limit = 20) =>
    api.get(`/api/admin/cvs?page=${page}&limit=${limit}`),

  // Templates
  getTemplates: (page = 1, limit = 20) =>
    api.get(`/api/admin/templates?page=${page}&limit=${limit}`),

  createTemplate: (data: any) => api.post("/api/admin/templates", data),

  updateTemplate: (id: string, data: any) =>
    api.put(`/api/admin/templates/${id}`, data),

  deleteTemplate: (id: string) => api.delete(`/api/admin/templates/${id}`),

  // Subscriptions
  getSubscriptions: (
    page = 1,
    limit = 20,
    filters?: { plan?: string; status?: string },
  ) =>
    api.get(`/api/admin/subscriptions`, {
      params: { page, limit, ...filters },
    }),

  getSubscriptionStats: () => api.get("/api/admin/subscriptions/stats"),

  updateSubscription: (id: string, data: any) =>
    api.put(`/api/admin/subscriptions/${id}`, data),

  cancelSubscription: (id: string) =>
    api.post(`/api/admin/subscriptions/${id}/cancel`),

  resetSubscriptionUsage: (id: string) =>
    api.post(`/api/admin/subscriptions/${id}/reset-usage`),

  // Plan Configurations
  getPlans: () => api.get("/api/admin/plans"),

  getPlan: (id: string) => api.get(`/api/admin/plans/${id}`),

  createPlan: (data: any) => api.post("/api/admin/plans", data),

  updatePlan: (id: string, data: any) =>
    api.put(`/api/admin/plans/${id}`, data),

  deletePlan: (id: string) => api.delete(`/api/admin/plans/${id}`),

  // AI Usage
  getAiUsage: (page = 1, limit = 50) =>
    api.get(`/api/admin/ai-usage?page=${page}&limit=${limit}`),

  getAiGlobalStats: () => api.get("/api/admin/ai-usage/stats"),

  getUserAiStats: (userId: string) =>
    api.get(`/api/admin/ai-usage/user/${userId}`),

  // Audit Logs
  getAuditLogs: (page = 1, limit = 50, filters?: Record<string, string>) =>
    api.get("/api/admin/audit-logs", { params: { page, limit, ...filters } }),

  getUserAuditLogs: (userId: string) =>
    api.get(`/api/admin/audit-logs/user/${userId}`),

  // Feature Flags
  getFeatureFlags: () => api.get("/api/admin/feature-flags"),

  createFeatureFlag: (data: any) => api.post("/api/admin/feature-flags", data),

  updateFeatureFlag: (id: string, data: any) =>
    api.put(`/api/admin/feature-flags/${id}`, data),

  toggleFeatureFlag: (id: string) =>
    api.put(`/api/admin/feature-flags/${id}/toggle`),

  deleteFeatureFlag: (id: string) =>
    api.delete(`/api/admin/feature-flags/${id}`),

  // Notifications
  sendNotification: (userId: string, data: any) =>
    api.post("/api/admin/notifications/send", { userId, ...data }),

  broadcastNotification: (data: any) =>
    api.post("/api/admin/notifications/broadcast", data),

  // Revenue
  getRevenue: () => api.get("/api/admin/revenue"),
};

export default api;
