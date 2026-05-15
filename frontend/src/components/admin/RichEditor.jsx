import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import { uploadFile } from "../../services/api";
import toast from "react-hot-toast";
import { useState, useRef, useCallback } from "react";
import { ImageResize } from "./ImageResizeExtension";
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Code2,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Highlighter,
  Type,
  Upload,
  X,
  Check,
  ChevronDown,
  Film,
} from "lucide-react";

/* ─── Font options ─────────────────────────────────────────────────── */
const FONT_OPTIONS = [
  { label: "Default", value: "" },
  { label: "Playfair Display", value: "'Playfair Display', Georgia, serif" },
  { label: "Lora", value: "'Lora', Georgia, serif" },
  { label: "DM Sans", value: "'DM Sans', sans-serif" },
  { label: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { label: "हिंदी (Noto Sans)", value: "'Noto Sans Devanagari', sans-serif" },
  { label: "हिंदी (Poppins)", value: "'Poppins', sans-serif" },
  { label: "हिंदी (Mukta)", value: "'Mukta', sans-serif" },
];

const HEADING_OPTIONS = [
  { label: "Normal", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
];

const TEXT_COLORS = [
  { color: "#26201a", label: "Black" },
  { color: "#c93333", label: "Crimson" },
  { color: "#e8920a", label: "Saffron" },
  { color: "#2563eb", label: "Blue" },
  { color: "#16a34a", label: "Green" },
  { color: "#7c3aed", label: "Purple" },
  { color: "#db2777", label: "Pink" },
  { color: "#64748b", label: "Slate" },
  { color: "#ffffff", label: "White" },
];

const HIGHLIGHT_COLORS = [
  { color: "#fef08a", label: "Yellow" },
  { color: "#bbf7d0", label: "Green" },
  { color: "#bfdbfe", label: "Blue" },
  { color: "#fecaca", label: "Red" },
  { color: "#e9d5ff", label: "Purple" },
  { color: "#fed7aa", label: "Orange" },
];

/* ─── Helpers ──────────────────────────────────────────────────────── */
function getYoutubeEmbedUrl(url) {
  try {
    const u = new URL(url);
    let id = null;
    if (u.hostname.includes("youtube.com")) id = u.searchParams.get("v");
    else if (u.hostname === "youtu.be") id = u.pathname.slice(1);
    else if (u.pathname.includes("/embed/")) id = u.pathname.split("/embed/")[1]?.split("?")[0];
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch { return url; }
}

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url) ||
    url.includes("youtube.com") || url.includes("youtu.be") ||
    url.includes("vimeo.com");
}

function isImageUrl(url) {
  return /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?|$)/i.test(url);
}

