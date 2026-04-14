import React, { useState } from "react";
import { ai } from "@/api/apiClient";
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Phone } from "lucide-react";

export default function AISuggestions({ description, location, state }) {
const [suggestions, setSuggestions] = useState(null);
const [loading, setLoading] = useState(false);
const [expanded, setExpanded] = useState(true);

const getSuggestions = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setSuggestions(null);

    try {
    const prompt = `You are an emergency response assistant. Based on the following emergency description and location, provide concise, actionable suggestions.

Emergency Description: "${description}"
Location: "${location || "Unknown"}, ${state || "Unknown"}"

Provide a JSON response with:
- emergencyType: short label (e.g. "Fire", "Medical", "Flood", "Accident", etc.)
- immediateActions: array of 3-4 immediate steps the person should take RIGHT NOW
- doNotDo: array of 2-3 things to avoid
- callNumbers: array of relevant emergency numbers with label and number. IMPORTANT: Include the actual local police station phone number for "${location || ""}, ${state || ""}" (not just 911 — find the real non-emergency or direct line for that city's police department). Also include other relevant numbers (fire, ambulance, poison control, etc.) based on the emergency type.
- safetyTip: one short safety tip specific to this emergency

For the local police number, use your knowledge of real phone numbers for that city/region. Be accurate.

IMPORTANT: Return only valid JSON, no markdown, no extra text.`;

const raw = await ai.getSuggestions(prompt);

      // Parse Gemini response structure
let parsed = null;

if (raw?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = raw.candidates[0].content.parts[0].text;
        // Clean any accidental markdown fences
        const clean = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
    } else if (raw?.emergencyType) {
        // Already parsed object (backend returned it directly)
        parsed = raw;
    }

    setSuggestions(parsed);
    } catch (e) {
    console.error("AI suggestions error:", e);
    setSuggestions({
        emergencyType: "Error",
        immediateActions: ["Could not load AI suggestions. Please try again."],
        doNotDo: [],
        callNumbers: [{ label: "Emergency", number: "911" }],
        safetyTip: "Always call emergency services first."
    });
    }

    setLoading(false);
};

return (
    <div className="mt-3">
    <button
        onClick={getSuggestions}
        disabled={!description.trim() || loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-600 font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
    >
        {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing emergency…</>
        ) : (
        <><Sparkles className="w-4 h-4" /> Get AI Suggestions</>
        )}
    </button>

    {suggestions && (
        <div className="mt-3 rounded-xl border border-purple-200 bg-purple-50 overflow-hidden">
          {/* Header */}
        <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-purple-500 text-white"
        >
            <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="font-bold text-sm">
                AI Suggestions · {suggestions.emergencyType}
            </span>
            </div>
            {expanded ? (
            <ChevronUp className="w-4 h-4" />
            ) : (
            <ChevronDown className="w-4 h-4" />
            )}
        </button>

        {expanded && (
            <div className="p-4 space-y-4">

              {/* Immediate Actions */}
            {suggestions.immediateActions?.length > 0 && (
                <div>
                <p className="text-xs font-bold text-purple-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Do This Now
                </p>
                <ul className="space-y-1.5">
                    {suggestions.immediateActions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                        <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {i + 1}
                        </span>
                        {action}
                    </li>
                    ))}
                </ul>
                </div>
            )}

              {/* Do Not Do */}
            {suggestions.doNotDo?.length > 0 && (
                <div>
                <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Avoid These
                </p>
                <ul className="space-y-1.5">
                    {suggestions.doNotDo.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-red-500 font-bold flex-shrink-0">✕</span>
                        {item}
                    </li>
                    ))}
                </ul>
                </div>
            )}

              {/* Call Numbers */}
            {suggestions.callNumbers?.length > 0 && (
                <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> Emergency Contacts
                </p>
                <div className="flex flex-wrap gap-2">
                    {suggestions.callNumbers.map((c, i) => (
                    <a
                        key={i}
                        href={`tel:${c.number}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
                    >
                        <Phone className="w-3 h-3" />
                        {c.label}: {c.number}
                    </a>
                    ))}
                </div>
                </div>
            )}

              {/* Safety Tip */}
            {suggestions.safetyTip && (
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <p className="text-xs font-bold text-yellow-700 mb-1">💡 Safety Tip</p>
                <p className="text-xs text-yellow-800">{suggestions.safetyTip}</p>
                </div>
            )}

            </div>
        )}
        </div>
    )}
    </div>
    );
}


