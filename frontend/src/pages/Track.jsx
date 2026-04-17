import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { reports, auth } from "@/api/apiClient";
import {
  CheckCircle2, Hash, Upload, Video, Mic, Loader2,
  ChevronRight, FileVideo, FileAudio, X, AlertTriangle,
  Camera, StopCircle
} from "lucide-react";
import StepIndicator from "../components/StepIndicator";
import EMapHeader from "../components/EMapHeader";

const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8080";

export default function Track() {
  const navigate = useNavigate();
  const [reportId, setReportId] = useState(null);
  const [incidentId, setIncidentId] = useState(null);
  const [videoFiles, setVideoFiles] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ video: 0, audio: 0 });
  const [continuing, setContinuing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(auth.isAuthenticated());
  const [error, setError] = useState("");

  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [videoRecorder, setVideoRecorder] = useState(null);
  const videoPreviewRef = useRef(null);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [audioRecorder, setAudioRecorder] = useState(null);
  const [audioSeconds, setAudioSeconds] = useState(0);
  const audioTimerRef = useRef(null);

  useEffect(() => {
    loadReport();
    return () => {
      if (videoStream) videoStream.getTracks().forEach(t => t.stop());
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, []);

  const loadReport = async () => {
    const id = sessionStorage.getItem("emap_report_id");
    if (!id) { navigate("/ReportStart"); return; }
    setReportId(id);
    try {
      const data = await reports.getById(id);
      if (data?.id) setIncidentId(data.incidentId);
    } catch (err) {
      console.error("Failed to load report:", err);
    }
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => f.size <= 50 * 1024 * 1024);
    if (valid.length < files.length) setError("Some files skipped — max 50MB each.");
    setVideoFiles((prev) => [...prev, ...valid]);
  };

  const handleAudioChange = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter((f) => f.size <= 20 * 1024 * 1024);
    if (valid.length < files.length) setError("Some files skipped — max 20MB each.");
    setAudioFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (type, idx) => {
    if (type === "video") setVideoFiles((prev) => prev.filter((_, i) => i !== idx));
    else setAudioFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: "environment" } }, 
        audio: true 
      });
      setVideoStream(stream);
      setTimeout(() => {
        if (videoPreviewRef.current) {
          videoPreviewRef.current.srcObject = stream;
          videoPreviewRef.current.muted = true;
          videoPreviewRef.current.play().catch(err => console.error("Play failed:", err));
        }
      }, 100);
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
        setVideoFiles((prev) => [...prev, file]);
        stream.getTracks().forEach(t => t.stop());
        setVideoStream(null);
      };
      recorder.start();
      setVideoRecorder(recorder);
      setIsRecordingVideo(true);
    } catch (err) {
      setError("Camera access denied. Please allow camera permissions.");
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorder) {
      videoRecorder.stop();
      setVideoRecorder(null);
      setIsRecordingVideo(false);
    }
  };

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        setAudioFiles((prev) => [...prev, file]);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setAudioRecorder(recorder);
      setIsRecordingAudio(true);
      setAudioSeconds(0);
      audioTimerRef.current = setInterval(() => setAudioSeconds(s => s + 1), 1000);
    } catch (err) {
      setError("Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopAudioRecording = () => {
    if (audioRecorder) {
      audioRecorder.stop();
      setAudioRecorder(null);
      setIsRecordingAudio(false);
      clearInterval(audioTimerRef.current);
      setAudioSeconds(0);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleUploadAndContinue = async () => {
    setError("");
    if (videoFiles.length === 0 && audioFiles.length === 0) {
      handleContinue();
      return;
    }
    setUploading(true);
    try {
      const token = localStorage.getItem("emap_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Combine all files into one sequential loop — video first, then audio
      const allFiles = [
        ...videoFiles.map(f => ({ file: f, type: "video" })),
        ...audioFiles.map(f => ({ file: f, type: "audio" }))
      ];

      for (const { file, type } of allFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch(`${BACKEND}/api/media/upload?reportId=${reportId}`, {
          method: "POST", headers, body: formData,
        });
        if (!res.ok) throw new Error(`Failed to upload ${file.name}`);
        const data = await res.json();
        console.log(`${type} uploaded to S3:`, data.url);

        if (type === "video") setUploadProgress((prev) => ({ ...prev, video: 100 }));
        else setUploadProgress((prev) => ({ ...prev, audio: 100 }));
      }

      setUploading(false);
      handleContinue();
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. You can skip and continue without files.");
      setUploading(false);
    }
  };

  const handleContinue = () => { setContinuing(true); navigate("/OptionalLogin"); };
  const handleSkip = () => { navigate("/OptionalLogin"); };

  return (
    <div className="min-h-screen emap-gradient">
      <EMapHeader isLoggedIn={isLoggedIn} onLogout={() => setIsLoggedIn(false)} />

      <div className="max-w-xl mx-auto px-4 pb-10">
        <StepIndicator currentStep={2} />

        {incidentId && (
          <div className="emap-card rounded-2xl p-4 mb-4 slide-up">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Report Created</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Hash className="w-3.5 h-3.5 text-red-500" />
                  <span className="font-mono font-bold text-gray-900 text-sm">{incidentId}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="emap-card rounded-2xl p-5 mb-4 slide-up">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Upload Evidence</span>
          </div>
          <p className="text-xs text-gray-400 mb-5">Optional — upload or record video/audio evidence</p>

          {/* VIDEO */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Video className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-bold text-gray-700">Video</span>
              <span className="text-xs text-gray-400">(max 50MB)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 cursor-pointer transition-all">
                <FileVideo className="w-6 h-6 text-blue-400 mb-1.5" />
                <span className="text-xs font-semibold text-blue-500">Upload Video</span>
                <span className="text-xs text-blue-400 mt-0.5">MP4, MOV, AVI</span>
                <input type="file" accept="video/*" multiple onChange={handleVideoChange} className="hidden" />
              </label>
              {!isRecordingVideo ? (
                <button onClick={startVideoRecording} className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-red-200 hover:border-red-400 bg-red-50 hover:bg-red-100 transition-all">
                  <Camera className="w-6 h-6 text-red-400 mb-1.5" />
                  <span className="text-xs font-semibold text-red-500">Record Video</span>
                  <span className="text-xs text-red-400 mt-0.5">Use camera</span>
                </button>
              ) : (
                <button onClick={stopVideoRecording} className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-red-400 bg-red-500 transition-all">
                  <StopCircle className="w-6 h-6 text-white mb-1.5" />
                  <span className="text-xs font-semibold text-white">Stop Recording</span>
                  <span className="text-xs text-red-100 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> Recording…
                  </span>
                </button>
              )}
            </div>
            {isRecordingVideo && (
              <div className="mb-3 rounded-xl overflow-hidden border-2 border-red-300">
                <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full h-40 object-cover bg-black" />
              </div>
            )}
            {videoFiles.length > 0 && (
              <div className="space-y-2">
                {videoFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                    <FileVideo className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile("video", idx)} className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploading && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-blue-500 font-semibold">Uploading video…</span>
                  <span className="text-xs text-blue-500">{uploadProgress.video}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.video}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* AUDIO */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Mic className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-bold text-gray-700">Audio</span>
              <span className="text-xs text-gray-400">(max 20MB)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <label className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all">
                <FileAudio className="w-6 h-6 text-purple-400 mb-1.5" />
                <span className="text-xs font-semibold text-purple-500">Upload Audio</span>
                <span className="text-xs text-purple-400 mt-0.5">MP3, WAV, M4A</span>
                <input type="file" accept="audio/*" multiple onChange={handleAudioChange} className="hidden" />
              </label>
              {!isRecordingAudio ? (
                <button onClick={startAudioRecording} className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50 hover:bg-purple-100 transition-all">
                  <Mic className="w-6 h-6 text-purple-400 mb-1.5" />
                  <span className="text-xs font-semibold text-purple-500">Record Audio</span>
                  <span className="text-xs text-purple-400 mt-0.5">Use microphone</span>
                </button>
              ) : (
                <button onClick={stopAudioRecording} className="flex flex-col items-center justify-center py-5 rounded-xl border-2 border-purple-500 bg-purple-500 transition-all">
                  <StopCircle className="w-6 h-6 text-white mb-1.5" />
                  <span className="text-xs font-semibold text-white">Stop Recording</span>
                  <span className="text-xs text-purple-100 mt-0.5 font-mono">{formatTime(audioSeconds)}</span>
                </button>
              )}
            </div>
            {isRecordingAudio && (
              <div className="mb-3 p-3 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-purple-700">Recording audio…</p>
                  <p className="text-xs text-purple-500">{formatTime(audioSeconds)} elapsed</p>
                </div>
                <button onClick={stopAudioRecording} className="px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 transition-colors">
                  Stop
                </button>
              </div>
            )}
            {audioFiles.length > 0 && (
              <div className="space-y-2">
                {audioFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                    <FileAudio className="w-4 h-4 text-purple-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button onClick={() => removeFile("audio", idx)} className="w-5 h-5 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors">
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploading && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-purple-500 font-semibold">Uploading audio…</span>
                  <span className="text-xs text-purple-500">{uploadProgress.audio}%</span>
                </div>
                <div className="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress.audio}%` }} />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <button
            onClick={handleUploadAndContinue}
            disabled={uploading || continuing || isRecordingVideo || isRecordingAudio}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 mb-3"
            style={{ background: "linear-gradient(135deg,#E63946,#c1121f)", boxShadow: "0 4px 15px rgba(230,57,70,0.3)" }}
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
            ) : continuing ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Continuing…</>
            ) : (videoFiles.length > 0 || audioFiles.length > 0) ? (
              <><Upload className="w-4 h-4" /> Upload & Continue</>
            ) : (
              <><ChevronRight className="w-4 h-4" /> Continue</>
            )}
          </button>

          <button
            onClick={handleSkip}
            disabled={uploading || continuing || isRecordingVideo || isRecordingAudio}
            className="w-full py-3 rounded-xl font-semibold text-gray-500 text-sm flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-50"
          >
            Skip — No Evidence to Upload
          </button>
        </div>
      </div>
    </div>
  );
}
