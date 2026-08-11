import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { uploadFile, getSearchSuggestions } from "../../services/api";
import toast from "react-hot-toast";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
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
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Type,
  Upload,
  X,
  Check,
  ChevronDown,
  Film,
  Table as TableIcon,
  Maximize2,
  Minimize2,
  MousePointerClick,
  Trash2,
  Rows,
  Columns,
  Combine,
  Split,
  Palette,
  Grid,
  Paintbrush,
  Pin,
  PinOff,
  BookOpen,
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

const FONT_SIZES = [
  { label: "Default (16px)", value: "" },
  { label: "Small (12px)", value: "12px" },
  { label: "Normal (14px)", value: "14px" },
  { label: "Medium (18px)", value: "18px" },
  { label: "Large (24px)", value: "24px" },
  { label: "Huge (32px)", value: "32px" },
];

const HEADING_OPTIONS = [
  { label: "Normal", value: "paragraph" },
  { label: "Heading 1", value: "h1" },
  { label: "Heading 2", value: "h2" },
  { label: "Heading 3", value: "h3" },
  { label: "Heading 4", value: "h4" },
];

/* ─── Expanded Rich Color Palettes ─────────────────────────────────── */
const TEXT_COLORS = [
  { color: "#26201a", label: "Dark Ink" },
  { color: "#475569", label: "Slate Gray" },
  { color: "#c93333", label: "Crimson Red" },
  { color: "#dc2626", label: "Ruby Red" },
  { color: "#e8920a", label: "Saffron Gold" },
  { color: "#ea580c", label: "Vibrant Orange" },
  { color: "#d97706", label: "Amber" },
  { color: "#16a34a", label: "Emerald Green" },
  { color: "#15803d", label: "Forest Green" },
  { color: "#0284c7", label: "Sky Blue" },
  { color: "#2563eb", label: "Royal Blue" },
  { color: "#4f46e5", label: "Indigo" },
  { color: "#7c3aed", label: "Purple" },
  { color: "#db2777", label: "Pink" },
  { color: "#78350f", label: "Brown" },
  { color: "#ffffff", label: "White" },
];

const HIGHLIGHT_COLORS = [
  { color: "#fef08a", label: "Soft Yellow" },
  { color: "#fde68a", label: "Amber Gold" },
  { color: "#bbf7d0", label: "Soft Green" },
  { color: "#a7f3d0", label: "Mint Emerald" },
  { color: "#cffafe", label: "Cyan Tint" },
  { color: "#bfdbfe", label: "Soft Blue" },
  { color: "#c7d2fe", label: "Indigo Tint" },
  { color: "#e9d5ff", label: "Soft Purple" },
  { color: "#fbcfe8", label: "Soft Pink" },
  { color: "#fecaca", label: "Soft Red" },
  { color: "#fed7aa", label: "Soft Orange" },
  { color: "#e2e8f0", label: "Neutral Gray" },
];

const CELL_BG_COLORS = [
  { color: "#ffffff", label: "White" },
  { color: "#f8fafc", label: "Light Slate" },
  { color: "#fffbeb", label: "Soft Saffron" },
  { color: "#fef2f2", label: "Soft Red" },
  { color: "#eff6ff", label: "Soft Blue" },
  { color: "#f0fdf4", label: "Soft Green" },
  { color: "#fef08a", label: "Yellow Shading" },
  { color: "#e2e8f0", label: "Gray Header" },
  { color: "#fed7aa", label: "Orange Shading" },
  { color: "#e9d5ff", label: "Purple Shading" },
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

/* ─── Custom Extensions for Table Background, Border & Row Height ──── */
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderColor: {
        default: null,
        parseHTML: element => element.style.borderColor || null,
        renderHTML: attributes => {
          if (!attributes.borderColor) return {};
          return { style: `border-color: ${attributes.borderColor} !important` };
        },
      },
      borderWidth: {
        default: null,
        parseHTML: element => element.style.borderWidth || null,
        renderHTML: attributes => {
          if (!attributes.borderWidth) return {};
          return { style: `border-width: ${attributes.borderWidth} !important` };
        },
      },
      borderStyle: {
        default: null,
        parseHTML: element => element.style.borderStyle || null,
        renderHTML: attributes => {
          if (!attributes.borderStyle) return {};
          return { style: `border-style: ${attributes.borderStyle} !important` };
        },
      },
    };
  },
}).configure({ resizable: true });

