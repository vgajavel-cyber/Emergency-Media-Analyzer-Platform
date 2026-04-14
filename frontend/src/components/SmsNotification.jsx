import React, { useState } from "react";
import { MessageSquare, Phone, X, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { reports } from "@/api/apiClient";

export default function SmsNotification({ reportId, incidentId, onClose }) {
const [phone, setPhone] = useState("");
const [sending, setSending] = useState(false);
const [sent, setSent] = useState(false);
const [error, setError] = useState("");

const handleSend = async () => {
    if (!phone.trim() || phone.replace(/\D/g, "").length < 10) {
    setError("Please enter a valid phone number.");
    return;
    }
    setError("");
    setSending(true);

    try {
      // Save the phone number on the report for SMS delivery
    if (reportId) {
        await reports.update(reportId, { userPhone: phone });
    }

      // Simulate SMS sending delay
    await new Promise((r) => setTimeout(r, 1500));

    setSent(true);
    } catch (err) {
    console.error("SMS send error:", err);
    setError("Failed to save phone number. Please try again.");
    }

    setSending(false);
};

return (
    <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{ background: "rgba(0,0,0,0.4)" }}
    >
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
            <p className="font-bold text-gray-900 text-sm">Emergency SMS Alert</p>
            <p className="text-xs text-gray-400">Get notified on your phone</p>
            </div>
        </div>
        <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
            <X className="w-4 h-4 text-gray-400" />
        </button>
        </div>

        <div className="p-5">
        {sent ? (
            /* Success State */
            <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-7 h-7 text-green-500" />
            </div>
            <p className="font-bold text-gray-900">SMS Notification Set!</p>
            <p className="text-sm text-gray-500 mt-1">
                You'll receive updates at{" "}
                <span className="font-semibold text-gray-700">{phone}</span>
            </p>
            {incidentId && (
                <p className="text-xs text-gray-400 mt-2 font-mono">
                Incident: {incidentId}
                </p>
            )}
            <button
                onClick={onClose}
                className="mt-4 w-full py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors"
            >
                Done
            </button>
            </div>
        ) : (
            /* Input State */
            <>
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                You'll receive SMS updates when your incident status changes
                or emergency vehicles are dispatched.
                </p>
            </div>

            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Mobile Number
            </label>
            <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                type="tel"
                value={phone}
                onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                }}
                placeholder="+1 (555) 000-0000"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400"
                />
            </div>

            {error && (
                <p className="text-xs text-red-500 mt-1.5">{error}</p>
            )}

            <button
                onClick={handleSend}
                disabled={sending || !phone.trim()}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{
                background: "linear-gradient(135deg,#E63946,#c1121f)",
                boxShadow: "0 4px 15px rgba(230,57,70,0.3)",
                }}
            >
                {sending ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                </>
                ) : (
                <>
                    <MessageSquare className="w-4 h-4" /> Send SMS Notification
                </>
                )}
            </button>
            </>
        )}
        </div>
    </div>
    </div>
);
}