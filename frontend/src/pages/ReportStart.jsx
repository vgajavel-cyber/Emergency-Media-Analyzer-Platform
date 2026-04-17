import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, reports, contacts } from "@/api/apiClient";
import {
  Phone, MapPin, Wifi, Loader2, Send,
  Shield, MessageSquare, Plus, Check, X
} from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import EMapHeader from "../components/EMapHeader";
import DangerZoneList from "../components/DangerZoneList";
import SmsNotification from "../components/SmsNotification";
import AISuggestions from "../components/AISuggestions";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function ReportStart() {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [locationData, setLocationData] = useState({
    location: "", state: "", ip: "",
    latitude: null, longitude: null
  });
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());
  const [contactList, setContactList] = useState([]);
  const [showSms, setShowSms] = useState(false);
  const [addingContact, setAddingContact] = useState(null);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [submittedReport, setSubmittedReport] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    detectLocation();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (auth.isAuthenticated()) {
      setIsLoggedIn(true);
      try {
        const data = await contacts.list();
        setContactList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load contacts:", err);
      }
    }
  };

  const detectLocation = async () => {
    setLoadingLocation(true);
    const applyGPS = (baseLoc) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => setLocationData((prev) => ({
            ...prev,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          })),
          () => {}
        );
      }
    };
    try {
      // Get real IP from browser first
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      const realIp = ipData.ip;

      // Pass real IP to backend so ip-api.com looks up correct location
      const res = await fetch(`${BACKEND}/api/location?ip=${realIp}`);
      const data = await res.json();
      if (data.status === "success") {
        const loc = {
          location: data.city || "",
          state: data.regionName || "",
          ip: realIp || data.query || "",
          latitude: data.lat || null,
          longitude: data.lon || null,
        };
        setLocationData(loc);
        applyGPS(loc);
      } else {
        setLocationData((prev) => ({ ...prev, ip: realIp }));
        applyGPS({});
      }
    } catch {
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipRes.json();
        setLocationData((prev) => ({ ...prev, ip: ipData.ip }));
      } catch {}
      applyGPS({});
    }
    setLoadingLocation(false);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Please describe the emergency.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isLoggedIn) {
        try {
          const myReports = await reports.listMy();
          if (Array.isArray(myReports)) {
            const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
            const recent = myReports.find(
              (r) =>
                r.description === description.trim() &&
                new Date(r.createdAt).getTime() > fiveMinutesAgo
            );
            if (recent) {
              setError("You already submitted this report recently.");
              setSubmitting(false);
              return;
            }
          }
        } catch {}
      }
      const payload = {
        description: description.trim(),
        location: locationData.location,
        state: locationData.state,
        ip: locationData.ip,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        status: "Received",
        isVerified: false,
        isAnonymous: !isLoggedIn,
        aiCallPlaced: false,
      };
      if (isLoggedIn) {
        try {
          const user = await auth.me();
          if (user?.id) payload.userId = user.id;
        } catch {}
      }
      const saved = await reports.create(payload);
      if (!saved?.id) throw new Error("Report creation failed");
      sessionStorage.setItem("emap_report_id", saved.id);
      setSubmittedReport(saved);
      navigate("/Track");
    } catch (err) {
      console.error("Submit error:", err);
      setError("Failed to submit report. Please try again.");
    }
    setSubmitting(false);
  };

  const handleSaveContact = async (index) => {
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setSavingContact(true);
    try {
      let saved;
      if (contactList[index]) {
        saved = await contacts.update(contactList[index].id, {
          name: newContactName,
          phone: newContactPhone,
        });
        setContactList((prev) => prev.map((c, i) => (i === index ? saved : c)));
      } else {
        saved = await contacts.create({
          name: newContactName,
          phone: newContactPhone,
        });
        setContactList((prev) => {
          const updated = [...prev];
          updated[index] = saved;
          return updated;
        });
      }
    } catch (err) {
      console.error("Save contact error:", err);
    }
    setNewContactName("");
    setNewContactPhone("");
    setAddingContact(null);
    setSavingContact(false);
  };

  return (
    <div className="min-h-screen emap-gradient">
      <EMapHeader isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />

      <div className="max-w-xl mx-auto px-4 pb-10">
        <StepIndicator currentStep={1} />

        {/* Location Card */}
        <div className="emap-card rounded-2xl p-4 mb-4 slide-up">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Your Location</span>
          </div>
          {loadingLocation ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-red-400" />
              <span className="text-sm">Detecting location…</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800">
                {locationData.location && locationData.state
                  ? `${locationData.location}, ${locationData.state}`
                  : locationData.location || locationData.state || "Location unavailable"}
              </span>
              {locationData.ip && (
                <span className="text-xs text-gray-400 ml-auto">IP: {locationData.ip}</span>
              )}
            </div>
          )}
          {locationData.latitude && locationData.longitude && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">
                {locationData.latitude.toFixed(5)}, {locationData.longitude.toFixed(5)}
              </span>
            </div>
          )}
        </div>

        {/* Report Form */}
        <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Emergency Report</span>
          </div>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(""); }}
            placeholder="Describe the emergency in detail — what happened, how many people involved, any immediate dangers…"
            rows={5}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-gray-900 placeholder-gray-400 resize-none"
          />
          <div className="flex items-center justify-between mt-1 mb-3">
            <span className={`text-xs ${description.length > 500 ? "text-red-400" : "text-gray-400"}`}>
              {description.length} characters
            </span>
            {description.length > 0 && (
              <button onClick={() => setDescription("")} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
                Clear
              </button>
            )}
          </div>
          <AISuggestions description={description} location={locationData.location} state={locationData.state} />
          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
            ) : (
              <><Send className="w-4 h-4" /> Submit Emergency Report</>
            )}
          </button>
        </div>

        {/* Emergency Contacts */}
        {isLoggedIn && (
          <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Emergency Contacts</span>
              </div>
              {submittedReport && contactList.length > 0 && (
                <button
                  onClick={() => setShowSms(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" /> SMS Alerts
                </button>
              )}
            </div>

            {[0, 1].map((index) => {
              const contact = contactList[index];
              const isAdding = addingContact === index;

              return (
                <div key={index} className="mb-3">
                  {isAdding ? (
                    <div className="p-3 rounded-xl border border-red-200 bg-red-50">
                      <input
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Contact Name"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-red-400"
                      />
                      <input
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        placeholder="Phone Number e.g. +14801234567"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-2 focus:outline-none focus:border-red-400"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveContact(index)}
                          disabled={savingContact}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {savingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          Save
                        </button>
                        <button
                          onClick={() => { setAddingContact(null); setNewContactName(""); setNewContactPhone(""); }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : contact ? (
                    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
                        >
                          <Phone className="w-3 h-3" /> Call
                        </a>
                        <a
                          href={`sms:${contact.phone}?body=Emergency Alert! I submitted an emergency report. Please check on me immediately.`}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" /> SMS
                        </a>
                        <button
                          onClick={() => { setAddingContact(index); setNewContactName(contact.name); setNewContactPhone(contact.phone); }}
                          className="text-xs text-red-500 font-bold hover:text-red-600 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingContact(index); setNewContactName(""); setNewContactPhone(""); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-400 text-sm font-semibold transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      Add Emergency Contact {index + 1}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Danger Zone List */}
        <div className="slide-up">
          <DangerZoneList latitude={locationData.latitude} longitude={locationData.longitude} />
        </div>
      </div>

      {/* SMS Modal */}
      {showSms && (
        <SmsNotification
          reportId={submittedReport?.id}
          incidentId={submittedReport?.incidentId}
          onClose={() => setShowSms(false)}
        />
      )}
    </div>
  );
}