const CustomTableRow = TableRow.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      height: {
        default: null,
        parseHTML: element => element.style.height || null,
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { style: `height: ${attributes.height} !important` };
        },
      },
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      borderColor: {
        default: null,
        parseHTML: element => element.style.borderColor || null,
        renderHTML: attributes => {
          if (!attributes.borderColor) return {};
          return { style: `border-color: ${attributes.borderColor} !important` };
        },
      },
      borderWidth: {
        default: null,
        parseHTML: element => element.style.borderWidth || null,
        renderHTML: attributes => {
          if (!attributes.borderWidth) return {};
          return { style: `border-width: ${attributes.borderWidth} !important` };
        },
      },
      borderStyle: {
        default: null,
        parseHTML: element => element.style.borderStyle || null,
        renderHTML: attributes => {
          if (!attributes.borderStyle) return {};
          return { style: `border-style: ${attributes.borderStyle} !important` };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.style.height || null,
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { style: `height: ${attributes.height} !important` };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      borderColor: {
        default: null,
        parseHTML: element => element.style.borderColor || null,
        renderHTML: attributes => {
          if (!attributes.borderColor) return {};
          return { style: `border-color: ${attributes.borderColor} !important` };
        },
      },
      borderWidth: {
        default: null,
        parseHTML: element => element.style.borderWidth || null,
        renderHTML: attributes => {
          if (!attributes.borderWidth) return {};
          return { style: `border-width: ${attributes.borderWidth} !important` };
        },
      },
      borderStyle: {
        default: null,
        parseHTML: element => element.style.borderStyle || null,
        renderHTML: attributes => {
          if (!attributes.borderStyle) return {};
          return { style: `border-style: ${attributes.borderStyle} !important` };
        },
      },
      height: {
        default: null,
        parseHTML: element => element.style.height || null,
        renderHTML: attributes => {
          if (!attributes.height) return {};
          return { style: `height: ${attributes.height} !important` };
        },
      },
    };
  },
});

