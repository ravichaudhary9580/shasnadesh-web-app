import { useState, useEffect } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getBlog, getBlogs, trackVisit } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BlogCard from "../components/BlogCard";
import SEO from "../components/SEO";
import { formatDistanceToNow } from "date-fns";
import { getImageUrl } from "../utils/imageUtils";
import { shareBlog } from "../utils/shareUtils";
import { Download, ExternalLink, Share2 } from "lucide-react";
import { generateBlogSchema, generateBreadcrumbSchema, injectSchema } from "../utils/schemaUtils";
import AdSense from "../components/AdSense";

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
  const [headings, setHeadings] = useState([]);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  // Extract headings for Table of Contents after content renders
  useEffect(() => {
    if (blog && !loading) {
      // Give React a tick to render the HTML
      setTimeout(() => {
        const article = document.querySelector('.prose-blog');
        if (article) {
          const elements = article.querySelectorAll('h1, h2, h3, h4');
          const extracted = Array.from(elements).map((el, idx) => {
            // Assign an ID if it doesn't have one
            const id = el.id || `heading-${idx}`;
            el.id = id;
            return {
              id,
              text: el.textContent || el.innerText || "",
              level: parseInt(el.tagName.replace('H', '')) || 2
            };
          }).filter(h => h.text.trim().length > 0);
          setHeadings(extracted);
        }
      }, 100);
    }
  }, [blog, loading]);

  useEffect(() => {
    window.scrollTo(0, 0);
    getBlog(slug)
      .then(({ data }) => {
        setBlog(data);
        trackVisit({ blogId: data._id, slug: data.slug, referrer: document.referrer }).catch(() => {});
        
        // Fetch related blogs in the same category
        if (data.category) {
          getBlogs({ category: data.category, limit: 4 })
            .then(res => {
              // Filter out the current blog
              const filtered = res.data.blogs.filter(b => b._id !== data._id).slice(0, 3);
              setRelatedBlogs(filtered);
            })
            .catch(() => {});
        }
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
    try {
      await shareBlog(blog, window.location.origin);
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        navigator.clipboard.writeText(window.location.href);
        setShared(true);
        setTimeout(() => setShared(false), 2500);
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
          image={getImageUrl(blog.thumbnail)}
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
          <div className="relative w-full h-[35vh] sm:h-[50vh] lg:h-[65vh] xl:h-[75vh] max-h-[800px] overflow-hidden bg-ink-950 flex justify-center items-center">
            {/* Blurred background */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110"
              style={{ backgroundImage: `url(${getImageUrl(blog.thumbnail)})` }}
            />
            {/* Foreground image (fully visible) */}
            <img
              src={getImageUrl(blog.thumbnail)}
              alt={blog.title}
              className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
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
          {blog.tags?.slice(0, tagsExpanded ? blog.tags.length : 3).map((t) => (
            <span key={t} className="badge bg-ink-100 text-ink-600">#{t}</span>
          ))}
          {blog.tags?.length > 3 && (
            <button
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="badge bg-white text-ink-500 hover:bg-ink-50 hover:text-ink-800 transition-colors border border-ink-200 cursor-pointer"
            >
              {tagsExpanded ? "Show less" : `+${blog.tags.length - 3} more`}
            </button>
          )}
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

        {/* Table of Contents */}
        {headings.length > 0 && (
          <div className="mb-8 p-5 sm:p-6 bg-white border border-ink-100 rounded-2xl shadow-sm animate-fade-in">
            <h3 className="font-display text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📑</span> विषय सूची (Table of Contents)
            </h3>
            <ul className="space-y-3">
              {headings.map((h) => (
                <li key={h.id} className={h.level === 3 ? "ml-5" : ""}>
                  <a
                    href={`#${h.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) {
                        const y = el.getBoundingClientRect().top + window.scrollY - 100; // Offset for fixed navbar
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }}
                    className="group flex items-start gap-2.5 text-ink-600 hover:text-saffron-600 font-ui text-sm sm:text-base transition-colors"
                  >
                    <span className="text-ink-300 group-hover:text-saffron-400 select-none mt-0.5">•</span>
                    <span className="leading-tight">{h.text}</span>
                  </a>
                </li>
              ))}
            </ul>

            {/* Static ToC items for Links and Documents */}
            {(blog.links?.length > 0 || blog.pdfs?.length > 0) && (
              <ul className="mt-3 pt-3 border-t border-ink-100 space-y-3">
                {blog.links?.length > 0 && (
                  <li>
                    <a
                      href="#related-links"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('related-links');
                        if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                      }}
                      className="group flex items-center gap-2 text-ink-700 hover:text-saffron-600 font-ui font-medium text-sm sm:text-base transition-colors"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">🔗</span>
                      <span>महत्वपूर्ण लिंक (Related Links)</span>
                    </a>
                  </li>
                )}
                {blog.pdfs?.length > 0 && (
                  <li>
                    <a
                      href="#documents"
                      onClick={(e) => {
                        e.preventDefault();
                        const el = document.getElementById('documents');
                        if (el) window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
                      }}
                      className="group flex items-center gap-2 text-ink-700 hover:text-saffron-600 font-ui font-medium text-sm sm:text-base transition-colors"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">📄</span>
                      <span>शासनादेश (Documents)</span>
                    </a>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Body */}
        <article
          className={`prose-blog ${isHindi ? "font-hindi" : ""}`}
          dangerouslySetInnerHTML={{ __html: blog.content }}
        />

        {/* AdSense Unit Below Article */}
        <AdSense className="my-8" />

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

        {/* Links */}
        {blog.links?.length > 0 && (
          <div id="related-links" className="mt-10 scroll-mt-24">
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

        {/* ── PDFs — inline viewer ── */}
        {blog.pdfs?.length > 0 && (
          <div id="documents" className="mt-10 scroll-mt-24">
            <div className="divider-ornament"><span>📄</span></div>
            <h3 className="font-display text-xl font-bold text-ink-900 mb-4">Documents</h3>
            <div className="space-y-3">
              {blog.pdfs.map((pdf, i) => (
                <PdfViewer key={i} pdf={pdf} />
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

        {/* Editorial Trust & Fact Check Box */}
        <div className="mt-12 bg-white border border-ink-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-saffron-500 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
              SU
            </div>
            <div>
              <h4 className="font-ui font-bold text-sm text-ink-900">
                Shasnadesh Updates Editorial Team
              </h4>
              <p className="font-hindi text-xs text-ink-500">
                सत्यापित शासनादेश एवं आधिकारिक सूचना पोर्टल · Verified Information
              </p>
            </div>
          </div>
          <Link
            to="/about"
            className="text-xs font-semibold text-saffron-600 hover:text-saffron-700 underline font-ui flex-shrink-0"
          >
            Editorial Policy & Fact-Checking →
          </Link>
        </div>

        {/* Auto Related Posts Section */}
        {relatedBlogs.length > 0 && (
          <div className="mt-16 pt-8 border-t border-ink-200">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔥</span>
              <h3 className="font-display text-2xl font-bold text-ink-900">
                सम्बंधित खबरें (Related Posts)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedBlogs.map((relatedBlog, i) => (
                <div key={relatedBlog._id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <BlogCard blog={relatedBlog} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back */}
        <div className="mt-8 pt-6 border-t border-ink-100 flex items-center justify-between">
          <button
            onClick={() => navigate(location.state?.from || "/")}
            className="btn-ghost text-xs sm:text-sm"
          >
            ← Back to all posts
          </button>
          <Link to="/contact" className="text-xs text-ink-400 hover:text-ink-600 underline">
            Report an issue with this post
          </Link>
        </div>
      </main>

      <Footer variant="narrow" />
    </div>
  );
}