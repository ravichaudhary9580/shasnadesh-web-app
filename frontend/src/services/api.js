import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE_URL });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("shasnadesh_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("shasnadesh_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// --- Auth ---
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updatePassword = (data) => api.put("/auth/update-password", data);

// --- Public Blogs ---
export const getBlogs = (params) => api.get("/blogs", { params });
export const getBlog = (slug) => api.get(`/blogs/${slug}`);
export const getCategories = () => api.get("/blogs/categories/list");
export const getSearchSuggestions = (q, limit = 8) => api.get("/blogs/suggestions", { params: { q, limit } });

// --- Admin Blogs ---
export const adminGetBlogs = (params) => api.get("/admin/blogs", { params });
export const createBlog = (data) => api.post("/admin/blogs", data);
export const updateBlog = (id, data) => api.put(`/admin/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/admin/blogs/${id}`);
export const toggleStatus = (id) => api.patch(`/admin/blogs/${id}/status`);
export const toggleFeatured = (id) => api.patch(`/admin/blogs/${id}/featured`);

// --- Upload ---
export const uploadFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
};

// --- Analytics ---
export const trackVisit = (data) => api.post("/analytics/track", data);
export const getOverview = () => api.get("/admin/analytics/overview");
export const getPopular = () => api.get("/admin/analytics/popular");
export const getDeviceSplit = () => api.get("/admin/analytics/devices");
export const getDailyVisits = () => api.get("/admin/analytics/daily");

export default api;
