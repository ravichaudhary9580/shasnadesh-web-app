import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SEO from "../components/SEO";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-ink-50 flex flex-col justify-between">
      <SEO 
        title="404 - पेज नहीं मिला (Page Not Found) | Shasnadesh Updates" 
        description="The page you are looking for does not exist or has been moved."
        noindex={true} 
      />
      <Navbar />

      <main className="max-w-xl mx-auto px-4 py-24 sm:py-32 text-center flex-1 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-ink-100 shadow-sm w-full">
          <div className="w-16 h-16 bg-saffron-50 text-saffron-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-saffron-200">
            404
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink-900">
            पेज नहीं मिला
          </h1>
          <p className="mt-3 text-ink-600 text-sm sm:text-base leading-relaxed">
            यह पेज हटा दिया गया है, इसका लिंक बदल गया है या यह कभी मौजूद नहीं था।
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link 
              to="/" 
              className="btn-primary w-full sm:w-auto px-6 py-2.5 text-sm justify-center"
            >
              ← होमपेज पर जाएं
            </Link>
            <Link 
              to="/about" 
              className="btn-secondary w-full sm:w-auto px-6 py-2.5 text-sm justify-center"
            >
              हमारे बारे में
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
