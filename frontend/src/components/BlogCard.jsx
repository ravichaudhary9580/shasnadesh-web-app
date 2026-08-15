import { Link, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { getImageUrl, getCloudFrontSrcSet } from "../utils/imageUtils";
import { shareBlog } from "../utils/shareUtils";
import { Share2 } from "lucide-react";

export default function BlogCard({ blog, featured = false, priority = false, viewMode = "card" }) {
  const timeAgo = formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true });
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
          <div className="flex items-center gap-3 text-ink-300 text-xs font-ui">
            <span>{timeAgo}</span>
            {blog.views > 0 && (
              <><span>·</span><span>{blog.views.toLocaleString()} views</span></>
            )}
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
              <span className="badge bg-saffron-50 text-saffron-700 text-[10px] sm:text-[11px] font-medium border border-saffron-200/60 px-1.5 py-0.5 rounded-md">
                {blog.category}
              </span>
            </div>
          )}

          {/* blog-card-title → CSS changes color on :visited */}
          <h3
            className={`blog-card-title font-display font-bold text-ink-900 text-xs sm:text-sm md:text-base leading-snug group-hover:text-saffron-600 transition-colors line-clamp-2 ${blog.category === "hindi" ? "font-hindi" : ""
              }`}
          >
            {blog.title}
          </h3>

          {/* Short summary / excerpt */}
          {blog.excerpt && (
            <p className="text-ink-500 text-[11px] sm:text-xs font-body leading-relaxed line-clamp-1 sm:line-clamp-2">
              {blog.excerpt}
            </p>
          )}

          {/* Bottom metadata */}
          <div className="flex items-center justify-between pt-1 border-t border-ink-100/60 text-[11px] sm:text-xs text-ink-500 font-ui mt-0.5">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span>{timeAgo}</span>
              {blog.views > 0 && (
                <>
                  <span>·</span>
                  <span>👁 {blog.views.toLocaleString()}</span>
                </>
              )}
            </div>

            <button
              onClick={handleShare}
              className="p-1 -mr-1 rounded-full hover:bg-ink-100 hover:text-saffron-600 transition-colors flex items-center justify-center"
              title="Share"
              aria-label="Share post"
            >
              <Share2 size={14} />
            </button>
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
      <div className="flex flex-col flex-1 p-5">
        {/* blog-card-title → CSS changes color on :visited */}
        <h3
          className={`blog-card-title font-display font-bold text-ink-900 text-lg leading-snug mb-2 group-hover:text-saffron-600 transition-colors line-clamp-2 ${blog.category === "hindi" ? "font-hindi text-xl" : ""
            }`}
        >
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="text-ink-500 text-sm font-body leading-relaxed line-clamp-2 mb-4 flex-1">
            {blog.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-100">
          <span className="text-xs text-ink-600 font-ui">{timeAgo}</span>
          <div className="flex items-center gap-2 text-xs text-ink-600 font-ui">
            {blog.views > 0 && <span>👁 {blog.views.toLocaleString()}</span>}
            <button
              onClick={handleShare}
              className="p-2 -mr-1 rounded-full hover:bg-ink-100 hover:text-saffron-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Share"
              aria-label="Share post"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
        {/* Tags */}
        {blog.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {blog.tags.slice(0, 3).map((t) => (
              <span key={t} className="badge bg-ink-100 text-ink-600">#{t}</span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
} 