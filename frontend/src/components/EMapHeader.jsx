import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, User, Radio, LogOut } from "lucide-react";

export default function EMapHeader({ isLoggedIn, onLogout }) {
const navigate = useNavigate();

const handleLogout = () => {
    localStorage.removeItem("emap_token");
    if (onLogout) onLogout();
    navigate("/ReportStart");
};

return (
    <header className="w-full px-4 py-3 flex items-center justify-between border-b border-red-100 bg-white shadow-sm sticky top-0 z-50">

      {/* Logo */}
    <Link
        to="/ReportStart"
        className="flex items-center gap-2.5 group"
    >
        <div className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center red-glow group-hover:scale-105 transition-transform">
        <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
        <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-gray-900 tracking-widest">
            EMAP
            </span>
            <span className="hidden sm:inline text-xs font-medium text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
            Emergency Media Analyzer Platform
            </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400 -mt-0.5">
            <Radio className="w-2.5 h-2.5 text-red-400" />
            <span>Live Monitoring Active</span>
        </div>
        </div>
    </Link>

      {/* Right side nav */}
    <div className="flex items-center gap-2">
        {isLoggedIn ? (
        <>
            <Link
            to="/UserDashboard"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition-colors text-sm text-white font-medium shadow-sm"
            >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors text-sm text-red-500 font-medium"
            >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
            </button>
        </>
        ) : (
        <Link
            to="/UserDashboard"
            className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium"
        >
            User Dashboard
        </Link>
        )}
    </div>

    </header>
);
}