import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, reports } from "@/api/apiClient";
import {
  User, Mail, Phone, ChevronRight,
  SkipForward, Loader2, Shield
} from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import EMapHeader from "../components/EMapHeader";

export default function OptionalLogin() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());

  useEffect(() => {
    if (auth.isAuthenticated()) {
      auth.me().then((user) => {
        if (user) {
          setName(user.name || "");
          setEmail(user.email || "");
          setPhone(user.phone || "");
          const reportId = sessionStorage.getItem("emap_report_id");
          if (reportId) {
            reports.update(reportId, {
              userName: user.name,
              userEmail: user.email,
              userPhone: user.phone,
              isAnonymous: false,
              userId: user.id,
            }).then(() => {
              navigate("/ReportGenerated");
            }).catch(() => {
              navigate("/ReportGenerated");
            });
          } else {
            navigate("/ReportGenerated");
          }
        }
      }).catch(() => {});
    }
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const reportId = sessionStorage.getItem("emap_report_id");
      if (reportId) {
        await reports.update(reportId, {
          userName: name,
          userEmail: email,
          userPhone: phone,
          isAnonymous: false,
        });
      }
      if (auth.isAuthenticated()) {
        await auth.updateMe({ phone, name });
        const user = await auth.me();
        if (reportId && user?.id) {
          await reports.update(reportId, { userId: user.id });
        }
        navigate("/ReportGenerated");
        return;
      }
      sessionStorage.setItem("emap_user_name", name);
      sessionStorage.setItem("emap_user_email", email);
      sessionStorage.setItem("emap_user_phone", phone);
      navigate("/Login?return=/ReportGenerated");
    } catch (err) {
      console.error("Save error:", err);
      setError("Something went wrong. Please try again.");
    }
    setSaving(false);
  };

  const handleSkip = async () => {
  const reportId = sessionStorage.getItem("emap_report_id");
  if (phone.trim() && reportId) {
    try {
      await reports.update(reportId, { userPhone: phone.trim() });
    } catch (e) {}
  }
  navigate("/ReportGenerated");
};

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
  };

  return (
    <div className="min-h-screen emap-gradient">
      <EMapHeader isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />
      <div className="max-w-xl mx-auto px-4 pb-10">
        <StepIndicator currentStep={3} />
        <div className="emap-card rounded-2xl p-6 mb-4 slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-900">Your Information</h2>
              <p className="text-xs text-gray-500 mt-0.5">Help responders reach you faster</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Full Name <span className="text-red-500">*</span>
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

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Email <span className="text-red-500">*</span>
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

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
              Phone <span className="text-gray-400 font-normal">(for AI calls and SMS alerts)</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Required for AI emergency callback and SMS notifications</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <div className="mb-6 p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Your information is only used for emergency response purposes and will never be shared with third parties.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-3"
            style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : (
              <><ChevronRight className="w-4 h-4" /> Save & Continue</>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-gray-500 text-sm flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-50"
          >
            <SkipForward className="w-4 h-4" />
            Skip — Stay Anonymous
          </button>
        </div>
      </div>
    </div>
  );
}