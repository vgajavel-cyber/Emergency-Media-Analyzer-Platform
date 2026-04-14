import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { reports } from "@/api/apiClient";
import {
  CheckCircle2, Copy, Clock, Shield,
  Home, Loader2, MapPin, Hash, AlertTriangle
} from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import EMapHeader from "../components/EMapHeader";
import { auth } from "@/api/apiClient";

export default function ReportGenerated() {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const reportId = sessionStorage.getItem("emap_report_id");
      if (!reportId) {
        navigate("/ReportStart");
        return;
      }

      const data = await reports.getById(reportId);
      if (data?.id) {
        setReport(data);
      } else {
        navigate("/ReportStart");
      }
    } catch (err) {
      console.error("Failed to load report:", err);
      navigate("/ReportStart");
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (report?.incidentId) {
      navigator.clipboard.writeText(report.incidentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNewReport = () => {
    // Clear session and start fresh
    sessionStorage.removeItem("emap_report_id");
    navigate("/ReportStart");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#f8f9fa" }}
      >
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen emap-gradient">

      {/* Header */}
      <EMapHeader
        isLoggedIn={isLoggedIn}
        onLogout={() => setIsLoggedIn(false)}
      />

      <div className="max-w-xl mx-auto px-4 pb-10">

        {/* Step Indicator */}
        <StepIndicator currentStep={4} />

        {/* Success Banner */}
        <div className="emap-card rounded-2xl p-6 mb-4 slide-up text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Report Submitted
          </h1>
          <p className="text-gray-500 text-sm">
            Your emergency report has been received and is being processed.
          </p>
        </div>

        {/* Incident ID */}
        <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-red-500" />
            Incident ID
          </h2>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
            <Hash className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="font-mono font-bold text-gray-900 text-sm flex-1 break-all">
              {report?.incidentId || "—"}
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              }`}
            >
              {copied ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy</>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Save this ID to track your report status
          </p>
        </div>

        {/* Report Details */}
        {report && (
          <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              Report Summary
            </h2>

            <div className="space-y-3">

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Status</span>
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  {report.status || "Received"}
                </span>
              </div>

              {/* Description */}
              {report.description && (
                <div>
                  <span className="text-xs text-gray-500 font-medium block mb-1">
                    Description
                  </span>
                  <p className="text-sm text-gray-800 leading-snug">
                    {report.description}
                  </p>
                </div>
              )}

              {/* Location */}
              {(report.location || report.state) && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-medium">Location</span>
                  <span className="text-xs text-gray-700 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-400" />
                    {report.location}{report.state ? `, ${report.state}` : ""}
                  </span>
                </div>
              )}

              {/* Submitted */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">Submitted</span>
                <span className="text-xs text-gray-700 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {report.createdAt
                    ? new Date(report.createdAt).toLocaleString()
                    : "Just now"}
                </span>
              </div>

            </div>
          </div>
        )}

        {/* What Happens Next */}
        <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            What Happens Next
          </h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Your report is being reviewed by our emergency response team." },
              { step: "2", text: "Authorities will be notified based on the severity of the incident." },
              { step: "3", text: "You'll receive updates if you provided contact information." },
              { step: "4", text: "Use your Incident ID to track status at any time." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-sm text-gray-600 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 slide-up">

          {/* Go to Dashboard */}
          {isLoggedIn && (
            <Link
              to="/UserDashboard"
              className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all"
              style={{
                background: "linear-gradient(135deg,#E63946,#c1121f)",
                boxShadow: "0 4px 15px rgba(230,57,70,0.3)",
              }}
            >
              <Shield className="w-4 h-4" />
              View My Dashboard
            </Link>
          )}

          {/* Submit New Report */}
          <button
            onClick={handleNewReport}
            className="w-full py-3 rounded-xl font-bold text-gray-600 text-sm flex items-center justify-center gap-2 border border-gray-200 hover:border-red-300 hover:text-red-500 transition-all bg-white"
          >
            <Home className="w-4 h-4" />
            Submit Another Report
          </button>

        </div>
      </div>
    </div>
  );
}