import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import { createBlog, updateBlog, adminGetBlogs, uploadFile, getCategories } from "../../services/api";
import RichEditor from "../../components/admin/RichEditor";
import { getImageUrl } from "../../utils/imageUtils";
import toast from "react-hot-toast";
import {
  PenSquare,
  Settings2,
  Paperclip,
  Save,
  Send,
  Upload,
  X,
  Plus,
  Image as ImageIcon,
  Link2,
  FileText,
  Loader2,
  Check,
  Eye,
  Monitor,
  Smartphone,
  ExternalLink,
  Award,
} from "lucide-react";
import BlogWatermarkOverlay from "../../components/BlogWatermarkOverlay";

const DEFAULT_CATEGORIES = ["उत्तर प्रदेश शासनादेश", "शिक्षा विभाग", "अवकाश कैलेंडर", "वैकेंसी अलर्ट", "स्टूडेंट कॉर्नर", "छात्रवृत्ति", "प्रारूप", "अन्य"];


function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-ui text-sm font-medium text-ink-700">{label}</label>
      {children}
      {hint && <p className="font-ui text-xs text-ink-400">{hint}</p>}
    </div>
  );
}

/* ─── Thumbnail upload area ─────────────────────────────────────── */
function ThumbnailUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode] = useState("upload"); // 'upload' | 'url'

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadFile(file);
      onChange(data.url);
      toast.success("Thumbnail uploaded!");
    } catch (err) {
      console.error('Upload error:', err);
      const errorMsg = err.response?.data?.message || err.message || "Upload failed";
      toast.error(errorMsg);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-ink-100 rounded-lg p-0.5 w-fit">
        {["upload", "url"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded-md font-ui text-xs font-medium capitalize transition-all ${mode === m ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              }`}
          >
            {m === "upload" ? "📁 Upload File" : "🔗 URL"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <label
          className={`flex flex-col items-center gap-3 px-6 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${uploading
              ? "border-saffron-300 bg-saffron-50"
              : "border-ink-200 hover:border-saffron-300 hover:bg-saffron-50/30"
            }`}
        >
          {uploading ? (
            <Loader2 size={28} className="text-saffron-500 animate-spin" />
          ) : (
            <Upload size={28} className="text-ink-300" />
          )}
          <div className="text-center">
            <p className="font-ui text-sm font-medium text-ink-600">
              {uploading ? "Uploading to S3…" : "Drop image here or click to browse"}
            </p>
            <p className="font-ui text-xs text-ink-400 mt-1">JPG, PNG, WebP up to 10 MB</p>
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} disabled={uploading} />
        </label>
      ) : (
        <div className="flex gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/thumbnail.jpg"
            className="input"
          />
        </div>
      )}

      {value && (
        <div className="relative group w-full">
          <img
            src={value}
            alt="Thumbnail preview"
            className="w-full h-40 object-cover rounded-xl border border-ink-100 shadow-sm"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-ui px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <Check size={10} /> Thumbnail set
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Live Blog Preview Modal ─────────────────────────────────────── */
function BlogPreviewModal({ form, isOpen, onClose, onSave, isEditing, saving }) {
  const [device, setDevice] = useState("desktop"); // "desktop" | "mobile"

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.removeProperty("overflow");
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const wordCount = (form.content || "").replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));
  const tagList = form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  return createPortal(
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[999999] flex flex-col bg-ink-950/80 backdrop-blur-sm animate-fade-in w-screen h-screen">
      {/* Top Controls Header */}
      <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 bg-white border-b border-ink-200 z-10 flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-ink-100 rounded-lg p-0.5 sm:p-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "desktop" ? "bg-white text-ink-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                device === "mobile" ? "bg-white text-ink-900 shadow-xs" : "text-ink-500 hover:text-ink-800"
              }`}
            >
              <Smartphone size={14} /> Mobile
            </button>
          </div>
          <span className="hidden md:inline-block text-xs font-medium text-ink-500">
            Preview Mode • {wordCount} words (~{readTime} min read)
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => onSave("draft")}
            disabled={saving}
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-ink-200 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Draft
          </button>
          <button
            type="button"
            onClick={() => onSave("published")}
            disabled={saving}
            className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-lg bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} {isEditing ? "Update" : "Publish"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-ink-900 transition-colors ml-1 cursor-pointer"
            title="Close Preview (Esc)"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-6 flex justify-center items-start bg-ink-100/60">
        <div
          className={`w-full bg-white transition-all duration-200 rounded-2xl shadow-xl overflow-hidden ${
            device === "mobile"
              ? "max-w-[400px] border-4 border-ink-800 rounded-[36px] my-2 min-h-[720px] ring-8 ring-ink-900/10 shadow-2xl"
              : "max-w-4xl border border-ink-200/80 my-2"
          }`}
        >
          {/* Mobile phone speaker pill */}
          {device === "mobile" && (
            <div className="pt-3 pb-1 flex justify-center bg-white">
              <div className="w-20 h-3.5 bg-ink-200 rounded-full" />
            </div>
          )}

          {/* Thumbnail Hero */}
          {form.thumbnail && (
            <div className="relative w-full aspect-video bg-ink-950 overflow-hidden flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110"
                style={{ backgroundImage: `url(${getImageUrl(form.thumbnail)})` }}
              />
              <img
                src={getImageUrl(form.thumbnail)}
                alt={form.title || "Blog Preview"}
                className="relative z-10 w-full h-full object-contain drop-shadow-md"
              />
            </div>
          )}

          <div className="p-4 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Watermark Layer for Preview */}
            <BlogWatermarkOverlay watermark={form.watermark} />

            <div className="relative z-10 space-y-6">
              {/* Badges & Meta */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                {form.category && (
                  <span className="badge bg-saffron-100 text-saffron-700 font-semibold px-2.5 py-1 rounded-md">
                    {form.category}
                  </span>
                )}
                <span className="text-ink-400 font-ui">Just Now</span>
                <span className="text-ink-400 font-ui">· ⏱ {readTime} min read</span>
              </div>

              {/* Title */}
              <h1 className="font-display text-xl sm:text-3xl font-bold text-ink-900 leading-snug">
                {form.title || "Untitled Blog Post"}
              </h1>

              {/* Excerpt */}
              {form.excerpt && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-saffron-50/60 border-l-4 border-saffron-500 text-ink-700 font-ui text-sm sm:text-base leading-relaxed">
                  {form.excerpt}
                </div>
              )}

              {/* Content */}
              <article
                className="prose-blog text-ink-800 leading-relaxed overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: form.content || "<p class='text-ink-400 italic'>No content yet...</p>" }}
              />
            </div>

            {/* Video Preview */}
            {form.videoUrl && (
              <div className="mt-8 pt-6 border-t border-ink-100">
                <h3 className="font-display text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                  <span>🎬</span> Video
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden shadow-sm bg-black">
                  <iframe
                    src={form.videoUrl}
                    title="Blog video"
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* Related Links Preview */}
            {form.links && form.links.filter((l) => l.title || l.url).length > 0 && (
              <div className="mt-8 pt-6 border-t border-ink-100">
                <h3 className="font-display text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                  <span>🔗</span> महत्वपूर्ण लिंक (Related Links)
                </h3>
                <div className="space-y-2">
                  {form.links.filter((l) => l.title || l.url).map((link, i) => (
                    <a
                      key={i}
                      href={link.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-ui text-sm font-medium hover:underline"
                    >
                      <span>→</span> {link.title || link.url}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* PDFs & Documents Preview */}
            {form.pdfs && form.pdfs.filter((p) => p.title || p.url).length > 0 && (
              <div className="mt-8 pt-6 border-t border-ink-100">
                <h3 className="font-display text-base font-bold text-ink-900 mb-3 flex items-center gap-2">
                  <span>📄</span> शासनादेश (Documents & Attachments)
                </h3>
                <div className="space-y-2.5">
                  {form.pdfs.filter((p) => p.title || p.url).map((pdf, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl border border-ink-200 bg-ink-50/50"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl flex-shrink-0">📑</span>
                        <span className="font-ui text-sm font-medium text-ink-800 truncate">
                          {pdf.title || "Document File"}
                        </span>
                      </div>
                      {pdf.url && (
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-saffron-50 text-saffron-700 border border-saffron-200/60 hover:bg-saffron-100 transition-colors flex-shrink-0"
                        >
                          <ExternalLink size={12} /> View
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Preview */}
            {tagList.length > 0 && (
              <div className="mt-8 pt-6 border-t border-ink-100 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-ink-400 font-medium">Tags:</span>
                {tagList.map((tag, i) => (
                  <span key={i} className="badge bg-ink-100 text-ink-600 text-xs px-2.5 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── Main BlogEditor ─────────────────────────────────────────────── */
export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    status: "draft",
    thumbnail: "",
    videoUrl: "",
    links: [],
    pdfs: [],
    images: [],
    watermark: {
      enabled: true,
      type: "preset",
      text: "शासनादेश अपडेट्स",
      imageUrl: "",
      opacity: 0.12,
      pattern: "diagonal",
    },
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("content");
  const [hindiMode, setHindiMode] = useState(false);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    if (!isEditing) return;
    setLoading(true);
    adminGetBlogs({ page: 1, limit: 200 })
      .then(({ data }) => {
        const blog = data.blogs.find((b) => b._id === id);
        if (blog)
          setForm({
            title: blog.title || "",
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            category: blog.category || "",
            tags: blog.tags?.join(", ") || "",
            status: blog.status || "draft",
            thumbnail: blog.thumbnail || "",
            videoUrl: blog.videoUrl || "",
            links: blog.links || [],
            pdfs: blog.pdfs || [],
            images: blog.images || [],
            watermark: {
              enabled: blog.watermark?.enabled !== undefined ? Boolean(blog.watermark.enabled) : true,
              type: blog.watermark?.type || "preset",
              text: blog.watermark?.text || "शासनादेश अपडेट्स",
              imageUrl: blog.watermark?.imageUrl || "",
              opacity: blog.watermark?.opacity !== undefined ? Number(blog.watermark.opacity) : 0.12,
              pattern: blog.watermark?.pattern || "diagonal",
            },
          });
      })
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  useEffect(() => {
    getCategories()
      .then(({ data }) => {
        const normalized = Array.isArray(data) ? data : [];
        const unique = Array.from(new Set([...normalized, ...DEFAULT_CATEGORIES])).filter(Boolean);
        setCategories(unique);
      })
      .catch(() => setCategories(DEFAULT_CATEGORIES));
  }, []);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async (status = null) => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (!form.content || form.content === "<p></p>") { toast.error("Content is required"); return; }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        status: status || form.status,
      };
      if (isEditing) {
        await updateBlog(id, payload);
        toast.success("Blog updated!");
      } else {
        await createBlog(payload);
        toast.success("Blog created!");
        navigate("/admin/blogs");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // Link helpers
  const addLink = () => set("links", [...form.links, { title: "", url: "" }]);
  const updateLink = (i, key, val) => {
    const arr = [...form.links]; arr[i] = { ...arr[i], [key]: val }; set("links", arr);
  };
  const removeLink = (i) => set("links", form.links.filter((_, j) => j !== i));

  // PDF helpers
  const addPdf = () => set("pdfs", [...form.pdfs, { title: "", url: "" }]);
  const updatePdf = (i, key, val) => {
    const arr = [...form.pdfs]; arr[i] = { ...arr[i], [key]: val }; set("pdfs", arr);
  };
  const removePdf = (i) => set("pdfs", form.pdfs.filter((_, j) => j !== i));

  // PDF file upload
  const handlePdfUpload = async (i, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tid = toast.loading("Uploading PDF…");
    try {
      const { data } = await uploadFile(file);
      updatePdf(i, "url", data.url);
      toast.success("PDF uploaded!", { id: tid });
    } catch {
      toast.error("Upload failed", { id: tid });
    }
    e.target.value = "";
  };

  const getDocType = (url = "") => {
    const clean = url.split("?")[0].toLowerCase();
    if (clean.endsWith(".pdf")) return "pdf";
    if (clean.endsWith(".docx")) return "docx";
    if (clean.endsWith(".doc")) return "doc";
    if (clean.endsWith(".gdoc")) return "gdoc";
    if (clean.endsWith(".odt")) return "odt";
    if (clean.endsWith(".txt")) return "txt";
    return "file";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-saffron-400 animate-spin" />
      </div>
    );

  const TABS = [
    { id: "content", icon: PenSquare, label: "Content" },
    { id: "meta", icon: Settings2, label: "Settings" },
    { id: "watermark", icon: Award, label: "Watermark" },
    { id: "media", icon: Paperclip, label: "Media" },
  ];

  const categoryOptions = Array.from(new Set([...(categories || []), form.category].filter(Boolean)));

  return (
    <div className="max-w-5xl space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2">
            {isEditing ? <><PenSquare size={22} className="text-saffron-500" /> Edit Blog</> : <><PenSquare size={22} className="text-saffron-500" /> New Blog</>}
          </h1>
          <p className="font-ui text-sm text-ink-400 mt-0.5">
            {isEditing ? "Update your post" : "Write and publish a new post"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar flex-nowrap w-full sm:w-auto pb-0.5 sm:pb-0">
          <button
            type="button"
            onClick={() => setHindiMode(!hindiMode)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-ui text-xs sm:text-sm font-medium transition-all flex-shrink-0 whitespace-nowrap ${hindiMode ? "bg-saffron-100 text-saffron-700" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            title="Toggle Hindi/English mode"
          >
            {hindiMode ? "हिंदी मोड" : "English"}
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="btn-ghost px-2.5 py-1.5 sm:px-3 sm:py-2 border border-ink-200 gap-1.5 text-xs sm:text-sm font-medium hover:border-saffron-300 hover:text-saffron-700 transition-all flex-shrink-0 whitespace-nowrap"
            title="Preview how this blog looks on live site"
          >
            <Eye size={14} />
            Preview
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="btn-ghost px-2.5 py-1.5 sm:px-3 sm:py-2 border border-ink-200 disabled:opacity-50 gap-1.5 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="btn-primary px-3 py-1.5 sm:px-4 sm:py-2 disabled:opacity-50 text-xs sm:text-sm flex-shrink-0 whitespace-nowrap"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isEditing ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      {/* Title input */}
      <div className="card p-3 sm:p-4">
        <input
          type="text"
          placeholder={hindiMode ? "ब्लॉग का शीर्षक यहां लिखें…" : "Blog Title..."}
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          className="w-full font-display text-xl sm:text-2xl md:text-3xl font-bold text-ink-900 bg-transparent outline-none placeholder:text-ink-200 border-none"
          lang={hindiMode ? "hi" : "en"}
          style={hindiMode ? { fontFamily: "'Noto Sans Devanagari', 'Poppins', sans-serif" } : {}}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-ink-100 rounded-xl p-1 w-full sm:w-fit overflow-x-auto no-scrollbar flex-nowrap">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-ui text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial flex-shrink-0 whitespace-nowrap ${activeTab === id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
              }`}
          >
            <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 2} className="flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* ── CONTENT TAB ── */}
      {activeTab === "content" && (
        <div className="space-y-3 animate-fade-in">
          <Field label={hindiMode ? "सारांश / संक्षिप्त विवरण" : "Excerpt / Summary"} hint="Shown on post cards and SEO description">
            <textarea
              rows={3}
              placeholder={hindiMode ? "अपनी पोस्ट का संक्षिप्त सारांश यहां लिखें…" : "Short summary of your post..."}
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              className="input resize-none"
              lang={hindiMode ? "hi" : "en"}
              style={hindiMode ? { fontFamily: "'Noto Sans Devanagari', 'Poppins', sans-serif", lineHeight: "1.8" } : {}}
            />
          </Field>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-ui text-sm font-medium text-ink-700">Content</p>
              {(() => {
                const textOnly = (form.content || "").replace(/<[^>]*>/g, " ").trim();
                const wordCount = textOnly ? textOnly.split(/\s+/).filter(Boolean).length : 0;
                const isOptimal = wordCount >= 350;
                return (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${isOptimal
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                    {wordCount} words {isOptimal ? "✓ (Optimal for AdSense)" : "(Aim for 350+ words)"}
                  </span>
                );
              })()}
            </div>
            <RichEditor
              content={form.content}
              onChange={(val) => set("content", val)}
              watermark={form.watermark}
            />

            {/* AdSense Quality Guidance Callout */}
            <div className="mt-3 p-3 bg-ink-50/70 border border-ink-100 rounded-xl text-xs text-ink-600 space-y-1">
              <span className="font-bold text-ink-800">💡 Google AdSense High-Quality Content Checklist:</span>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px] text-ink-500">
                <li>Include <strong>Overview (सार)</strong>, <strong>Key Highlights (मुख्य बिंदु)</strong>, and <strong>How to Apply / Process</strong>.</li>
                <li>Avoid thin 1-2 sentence posts; aim for <strong>350 to 600+ original words</strong> with clear headings (H2/H3).</li>
                <li>Provide official PDF attachment links & verified government circular details.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── META TAB ── */}
      {activeTab === "meta" && (
        <div className="card p-6 space-y-5 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Category" hint="Select from list or type custom category">
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  placeholder="Type custom category or select below"
                  className="input"
                />
                <div className="flex flex-wrap gap-1.5">
                  {categoryOptions.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => set("category", c)}
                      className={`px-2.5 py-1 rounded-lg font-ui text-xs font-medium transition-all ${form.category === c
                          ? "bg-saffron-500 text-white shadow-sm"
                          : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                        }`}
                    >
                      {c === "hindi" ? "हिंदी" : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="input">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </Field>
          </div>
          <Field label="Tags" hint="Comma-separated: tag1, tag2, tag3">
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="hindi, culture, news"
              className="input"
            />
          </Field>
          <Field label="Video URL" hint="YouTube embed, direct MP4, or Vimeo link">
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => set("videoUrl", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="input"
            />
            {/* Video preview */}
            {form.videoUrl && (
              <div className="mt-3 rounded-xl overflow-hidden border border-ink-100 aspect-video bg-black">
                {form.videoUrl.includes("youtube") || form.videoUrl.includes("youtu.be") ? (
                  <iframe
                    src={(() => {
                      try {
                        const u = new URL(form.videoUrl);
                        const id = u.searchParams.get("v") || u.pathname.slice(1);
                        return `https://www.youtube.com/embed/${id}`;
                      } catch { return form.videoUrl; }
                    })()}
                    title="Video preview"
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video src={form.videoUrl} controls className="w-full h-full" />
                )}
              </div>
            )}
          </Field>
        </div>
      )}

      {/* ── WATERMARK TAB ── */}
      {activeTab === "watermark" && (
        <div className="card p-6 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-ink-100 pb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900 flex items-center gap-2">
                <span>🛡️</span> ब्लॉग वॉटरमार्क सेटिंग्स (Blog Watermark)
              </h2>
              <p className="font-ui text-xs text-ink-400 mt-0.5">
                Protect your content by displaying a subtle background watermark on the entire article
              </p>
            </div>
            {/* Enable Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={form.watermark?.enabled || false}
                onChange={(e) =>
                  set("watermark", {
                    ...(form.watermark || {}),
                    enabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-ink-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ink-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-saffron-600"></div>
              <span className="ml-2.5 font-ui text-xs font-semibold text-ink-800">
                {form.watermark?.enabled ? "Enabled (सक्रिय)" : "Disabled (निष्क्रिय)"}
              </span>
            </label>
          </div>

          {form.watermark?.enabled && (
            <div className="space-y-6">
              {/* Watermark Type Selector */}
              <div>
                <label className="block font-ui text-sm font-semibold text-ink-800 mb-2">Watermark Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "preset", title: "🏛️ Official Seal / Logo", desc: "Shasnadesh official emblem / logo" },
                    { id: "text", title: "✍️ Custom Text", desc: "Custom Hindi or English text watermark" },
                    { id: "image", title: "🖼️ Custom Image", desc: "Upload your custom seal or watermark" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        set("watermark", {
                          ...(form.watermark || {}),
                          type: item.id,
                        })
                      }
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        form.watermark?.type === item.id
                          ? "border-saffron-500 bg-saffron-50/50 shadow-2xs ring-2 ring-saffron-500/20"
                          : "border-ink-200 hover:border-ink-300 bg-white"
                      }`}
                    >
                      <div className="font-ui text-sm font-bold text-ink-900">{item.title}</div>
                      <div className="font-ui text-xs text-ink-500 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional Inputs based on Type */}
              {form.watermark?.type === "text" && (
                <Field label="Custom Watermark Text" hint="Text that will repeat across the article">
                  <input
                    type="text"
                    value={form.watermark?.text || ""}
                    onChange={(e) =>
                      set("watermark", {
                        ...(form.watermark || {}),
                        text: e.target.value,
                      })
                    }
                    placeholder="उदा. शासनादेश अपडेट्स / Shasnadesh Updates"
                    className="input"
                  />
                </Field>
              )}

              {form.watermark?.type === "image" && (
                <Field label="Custom Watermark Image" hint="Upload a transparent PNG/SVG or paste image URL">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={form.watermark?.imageUrl || ""}
                        onChange={(e) =>
                          set("watermark", {
                            ...(form.watermark || {}),
                            imageUrl: e.target.value,
                          })
                        }
                        placeholder="https://example.com/watermark.png"
                        className="input flex-1"
                      />
                      <label className="btn-secondary cursor-pointer gap-1 text-xs">
                        <Upload size={14} /> Upload
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const { data } = await uploadFile(file);
                              set("watermark", {
                                ...(form.watermark || {}),
                                imageUrl: data.url,
                              });
                              toast.success("Watermark image uploaded!");
                            } catch {
                              toast.error("Upload failed");
                            }
                          }}
                        />
                      </label>
                    </div>
                    {form.watermark?.imageUrl && (
                      <div className="p-2 border border-ink-100 rounded-xl w-32 h-32 bg-ink-50 flex items-center justify-center relative">
                        <img
                          src={getImageUrl(form.watermark.imageUrl)}
                          alt="Watermark preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                </Field>
              )}

              {/* Watermark Pattern Layout */}
              <div>
                <label className="block font-ui text-sm font-semibold text-ink-800 mb-2">Display Pattern Layout</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: "diagonal", title: "📐 Diagonal Tiled Grid", desc: "Repeating angled pattern across the whole post (Recommended)" },
                    { id: "center", title: "🎯 Large Centered Emblem", desc: "Single prominent subtle seal in the center of the post" },
                  ].map((pat) => (
                    <button
                      key={pat.id}
                      type="button"
                      onClick={() =>
                        set("watermark", {
                          ...(form.watermark || {}),
                          pattern: pat.id,
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        (form.watermark?.pattern || "diagonal") === pat.id
                          ? "border-saffron-500 bg-saffron-50/50 shadow-2xs ring-2 ring-saffron-500/20"
                          : "border-ink-200 hover:border-ink-300 bg-white"
                      }`}
                    >
                      <div className="font-ui text-sm font-bold text-ink-900">{pat.title}</div>
                      <div className="font-ui text-xs text-ink-500 mt-0.5">{pat.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Watermark Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-ui text-sm font-semibold text-ink-800">Watermark Opacity (पारदर्शिता)</label>
                  <span className="text-sm font-bold text-saffron-600">
                    {Math.round(Number(form.watermark?.opacity || 0.12) * 100)}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { val: 0.08, label: "Subtle (8%)" },
                    { val: 0.15, label: "Standard (15%)" },
                    { val: 0.25, label: "Prominent (25%)" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() =>
                        set("watermark", {
                          ...(form.watermark || {}),
                          opacity: p.val,
                        })
                      }
                      className={`py-1.5 px-3 rounded-lg text-xs font-semibold border cursor-pointer ${
                        Number(form.watermark?.opacity) === p.val
                          ? "bg-saffron-600 text-white border-saffron-600 shadow-2xs"
                          : "bg-ink-50 text-ink-700 border-ink-200 hover:bg-ink-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min="0.04"
                  max="0.40"
                  step="0.02"
                  value={form.watermark?.opacity || 0.12}
                  onChange={(e) =>
                    set("watermark", {
                      ...(form.watermark || {}),
                      opacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-ink-200 rounded-lg appearance-none cursor-pointer accent-saffron-500"
                />
              </div>

              {/* Live Mini Preview Box */}
              <div>
                <label className="block font-ui text-sm font-semibold text-ink-800 mb-2">Live Watermark Preview</label>
                <div className="relative border border-ink-200 rounded-xl p-5 overflow-hidden bg-white shadow-2xs min-h-[140px] flex flex-col justify-center">
                  <BlogWatermarkOverlay watermark={form.watermark} />
                  <div className="relative z-10 text-ink-800 space-y-1.5">
                    <h4 className="font-display font-bold text-sm text-ink-900">शासनादेश संख्या / Circular Order 2026</h4>
                    <p className="font-ui text-xs text-ink-600 leading-relaxed">
                      यह एक नमूना पाठ (Sample Text) है जो यह दर्शाता है कि ब्लॉग पोस्ट पर वॉटरमार्क कैसा दिखाई देगा। पाठक पाठ को आसानी से पढ़ सकते हैं।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MEDIA TAB ── */}
      {activeTab === "media" && (
        <div className="card p-6 space-y-8 animate-fade-in">
          {/* Thumbnail */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ImageIcon size={16} className="text-saffron-500" />
              <p className="font-ui text-sm font-semibold text-ink-800">Thumbnail</p>
            </div>
            <ThumbnailUploader value={form.thumbnail} onChange={(v) => set("thumbnail", v)} />
          </div>

          {/* External Links */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Link2 size={16} className="text-blue-500" />
                <p className="font-ui text-sm font-semibold text-ink-800">External Links</p>
              </div>
              <button type="button" onClick={addLink} className="btn-ghost text-xs gap-1">
                <Plus size={13} /> Add Link
              </button>
            </div>
            <div className="space-y-2">
              {form.links.map((link, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <input
                    type="text"
                    placeholder="Label"
                    value={link.title}
                    onChange={(e) => updateLink(i, "title", e.target.value)}
                    className="input flex-1 text-sm"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(i, "url", e.target.value)}
                    className="input flex-[2] text-sm"
                  />
                  <button
                    onClick={() => removeLink(i)}
                    className="p-2 mt-0.5 text-ink-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {form.links.length === 0 && (
                <p className="font-ui text-xs text-ink-400 py-3 text-center border border-dashed border-ink-200 rounded-xl">
                  No links added yet
                </p>
              )}
            </div>
          </div>

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-red-500" />
                <p className="font-ui text-sm font-semibold text-ink-800">Documents (PDF/DOC/DOCX/GDOC/ODT/TXT)</p>
              </div>
              <button type="button" onClick={addPdf} className="btn-ghost text-xs gap-1">
                <Plus size={13} /> Add Document
              </button>
            </div>
            <div className="space-y-3">
              {form.pdfs.map((pdf, i) => (
                <div key={i} className="border border-ink-100 rounded-xl p-3 bg-ink-50 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Document title"
                      value={pdf.title}
                      onChange={(e) => updatePdf(i, "title", e.target.value)}
                      className="input flex-1 text-sm"
                    />
                    <button
                      onClick={() => removePdf(i)}
                      className="p-2 text-ink-400 hover:text-red-500 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="Document URL (or upload below)"
                      value={pdf.url}
                      onChange={(e) => updatePdf(i, "url", e.target.value)}
                      className="input flex-1 text-sm"
                    />
                  </div>
                  <label className="btn-ghost text-xs whitespace-nowrap w-fit">
                    <Upload size={13} /> Upload
                    <input
                      type="file"
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.google-apps.document,application/vnd.oasis.opendocument.text,text/plain"
                      className="hidden"
                      onChange={(e) => handlePdfUpload(i, e)}
                    />
                  </label>
                  {pdf.url && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-green-600 font-ui">
                        <Check size={11} /> File ready
                        <span className="text-ink-400">•</span>
                        <span className="text-ink-500 uppercase">{getDocType(pdf.url)}</span>
                        <a
                          href={pdf.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink-600 hover:text-ink-800"
                        >
                          View
                        </a>
                      </div>
                      {getDocType(pdf.url) === "pdf" ? (
                        <div className="border border-ink-100 rounded-lg overflow-hidden bg-white">
                          <iframe
                            src={pdf.url}
                            title={`Document preview ${i + 1}`}
                            className="w-full h-56"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-ink-500 bg-white border border-ink-100 rounded-lg px-3 py-2">
                          Preview not available for DOC/DOCX/GDOC/ODT/TXT. Use the View link to open.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {form.pdfs.length === 0 && (
                <p className="font-ui text-xs text-ink-400 py-3 text-center border border-dashed border-ink-200 rounded-xl">
                  No PDFs added yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── LIVE BLOG PREVIEW MODAL ── */}
      <BlogPreviewModal
        form={form}
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onSave={handleSave}
        isEditing={isEditing}
        saving={saving}
      />
    </div>
  );
}