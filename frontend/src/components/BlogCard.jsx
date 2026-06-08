import { Link, useLocation } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "../utils/imageUtils";
import { Share2 } from "lucide-react";

export default function BlogCard({ blog, featured = false }) {
  const timeAgo = formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true });
  const location = useLocation();

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareData = {
      title: blog.title,
      text: blog.excerpt || blog.title,
      url: `${window.location.origin}/blog/${blog.slug}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (featured) {
    return (
      // blog-card-link → lets CSS target :visited children
      <Link
        to={`/blog/${blog.slug}`}
        state={{ from: location.pathname + location.search }}
        className="blog-card-link group block relative overflow-hidden rounded-3xl aspect-[21/9] max-h-[350px] bg-ink-200"
      >
        {blog.thumbnail ? (
          <img
            src={getImageUrl(blog.thumbnail)}
            alt={blog.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
            className={`blog-card-title-featured font-display text-2xl md:text-3xl font-bold text-white mb-2 text-balance leading-snug ${
              blog.category === "hindi" ? "font-hindi" : ""
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

  return (
    // blog-card-link → lets CSS target :visited children
    <Link
      to={`/blog/${blog.slug}`}
      state={{ from: location.pathname + location.search }}
      className="blog-card-link group card flex flex-col overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden aspect-[16/10] bg-ink-100">
        {blog.thumbnail ? (
          <img
            src={getImageUrl(blog.thumbnail)}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          className={`blog-card-title font-display font-bold text-ink-900 text-lg leading-snug mb-2 group-hover:text-saffron-600 transition-colors line-clamp-2 ${
            blog.category === "hindi" ? "font-hindi text-xl" : ""
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
          <span className="text-xs text-ink-400 font-ui">{timeAgo}</span>
          <div className="flex items-center gap-2 text-xs text-ink-400 font-ui">
            {blog.views > 0 && <span>👁 {blog.views.toLocaleString()}</span>}
            <button
              onClick={handleShare}
              className="p-1 hover:text-saffron-600 transition-colors"
              title="Share"
            >
              <Share2 size={14} />
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