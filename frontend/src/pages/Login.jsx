import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/api/apiClient";
import { Shield, Mail, Lock, Loader2, Eye, EyeOff, User, Phone, AlertTriangle } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (auth.isAuthenticated()) {
      const returnUrl = new URLSearchParams(window.location.search).get("return");
      navigate(returnUrl || "/ReportStart");
    }
  }, []);

  const handleSubmit = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    if (isRegister && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await auth.register(email, password, name);
        // After register, save phone number if provided
        if (result.token && phone.trim()) {
          try {
            await auth.updateMe({ phone: phone.trim() });
          } catch (e) {
            console.error("Failed to save phone:", e);
          }
        }
      } else {
        result = await auth.login(email, password);
      }

      if (result.token) {
        const returnUrl = new URLSearchParams(window.location.search).get("return");
        navigate(returnUrl || "/ReportStart");
      } else {
        setError(result.message || "Invalid email or password.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSubmit();
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setError("");
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
  };

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
          <p className="text-red-500 text-sm mt-1 font-bold uppercase tracking-wider">
            {isRegister ? "Create Account" : "Welcome Back"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-6 space-y-4">

          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center">
            {isRegister ? "Register a new account" : "Sign in to your account"}
          </p>

          {/* Name — Register only */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
              />
            </div>
          </div>

          {/* Phone — Register only */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Phone <span className="text-red-500">*</span>
                <span className="text-gray-400 font-normal normal-case ml-1">(for AI calls & SMS alerts)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  onKeyDown={handleKeyDown}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Include country code e.g. +14801234567</p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
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
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Please wait…</>
            ) : isRegister ? (
              <><User className="w-4 h-4" /> Create Account</>
            ) : (
              <><Shield className="w-4 h-4" /> Sign In</>
            )}
          </button>

          {/* Switch Mode */}
          <div className="pt-2 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              {isRegister ? "Already have an account?" : "Don't have an account?"}
              <button
                onClick={switchMode}
                className="text-red-500 font-bold ml-1 hover:text-red-600 transition-colors"
              >
                {isRegister ? "Sign In" : "Register"}
              </button>
            </p>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <button
            onClick={() => navigate("/ReportStart")}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Back to Report Start
          </button>
        </div>
      </div>
    </div>
  );
}