/* ─── Dropdown wrapper with Portal ─────────────────────────────────── */
function ToolbarDropdown({ trigger, children, width = "w-44" }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (open && triggerRef.current) {
      const updatePosition = () => {
        const rect = triggerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: Math.min(rect.left, window.innerWidth - 240)
        });
      };
      updatePosition();
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <>
      <div ref={triggerRef} onClick={() => setOpen((v) => !v)}>
        {trigger}
      </div>
      {open && createPortal(
        <div
          ref={dropdownRef}
          className={`${width} bg-white border border-ink-100 rounded-xl shadow-xl overflow-hidden py-1 max-h-[360px] overflow-y-auto z-[9999]`}
          style={{
            position: 'fixed',
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          onClick={(e) => {
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'LABEL') {
              setOpen(false);
            }
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}

/* ─── Toolbar button ───────────────────────────────────────────────── */
function TB({ onClick, active, title, children, className = "" }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
      title={title}
      className={`p-1 sm:p-1.5 rounded-md text-sm transition-all select-none ${
        active
          ? "bg-saffron-100 text-saffron-700 font-semibold"
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

/* ─── Insert Table & Media Modal ────────────────────────────────────── */
function MediaModal({ type, onClose, onConfirm }) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [width, setWidth] = useState("100%");
  const [height, setHeight] = useState("auto");
  const [align, setAlign] = useState("center");
  const [buttonStyle, setButtonStyle] = useState("btn-cta-saffron");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Table insert options (clean & simple)
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [hoverGrid, setHoverGrid] = useState(null);
  const [tableHeader, setTableHeader] = useState(true);

  const activeRows = hoverGrid ? hoverGrid.rows : Number(tableRows) || 3;
  const activeCols = hoverGrid ? hoverGrid.cols : Number(tableCols) || 3;

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
    } else if (type === "cta") {
      onConfirm({
        url: url.trim(),
        label: label.trim() || "📄 डाउनलोड शासनादेश PDF",
        buttonStyle
      });
    } else if (type === "table") {
      onConfirm({
        rows: Math.max(1, Math.min(20, Number(tableRows) || 3)),
        cols: Math.max(1, Math.min(15, Number(tableCols) || 3)),
        withHeaderRow: tableHeader,
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
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 flex-shrink-0">
          <h3 className="font-display text-base font-bold text-ink-900 flex items-center gap-2">
            {type === "table" && <Grid size={18} className="text-saffron-600" />}
            {type === "link"
              ? "Insert Link"
              : type === "image"
              ? "Insert Image"
              : type === "cta"
              ? "Insert CTA Action Button"
              : type === "table"
              ? "Insert Table"
              : "Embed Video"}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink-700 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* CLEAN INSERT TABLE MODAL */}
          {type === "table" && (
            <div className="space-y-4">
              {/* Quick Interactive Grid Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-ui text-xs font-medium text-ink-500 uppercase tracking-wide">
                    Grid Size ({activeRows} Rows × {activeCols} Columns)
                  </label>
                </div>
                <div
                  className="p-3 bg-ink-50 rounded-xl border border-ink-200 flex flex-col items-center select-none"
                  onMouseLeave={() => setHoverGrid(null)}
                >
                  <div className="grid grid-cols-6 gap-1.5">
                    {Array.from({ length: 6 }).map((_, r) =>
                      Array.from({ length: 6 }).map((_, c) => {
                        const rowNum = r + 1;
                        const colNum = c + 1;
                        const isSelected = rowNum <= activeRows && colNum <= activeCols;
                        return (
                          <button
                            key={`${r}-${c}`}
                            type="button"
                            onMouseEnter={() => setHoverGrid({ rows: rowNum, cols: colNum })}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              setTableRows(rowNum);
                              setTableCols(colNum);
                              setHoverGrid(null);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              setTableRows(rowNum);
                              setTableCols(colNum);
                              setHoverGrid(null);
                            }}
                            className={`w-7 h-7 rounded-md border transition-all ${
                              isSelected
                                ? "bg-saffron-500 border-saffron-600 shadow-2xs scale-105"
                                : "bg-white border-ink-200 hover:border-saffron-300"
                            }`}
                          />
                        );
                      })
                    )}
                  </div>
                  <p className="text-[11px] font-ui text-ink-500 font-medium mt-2">
                    Dimensions: <span className="text-saffron-600 font-bold">{activeRows} Rows × {activeCols} Columns</span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                    Rows (1 - 20)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(e.target.value)}
                    className="input text-sm"
                  />
                </div>
                <div>
                  <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                    Columns (1 - 15)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={tableCols}
                    onChange={(e) => setTableCols(e.target.value)}
                    className="input text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="headerToggle"
                  checked={tableHeader}
                  onChange={(e) => setTableHeader(e.target.checked)}
                  className="w-4 h-4 text-saffron-600 rounded border-ink-300 focus:ring-saffron-500 cursor-pointer"
                />
                <label htmlFor="headerToggle" className="font-ui text-xs font-medium text-ink-700 cursor-pointer">
                  Include Top Header Row (&lt;th&gt;)
                </label>
              </div>
            </div>
          )}

          {/* Standard Media Inputs */}
          {type !== "table" && (
            <div>
              <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                {type === "cta" ? "Target Link / PDF URL *" : "URL *"}
              </label>
              <input
                autoFocus
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={
                  type === "cta"
                    ? "https://example.com/order.pdf"
                    : type === "link"
                    ? "https://example.com"
                    : type === "image"
                    ? "https://example.com/image.jpg"
                    : "https://youtube.com/watch?v=..."
                }
                className="input text-sm"
              />
            </div>
          )}

          {/* CTA Label */}
          {type === "cta" && (
            <>
              <div>
                <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                  Button Text / Label *
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. 📄 डाउनलोड शासनादेश PDF"
                  className="input text-sm"
                />
              </div>

              <div>
                <label className="block font-ui text-xs font-medium text-ink-500 mb-1.5 uppercase tracking-wide">
                  Button Color Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "btn-cta-saffron", name: "Saffron Primary" },
                    { id: "btn-cta-green", name: "Emerald Green" },
                    { id: "btn-cta-blue", name: "Royal Blue" },
                    { id: "btn-cta-outline", name: "Dark Outline" },
                  ].map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setButtonStyle(style.id)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-all ${
                        buttonStyle === style.id
                          ? "border-saffron-500 bg-saffron-50 text-saffron-800"
                          : "border-ink-200 hover:border-ink-300 text-ink-700"
                      }`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

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
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-ink-100 bg-ink-50 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={type !== "table" && !url.trim()}
            className="btn-primary text-sm disabled:opacity-50"
          >
            <Check size={14} />
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main RichEditor ──────────────────────────────────────────────── */
export default function RichEditor({ content, onChange }) {
  const [modal, setModal] = useState(null); // null | 'link' | 'image' | 'video' | 'cta' | 'table' | 'internal-link'
  const [uploading, setUploading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isFrozen, setIsFrozen] = useState(true); // Freeze Toolbar toggle state
  const fileInputRef = useRef(null);

  // States for Internal Link Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (modal === "internal-link" && searchQuery.length > 1) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        getSearchSuggestions(searchQuery)
          .then((res) => setSearchResults(res.data))
          .catch(() => setSearchResults([]))
          .finally(() => setIsSearching(false));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, modal]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      CustomTable,
      CustomTableRow,
      CustomTableHeader,
      CustomTableCell,
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

  /* ── Dynamic Table Border Customization (Entire Table) ── */
  const updateTableBorder = ({ color, width, style }) => {
    if (!editor) return;

    if (color) editor.chain().focus().setCellAttribute('borderColor', color).run();
    if (width) editor.chain().focus().setCellAttribute('borderWidth', width).run();
    if (style) editor.chain().focus().setCellAttribute('borderStyle', style).run();

    const { $anchor } = editor.state.selection;
    for (let d = $anchor.depth; d > 0; d--) {
      if ($anchor.node(d).type.name === 'table') {
        const pos = $anchor.before(d);
        const tableEl = editor.view.nodeDOM(pos);

        if (tableEl && tableEl.tagName === 'TABLE') {
          if (color) {
            tableEl.style.setProperty('border-color', color, 'important');
            tableEl.querySelectorAll('th, td').forEach((c) => c.style.setProperty('border-color', color, 'important'));
          }
          if (width) {
            tableEl.style.setProperty('border-width', width, 'important');
            tableEl.querySelectorAll('th, td').forEach((c) => c.style.setProperty('border-width', width, 'important'));
          }
          if (style) {
            tableEl.style.setProperty('border-style', style, 'important');
            tableEl.querySelectorAll('th, td').forEach((c) => c.style.setProperty('border-style', style, 'important'));
          }
          onChange?.(editor.getHTML());
        }
        break;
      }
    }
  };

  /* ── Dynamic Cell Border Customization (Active/Selected Cell Only) ── */
  const updateCellBorder = ({ color, width, style }) => {
    if (!editor) return;

    if (color) editor.chain().focus().setCellAttribute('borderColor', color).run();
    if (width) editor.chain().focus().setCellAttribute('borderWidth', width).run();
    if (style) editor.chain().focus().setCellAttribute('borderStyle', style).run();

    const selectedCells = editor.view.dom.querySelectorAll(
      '.ProseMirror table .selectedCell, .ProseMirror table td:focus-within, .ProseMirror table th:focus-within, .ProseMirror table td.has-focus, .ProseMirror table th.has-focus'
    );
    selectedCells.forEach((cell) => {
      if (color) cell.style.setProperty('border-color', color, 'important');
      if (width) cell.style.setProperty('border-width', width, 'important');
      if (style) cell.style.setProperty('border-style', style, 'important');
    });

    onChange?.(editor.getHTML());
  };

  /* ── Dynamic Row Height Customization ── */
  const updateRowHeight = (heightVal) => {
    if (!editor) return;

    if (heightVal && heightVal !== 'auto') {
      editor.chain().focus().setCellAttribute('height', heightVal).run();
    } else {
      editor.chain().focus().setCellAttribute('height', null).run();
    }

    const { $anchor } = editor.state.selection;
    for (let d = $anchor.depth; d > 0; d--) {
      if ($anchor.node(d).type.name === 'tableRow') {
        const rowPos = $anchor.before(d);
        const rowEl = editor.view.nodeDOM(rowPos);
        if (rowEl && rowEl.tagName === 'TR') {
          if (!heightVal || heightVal === 'auto') {
            rowEl.style.removeProperty('height');
            rowEl.querySelectorAll('th, td').forEach((cell) => cell.style.removeProperty('height'));
          } else {
            rowEl.style.setProperty('height', heightVal, 'important');
            rowEl.querySelectorAll('th, td').forEach((cell) => cell.style.setProperty('height', heightVal, 'important'));
          }
          onChange?.(editor.getHTML());
        }
        break;
      }
    }
  };

  /* ── get current font ── */
  const getCurrentFont = () => {
    const fontFamily = editor.getAttributes('textStyle').fontFamily;
    if (!fontFamily) return "Default Font";
    const found = FONT_OPTIONS.find(f => f.value === fontFamily);
    return found ? found.label : "Default Font";
  };

  /* ── font size ── */
  const setFontSize = (size) => {
    if (!size) {
      editor.chain().focus().setMark('textStyle', { fontSize: null }).run();
    } else {
      editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
    }
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
  const handleModalConfirm = ({
    url,
    label,
    width = '100%',
    height = 'auto',
    align = 'center',
    buttonStyle = 'btn-cta-saffron',
    rows = 3,
    cols = 3,
    withHeaderRow = true,
  }) => {
    if (modal === "table") {
      let tableHtml = `<table style="width: 100%; border-collapse: collapse; border: 1px solid #cbd5e1;">`;
      if (withHeaderRow) {
        tableHtml += `<thead><tr style="border: 1px solid #cbd5e1;">`;
        for (let c = 0; c < cols; c++) {
          tableHtml += `<th style="border: 1px solid #cbd5e1;"><p>Header ${c + 1}</p></th>`;
        }
        tableHtml += '</tr></thead>';
      }
      tableHtml += '<tbody>';
      for (let r = 0; r < rows; r++) {
        tableHtml += `<tr style="border: 1px solid #cbd5e1;">`;
        for (let c = 0; c < cols; c++) {
          tableHtml += `<td style="border: 1px solid #cbd5e1;"><p></p></td>`;
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';

      editor.chain().focus().insertContent(tableHtml).run();
      setModal(null);
      return;
    }

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
    } else if (modal === "cta") {
      const btnHtml = `<div class="my-6 text-center"><a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-cta ${buttonStyle}">${label || '📄 डाउनलोड शासनादेश PDF'}</a></div>`;
      editor.chain().focus().insertContent(btnHtml).run();
    } else if (modal === "video") {
      const embed = getYoutubeEmbedUrl(url);
      if (url.includes("youtube") || url.includes("youtu.be")) {
        editor.commands.setYoutubeVideo({ src: embed });
      } else {
        editor.chain().focus().insertContent(
          `<div class="video-embed my-6"><video src="${url}" controls class="w-full rounded-xl max-h-[400px]"></video></div>`
        ).run();
      }
    }
    setModal(null);
  };

  return (
    <>
      {modal && modal !== "internal-link" && (
        <MediaModal
          type={modal}
          onClose={() => setModal(null)}
          onConfirm={handleModalConfirm}
        />
      )}

      {/* Internal Link Custom Modal */}
      {modal === "internal-link" && (
        <div className="fixed inset-0 z-[999] bg-ink-950/50 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
              <h3 className="font-display font-bold text-lg text-ink-900">Insert Related Post</h3>
              <button onClick={() => { setModal(null); setSearchQuery(""); }} className="text-ink-400 hover:text-ink-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="relative mb-4">
                <input
                  type="text"
                  autoFocus
                  placeholder="Search for a blog post..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 bg-ink-50 border border-ink-200 rounded-lg text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:bg-white transition-all"
                />
                {isSearching && (
                  <div className="absolute right-3 top-3 w-4 h-4 border-2 border-saffron-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin">
                {searchQuery.length > 1 && !isSearching && searchResults.length === 0 && (
                  <p className="text-center text-ink-500 text-sm py-4">No blogs found.</p>
                )}
                {searchResults.map((blog) => (
                  <button
                    key={blog._id}
                    onClick={() => {
                      const linkHtml = `<div class="my-6 p-4 border border-ink-200 bg-white rounded-xl shadow-sm border-l-4 border-l-saffron-500 hover:border-l-saffron-600 transition-colors"><span class="text-saffron-600 font-bold mr-2 text-lg">👉 यह भी पढ़ें:</span><a href="/blog/${blog.slug}" target="_blank" class="text-ink-900 font-bold hover:text-saffron-600 hover:underline transition-colors text-lg">${blog.title}</a></div><p></p>`;
                      editor.chain().focus().insertContent(linkHtml).run();
                      setModal(null);
                      setSearchQuery("");
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-saffron-50 border border-transparent hover:border-saffron-200 transition-all flex flex-col gap-1 group"
                  >
                    <span className="font-ui font-semibold text-ink-900 text-sm group-hover:text-saffron-700 line-clamp-1">{blog.title}</span>
                    <span className="text-xs text-ink-400">/{blog.slug}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`border border-ink-200 rounded-xl bg-white tiptap-editor shadow-sm relative transition-all ${
        isFullScreen ? "fixed inset-0 z-[100] rounded-none flex flex-col p-4 bg-white overflow-y-auto" : ""
      }`}>
        {/* ── MAIN TOOLBAR ── */}
        <div
          className={`border-b border-ink-100 bg-white/98 backdrop-blur-md px-1.5 sm:px-2 py-1.5 flex flex-wrap items-center gap-0.5 overflow-x-auto scrollbar-hide transition-all ${
            isFrozen
              ? "sticky top-0 z-30 shadow-md border-b-2 border-saffron-300"
              : "relative z-10"
          }`}
        >

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
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-ui text-ink-700 hover:bg-ink-100 transition-all min-w-[100px] justify-between border border-ink-200/60"
              >
                <span className="flex items-center gap-1">
                  <Type size={13} />
                  {currentHeading()}
                </span>
                <ChevronDown size={11} />
              </button>
            }
          >
            {HEADING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setHeading(opt.value); }}
                className={`w-full text-left px-3 py-1.5 font-ui text-xs hover:bg-ink-50 transition-colors ${
                  currentHeading() === opt.label ? "text-saffron-600 font-medium" : "text-ink-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </ToolbarDropdown>

          {/* Font family dropdown */}
          <ToolbarDropdown
            width="w-52"
            trigger={
              <button
                type="button"
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-ui text-ink-700 hover:bg-ink-100 transition-all min-w-[110px] justify-between border border-ink-200/60"
              >
                <span className="truncate">{getCurrentFont()}</span>
                <ChevronDown size={11} className="flex-shrink-0" />
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
                className={`w-full text-left px-3 py-1.5 hover:bg-ink-50 transition-colors ${
                  getCurrentFont() === f.label ? "bg-saffron-50 text-saffron-700 font-medium" : ""
                }`}
                style={{ fontFamily: f.value || "inherit" }}
              >
                <span className="text-xs text-ink-700">{f.label}</span>
                {f.label.includes("हिंदी") && (
                  <span className="ml-2 text-xs text-saffron-500">अ</span>
                )}
              </button>
            ))}
          </ToolbarDropdown>

          {/* Font Size Dropdown */}
          <ToolbarDropdown
            width="w-48"
            trigger={
              <button
                type="button"
                title="Font Size"
                className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-ui text-ink-700 hover:bg-ink-100 transition-all min-w-[90px] justify-between border border-ink-200/60"
              >
                <span className="text-xs">Size</span>
                <ChevronDown size={11} />
              </button>
            }
          >
            {FONT_SIZES.map((s) => (
              <button
                key={s.value}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setFontSize(s.value);
                }}
                className="w-full text-left px-3.5 py-2 text-xs text-ink-700 hover:bg-saffron-50 hover:text-saffron-900 transition-colors flex items-center justify-between"
              >
                <span className="font-ui font-medium">{s.label.split(' ')[0]}</span>
                <span className="text-[10px] text-ink-400 font-mono bg-ink-50 px-1.5 py-0.5 rounded border border-ink-100">
                  {s.value || '16px'}
                </span>
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

          {/* COLOR PALETTES */}
          <ToolbarDropdown
            width="w-64"
            trigger={
              <TB title="Text Color & Highlight Background">
                <div className="flex items-center gap-1 px-1">
                  <Palette size={14} className="text-saffron-600" />
                  <ChevronDown size={10} />
                </div>
              </TB>
            }
          >
            <div className="p-3 space-y-3">
              {/* Text Color Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-ui text-xs font-semibold text-ink-800">Text Color</p>
                  <label className="flex items-center gap-1 text-[11px] text-saffron-600 hover:underline cursor-pointer">
                    <Paintbrush size={11} /> Custom
                    <input
                      type="color"
                      onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {TEXT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setColor(color).run(); }}
                      className="w-5 h-5 rounded-full border border-ink-200 hover:scale-125 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Highlight Color Section */}
              <div className="pt-2 border-t border-ink-100">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-ui text-xs font-semibold text-ink-800">Highlight Background</p>
                  <label className="flex items-center gap-1 text-[11px] text-saffron-600 hover:underline cursor-pointer">
                    <Paintbrush size={11} /> Custom
                    <input
                      type="color"
                      onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {HIGHLIGHT_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHighlight({ color }).run(); }}
                      className="w-6 h-6 rounded-md border border-ink-200 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    type="button"
                    title="Remove Highlight"
                    onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); }}
                    className="w-6 h-6 rounded-md border border-ink-300 flex items-center justify-center text-xs text-ink-400 hover:bg-ink-100"
                  >
                    ✕
                  </button>
                </div>
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

          {/* TABLE INSERT BUTTON */}
          <button
            type="button"
            onClick={() => setModal("table")}
            title="Insert Table"
            className={`p-1 sm:p-1.5 rounded-md text-xs font-ui transition-all border flex items-center gap-1 ${
              editor.isActive("table") ? "bg-saffron-100 text-saffron-700 border-saffron-300 font-bold" : "text-ink-700 hover:bg-ink-100 border-ink-200/60"
            }`}
          >
            <TableIcon size={15} className="text-saffron-600" />
            <span className="font-medium text-xs">Table</span>
          </button>

          {/* CTA Download / Apply Button Inserter */}
          <TB onClick={() => setModal("cta")} title="Insert CTA Action Button (Download PDF / Apply Online)">
            <div className="flex items-center gap-1 text-saffron-600 font-semibold text-xs px-1">
              <MousePointerClick size={14} />
              <span className="hidden sm:inline">CTA Button</span>
            </div>
          </TB>

          {/* Internal Blog Link Inserter */}
          <TB onClick={() => setModal("internal-link")} title="Link to an internal blog post">
            <div className="flex items-center gap-1 text-saffron-600 font-semibold text-xs px-1">
              <BookOpen size={14} />
              <span className="hidden sm:inline">Related Post</span>
            </div>
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

          <Sep />

          {/* Freeze / Pin Toolbar Button */}
          <TB
            onClick={() => setIsFrozen((v) => !v)}
            active={isFrozen}
            title={isFrozen ? "Toolbar Frozen at Top (Click to Unfreeze)" : "Freeze Toolbar at Top"}
            className={isFrozen ? "bg-saffron-500 text-white font-bold hover:bg-saffron-600 shadow-2xs" : ""}
          >
            <div className="flex items-center gap-1 px-1">
              {isFrozen ? <PinOff size={14} /> : <Pin size={14} />}
              <span className="text-[11px] font-medium hidden sm:inline">
                {isFrozen ? "Frozen" : "Freeze Bar"}
              </span>
            </div>
          </TB>

          {/* Full-Screen Distraction-Free Toggle */}
          <TB onClick={() => setIsFullScreen((v) => !v)} title={isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
            {isFullScreen ? <Minimize2 size={15} className="text-saffron-600" /> : <Maximize2 size={15} />}
          </TB>
        </div>

        {/* ── DYNAMIC TABLE DESIGN & EDITING TOOLBAR ── */}
        {editor.isActive("table") && (
          <div
            className={`bg-saffron-50/98 backdrop-blur-md border-b border-saffron-200 px-3 py-1.5 flex flex-wrap items-center gap-1.5 text-xs text-saffron-900 animate-fade-in shadow-sm transition-all ${
              isFrozen
                ? "sticky top-[43px] z-30 shadow-md"
                : "relative z-10"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-saffron-800 pr-2 border-r border-saffron-200 flex-shrink-0">
              <TableIcon size={14} className="text-saffron-600" />
              <span>Table Tools</span>
            </div>

            {/* ENTIRE TABLE BORDER DROPDOWN */}
            <ToolbarDropdown
              width="w-56"
              trigger={
                <button type="button" className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 font-medium hover:bg-saffron-100 flex items-center gap-1 shadow-2xs">
                  <Grid size={12} className="text-saffron-600" /> Table Border <ChevronDown size={10} />
                </button>
              }
            >
              <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-ink-800">
                  <span>Table Border Color</span>
                  <label className="text-saffron-600 hover:underline cursor-pointer">
                    Custom
                    <input
                      type="color"
                      onChange={(e) => updateTableBorder({ color: e.target.value })}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {["#cbd5e1", "#e8920a", "#2563eb", "#16a34a", "#c93333", "#26201a"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateTableBorder({ color: c });
                      }}
                      className="w-6 h-6 rounded-full border border-ink-200 hover:scale-110 transition-transform shadow-2xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </ToolbarDropdown>

            {/* BORDER THICKNESS SELECTOR */}
            <select
              onChange={(e) => updateTableBorder({ width: e.target.value })}
              className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 text-xs font-medium focus:outline-none cursor-pointer shadow-2xs"
              defaultValue="1px"
              title="Table Border Thickness"
            >
              <option value="1px">1px Border</option>
              <option value="2px">2px Border</option>
              <option value="3px">3px Border</option>
              <option value="4px">4px Border</option>
            </select>

            {/* BORDER STYLE SELECTOR */}
            <select
              onChange={(e) => updateTableBorder({ style: e.target.value })}
              className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 text-xs font-medium focus:outline-none cursor-pointer shadow-2xs"
              defaultValue="solid"
              title="Table Border Style"
            >
              <option value="solid">Solid Line</option>
              <option value="dashed">Dashed Line</option>
              <option value="dotted">Dotted Line</option>
              <option value="double">Double Line</option>
            </select>

            <div className="h-4 w-px bg-saffron-200 mx-0.5" />

            {/* CELL BORDER DROPDOWN (SELECTED CELL ONLY) */}
            <ToolbarDropdown
              width="w-56"
              trigger={
                <button type="button" className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 font-medium hover:bg-saffron-100 flex items-center gap-1 shadow-2xs">
                  <Paintbrush size={12} className="text-saffron-600" /> Cell Border <ChevronDown size={10} />
                </button>
              }
            >
              <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-ink-800">
                  <span>Cell Border Color</span>
                  <label className="text-saffron-600 hover:underline cursor-pointer">
                    Custom
                    <input
                      type="color"
                      onChange={(e) => updateCellBorder({ color: e.target.value })}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {["#e8920a", "#c93333", "#2563eb", "#16a34a", "#7c3aed", "#cbd5e1"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        updateCellBorder({ color: c });
                      }}
                      className="w-6 h-6 rounded-full border border-ink-200 hover:scale-110 transition-transform shadow-2xs"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="pt-2 border-t border-ink-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-ink-800">Cell Border Width</span>
                  <select
                    onChange={(e) => updateCellBorder({ width: e.target.value })}
                    className="px-2 py-0.5 rounded bg-ink-50 border border-ink-200 text-xs text-ink-800"
                    defaultValue="2px"
                  >
                    <option value="1px">1px</option>
                    <option value="2px">2px</option>
                    <option value="3px">3px</option>
                    <option value="4px">4px</option>
                  </select>
                </div>
              </div>
            </ToolbarDropdown>

            {/* CELL BACKGROUND COLOR DROPDOWN */}
            <ToolbarDropdown
              width="w-56"
              trigger={
                <button type="button" className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 font-medium hover:bg-saffron-100 flex items-center gap-1 shadow-2xs">
                  <Palette size={12} className="text-saffron-600" /> Cell Color <ChevronDown size={10} />
                </button>
              }
            >
              <div className="p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-ink-800">
                  <span>Cell Background</span>
                  <label className="text-saffron-600 hover:underline cursor-pointer">
                    Custom
                    <input
                      type="color"
                      onChange={(e) => editor.chain().focus().setCellAttribute('backgroundColor', e.target.value).run()}
                      className="w-0 h-0 opacity-0 absolute pointer-events-none"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {CELL_BG_COLORS.map(({ color, label }) => (
                    <button
                      key={color}
                      type="button"
                      title={label}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        editor.chain().focus().setCellAttribute('backgroundColor', color).run();
                      }}
                      className="w-6 h-6 rounded border border-ink-200 hover:scale-110 transition-transform shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <button
                    type="button"
                    title="Remove Cell Background"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      editor.chain().focus().setCellAttribute('backgroundColor', null).run();
                    }}
                    className="w-6 h-6 rounded border border-ink-300 flex items-center justify-center text-xs text-ink-400 hover:bg-ink-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </ToolbarDropdown>

            <div className="h-4 w-px bg-saffron-200 mx-0.5" />

            {/* ROW HEIGHT SELECTOR */}
            <select
              onChange={(e) => updateRowHeight(e.target.value)}
              className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-800 text-xs font-medium focus:outline-none cursor-pointer shadow-2xs"
              defaultValue="auto"
              title="Row Height Customization"
            >
              <option value="auto">Auto Height</option>
              <option value="35px">Compact (35px)</option>
              <option value="50px">Normal (50px)</option>
              <option value="65px">Medium (65px)</option>
              <option value="85px">Tall (85px)</option>
              <option value="110px">Extra Tall (110px)</option>
            </select>

            {/* CELL MERGING & SPLITTING */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().mergeCells().run(); }}
              className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-900 font-medium hover:bg-saffron-100 flex items-center gap-1 shadow-2xs"
              title="Merge selected cells"
            >
              <Combine size={12} className="text-saffron-600" /> Merge Cells
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().splitCell().run(); }}
              className="px-2 py-1 rounded bg-white border border-saffron-300 text-saffron-900 font-medium hover:bg-saffron-100 flex items-center gap-1 shadow-2xs"
              title="Split merged cell"
            >
              <Split size={12} className="text-blue-600" /> Split Cell
            </button>

            <div className="h-4 w-px bg-saffron-200 mx-0.5" />

            {/* ROW CONTROLS */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowBefore().run(); }}
              className="px-2 py-1 rounded bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1 shadow-2xs"
              title="Add Row Above"
            >
              <Rows size={12} /> +Row Up
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addRowAfter().run(); }}
              className="px-2 py-1 rounded bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1 shadow-2xs"
              title="Add Row Below"
            >
              <Rows size={12} /> +Row Down
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteRow().run(); }}
              className="px-2 py-1 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 shadow-2xs"
              title="Delete Row"
            >
              <Trash2 size={12} /> -Row
            </button>

            <div className="h-4 w-px bg-saffron-200 mx-0.5" />

            {/* COLUMN CONTROLS */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnBefore().run(); }}
              className="px-2 py-1 rounded bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1 shadow-2xs"
              title="Add Column Left"
            >
              <Columns size={12} /> +Col Left
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().addColumnAfter().run(); }}
              className="px-2 py-1 rounded bg-white border border-ink-200 text-ink-700 hover:bg-ink-100 flex items-center gap-1 shadow-2xs"
              title="Add Column Right"
            >
              <Columns size={12} /> +Col Right
            </button>

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteColumn().run(); }}
              className="px-2 py-1 rounded bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 shadow-2xs"
              title="Delete Column"
            >
              <Trash2 size={12} /> -Col
            </button>

            <div className="h-4 w-px bg-saffron-200 mx-0.5" />

            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().deleteTable().run(); }}
              className="px-2.5 py-1 rounded bg-red-600 text-white font-medium hover:bg-red-700 flex items-center gap-1 ml-auto shadow-2xs"
              title="Delete Entire Table"
            >
              <Trash2 size={12} /> Delete Table
            </button>
          </div>
        )}

        {/* ── EDITOR AREA ── */}
        <EditorContent editor={editor} className="flex-1" />
      </div>
    </>
  );
}