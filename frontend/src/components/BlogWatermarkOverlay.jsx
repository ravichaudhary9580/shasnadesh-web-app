import { useId } from "react";
import { getImageUrl } from "../utils/imageUtils";

/**
 * Ultra-robust Watermark overlay for blog articles and preview modal.
 * Supports:
 * - 🏛️ Preset (Official Seal / Logo) - Circular Logo Seal repeated multiple times down the post
 * - ✍️ Custom Text (Diagonal Tiled Grid) - Small compact diagonal text repeated multiple times in a dense grid
 * - ✍️ Custom Text (Center Badge) - Custom text badge repeated down the post
 * - 🖼️ Custom Image - Tiled pattern or centered emblem
 */
export default function BlogWatermarkOverlay({ watermark }) {
  const generatedId = useId();
  const patternId = `wm-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "") || "pattern"}`;

  // If explicitly disabled by admin, do not render
  if (watermark && (watermark.enabled === false || watermark.enabled === "false")) {
    return null;
  }

  const {
    type = "preset",
    text = "शासनादेश अपडेट्स",
    imageUrl = "",
    opacity = 0.12,
    pattern = "diagonal",
  } = watermark || {};

  const numOpacity = Math.max(0.06, Number(opacity) || 0.12);
  const displayText = type === "preset" ? (text || "शासनादेश अपडेट्स") : (text || "शासनादेश");

  // Resolve custom image URL if type is image
  const resolvedLogoUrl = getImageUrl("/logo512.png");
  const resolvedCustomUrl = getImageUrl(imageUrl || "/logo512.png");

  /* ─────────────────────────────────────────────────────────────
     CASE 1: CUSTOM TEXT + DIAGONAL TILED GRID (Small compact repeated text grid)
  ───────────────────────────────────────────────────────────── */
  if (type === "text" && pattern === "diagonal") {
    return (
      <svg
        className="pointer-events-none select-none absolute inset-0 w-full h-full z-0 overflow-hidden"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: "100%", height: "100%", position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <pattern
            id={patternId}
            width="220"
            height="110"
            patternUnits="userSpaceOnUse"
          >
            <text
              x="110"
              y="55"
              transform="rotate(-24, 110, 55)"
              fill="#26201a"
              fillOpacity={numOpacity}
              fontFamily="'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="700"
              fontSize="15"
              textAnchor="middle"
              dominantBaseline="central"
            >
              {displayText}
            </text>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     CASE 2: CUSTOM IMAGE + DIAGONAL TILED GRID
  ───────────────────────────────────────────────────────────── */
  if (type === "image" && pattern === "diagonal") {
    return (
      <div
        className="pointer-events-none select-none absolute inset-0 w-full h-full z-0 overflow-hidden"
        style={{
          backgroundImage: `url("${resolvedCustomUrl}")`,
          backgroundRepeat: "repeat",
          backgroundSize: "130px 130px",
          backgroundPosition: "center",
          opacity: numOpacity,
        }}
        aria-hidden="true"
      />
    );
  }

  /* ─────────────────────────────────────────────────────────────
     CASE 3: MULTIPLE INSTANCES DOWN THE BLOG (Preset Logo Seal, Text Badge, or Image Emblem)
  ───────────────────────────────────────────────────────────── */
  const repeatCount = 15;

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden flex flex-col items-center justify-start gap-32 sm:gap-44 pt-12 pb-24"
      aria-hidden="true"
    >
      {Array.from({ length: repeatCount }).map((_, idx) => (
        <div key={idx} className="flex items-center justify-center w-full">
          {/* 3A. PRESET: Official Circular Logo Seal (Multiple times down the post) */}
          {type === "preset" && (
            <div
              className="flex flex-col items-center justify-center text-center p-6 rounded-full border-4 border-dashed border-ink-900 aspect-square w-[280px] sm:w-[350px] h-[280px] sm:h-[350px] bg-white/10 backdrop-blur-2xs shadow-2xs"
              style={{ opacity: numOpacity }}
            >
              <img
                src={resolvedLogoUrl}
                alt="Shasnadesh Seal"
                className="w-24 sm:w-32 h-24 sm:h-32 object-contain mb-1.5 drop-shadow-xs"
              />
              <div className="font-display font-black text-base sm:text-xl text-ink-900 tracking-wider leading-tight">
                {displayText}
              </div>
            </div>
          )}

          {/* 3B. TEXT: Custom Text Angled Badge */}
          {type === "text" && (
            <div
              className="font-display font-black text-center tracking-widest text-ink-900 -rotate-12 whitespace-nowrap px-8 py-5 border-4 border-ink-900 rounded-2xl shadow-2xs bg-white/10"
              style={{
                fontSize: "clamp(2rem, 5.5vw, 4rem)",
                opacity: numOpacity,
              }}
            >
              {displayText}
            </div>
          )}

          {/* 3C. IMAGE: Custom Uploaded Emblem */}
          {type === "image" && (
            <div
              className="flex items-center justify-center w-[280px] sm:w-[360px] h-[280px] sm:h-[360px]"
              style={{ opacity: numOpacity }}
            >
              <img
                src={resolvedCustomUrl}
                alt="Watermark Emblem"
                className="max-w-full max-h-full object-contain drop-shadow-xs"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
