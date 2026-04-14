import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, reports } from "@/api/apiClient";
import {
  Shield, Bell, MapPin, AlertTriangle,
  FileText, Clock, ChevronRight, Plus, Hash, Loader2,
  CheckCircle2, RefreshCw, LogOut, User, Phone, Save
} from "lucide-react";
import EMapHeader from "../components/EMapHeader";

const STATUS_COLORS = {
  "Received": "text-blue-600 bg-blue-50 border-blue-200",
  "In Progress": "text-yellow-700 bg-yellow-50 border-yellow-200",
  "Closed": "text-green-600 bg-green-50 border-green-200",
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [myReports, setMyReports] = useState([]);
  const [dangerZone, setDangerZone] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());
  const [activeTab, setActiveTab] = useState("reports");
  const [error, setError] = useState("");

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!auth.isAuthenticated()) {
      navigate("/Login?return=/UserDashboard");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const userData = await auth.me();
      setUser(userData);
      setEditName(userData?.name || "");
      setEditPhone(userData?.phone || "");

      const [myReportsData, verifiedData] = await Promise.all([
        reports.listMy(),
        reports.listVerified(),
      ]);
      setMyReports(Array.isArray(myReportsData) ? myReportsData : []);
      setDangerZone(Array.isArray(verifiedData) ? verifiedData.slice(0, 5) : []);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      setError("Failed to load your data. Please try again.");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");
    try {
      await auth.updateMe({ name: editName, phone: editPhone });
      const updated = await auth.me();
      setUser(updated);
      setProfileSuccess("Profile updated successfully!");
      setTimeout(() => setProfileSuccess(""), 3000);
    } catch (err) {
      setProfileError("Failed to update profile. Please try again.");
    }
    setSavingProfile(false);
  };

  const handleLogout = () => {
    auth.logout();
    setIsLoggedIn(false);
    navigate("/ReportStart");
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fa" }}>
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen emap-gradient">
      <EMapHeader isLoggedIn={isLoggedIn} onLogout={() => { setIsLoggedIn(false); navigate("/ReportStart"); }} />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-10">

        {/* Welcome Banner */}
        <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-gray-900">
                  Welcome, {user?.name || user?.email?.split("@")[0] || "User"}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">{user?.email}</p>
                {!user?.phone && (
                  <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    ⚠ Add phone number for AI calls & SMS alerts
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="emap-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-gray-900">{myReports.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Reports</p>
          </div>
          <div className="emap-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-yellow-600">
              {myReports.filter((r) => r.status === "In Progress").length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">In Progress</p>
          </div>
          <div className="emap-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-green-600">
              {myReports.filter((r) => r.status === "Closed").length}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Closed</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
            <button onClick={loadData} className="ml-auto text-xs text-red-500 font-bold hover:text-red-600">Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {["reports", "alerts", "profile"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all capitalize ${
                activeTab === tab
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200 hover:border-red-300"
              }`}
            >
              {tab === "reports" && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> My Reports
                  {myReports.length > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/30">{myReports.length}</span>}
                </span>
              )}
              {tab === "alerts" && (
                <span className="flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> Nearby Alerts
                </span>
              )}
              {tab === "profile" && (
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Profile
                  {!user?.phone && <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />}
                </span>
              )}
            </button>
          ))}

          <button
            onClick={loadData}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-gray-500 hover:text-red-500 text-xs font-bold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* My Reports Tab */}
        {activeTab === "reports" && (
          <div className="space-y-3">
            <Link
              to="/ReportStart"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-red-200 hover:border-red-400 text-red-400 hover:text-red-500 font-bold text-sm transition-all bg-white"
            >
              <Plus className="w-4 h-4" /> Submit New Report
            </Link>

            {myReports.length === 0 ? (
              <div className="emap-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No reports yet</p>
                <p className="text-xs text-gray-400 mt-1">Your submitted reports will appear here</p>
              </div>
            ) : (
              myReports.map((report) => {
                const sc = STATUS_COLORS[report.status] || STATUS_COLORS["Received"];
                return (
                  <div key={report.id} className="emap-card rounded-2xl p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                          <Hash className="w-3 h-3" />{report.incidentId?.slice(-8) || report.id}
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc}`}>{report.status}</span>
                        {report.isVerified && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(report.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-snug mb-3">
                      {report.description?.slice(0, 120)}{report.description?.length > 120 ? "…" : ""}
                    </p>
                    {(report.location || report.state) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-red-400" />
                        {report.location}{report.state ? `, ${report.state}` : ""}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Nearby Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="space-y-3">
            {dangerZone.length === 0 ? (
              <div className="emap-card rounded-2xl p-10 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No active alerts nearby</p>
                <p className="text-xs text-gray-400 mt-1">Verified incidents will appear here</p>
              </div>
            ) : (
              dangerZone.map((incident) => (
                <div key={incident.id} className="emap-card rounded-2xl p-5 border-l-4 border-red-400 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <span className="text-xs font-black text-red-500 uppercase tracking-wide">Verified Incident</span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(incident.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium leading-snug mb-2">
                    {incident.description?.slice(0, 120)}{incident.description?.length > 120 ? "…" : ""}
                  </p>
                  {(incident.location || incident.state) && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {incident.location}{incident.state ? `, ${incident.state}` : ""}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="emap-card rounded-2xl p-6 slide-up">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-black text-gray-900">My Profile</h2>
                <p className="text-xs text-gray-500">Update your contact information</p>
              </div>
            </div>

            {/* Email (read only) */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="w-full px-4 py-3 border border-gray-100 rounded-xl text-sm text-gray-500 bg-gray-50">
                {user?.email}
              </div>
            </div>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Phone Number <span className="text-red-500 font-normal normal-case">(required for AI calls & SMS)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Include country code e.g. +14801234567
              </p>
            </div>

            {/* Success/Error */}
            {profileSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-700 font-medium">{profileSuccess}</p>
              </div>
            )}
            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-xs text-red-600 font-medium">{profileError}</p>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
            >
              {savingProfile ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><Save className="w-4 h-4" /> Save Profile</>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
