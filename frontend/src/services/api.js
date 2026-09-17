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

// --- In-memory cache & request deduplication ---
const apiCache = new Map();
const inFlightRequests = new Map();

export const clearApiCache = () => {
  apiCache.clear();
};

export const cachedGet = async (url, params = {}, ttlMs = 60000) => {
  const sortedParams = params
    ? Object.keys(params).sort().reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) acc[key] = params[key];
        return acc;
      }, {})
    : {};
  const cacheKey = `${url}?${new URLSearchParams(sortedParams).toString()}`;
  const now = Date.now();

  const cached = apiCache.get(cacheKey);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = api.get(url, { params })
    .then((res) => {
      apiCache.set(cacheKey, { data: res, timestamp: Date.now() });
      inFlightRequests.delete(cacheKey);
      return res;
    })
    .catch((err) => {
      inFlightRequests.delete(cacheKey);
      throw err;
    });

  inFlightRequests.set(cacheKey, promise);
  return promise;
};

// --- Auth ---
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updatePassword = (data) => api.put("/auth/update-password", data);

// --- Public Blogs ---
export const getBlogs = (params, options = {}) =>
  options.skipCache ? api.get("/blogs", { params }) : cachedGet("/blogs", params, 45000);
export const getBlog = (slug) => api.get(`/blogs/${slug}`);
export const getCategories = () => cachedGet("/blogs/categories/list", {}, 300000);
export const getYears = () => cachedGet("/blogs/years/list", {}, 600000);
export const getSearchSuggestions = (q, limit = 8) => api.get("/blogs/suggestions", { params: { q, limit } });

// --- Admin Blogs ---
export const adminGetBlogs = (params) => api.get("/admin/blogs", { params });
export const createBlog = (data) => {
  clearApiCache();
  return api.post("/admin/blogs", data);
};
export const updateBlog = (id, data) => {
  clearApiCache();
  return api.put(`/admin/blogs/${id}`, data);
};
export const deleteBlog = (id) => {
  clearApiCache();
  return api.delete(`/admin/blogs/${id}`);
};
export const toggleStatus = (id) => {
  clearApiCache();
  return api.patch(`/admin/blogs/${id}/status`);
};
export const toggleFeatured = (id) => {
  clearApiCache();
  return api.patch(`/admin/blogs/${id}/featured`);
};
export const requestInstantIndexing = (data) => api.post("/admin/indexing/request", data);

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
export const getAllTimeVisits = (range, startDate, endDate) => api.get("/admin/analytics/all-time", { params: { range, startDate, endDate } });
export const getTopCategories = () => api.get("/admin/analytics/categories");
export const getTrafficSources = () => api.get("/admin/analytics/traffic-sources");

// --- Backup ---
export const getBackupPreview = (params) => api.get("/admin/backup", { params: { ...params, format: "preview" } });
export const downloadBackup = (params) => api.get("/admin/backup", { params, responseType: "blob" });
export const downloadS3MediaZip = (params) => api.get("/admin/backup/s3-zip", { params, responseType: "blob" });

export default api;
