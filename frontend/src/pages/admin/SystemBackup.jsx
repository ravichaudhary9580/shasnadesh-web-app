import { useState, useEffect, useCallback } from "react";
import { getCategories, getBackupPreview } from "../../services/api";
import toast from "react-hot-toast";
import JSZip from "jszip";
import {
  HardDriveDownload,
  Calendar,
  Filter,
  Loader2,
  Database,
  Layers,
  Sparkles,
  FileArchive,
  FolderArchive,
  Link as LinkIcon,
  FileText,
  Globe,
} from "lucide-react";

const DEFAULT_CATEGORIES = ["उत्तर प्रदेश शासनादेश", "वैकेंसी अलर्ट", "स्टूडेंट कॉर्नर", "Document", "प्रारूप", "शिक्षा विभाग", "अवकाश कैलेंडर", "छात्रवृत्ति", "मा० न्यायालय के आदेश", "अन्य"];

// Pure helper to compute actual start & end dates based on preset filters
function getComputedDates(currentFilters) {
  if (currentFilters.datePreset === "custom") {
    return { startDate: currentFilters.startDate, endDate: currentFilters.endDate };
  }

  const end = new Date();
  const endDateStr = end.toISOString().slice(0, 10);

  if (currentFilters.datePreset === "30days") {
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { startDate: start.toISOString().slice(0, 10), endDate: endDateStr };
  }

  if (currentFilters.datePreset === "90days") {
    const start = new Date();
    start.setDate(start.getDate() - 90);
    return { startDate: start.toISOString().slice(0, 10), endDate: endDateStr };
  }

  if (currentFilters.datePreset === "year") {
    const year = new Date().getFullYear();
    return { startDate: `${year}-01-01`, endDate: endDateStr };
  }

  return { startDate: "", endDate: "" };
}

