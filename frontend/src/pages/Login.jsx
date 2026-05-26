import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { login } from "../services/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const { admin, loginAdmin } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (admin) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      loginAdmin(data.token, data.admin);
      toast.success(`Welcome, ${data.admin.name}!`);
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: "repeating-linear-gradient(45deg, #e8920a 0, #e8920a 1px, transparent 0, transparent 50%)", backgroundSize: "20px 20px" }} />

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Card */}
        <div className="bg-ink-50 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-saffron-500 flex items-center justify-center text-white text-3xl font-display font-bold mx-auto mb-4 shadow-lg">
              श
            </div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Admin Login</h1>
            <p className="font-hindi text-ink-400 text-sm mt-1">प्रशासक पैनल</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-ui text-sm font-medium text-ink-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="admin@example.com"
                className="input"
              />
            </div>
            <div>
              <label className="block font-ui text-sm font-medium text-ink-600 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-2 py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : "Sign In →"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="font-ui text-sm text-ink-400 hover:text-saffron-600 transition-colors">
              ← Back to website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
