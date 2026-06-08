import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getBlog, trackVisit } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "../utils/imageUtils";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { generateBlogSchema, generateBreadcrumbSchema, injectSchema } from "../utils/schemaUtils";

// ── Inline PDF viewer — always open, no toggle ─────────────────────────────
function PdfViewer({ pdf }) {
  const handleDownload = async () => {
    try {
      const response = await fetch(pdf.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = pdf.title.endsWith('.pdf') ? pdf.title : `${pdf.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      window.location.href = pdf.url;
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: pdf.title,
      text: `Check out this document: ${pdf.title}`,
      url: pdf.url
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(pdf.url);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <div className="border border-ink-200 rounded-2xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white">
        <span className="text-xl flex-shrink-0">📑</span>
        <span className="font-ui text-ink-800 font-medium flex-1 min-w-0 truncate text-sm">
          {pdf.title}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={handleShare}
            className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-ink-800 transition-colors"
            title="Share PDF"
          >
            <Share2 size={15} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-ink-800 transition-colors"
            title="Download PDF"
          >
            <Download size={15} />
          </button>
          <a
            href={pdf.url}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 hover:text-ink-800 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Inline iframe — always visible */}
      <div className="border-t border-ink-100">
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(pdf.url)}&embedded=true`}
          title={pdf.title}
          className="w-full"
          style={{ height: "75vh", minHeight: "480px" }}
          loading="lazy"
        />
        <div className="px-4 py-2 bg-ink-50 border-t border-ink-100">
          <p className="font-ui text-xs text-ink-400">
            PDF not loading?{" "}
            <a href={pdf.url} target="_blank" rel="noreferrer"
              className="text-saffron-600 underline underline-offset-2">
              Open directly
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    getBlog(slug)
      .then(({ data }) => {
        setBlog(data);
        trackVisit({ blogId: data._id, slug: data.slug, referrer: document.referrer }).catch(() => {});
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  // Inject structured data when blog loads
  useEffect(() => {
    if (!blog) return;
    const cleanup1 = injectSchema(generateBlogSchema(blog));
    const breadcrumbItems = [
      { name: 'Home', url: 'https://shasnadeshupdates.com' },
      { name: blog.category || 'Blog', url: `https://shasnadeshupdates.com/?category=${blog.category}` },
      { name: blog.title, url: `https://shasnadeshupdates.com/blog/${blog.slug}` }
    ];
    const cleanup2 = injectSchema(generateBreadcrumbSchema(breadcrumbItems));
    return () => { cleanup1(); cleanup2(); };
  }, [blog]);

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareData = {
      title: blog.title,
      text: blog.excerpt || blog.title,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        // Mobile: Try to share with image
        if (blog && blog.thumbnail && navigator.canShare && navigator.canShare({ files: [] })) {
          const imageUrl = getImageUrl(blog.thumbnail);
          
          try {
            const response = await fetch(imageUrl);
            if (response.ok) {
              const blob = await response.blob();
              const file = new File([blob], 'blog-image.jpg', { type: blob.type });
              
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({ ...shareData, files: [file] });
                return;
              }
            }
          } catch (err) {
            console.log('Image share failed, using text-only:', err);
          }
        }
        
        // Text-only share
        await navigator.share(shareData);
      } else {
        // Desktop: Copy URL
        navigator.clipboard.writeText(shareUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (error) {
      console.log('Share error:', error);
      
      // Final fallback
      if (error.name !== 'AbortError') {
        navigator.clipboard.writeText(shareUrl);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-saffron-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!blog) return null;

  const isHindi = blog.category === "hindi";

  return (
    <div className="min-h-screen bg-ink-50">
      {blog && (
        <SEO 
          title={`${blog.title} | Shasnadesh Updates`}
          description={blog.excerpt || blog.title}
          keywords={blog.tags?.join(', ') || ''}
          image={blog.thumbnail ? `https://shasnadeshupdates.com${blog.thumbnail}` : undefined}
          url={`https://shasnadeshupdates.com/blog/${blog.slug}`}
          type="article"
          publishedTime={blog.createdAt}
          modifiedTime={blog.updatedAt}
          category={blog.category}
          tags={blog.tags}
        />
      )}
      <Navbar />

      {/* Thumbnail hero */}
      <div className="pt-14 sm:pt-16">
        {blog.thumbnail && (
          <div className="w-full aspect-[21/9] max-h-[480px] overflow-hidden">
            <img
              src={getImageUrl(blog.thumbnail)}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm font-ui text-ink-400 mb-6">
          <Link to="/" className="hover:text-saffron-600 transition-colors">Home</Link>
          <span>/</span>
          {blog.category && (
            <>
              <Link
                to={`/?category=${blog.category}`}
                className="hover:text-saffron-600 transition-colors capitalize"
              >
                {blog.category}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-ink-600 truncate">{blog.title.slice(0, 40)}…</span>
        </nav>

        {/* Badges */}
        <div className="mb-4 flex flex-wrap gap-2">
          {blog.category && (
            <span className="badge bg-saffron-100 text-saffron-700">{blog.category}</span>
          )}
          {blog.tags?.map((t) => (
            <span key={t} className="badge bg-ink-100 text-ink-600">#{t}</span>
          ))}
        </div>

        {/* Title */}
        <h1 className={`font-display font-bold text-ink-900 leading-tight mb-4 text-balance ${
          isHindi ? "font-hindi text-3xl md:text-4xl" : "text-3xl md:text-5xl"
        }`}>
          {blog.title}
        </h1>

        {blog.excerpt && (
          <p className={`text-xl text-ink-500 font-body leading-relaxed mb-6 ${isHindi ? "font-hindi" : ""}`}>
            {blog.excerpt}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between py-4 border-y border-ink-100 mb-8">
          <div className="flex items-center gap-3 text-sm font-ui text-ink-400">
            <span>{formatDistanceToNow(new Date(blog.createdAt), { addSuffix: true })}</span>
            {blog.views > 0 && (
              <><span>·</span><span>👁 {blog.views.toLocaleString()} views</span></>
            )}
          </div>
          <button onClick={handleShare} className="btn-ghost text-sm">
            {shared ? "✅ Copied!" : "🔗 Share"}
          </button>
        </div>

        {/* Body */}
        <article
          className={`prose-blog ${isHindi ? "font-hindi" : ""}`}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* Video */}
        {blog.videoUrl && (
          <div className="mt-10">
            <div className="divider-ornament"><span>🎬</span></div>
            <div className="aspect-video rounded-2xl overflow-hidden shadow-md">
              <iframe
                src={blog.videoUrl}
                title="Blog video"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              />
            </div>
          </div>
        )}

        {/* ── PDFs — inline viewer ── */}
        {blog.pdfs?.length > 0 && (
          <div className="mt-10">
            <div className="divider-ornament"><span>📄</span></div>
            <h3 className="font-display text-xl font-bold text-ink-900 mb-4">Documents</h3>
            <div className="space-y-3">
              {blog.pdfs.map((pdf, i) => (
                <PdfViewer key={i} pdf={pdf} />
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {blog.links?.length > 0 && (
          <div className="mt-10">
            <div className="divider-ornament"><span>🔗</span></div>
            <h3 className="font-display text-xl font-bold text-ink-900 mb-4">Related Links</h3>
            <div className="space-y-2">
              {blog.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-saffron-600 hover:text-saffron-700 font-ui text-sm"
                >
                  <span>→</span>{link.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Image gallery */}
        {blog.images?.length > 0 && (
          <div className="mt-10">
            <div className="divider-ornament"><span>🖼</span></div>
            <div className="grid grid-cols-2 gap-3">
              {blog.images.map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt=""
                  className="rounded-xl object-cover aspect-square w-full"
                />
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-14 pt-8 border-t border-ink-100">
          <button
            onClick={() => navigate(location.state?.from || "/")}
            className="btn-ghost"
          >
            ← Back to all posts
          </button>
        </div>
      </main>

      <Footer variant="narrow" />
    </div>
  );
}