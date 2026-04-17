import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, reports, ai } from "@/api/apiClient";
import {
  Shield, FileText, Phone, Navigation, MapPin, Clock,
  CheckCircle2, XCircle, Loader2, Users, RefreshCw, Eye,
  PhoneCall, PhoneOutgoing, QrCode, FileVideo, FileAudio
} from "lucide-react";
import { QRCodeSVG } from 'qrcode.react';
import EMapHeader from "../components/EMapHeader";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8080";
const appUrl = `https://emapnow.me`;

const STATUS_COLORS = {
  "Received":    { text: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
  "In Progress": { text: "text-yellow-700", bg: "bg-yellow-50", border: "border-yellow-200" },
  "Closed":      { text: "text-green-600",  bg: "bg-green-50",  border: "border-green-200" },
};

function StatCard({ icon: IconComp, label, value, color }) {
  return (
    <div className="emap-card rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <IconComp className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Detect if a URL is a video based on filename patterns
const isVideoUrl = (url) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|mov|avi)$/)) return true;
  if (lower.includes('recording-') && lower.endsWith('.webm')) return true;
  if (lower.includes('/media/') && lower.match(/\.(mp4|mov|avi|webm)$/) && !lower.includes('audio-')) return true;
  return false;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [reportList, setReportList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedReport, setSelectedReport] = useState(null);
  const [callingReport, setCallingReport] = useState(null);
  const [callResult, setCallResult] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());

  useEffect(() => { checkAdmin(); }, []);

  const checkAdmin = async () => {
    if (!auth.isAuthenticated()) { navigate("/AdminLogin"); return; }
    try {
      const user = await auth.me();
      if (user?.role !== "admin") { navigate("/AdminLogin"); return; }
      await loadReports();
    } catch (err) {
      console.error("Admin check failed:", err);
      navigate("/AdminLogin");
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reports.listAll();
      setReportList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setReportList([]);
    }
    setLoading(false);
  };

  const toggleVerified = async (report) => {
    setUpdating(report.id);
    try {
      const updated = await reports.update(report.id, { isVerified: !report.isVerified });
      setReportList((prev) => prev.map((r) => r.id === report.id ? { ...r, isVerified: updated.isVerified } : r));
    } catch (err) { console.error("Toggle verified failed:", err); }
    setUpdating(null);
  };

  const updateStatus = async (report, status) => {
    setUpdating(report.id);
    try {
      const updated = await reports.update(report.id, { status });
      setReportList((prev) => prev.map((r) => r.id === report.id ? { ...r, status: updated.status } : r));
    } catch (err) { console.error("Status update failed:", err); }
    setUpdating(null);
  };

  const triggerAICall = async (report) => {
    if (!report.userPhone) {
      setCallResult((prev) => ({ ...prev, [report.id]: { error: "No phone number on this report." } }));
      return;
    }
    setCallingReport(report.id);
    try {
      const result = await ai.triggerCall(report.id);
      setCallResult((prev) => ({ ...prev, [report.id]: result }));
      setReportList((prev) => prev.map((r) => r.id === report.id ? { ...r, aiCallPlaced: true } : r));
    } catch (err) {
      console.error("AI call failed:", err);
      setCallResult((prev) => ({ ...prev, [report.id]: { error: "Call failed. Check Twilio config." } }));
    }
    setCallingReport(null);
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

  const total      = reportList.length;
  const inProgress = reportList.filter((r) => r.status === "In Progress").length;
  const verified   = reportList.filter((r) => r.isVerified).length;
  const aiCalled   = reportList.filter((r) => r.aiCallPlaced).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9fa" }}>
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8f9fa" }}>
      <EMapHeader isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-wide">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">EMAP Control Center</p>
          </div>
          <button onClick={loadReports} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-red-300 text-sm font-semibold text-gray-600 hover:text-red-500 transition-all shadow-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={FileText}     label="Total Reports" value={total}      color="bg-red-500" />
          <StatCard icon={Clock}        label="In Progress"   value={inProgress} color="bg-yellow-500" />
          <StatCard icon={CheckCircle2} label="Verified"      value={verified}   color="bg-green-500" />
          <StatCard icon={PhoneCall}    label="AI Calls Made" value={aiCalled}   color="bg-purple-500" />
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {["reports", "verified", "qr"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab ? "bg-red-500 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200 hover:border-red-300"
              }`}
            >
              {tab === "reports" && "All Reports"}
              {tab === "verified" && "Verified Only"}
              {tab === "qr" && <span className="flex items-center gap-1.5"><QrCode className="w-3.5 h-3.5" /> QR Demo</span>}
            </button>
          ))}
        </div>

        {activeTab === "qr" && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <h2 className="text-xl font-black text-gray-900 mb-2">Scan to Open EMAP</h2>
            <p className="text-sm text-gray-500 mb-8">Share this QR code for mobile demo access — make sure devices are on the same WiFi</p>
            <div className="flex justify-center mb-6">
              <div className="p-5 bg-white border-2 border-red-100 rounded-2xl shadow-md">
                <QRCodeSVG value={appUrl} size={240} bgColor="#ffffff" fgColor="#E63946" level="H" includeMargin={true} />
              </div>
            </div>
            <p className="text-sm font-mono font-bold text-gray-600 mb-1">{appUrl}</p>
            <p className="text-xs text-gray-400 mb-6">Point your phone camera at the QR code to open EMAP</p>
            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
              {[["Step 1","Connect to same WiFi"],["Step 2","Scan QR code"],["Step 3","Use EMAP on mobile"]].map(([s,d]) => (
                <div key={s} className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-xs font-bold text-red-600">{s}</p>
                  <p className="text-xs text-gray-500 mt-1">{d}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab !== "qr" && (
          <div className="space-y-3">
            {reportList
              .filter((r) => activeTab === "verified" ? r.isVerified : true)
              .map((report) => {
                const sc = STATUS_COLORS[report.status] || STATUS_COLORS["Received"];
                const isUpdating = updating === report.id;
                const isCalling  = callingReport === report.id;
                const callRes    = callResult[report.id];

                return (
                  <div key={report.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                            #{report.incidentId?.slice(-8) || report.id}
                          </span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.text} ${sc.bg} ${sc.border}`}>
                            {report.status}
                          </span>
                          {report.isVerified && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-200">✓ Verified</span>
                          )}
                          {report.aiCallPlaced && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200">AI Called</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 font-medium leading-snug">{report.description}</p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{timeAgo(report.createdAt)}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4 text-xs text-gray-500">
                      {(report.location || report.state) && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{report.location}{report.state ? `, ${report.state}` : ""}</span>
                      )}
                      {report.userName  && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{report.userName}</span>}
                      {report.userPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{report.userPhone}</span>}
                      {report.userEmail && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{report.userEmail}</span>}
                      {(report.latitude && report.longitude) && (
                        <span className="flex items-center gap-1"><Navigation className="w-3 h-3" />{report.latitude?.toFixed(4)}, {report.longitude?.toFixed(4)}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggleVerified(report)} disabled={isUpdating}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          report.isVerified
                            ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:border-green-300 hover:text-green-600"
                        }`}
                      >
                        {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : report.isVerified ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {report.isVerified ? "Verified" : "Mark Verified"}
                      </button>

                      {["Received", "In Progress", "Closed"].map((s) => (
                        <button key={s} onClick={() => updateStatus(report, s)}
                          disabled={isUpdating || report.status === s}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                            report.status === s
                              ? `${STATUS_COLORS[s]?.bg} ${STATUS_COLORS[s]?.text} ${STATUS_COLORS[s]?.border}`
                              : "bg-gray-50 text-gray-400 border-gray-200 hover:border-gray-300"
                          } disabled:opacity-50`}
                        >{s}</button>
                      ))}

                      <button onClick={() => triggerAICall(report)} disabled={isCalling || report.aiCallPlaced}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                          report.aiCallPlaced
                            ? "bg-purple-50 text-purple-400 border-purple-200 opacity-60"
                            : "bg-purple-500 text-white border-purple-500 hover:bg-purple-600"
                        } disabled:opacity-50`}
                      >
                        {isCalling ? <Loader2 className="w-3 h-3 animate-spin" /> : <PhoneOutgoing className="w-3 h-3" />}
                        {isCalling ? "Calling…" : report.aiCallPlaced ? "Called" : "AI Call"}
                      </button>

                      <button
                        onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 hover:border-gray-300 transition-all"
                      >
                        <Eye className="w-3 h-3" />
                        {selectedReport?.id === report.id ? "Hide" : "Details"}
                      </button>
                    </div>

                    {callRes && (
                      <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${
                        callRes.error ? "bg-red-50 text-red-600 border border-red-200" : "bg-purple-50 text-purple-700 border border-purple-200"
                      }`}>
                        {callRes.error ? `⚠ ${callRes.error}` : `✓ Call placed — SID: ${callRes.callSid} · Status: ${callRes.status}`}
                      </div>
                    )}

                    {selectedReport?.id === report.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Full Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-4">
                          <div><span className="font-semibold">Incident ID:</span> {report.incidentId}</div>
                          <div><span className="font-semibold">DB ID:</span> {report.id}</div>
                          <div><span className="font-semibold">Status:</span> {report.status}</div>
                          <div><span className="font-semibold">Anonymous:</span> {report.isAnonymous ? "Yes" : "No"}</div>
                          <div><span className="font-semibold">Created:</span> {new Date(report.createdAt).toLocaleString()}</div>
                          <div><span className="font-semibold">Updated:</span> {new Date(report.updatedAt).toLocaleString()}</div>
                          <div><span className="font-semibold">IP:</span> {report.ip || "—"}</div>
                          <div><span className="font-semibold">AI Call SID:</span> {report.aiCallSid || "—"}</div>
                        </div>

                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Media Files</p>
                        {report.mediaUrls ? (
                          <div className="space-y-2">
                            {report.mediaUrls.split(",").map((url, idx) => {
                              const cleanUrl = url.trim();
                              const isVideo = isVideoUrl(cleanUrl);
                              const filename = cleanUrl.split("/").pop();
                              return (
                                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                                  {isVideo
                                    ? <FileVideo className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                    : <FileAudio className="w-4 h-4 text-purple-500 flex-shrink-0" />}
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                                    isVideo ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                                  }`}>
                                    {isVideo ? "VIDEO" : "AUDIO"}
                                  </span>
                                  <span className="text-xs text-gray-600 flex-1 truncate">{filename}</span>
                                  <a href={cleanUrl} target="_blank" rel="noreferrer"
                                    className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors flex-shrink-0">
                                    View ↗
                                  </a>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic py-1">No media uploaded for this report.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

            {reportList.filter((r) => activeTab === "verified" ? r.isVerified : true).length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-500">No reports found</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === "verified" ? "No verified reports yet" : "No reports submitted yet"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