export default function SystemBackup() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [filters, setFilters] = useState({
    datePreset: "all", // 'all' | '30days' | '90days' | 'year' | 'custom'
    startDate: "",
    endDate: "",
    category: "all",
    status: "all",
  });

  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [downloadingS3Zip, setDownloadingS3Zip] = useState(false);

  // Fetch Categories
  useEffect(() => {
    getCategories()
      .then(({ data }) => {
        const normalized = Array.isArray(data) ? data : [];
        const unique = Array.from(new Set([...normalized, ...DEFAULT_CATEGORIES])).filter(Boolean);
        setCategories(unique);
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);

  // Load live preview stats
  const fetchPreview = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const { startDate, endDate } = getComputedDates(filters);
      const params = {
        startDate,
        endDate,
        category: filters.category,
        status: filters.status,
      };
      const { data } = await getBackupPreview(params);
      setPreviewData(data);
    } catch (err) {
      console.error("Preview fetch error:", err);
      toast.error("Failed to load backup preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Download Full Database ZIP Package (Separate Collection Folders & Individual Blog JSONs)
  const handleDownloadZipPackage = async () => {
    setDownloadingZip(true);
    const tid = toast.loading("Building Full Database ZIP Backup (Separate Collection Folders)...");
    try {
      const { startDate, endDate } = getComputedDates(filters);
      const params = {
        startDate,
        endDate,
        category: filters.category,
        status: filters.status,
        format: "preview",
      };

      const { data } = await getBackupPreview(params);
      const zip = new JSZip();

      // 1. README File
      const dateStr = new Date().toISOString().slice(0, 10);
      const readmeContent = `===================================================================
SHASNADESHUPDATES.COM - COMPLETE DATABASE BACKUP PACKAGE
===================================================================
Exported At: ${new Date().toLocaleString()}
Filter Date Range: ${data.filtersApplied?.startDate || "All Time"} to ${data.filtersApplied?.endDate || "All Time"}
Selected Category: ${data.filtersApplied?.category || "All Categories"}
Selected Status: ${data.filtersApplied?.status || "All Statuses"}

SUMMARY OF EXPORTED DATA:
- Total Blogs: ${data.summary?.totalBlogs || 0}
- Total Analytics Records: ${data.summary?.totalAnalyticsRecords || 0}

ZIP FOLDER STRUCTURE:
/collections/blogs/                      (Individual JSON file for each blog post)
/collections/blogs_master.json           (Master Array of all blogs)
/collections/analytics/analytics.json   (Analytics collection)
/collections/push_subscriptions.json     (Push Subscriptions)

Restore Instructions:
Each JSON file inside /collections/blogs/ contains the complete MongoDB document for that blog post.
You can import individual post JSONs into MongoDB using mongoimport or directly inspect them in any text editor.
`;

      zip.file("README.txt", readmeContent);
      zip.file("database_manifest.json", JSON.stringify(data.summary, null, 2));

      // 2. Individual Blog JSONs Folder (/collections/blogs/post-1-slug.json)
      const blogsFolder = zip.folder("collections/blogs");
      const blogsList = data.collections?.blogs || data.blogs || [];

      blogsList.forEach((blog, index) => {
        const safeSlug = (blog.slug || blog.title || `blog-${index + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 50);
        const fileName = `${String(index + 1).padStart(3, "0")}_${safeSlug}.json`;
        blogsFolder.file(fileName, JSON.stringify(blog, null, 2));
      });

      // 3. Master Blogs Collection File
      zip.file("collections/blogs_master.json", JSON.stringify(blogsList, null, 2));

      // 4. Analytics Collection Folder (/collections/analytics/analytics_records.json)
      const analyticsList = data.collections?.analytics || [];
      zip.file("collections/analytics/analytics_records.json", JSON.stringify(analyticsList, null, 2));

      // 5. Push Subscriptions Collection Folder (/collections/push_subscriptions/subscriptions.json)
      const pushList = data.collections?.pushSubscriptions || [];
      zip.file("collections/push_subscriptions/subscriptions.json", JSON.stringify(pushList, null, 2));

      // Generate ZIP blob and download
      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `shasnadesh-database-backup-${dateStr}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success("Database ZIP Backup Downloaded!", { id: tid });
    } catch (err) {
      console.error("ZIP download error:", err);
      toast.error("Failed to build database ZIP package", { id: tid });
    } finally {
      setDownloadingZip(false);
    }
  };

  // Download S3 URLs ZIP — one .txt per blog with its S3 links grouped by type
  const handleDownloadS3UrlsZip = async () => {
    setDownloadingS3Zip(true);
    const tid = toast.loading("Building S3 URLs ZIP (Per Blog)...");
    try {
      const { startDate, endDate } = getComputedDates(filters);
      const params = {
        startDate,
        endDate,
        category: filters.category,
        status: filters.status,
        format: "preview",
      };

      const { data } = await getBackupPreview(params);
      const s3Resources = data.s3Resources || [];
      const externalResources = data.externalResources || [];

      if (!s3Resources.length && !externalResources.length) {
        toast.error("No S3 or external resources found for the selected filters.", { id: tid });
        setDownloadingS3Zip(false);
        return;
      }

      const zip = new JSZip();
      const dateStr = new Date().toISOString().slice(0, 10);
      
      const generateUrlsFolder = (folderName, resources) => {
        if (!resources.length) return;
        const folder = zip.folder(folderName);
        
        // Group resources by blog slug
        const byBlog = new Map();
        resources.forEach((item) => {
          const key = item.slug || item.blogId || "unknown";
          if (!byBlog.has(key)) {
            byBlog.set(key, { title: item.blogTitle || "Unknown", slug: item.slug || key, resources: [] });
          }
          byBlog.get(key).resources.push(item);
        });

        // Create one .txt file per blog
        byBlog.forEach(({ title, slug, resources: blogRes }) => {
          const safeSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 60);
          const types = ["thumbnail", "pdf", "image", "embedded"];
          const lines = [
            `Blog: ${title}`,
            `Slug: ${slug}`,
            `Exported At: ${new Date().toLocaleString()}`,
            `Total Objects: ${blogRes.length}`,
            "",
          ];

          types.forEach((type) => {
            const ofType = blogRes.filter((r) => r.type === type);
            if (ofType.length) {
              lines.push(`── ${type.toUpperCase()} (${ofType.length}) ──`);
              ofType.forEach((r) => lines.push(r.url));
              lines.push("");
            }
          });

          folder.file(`${safeSlug}.txt`, lines.join("\n"));
        });

        // Master flat list
        const allUrls = resources.map((r) => r.url).join("\n");
        folder.file(`all_${folderName}.txt`, allUrls);
      };

      generateUrlsFolder("s3_urls", s3Resources);
      generateUrlsFolder("external_urls", externalResources);

      // README
      zip.file("README.txt",
        `MEDIA URLS ZIP PACKAGE — SHASNADESHUPDATES.COM
==========================================
Exported At: ${new Date().toLocaleString()}
Total S3 Objects: ${s3Resources.length}
Total External URLs: ${externalResources.length}

FOLDER STRUCTURE:
/s3_urls/         — Your AWS S3 bucket URLs
/external_urls/   — Third-party URLs (YouTube, external images, etc)

Inside each folder:
/<blog-slug>.txt  — URLs for each individual blog, grouped by type
/all_*.txt        — Flat master list of all URLs
`);

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.setAttribute("download", `shasnadesh-s3-urls-${dateStr}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);

      toast.success(`Media URLs ZIP Downloaded! (${s3Resources.length} S3, ${externalResources.length} External)`, { id: tid });
    } catch (err) {
      console.error("S3 URLs ZIP error:", err);
      toast.error("Failed to build S3 URLs ZIP", { id: tid });
    } finally {
      setDownloadingS3Zip(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2.5">
            <HardDriveDownload size={26} className="text-saffron-500" />
            System Backup &amp; Data Export
          </h1>
          <p className="font-ui text-sm text-ink-400 mt-1">
            Download full database ZIP packages with separate collection folders and individual blog JSONs.
          </p>
        </div>
      </div>

      {/* Filter Section Card */}
      <div className="card p-5 sm:p-6 space-y-5 bg-white border border-ink-100 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 border-b border-ink-100 pb-3">
          <Filter size={18} className="text-saffron-600" />
          <h2 className="font-display text-base font-bold text-ink-900">Backup Filters &amp; Range</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Range Presets */}
          <div className="space-y-2">
            <label className="block font-ui text-xs font-semibold text-ink-700 uppercase tracking-wide flex items-center gap-1.5">
              <Calendar size={13} className="text-saffron-500" /> Time Range
            </label>
            <select
              value={filters.datePreset}
              onChange={(e) => setFilters((f) => ({ ...f, datePreset: e.target.value }))}
              className="input text-sm font-medium"
            >
              <option value="all">All Time (Complete Database)</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="year">This Year ({new Date().getFullYear()})</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="block font-ui text-xs font-semibold text-ink-700 uppercase tracking-wide flex items-center gap-1.5">
              <Layers size={13} className="text-saffron-500" /> Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
              className="input text-sm font-medium"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="block font-ui text-xs font-semibold text-ink-700 uppercase tracking-wide flex items-center gap-1.5">
              <Sparkles size={13} className="text-saffron-500" /> Post Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="input text-sm font-medium"
            >
              <option value="all">All Statuses (Published &amp; Drafts)</option>
              <option value="published">Published Posts Only</option>
              <option value="draft">Drafts Only</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range Pickers */}
        {filters.datePreset === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-ink-100">
            <div>
              <label className="block font-ui text-xs font-medium text-ink-600 mb-1">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                className="input text-sm"
              />
            </div>
            <div>
              <label className="block font-ui text-xs font-medium text-ink-600 mb-1">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                className="input text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Blogs Count */}
        <div className="card p-5 bg-gradient-to-br from-saffron-50 to-amber-50/40 border border-saffron-200/80 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-saffron-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Database size={24} />
          </div>
          <div>
            <p className="font-ui text-xs font-semibold text-saffron-900 uppercase tracking-wide">Blogs in Backup</p>
            <h3 className="font-display text-2xl font-bold text-ink-900 mt-0.5">
              {loadingPreview ? <Loader2 size={20} className="animate-spin text-saffron-600" /> : (previewData?.summary?.totalBlogs ?? 0)}
            </h3>
            <p className="text-[11px] font-ui text-saffron-700 mt-1">Separate JSON per post in ZIP</p>
          </div>
        </div>

        {/* S3 Objects Count */}
        <div className="card p-5 bg-gradient-to-br from-blue-50 to-sky-50/40 border border-blue-200/80 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <LinkIcon size={22} />
          </div>
          <div>
            <p className="font-ui text-xs font-semibold text-blue-900 uppercase tracking-wide">S3 Object URLs</p>
            <h3 className="font-display text-2xl font-bold text-ink-900 mt-0.5">
              {loadingPreview ? <Loader2 size={20} className="animate-spin text-blue-600" /> : (previewData?.summary?.totalS3Resources ?? 0)}
            </h3>
            <p className="text-[11px] font-ui text-blue-700 mt-1">thumbnails · images · pdfs</p>
          </div>
        </div>

        {/* External URLs Count */}
        <div className="card p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50/40 border border-purple-200/80 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
            <Globe size={22} />
          </div>
          <div>
            <p className="font-ui text-xs font-semibold text-purple-900 uppercase tracking-wide">External URLs</p>
            <h3 className="font-display text-2xl font-bold text-ink-900 mt-0.5">
              {loadingPreview ? <Loader2 size={20} className="animate-spin text-purple-600" /> : (previewData?.summary?.totalExternalResources ?? 0)}
            </h3>
            <p className="text-[11px] font-ui text-purple-700 mt-1">YouTube embeds · external links</p>
          </div>
        </div>
      </div>

      {/* Download Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Complete DB ZIP */}
        <div className="card p-6 bg-white border border-ink-100 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2 border-b border-ink-100 pb-3">
            <FolderArchive size={18} className="text-saffron-600" /> Database Package
          </h3>

          <button
            onClick={handleDownloadZipPackage}
            disabled={downloadingZip || !previewData?.summary?.totalBlogs}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2.5 shadow-md shadow-saffron-900/20 disabled:opacity-50"
          >
            {downloadingZip ? <Loader2 size={18} className="animate-spin" /> : <FileArchive size={18} />}
            <span className="font-bold text-sm">
              {downloadingZip ? "Building ZIP..." : "Download DB ZIP"}
            </span>
          </button>

          <p className="text-xs text-ink-400 font-ui leading-relaxed">
            Collection folders with <code>/collections/blogs/</code> (one JSON per post), <code>blogs_master.json</code>, analytics, and push subscriptions.
          </p>
        </div>

        {/* S3 URLs ZIP */}
        <div className="card p-6 bg-white border border-blue-100 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2 border-b border-blue-100 pb-3">
            <LinkIcon size={18} className="text-blue-600" /> S3 Object URLs
          </h3>

          <button
            onClick={handleDownloadS3UrlsZip}
            disabled={downloadingS3Zip || !previewData?.summary?.totalS3Resources}
            className="w-full py-4 flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-md shadow-blue-900/20 disabled:opacity-50"
          >
            {downloadingS3Zip ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
            <span className="font-bold text-sm">
              {downloadingS3Zip ? "Building ZIP..." : "Download S3 URLs ZIP"}
            </span>
          </button>

          <p className="text-xs text-ink-400 font-ui leading-relaxed">
            One <code>.txt</code> per blog inside <code>/s3_urls/</code> with thumbnails, PDFs, images &amp; embedded URLs grouped by type.
          </p>
        </div>
      </div>
    </div>
  );
}
