import { Link, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { getImageUrl, getCloudFrontSrcSet } from "../utils/imageUtils";
import { shareBlog } from "../utils/shareUtils";
import { formatDateTime, getTimeAgo } from "../utils/dateUtils";
import { Share2 } from "lucide-react";

export default function BlogCard({ blog, featured = false, priority = false, viewMode = "card" }) {
  const formattedDateTime = formatDateTime(blog.createdAt);
  const timeAgo = getTimeAgo(blog.createdAt);
  const location = useLocation();

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const nativeShared = await shareBlog(blog, window.location.origin);
      if (!nativeShared) {
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.success('Link copied to clipboard!');
      }
    }
  };

  if (featured) {
    return (
      // blog-card-link → lets CSS target :visited children
      <Link
        to={`/blog/${blog.slug}`}
        state={{ from: location.pathname + location.search }}
        className="blog-card-link group block relative overflow-hidden rounded-3xl aspect-video bg-ink-200"
      >
        {blog.thumbnail ? (
          <img
            src={getImageUrl(blog.thumbnail)}
            srcSet={getCloudFrontSrcSet(getImageUrl(blog.thumbnail))}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            fetchpriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            width="1200"
            height="675"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink-700 to-ink-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          {blog.category && (
            <span className="badge bg-saffron-500/90 text-white mb-3">{blog.category}</span>
          )}
          {/* blog-card-title-featured → CSS changes color on :visited */}
          <h2
            className={`blog-card-title-featured font-display text-2xl md:text-3xl font-bold text-white mb-2 text-balance leading-snug ${blog.category === "hindi" ? "font-hindi" : ""
              }`}
          >
            {blog.title}
          </h2>
          {blog.excerpt && (
            <p className="text-ink-200 font-body text-sm line-clamp-2 mb-3">{blog.excerpt}</p>
          )}
          <div className="flex items-center justify-between text-ink-300 text-xs font-ui flex-nowrap gap-2 pt-2 border-t border-white/10 mt-2">
            <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
              <span className="flex-shrink-0">📅</span>
              <span className="truncate font-medium text-[11px] sm:text-xs text-white/90">{formattedDateTime}</span>
              {timeAgo && <span className="text-ink-300 hidden sm:inline flex-shrink-0">({timeAgo})</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-white/90 whitespace-nowrap bg-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
                <span>👁</span>
                <span>{(blog.views || 0).toLocaleString()}</span>
              </span>
              <button
                onClick={handleShare}
                className="p-1.5 rounded-full hover:bg-white/20 hover:text-white text-white/80 transition-colors flex items-center justify-center flex-shrink-0"
                title="Share"
                aria-label="Share post"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (viewMode === "list") {
    return (
      <Link
        to={`/blog/${blog.slug}`}
        state={{ from: location.pathname + location.search }}
        className="blog-card-link group card flex flex-row overflow-hidden p-2.5 sm:p-3 gap-3 sm:gap-4 hover:border-saffron-200 transition-all items-center"
      >
        {/* Thumbnail - Compact 16:9 Aspect Ratio */}
        <div className="relative overflow-hidden w-28 sm:w-44 md:w-48 lg:w-52 aspect-video rounded-lg sm:rounded-xl flex-shrink-0 bg-ink-100 self-center">
          {blog.thumbnail ? (
            <img
              src={getImageUrl(blog.thumbnail)}
              srcSet={getCloudFrontSrcSet(getImageUrl(blog.thumbnail))}
              sizes="(max-width: 640px) 140px, 220px"
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              fetchpriority={priority ? "high" : "auto"}
              loading={priority ? "eager" : "lazy"}
              decoding={priority ? "sync" : "async"}
              width="400"
              height="225"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center">
              <span className="text-xl sm:text-2xl text-ink-300 font-display">श</span>
            </div>
          )}
        </div>

        {/* Content - Compact & reduced height space */}
        <div className="flex flex-col flex-1 min-w-0 justify-center gap-1 sm:gap-1.5">
          {blog.category && (
            <div className="flex items-center gap-2">
              <span className="badge bg-saffron-50 text-saffron-700 text-xs sm:text-xs font-medium border border-saffron-200/60 px-2 py-0.5 rounded-md">
                {blog.category}
              </span>
            </div>
          )}

          {/* blog-card-title → CSS changes color on :visited */}
          <h3
            className={`blog-card-title font-display font-bold text-ink-900 text-sm sm:text-base md:text-lg leading-snug group-hover:text-saffron-600 transition-colors ${blog.category === "hindi" ? "font-hindi" : ""
              }`}
          >
            {blog.title}
          </h3>

          {/* Short summary / excerpt */}
          {blog.excerpt && (
            <p className="text-ink-500 text-xs sm:text-sm font-body leading-relaxed line-clamp-1 sm:line-clamp-2">
              {blog.excerpt}
            </p>
          )}

          {/* Bottom metadata */}
          <div className="flex items-center justify-between pt-1 border-t border-ink-100/60 text-xs sm:text-sm text-ink-500 font-ui mt-0.5 flex-nowrap gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 truncate">
              <span className="text-ink-400 flex-shrink-0">📅</span>
              <span className="truncate text-[11px] sm:text-xs text-ink-600 font-medium">
                {formattedDateTime}
              </span>
              {timeAgo && (
                <span className="text-ink-400 font-normal text-[11px] hidden sm:inline flex-shrink-0">
                  ({timeAgo})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-ink-600 whitespace-nowrap bg-ink-50 px-1.5 sm:px-2 py-0.5 rounded border border-ink-100/60 font-medium">
                <span>👁</span>
                <span>{(blog.views || 0).toLocaleString()}</span>
              </span>

              <button
                onClick={handleShare}
                className="p-1.5 -mr-1 rounded-full hover:bg-saffron-50 hover:text-saffron-600 text-ink-500 transition-colors flex items-center justify-center flex-shrink-0"
                title="Share"
                aria-label="Share post"
              >
                <Share2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    // blog-card-link → lets CSS target :visited children
    <Link
      to={`/blog/${blog.slug}`}
      state={{ from: location.pathname + location.search }}
      className="blog-card-link group card flex flex-col overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-video bg-ink-100">
        {blog.thumbnail ? (
          <img
            src={getImageUrl(blog.thumbnail)}
            srcSet={getCloudFrontSrcSet(getImageUrl(blog.thumbnail))}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            fetchpriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            width="600"
            height="338"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ink-100 to-ink-200 flex items-center justify-center">
            <span className="text-4xl text-ink-300 font-display">श</span>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* blog-card-title → CSS changes color on :visited */}
        <h3
          className={`blog-card-title font-display font-bold text-ink-900 text-lg leading-snug mb-2 group-hover:text-saffron-600 transition-colors ${blog.category === "hindi" ? "font-hindi text-xl" : ""
            }`}
        >
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-ink-500 text-sm font-body leading-relaxed line-clamp-2 mb-4 flex-1">
            {blog.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-100 flex-nowrap gap-1.5 text-xs text-ink-600 font-ui">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
            <span className="text-ink-400 flex-shrink-0">📅</span>
            <span className="truncate font-medium text-[11px] sm:text-xs text-ink-600">
              {formattedDateTime}
            </span>
            {timeAgo && (
              <span className="text-ink-400 font-normal text-[11px] hidden sm:inline flex-shrink-0">
                ({timeAgo})
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="flex items-center gap-1 text-[11px] sm:text-xs text-ink-600 whitespace-nowrap bg-ink-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-ink-100 font-medium">
              <span>👁</span>
              <span>{(blog.views || 0).toLocaleString()}</span>
            </span>
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full hover:bg-saffron-50 hover:text-saffron-600 text-ink-500 border border-transparent hover:border-saffron-200 transition-colors flex items-center justify-center flex-shrink-0"
              title="Share"
              aria-label="Share post"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>
        {/* Tags - Single line only */}
        {blog.tags?.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 overflow-hidden whitespace-nowrap">
            {blog.tags.map((t) => (
              <span key={t} className="badge bg-ink-100 text-ink-600 flex-shrink-0 text-xs">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
} 