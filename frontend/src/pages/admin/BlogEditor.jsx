import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createBlog, updateBlog, adminGetBlogs, uploadFile, getCategories } from "../../services/api";
import RichEditor from "../../components/admin/RichEditor";
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
} from "lucide-react";

const DEFAULT_CATEGORIES = ["hindi", "english", "news", "culture", "technology", "lifestyle", "opinion"];

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
            className={`px-3 py-1.5 rounded-md font-ui text-xs font-medium capitalize transition-all ${
              mode === m ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {m === "upload" ? "📁 Upload File" : "🔗 URL"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <label
          className={`flex flex-col items-center gap-3 px-6 py-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
            uploading
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
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    { id: "media", icon: Paperclip, label: "Media" },
  ];

  const categoryOptions = Array.from(new Set([...(categories || []), form.category].filter(Boolean)));

  return (
    <div className="max-w-5xl space-y-4 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 flex items-center gap-2">
            {isEditing ? <><PenSquare size={22} className="text-saffron-500" /> Edit Blog</> : <><PenSquare size={22} className="text-saffron-500" /> New Blog</>}
          </h1>
          <p className="font-ui text-sm text-ink-400 mt-0.5">
            {isEditing ? "Update your post" : "Write and publish a new post"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setHindiMode(!hindiMode)}
            className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg font-ui text-xs sm:text-sm font-medium transition-all ${
              hindiMode ? "bg-saffron-100 text-saffron-700" : "bg-ink-100 text-ink-600 hover:bg-ink-200"
            }`}
            title="Toggle Hindi/English mode"
          >
            {hindiMode ? "हिंदी मोड" : "English"}
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="btn-ghost border border-ink-200 disabled:opacity-50 gap-1.5 text-xs sm:text-sm"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="btn-primary disabled:opacity-50 text-xs sm:text-sm"
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
      <div className="flex flex-wrap gap-1 bg-ink-100 rounded-xl p-1 w-full sm:w-fit">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-ui text-xs sm:text-sm font-medium transition-all flex-1 sm:flex-initial ${
              activeTab === id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            <Icon size={14} strokeWidth={activeTab === id ? 2.5 : 2} />
            {label}
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
            <p className="font-ui text-sm font-medium text-ink-700 mb-1.5">Content</p>
            <RichEditor content={form.content} onChange={(val) => set("content", val)} />
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
                      className={`px-2.5 py-1 rounded-lg font-ui text-xs font-medium transition-all ${
                        form.category === c
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
                <p className="font-ui text-sm font-semibold text-ink-800">Documents (PDF/DOC)</p>
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
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                          Preview not available for DOC/DOCX. Use the View link to open.
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
    </div>
  );
}