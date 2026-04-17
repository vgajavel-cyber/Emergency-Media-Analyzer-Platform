import React, { useEffect, useState, useRef } from "react";
import { AlertTriangle, MapPin, Loader2, Bell, BellOff, RefreshCw, Zap, Clock, Cloud, Activity, Flame, Car } from "lucide-react";
import { reports } from "@/api/apiClient";

function getDistanceMiles(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// NWS Weather Alerts
async function fetchNWSAlerts(lat, lon) {
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
      { headers: { "User-Agent": "EMAP Emergency App (contact@emap.com)" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f) => ({
      id: `nws-${f.id}`,
      source: "NWS",
      type: "weather",
      title: f.properties.event,
      description: f.properties.headline || f.properties.description?.slice(0, 120),
      createdAt: f.properties.sent,
      location: f.properties.areaDesc?.split(";")[0]?.trim(),
      latitude: lat,
      longitude: lon,
    }));
  } catch (e) { return []; }
}

// USGS Earthquakes
async function fetchUSGSEarthquakes(lat, lon) {
  try {
    const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 19);
    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&latitude=${lat}&longitude=${lon}&maxradiuskm=80&minmagnitude=2.0&starttime=${startTime}&orderby=time`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f) => ({
      id: `usgs-${f.id}`,
      source: "USGS",
      type: "earthquake",
      title: `M${f.properties.mag} Earthquake`,
      description: f.properties.title,
      createdAt: new Date(f.properties.time).toISOString(),
      location: f.properties.place,
      latitude: f.geometry.coordinates[1],
      longitude: f.geometry.coordinates[0],
      magnitude: f.properties.mag,
    }));
  } catch (e) { return []; }
}

// NIFC Wildfires
async function fetchWildfires(lat, lon) {
  try {
    const bbox = `${lon - 0.8},${lat - 0.8},${lon + 0.8},${lat + 0.8}`;
    const url = `https://services3.arcgis.com/T4QMspbfLg3qTGWY/arcgis/rest/services/Active_Fires/FeatureServer/0/query?where=1%3D1&outFields=*&geometry=${bbox}&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects&outSR=4326&f=geojson`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || []).map((f) => ({
      id: `fire-${f.properties.OBJECTID || Math.random()}`,
      source: "NIFC",
      type: "wildfire",
      title: `Wildfire: ${f.properties.IncidentName || "Active Fire"}`,
      description: `${f.properties.IncidentName || "Active wildfire"} — ${f.properties.GISAcres ? Math.round(f.properties.GISAcres) + " acres" : "size unknown"}. Contained: ${f.properties.PercentContained || 0}%`,
      createdAt: f.properties.ModifiedOnDateTime_dt || new Date().toISOString(),
      location: f.properties.POOCounty ? `${f.properties.POOCounty}, ${f.properties.POOState}` : "Unknown",
      latitude: f.geometry?.coordinates?.[1] || lat,
      longitude: f.geometry?.coordinates?.[0] || lon,
    }));
  } catch (e) { return []; }
}