/* ─── Dropdown wrapper ─────────────────────────────────────────────── */
function ToolbarDropdown({ trigger, children, width = "w-44" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useCallback(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [])();

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={`absolute top-full left-0 mt-1 ${width} bg-white border border-ink-100 rounded-xl shadow-xl z-50 overflow-hidden py-1`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Toolbar button ───────────────────────────────────────────────── */
function TB({ onClick, active, title, children, className = "" }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      className={`p-1.5 rounded-md text-sm transition-all select-none ${
        active
          ? "bg-saffron-100 text-saffron-700"
          : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
      } ${className}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-5 bg-ink-200 mx-0.5 self-center flex-shrink-0" />;
}

/* ─── Link / Image / Video input modal ────────────────────────────── */
function MediaModal({ type, onClose, onConfirm }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("auto");
  const [align, setAlign] = useState("center");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const preview = url.trim();
  const showImagePreview = type === "image" && preview && isImageUrl(preview);
  const showVideoPreview = type === "video" && preview;
  const embedUrl = showVideoPreview ? getYoutubeEmbedUrl(preview) : null;
  const isYT = showVideoPreview && (preview.includes("youtube") || preview.includes("youtu.be"));
  const isDirectVideo = showVideoPreview && !isYT && isVideoUrl(preview);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await uploadFile(file);
      setUrl(data.url);
      toast.success("File uploaded!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleConfirm = () => {
    if (type === "image") {
      onConfirm({ 
        url: url.trim(), 
        label: label.trim(),
        width: width.trim(),
        height: height.trim(),
        align: align.trim()
      });
    } else {
      onConfirm({ url: url.trim(), label: label.trim() });
    }
  };

  const sizePresets = [
    { width: "100%", height: "auto", label: "Full Width" },
    { width: "800px", height: "auto", label: "Large" },
    { width: "600px", height: "400px", label: "Medium" },
    { width: "300px", height: "200px", label: "Small" },
    { width: "150px", height: "150px", label: "Thumbnail" },
  ];

  const alignmentOptions = [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-display text-base font-bold text-ink-900">
            {type === "link" ? "Insert Link" : type === "image" ? "Insert Image" : "Embed Video"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* URL input */}
          <div>
            <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
              {type === "link" ? "URL" : type === "image" ? "Image URL" : "Video URL"}
            </label>
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                type === "link"
                  ? "https://example.com"
                  : type === "image"
                  ? "https://example.com/image.jpg"
                  : "https://youtube.com/watch?v=..."
              }
              className="input text-sm"
            />
          </div>

          {/* Link label */}
          {type === "link" && (
            <div>
              <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                Display Text (optional)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Link text..."
                className="input text-sm"
              />
            </div>
          )}

          {/* Image size and alignment controls */}
          {type === "image" && (
            <>
              <div>
                <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                  Size Presets
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {sizePresets.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setWidth(preset.width);
                        setHeight(preset.height);
                      }}
                      className={`px-3 py-2 text-xs border rounded-lg hover:border-saffron-300 hover:bg-saffron-50 text-ink-700 hover:text-ink-900 ${width === preset.width && height === preset.height ? 'border-saffron-300 bg-saffron-50' : 'border-ink-200'}`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                    Width
                  </label>
                  <input
                    type="text"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="e.g., 800px or 100%"
                    className="input text-sm"
                  />
                </div>
                
                <div>
                  <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                    Height
                  </label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g., 400px or auto"
                    className="input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                  Alignment
                </label>
                <div className="flex gap-2">
                  {alignmentOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAlign(option.value)}
                      className={`px-4 py-2 text-sm border rounded-lg flex-1 ${align === option.value ? 'border-saffron-300 bg-saffron-50 text-saffron-700' : 'border-ink-200 hover:border-ink-300 text-ink-600 hover:text-ink-900'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* File upload (images only) */}
          {type === "image" && (
            <div>
              <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                Or Upload File
              </label>
              <label
                className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploading
                    ? "border-saffron-300 bg-saffron-50"
                    : "border-ink-200 hover:border-saffron-300 hover:bg-saffron-50/40"
                }`}
              >
                <Upload size={18} className={uploading ? "text-saffron-500 animate-bounce" : "text-ink-400"} />
                <span className="font-ui text-sm text-ink-500">
                  {uploading ? "Uploading to S3…" : "Click to upload image"}
                </span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          )}

          {/* PDF/File upload */}
          {type === "file" && (
            <div>
              <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                Upload File (PDF, Doc, etc.)
              </label>
              <label
                className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploading ? "border-saffron-300 bg-saffron-50" : "border-ink-200 hover:border-saffron-300 hover:bg-saffron-50/40"
                }`}
              >
                <Upload size={18} className={uploading ? "text-saffron-500 animate-bounce" : "text-ink-400"} />
                <span className="font-ui text-sm text-ink-500">{uploading ? "Uploading…" : "Click to upload file"}</span>
                <input type="file" className="hidden" onChange={handleFileUpload} />
              </label>
              {url && (
                <p className="mt-2 text-xs text-green-600 font-ui flex items-center gap-1">
                  <Check size={12} /> File uploaded
                </p>
              )}
            </div>
          )}

          {/* Image preview */}
          {showImagePreview && (
            <div className="rounded-xl overflow-hidden border border-ink-100 bg-ink-50">
              <div className="text-center p-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="mx-auto rounded-lg"
                  style={{
                    width: width === "100%" ? "100%" : width,
                    height: height === "auto" ? "auto" : height,
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
                <p className="text-xs text-ink-400 mt-2 font-ui">
                  Preview: {width} × {height} ({align})
                </p>
              </div>
            </div>
          )}

          {/* Video preview */}
          {showVideoPreview && isYT && embedUrl && (
            <div className="rounded-xl overflow-hidden border border-ink-100 aspect-video bg-black">
              <iframe
                src={embedUrl}
                title="Video preview"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              />
            </div>
          )}
          {showVideoPreview && isDirectVideo && (
            <div className="rounded-xl overflow-hidden border border-ink-100 bg-black">
              <video src={preview} controls className="w-full max-h-48" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-100 bg-ink-50">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            <Check size={14} />
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main RichEditor ──────────────────────────────────────────────── */
export default function RichEditor({ content, onChange }) {
  const [modal, setModal] = useState(null); // null | 'link' | 'image' | 'video'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      ImageResize,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-saffron-600 underline underline-offset-2 hover:text-saffron-500" },
      }),
      Youtube.configure({ controls: true, width: "100%", height: 400 }),
    ],
    content: content || "<p></p>",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[500px] outline-none px-6 py-5 prose-blog",
        spellcheck: "false",
      },
    },
  });

  if (!editor) return null;

  /* ── get current font ── */
  const getCurrentFont = () => {
    const fontFamily = editor.getAttributes('textStyle').fontFamily;
    if (!fontFamily) return "Default";
    const found = FONT_OPTIONS.find(f => f.value === fontFamily);
    return found ? found.label : "Default";
  };

  /* ── heading label ── */
  const currentHeading = () => {
    for (let i = 1; i <= 4; i++) {
      if (editor.isActive("heading", { level: i })) return `Heading ${i}`;
    }
    return "Normal";
  };

  const setHeading = (val) => {
    if (val === "paragraph") editor.chain().focus().setParagraph().run();
    else {
      const level = parseInt(val.replace("h", ""));
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  /* ── inline image upload (toolbar button) ── */
  const handleInlineImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const tid = toast.loading("Uploading…");
    try {
      const { data } = await uploadFile(file);
      editor.chain().focus().insertContent({
        type: 'imageResize',
        attrs: {
          src: data.url,
          alt: "",
          width: '100%',
          height: 'auto',
          align: 'center',
          className: 'rounded-lg',
        },
      }).run();
      toast.success("Image inserted!", { id: tid });
    } catch {
      toast.error("Upload failed", { id: tid });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  /* ── modal confirm handler ── */
  const handleModalConfirm = ({ url, label, width = '100%', height = 'auto', align = 'center' }) => {
    if (!url) return;
    if (modal === "link") {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
      if (label && editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${url}">${label}</a>`).run();
      }
    } else if (modal === "image") {
      editor.chain().focus().insertContent({
        type: 'imageResize',
        attrs: {
          src: url,
          alt: label || "",
          width: width || '100%',
          height: height || 'auto',
          align: align || 'center',
          className: 'rounded-lg',
        },
      }).run();
    } else if (modal === "video") {
      const embed = getYoutubeEmbedUrl(url);
      if (url.includes("youtube") || url.includes("youtu.be")) {
        editor.commands.setYoutubeVideo({ src: embed });
      } else {
        // Direct video — insert as HTML block
        editor.chain().focus().insertContent(
          `<div class="video-embed my-6"><video src="${url}" controls class="w-full rounded-xl max-h-[400px]"></video></div>`
        ).run();
      }
    }
    setModal(null);
  };

  return (
    <>
      {modal && (
        <MediaModal
          type={modal}
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      <div className="border border-ink-200 rounded-xl overflow-hidden bg-white tiptap-editor shadow-sm">
        {/* ── TOOLBAR (sticky, Google Docs style) ── */}
        <div className="border-b border-ink-100 bg-white/95 backdrop-blur-sm px-2 py-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-20 shadow-sm">

          {/* History */}
          <TB onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)">
            <Undo2 size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)">
            <Redo2 size={15} />
          </TB>
          <Sep />

          {/* Heading / paragraph dropdown */}
          <ToolbarDropdown
            width="w-44"
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-ui text-ink-700 hover:bg-ink-100 transition-all min-w-[110px] justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Type size={14} />
                  {currentHeading()}
                </span>
                <ChevronDown size={12} />
              </button>
            }
          >
            {HEADING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setHeading(opt.value); }}
                className={`w-full text-left px-4 py-2 font-ui text-sm hover:bg-ink-50 transition-colors ${
                  currentHeading() === opt.label ? "text-saffron-600 font-medium" : "text-ink-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </ToolbarDropdown>

          <Sep />

          {/* Font family dropdown */}
          <ToolbarDropdown
            width="w-52"
            trigger={
              <button
                type="button"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-ui text-ink-700 hover:bg-ink-100 transition-all min-w-[120px] justify-between"
              >
                <span className="truncate">{getCurrentFont()}</span>
                <ChevronDown size={12} className="flex-shrink-0" />
              </button>
            }
          >
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!f.value) {
                    editor.chain().focus().unsetFontFamily().run();
                  } else {
                    editor.chain().focus().setFontFamily(f.value).run();
                  }
                }}
                className={`w-full text-left px-4 py-2 hover:bg-ink-50 transition-colors ${
                  getCurrentFont() === f.label ? "bg-saffron-50 text-saffron-700 font-medium" : ""
                }`}
                style={{ fontFamily: f.value || "inherit" }}
              >
                <span className="text-sm text-ink-700">{f.label}</span>
                {f.label.includes("हिंदी") && (
                  <span className="ml-2 text-xs text-saffron-500">अ</span>
                )}
              </button>
            ))}
          </ToolbarDropdown>

          <Sep />

          {/* Bold / Italic / Underline / Strike / Code */}
          <TB onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold (Ctrl+B)">
            <Bold size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic (Ctrl+I)">
            <Italic size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline (Ctrl+U)">
            <UnderlineIcon size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
            <Strikethrough size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
            <Code size={15} />
          </TB>

          <Sep />

          {/* Text color */}
          <ToolbarDropdown
            width="w-52"
            trigger={
              <TB title="Text color">
                <div className="flex items-center gap-0.5">
                  <span className="font-bold text-xs" style={{ color: "#e8920a" }}>A</span>
                  <ChevronDown size={10} />
                </div>
              </TB>
            }
          >
            <div className="px-3 py-2">
              <p className="font-ui text-xs text-ink-400 mb-2">Text Color</p>
              <div className="grid grid-cols-5 gap-1.5 mb-3">
                {TEXT_COLORS.map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); }}
                    className="w-7 h-7 rounded-full border-2 border-white shadow hover:scale-110 transition-transform"
                    style={{ background: color, outline: color === "#ffffff" ? "1px solid #e2e2e2" : undefined }}
                  />
                ))}
                <button
                  type="button"
                  title="Remove color"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetColor().run(); }}
                  className="w-7 h-7 rounded-full border-2 border-ink-200 flex items-center justify-center hover:bg-ink-100 transition-colors"
                >
                  <X size={10} className="text-ink-400" />
                </button>
              </div>
              <p className="font-ui text-xs text-ink-400 mb-2">Highlight</p>
              <div className="grid grid-cols-5 gap-1.5">
                {HIGHLIGHT_COLORS.map(({ color, label }) => (
                  <button
                    key={color}
                    type="button"
                    title={label}
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color }).run(); }}
                    className="w-7 h-7 rounded-md border border-ink-100 hover:scale-110 transition-transform"
                    style={{ background: color }}
                  />
                ))}
                <button
                  type="button"
                  title="Remove highlight"
                  onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
                  className="w-7 h-7 rounded-md border-2 border-ink-200 flex items-center justify-center hover:bg-ink-100 transition-colors"
                >
                  <X size={10} className="text-ink-400" />
                </button>
              </div>
            </div>
          </ToolbarDropdown>

          <Sep />

          {/* Alignment */}
          <TB onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
            <AlignLeft size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Center">
            <AlignCenter size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
            <AlignRight size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify">
            <AlignJustify size={15} />
          </TB>

          <Sep />

          {/* Lists */}
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Numbered list">
            <ListOrdered size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
            <Code2 size={15} />
          </TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
            <Minus size={15} />
          </TB>

          <Sep />

          {/* Link */}
          <TB
            active={editor.isActive("link")}
            onClick={() => {
              if (editor.isActive("link")) {
                editor.chain().focus().extendMarkRange("link").unsetLink().run();
              } else {
                setModal("link");
              }
            }}
            title="Insert / remove link"
          >
            <LinkIcon size={15} />
          </TB>

          {/* Image — upload button (direct S3) */}
          <label
            className={`p-1.5 rounded-md text-sm transition-all cursor-pointer select-none ${
              uploading ? "bg-saffron-100 text-saffron-600" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`}
            title="Upload image to S3"
          >
            {uploading ? (
              <span className="w-[15px] h-[15px] border-2 border-saffron-400 border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <ImageIcon size={15} />
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInlineImageUpload}
            />
          </label>

          {/* Image from URL / preview */}
          <TB onClick={() => setModal("image")} title="Insert image from URL (with preview)">
            <div className="flex items-center">
              <ImageIcon size={13} />
              <span className="text-[10px] ml-0.5">URL</span>
            </div>
          </TB>

          {/* Video embed */}
          <TB onClick={() => setModal("video")} title="Embed YouTube / video URL (with preview)">
            <Film size={15} />
          </TB>
        </div>

        {/* ── EDITOR AREA ── */}
        <EditorContent editor={editor} />
      </div>
    </>
  );
}