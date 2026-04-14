import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api/apiClient";
import { Shield, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (auth.isAuthenticated()) {
      auth.me().then((user) => {
        if (user?.role === "admin") {
          navigate("/AdminDashboard");
        } else {
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const result = await auth.login(email, password);

      if (result.token) {
        if (result.user?.role === "admin") {
          navigate("/AdminDashboard");
        } else {
          localStorage.removeItem("emap_token");
          setError("Access denied. Admin accounts only.");
        }
      } else {
        setError(result.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    }

    setSubmitting(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fa" }}>
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "linear-gradient(160deg,#fff5f5 0%,#fff 60%)" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center mx-auto mb-4 red-glow">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-widest">EMAP</h1>
          <p className="text-red-500 text-sm mt-1 font-bold uppercase tracking-wider">Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 space-y-4">

          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">
              Sign in with admin credentials
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="admin@emap.com"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={submitting}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
            ) : (
              <><Shield className="w-4 h-4" /> Sign In as Admin</>
            )}
          </button>

          {/* Info */}
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              Only registered admin accounts can access this portal.
              <br />
              Contact your system administrator for access.
            </p>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                New admin?
                <button
                  onClick={() => navigate("/AdminSignup")}
                  className="text-red-500 font-bold ml-1 hover:text-red-600 transition-colors"
                >
                  Register here
                </button>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