// NWS Flood Alerts
async function fetchFloodAlerts(lat, lon) {
  try {
    const res = await fetch(
      `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}&event=Flood%20Warning,Flash%20Flood%20Warning,Flood%20Watch,Flash%20Flood%20Watch`,
      { headers: { "User-Agent": "EMAP Emergency App (contact@emap.com)" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.features || [])
      .filter(f => f.properties.event?.toLowerCase().includes("flood"))
      .map((f) => ({
        id: `flood-${f.id}`,
        source: "NWS",
        type: "flood",
        title: f.properties.event,
        description: f.properties.headline || f.properties.description?.slice(0, 120),
        createdAt: f.properties.sent,
        location: f.properties.areaDesc?.split(";")[0]?.trim(),
        latitude: lat,
        longitude: lon,
      }));
  } catch (e) { return []; }
}

// TomTom Traffic Incidents
async function fetchTrafficIncidents(lat, lon) {
  try {
    const apiKey = "gjdPtxWxunjXbvVjapHAaKh8XAN2kXtT";
    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?key=${apiKey}&bbox=${lon - 0.15},${lat - 0.15},${lon + 0.15},${lat + 0.15}&fields={incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}&language=en-GB&categoryFilter=0,1,2,3,4,5,6,7,8,9,10,11&timeValidityFilter=present`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const categories = {
      0: "Unknown", 1: "Accident", 2: "Fog", 3: "Dangerous Conditions",
      4: "Rain", 5: "Ice", 6: "Traffic Jam", 7: "Lane Closed",
      8: "Road Closed", 9: "Road Works", 10: "Wind", 11: "Flooding", 14: "Broken Down Vehicle"
    };
    return (data.incidents || []).map((f) => {
      const props = f.properties;
      const event = props.events?.[0];
      const coords = f.geometry?.coordinates;
      return {
        id: `tomtom-${props.id}`,
        source: "TRAFFIC",
        type: "traffic",
        title: categories[props.iconCategory] || "Traffic Incident",
        description: event?.description || `${props.from || ""} → ${props.to || ""}`.trim() || "Traffic incident reported",
        createdAt: props.startTime || new Date().toISOString(),
        location: props.from || props.roadNumbers?.[0] || "Nearby road",
        latitude: Array.isArray(coords?.[0]) ? coords[0][1] : coords?.[1] || lat,
        longitude: Array.isArray(coords?.[0]) ? coords[0][0] : coords?.[0] || lon,
      };
    });
  } catch (e) { return []; }
}

const STYLES = {
  weather:    { color: "bg-sky-500",    text: "text-sky-700",    bg: "bg-sky-50",     border: "border-sky-200",    icon: <Cloud className="w-3 h-3 text-white" /> },
  earthquake: { color: "bg-amber-600",  text: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  icon: <Activity className="w-3 h-3 text-white" /> },
  wildfire:   { color: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", icon: <Flame className="w-3 h-3 text-white" /> },
  flood:      { color: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   icon: <AlertTriangle className="w-3 h-3 text-white" /> },
  traffic:    { color: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50",  border: "border-yellow-200", icon: <Car className="w-3 h-3 text-white" /> },
  report:     { color: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    icon: <AlertTriangle className="w-3 h-3 text-white" /> },
  default:    { color: "bg-red-500",    text: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    icon: <AlertTriangle className="w-3 h-3 text-white" /> },
};

function getStyle(incident) {
  return STYLES[incident.type] || STYLES.default;
}

function SourceBadge({ source }) {
  const styles = {
    NWS:     "text-sky-600 bg-sky-100",
    USGS:    "text-amber-700 bg-amber-100",
    NIFC:    "text-orange-700 bg-orange-100",
    EMAP:    "text-red-600 bg-red-100",
    TRAFFIC: "text-yellow-700 bg-yellow-100",
  };
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${styles[source] || styles.EMAP}`}>
      {source}
    </span>
  );
}

export default function DangerZoneList({ latitude, longitude }) {
  const [incidents, setIncidents] = useState([]);
  const [newAlerts, setNewAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [error, setError] = useState(null);
  const [counts, setCounts] = useState({});
  const prevIdsRef = useRef(new Set());
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!latitude || !longitude) return;
    fetchIncidents(true);
    intervalRef.current = setInterval(() => fetchIncidents(false), 30000);
    return () => clearInterval(intervalRef.current);
  }, [latitude, longitude]);

  const fetchIncidents = async (initial = false) => {
    if (initial) setLoading(true);
    setError(null);

    try {
      const [emapRaw, weather, earthquakes, wildfires, traffic] = await Promise.allSettled([
        reports.listVerified().catch(() => []),
        fetchNWSAlerts(latitude, longitude),
        fetchUSGSEarthquakes(latitude, longitude),
        fetchWildfires(latitude, longitude),
        fetchTrafficIncidents(latitude, longitude),
      ]);

      const emapIncidents = (emapRaw.value || [])
        .filter((r) => {
          if (!latitude || !longitude || !r.latitude || !r.longitude) return true;
          return getDistanceMiles(latitude, longitude, r.latitude, r.longitude) <= 50;
        })
        .map((r) => ({ ...r, source: "EMAP", type: "report" }));

      const weatherList = weather.value || [];
      const quakeList = earthquakes.value || [];
      const fireList = wildfires.value || [];
      const trafficList = traffic.value || [];

      const all = [...emapIncidents, ...weatherList, ...quakeList, ...fireList, ...trafficList]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setCounts({
        EMAP:    emapIncidents.length,
        NWS:     weatherList.length,
        USGS:    quakeList.length,
        NIFC:    fireList.length,
        TRAFFIC: trafficList.length,
      });

      if (!initial) {
        const newOnes = all.filter((r) => !prevIdsRef.current.has(r.id));
        if (newOnes.length > 0 && alertsEnabled) {
          setNewAlerts((prev) => [...newOnes, ...prev].slice(0, 3));
          setTimeout(() => setNewAlerts([]), 8000);
        }
      }

      prevIdsRef.current = new Set(all.map((r) => r.id));
      setIncidents(all);
      setLastChecked(new Date());
    } catch (err) {
      setError("Could not load incidents. Check your connection.");
    }

    if (initial) setLoading(false);
  };

  return (
    <div className="emap-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-red-500">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Live Incident Alerts</h3>
          <span className="text-xs text-red-100 bg-red-600/50 px-2 py-0.5 rounded-full">50 mi radius</span>
        </div>
        <div className="flex items-center gap-2">
          {lastChecked && (
            <span className="text-xs text-red-100 hidden sm:flex items-center gap-1">
              <Clock className="w-3 h-3" />{timeAgo(lastChecked)}
            </span>
          )}
          <button onClick={() => fetchIncidents(false)} className="w-7 h-7 rounded-lg bg-red-600/50 hover:bg-red-600 flex items-center justify-center transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={() => setAlertsEnabled(!alertsEnabled)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${alertsEnabled ? "bg-white/20" : "bg-red-900/50"}`}>
            {alertsEnabled ? <Bell className="w-3.5 h-3.5 text-white" /> : <BellOff className="w-3.5 h-3.5 text-red-200" />}
          </button>
        </div>
      </div>

      {/* Source legend with counts */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-wrap">
        <span className="text-xs text-gray-400 font-medium">Sources:</span>
        {[
          { key: "EMAP",    label: "EMAP Reports", cls: "text-red-600 bg-red-100" },
          { key: "NWS",     label: "Weather",      cls: "text-sky-600 bg-sky-100" },
          { key: "USGS",    label: "Earthquakes",  cls: "text-amber-700 bg-amber-100" },
          { key: "NIFC",    label: "Wildfires",    cls: "text-orange-700 bg-orange-100" },
          { key: "TRAFFIC", label: "Traffic",      cls: "text-yellow-700 bg-yellow-100" },
        ].map(({ key, label, cls }) => (
          <span key={key} className={`text-xs font-bold px-1.5 py-0.5 rounded ${cls}`}>
            {label} {counts[key] !== undefined ? `(${counts[key]})` : ""}
          </span>
        ))}
      </div>

      {/* New Alert Banners */}
      {newAlerts.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          {newAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center gap-2 p-3 rounded-xl border border-red-300 bg-red-50">
              <Zap className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm font-semibold text-red-700">🚨 {alert.title || alert.description?.slice(0, 60)}…</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
            <span className="text-sm">Scanning all sources…</span>
          </div>
        ) : incidents.length === 0 && !error ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700">No active incidents in your area</p>
            <p className="text-xs text-gray-400 mt-1">Monitoring EMAP · NWS · USGS · NIFC · Traffic — refreshing every 30s</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {incidents.map((incident) => {
              const sev = getStyle(incident);
              const dist = getDistanceMiles(latitude, longitude, incident.latitude, incident.longitude);
              return (
                <div key={incident.id} className={`flex items-start gap-3 p-3.5 rounded-xl border ${sev.bg} ${sev.border} hover:shadow-sm transition-all`}>
                  <div className={`w-6 h-6 rounded-full ${sev.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    {sev.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className={`text-xs font-black ${sev.text} uppercase tracking-wide`}>{incident.title}</span>
                      <SourceBadge source={incident.source} />
                      <span className="text-xs text-gray-400">{timeAgo(incident.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-800 font-medium leading-snug">
                      {incident.description?.slice(0, 100)}{incident.description?.length > 100 ? "…" : ""}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {incident.location && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3" />{incident.location}
                        </span>
                      )}
                      {dist !== null && <span className="text-xs font-semibold text-red-500">{dist.toFixed(1)} mi away</span>}
                      {incident.magnitude && <span className="text-xs font-bold text-amber-700">Magnitude {incident.magnitude}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
