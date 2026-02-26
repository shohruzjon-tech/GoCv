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
};

// ========== PDF API ==========
export const pdfApi = {
  download: (cvId: string) =>
    api.get(`/api/pdf/${cvId}`, { responseType: "blob" }),
};

// ========== Admin API ==========
export const adminApi = {
  getDashboard: () => api.get("/api/admin/dashboard"),

  getUsers: (page = 1, limit = 20) =>
    api.get(`/api/admin/users?page=${page}&limit=${limit}`),

  getUser: (id: string) => api.get(`/api/admin/users/${id}`),

  toggleUserActive: (id: string, isActive: boolean) =>
    api.put(`/api/admin/users/${id}/toggle-active`, { isActive }),

  changeUserRole: (id: string, role: string) =>
    api.put(`/api/admin/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete(`/api/admin/users/${id}`),

  getSessions: (page = 1, limit = 20) =>
    api.get(`/api/admin/sessions?page=${page}&limit=${limit}`),

  getUserSessions: (userId: string) =>
    api.get(`/api/admin/sessions/user/${userId}`),

  terminateSession: (id: string) => api.delete(`/api/admin/sessions/${id}`),

  terminateAllUserSessions: (userId: string) =>
    api.delete(`/api/admin/sessions/user/${userId}`),

  getAllCvs: (page = 1, limit = 20) =>
    api.get(`/api/admin/cvs?page=${page}&limit=${limit}`),
};

export default api;
