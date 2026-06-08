import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function FeaturedSlideshow({ blogs }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (blogs.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % blogs.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [blogs.length]);

  if (!blogs || blogs.length === 0) return null;

  const goToPrev = () => setCurrent((prev) => (prev - 1 + blogs.length) % blogs.length);
  const goToNext = () => setCurrent((prev) => (prev + 1) % blogs.length);

  return (
    <div className="mb-8 animate-fade-in">
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-saffron-400" />
        <p className="font-hindi text-sm font-medium text-saffron-600 whitespace-nowrap">फीचर्ड आदेश</p>
        <div className="h-px flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-saffron-400" />
      </div>

      <div className="relative max-w-3xl mx-auto">
        {/* Slideshow container */}
        <div className="relative overflow-hidden rounded-xl bg-white shadow-md">
          {/* Slides */}
          <div className="relative" style={{ paddingBottom: "45%" }}>
            {blogs.map((blog, idx) => (
              <Link
                key={blog._id}
                to={`/blog/${blog.slug}`}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                {/* Image */}
                <div className="absolute inset-0">
                  {blog.thumbnail ? (
                    <img
                      src={blog.thumbnail}
                      alt={blog.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-saffron-100 to-saffron-200 flex items-center justify-center">
                      <span className="text-5xl text-saffron-400 font-display">श</span>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>

                {/* Content */}
                {/* <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 text-white">
                  {blog.category && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-saffron-500 text-white text-xs font-medium mb-1.5">
                      {blog.category}
                    </span>
                  )}
                  <h2 className="font-hindi text-lg sm:text-xl font-bold mb-1 line-clamp-2">
                    {blog.title}
                  </h2>
                  {blog.excerpt && (
                    <p className="font-ui text-xs sm:text-sm text-white/90 line-clamp-1 sm:line-clamp-2">
                      {blog.excerpt}
                    </p>
                  )}
                </div> */}
              </Link>
            ))}
          </div>

          {/* Navigation arrows */}
          {blogs.length > 1 && (
            <>
              <button
                onClick={(e) => { e.preventDefault(); goToPrev(); }}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all"
                aria-label="Previous"
              >
                <ChevronLeft size={16} className="text-ink-900" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); goToNext(); }}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-all"
                aria-label="Next"
              >
                <ChevronRight size={16} className="text-ink-900" />
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {blogs.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {blogs.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === current
                    ? "bg-saffron-500 w-4"
                    : "bg-ink-300 hover:bg-ink-400"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
