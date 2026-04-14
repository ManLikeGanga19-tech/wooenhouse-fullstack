"use client";

import { useState, useEffect } from "react";
import { acceptAllCookies, declineCookies, saveCustomCookies } from "@/actions/cookies";

export default function CookieBanner() {
    const [visible,      setVisible]      = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [analytics,    setAnalytics]    = useState(false);
    const [marketing,    setMarketing]    = useState(false);
    const [saving,       setSaving]       = useState(false);

    // Delay mount so the slide-up animation is visible
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), 600);
        return () => clearTimeout(t);
    }, []);

    async function handleAccept() {
        setSaving(true);
        await acceptAllCookies();
        setVisible(false);
    }

    async function handleDecline() {
        setSaving(true);
        await declineCookies();
        setVisible(false);
    }

    async function handleSaveSettings() {
        setSaving(true);
        await saveCustomCookies({ analytics, marketing });
        setVisible(false);
    }

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[200] transition-transform duration-500 ease-out"
            style={{ transform: visible ? "translateY(0)" : "translateY(110%)" }}
        >
            <div
                className="w-full shadow-2xl border-t-2"
                style={{ background: "#1c1007", borderColor: "#8B5E3C" }}
            >
                {/* ── SETTINGS PANEL (expands upward) ── */}
                <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{ maxHeight: showSettings ? "260px" : "0px" }}
                >
                    <div className="px-5 sm:px-8 pt-5 pb-4 border-b" style={{ borderColor: "#3d2010" }}>
                        <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#C49A6C" }}>
                            Cookie Preferences
                        </p>
                        <div className="space-y-3">
                            {/* Necessary — always on */}
                            <label className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-white">Necessary</p>
                                    <p className="text-xs mt-0.5" style={{ color: "#a0826a" }}>
                                        Required for the site to function. Cannot be disabled.
                                    </p>
                                </div>
                                <div className="w-10 h-5 flex-shrink-0" style={{ background: "#8B5E3C", border: "1px solid #C49A6C" }}>
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">ON</span>
                                    </div>
                                </div>
                            </label>

                            {/* Analytics */}
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <div>
                                    <p className="text-sm font-semibold text-white">Analytics</p>
                                    <p className="text-xs mt-0.5" style={{ color: "#a0826a" }}>
                                        Helps us understand how visitors use the site (Tawk.to chat).
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAnalytics(v => !v)}
                                    className="w-10 h-5 flex-shrink-0 transition-colors duration-200 flex items-center justify-center border"
                                    style={{
                                        background:   analytics ? "#8B5E3C" : "transparent",
                                        borderColor:  "#8B5E3C",
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-white">
                                        {analytics ? "ON" : "OFF"}
                                    </span>
                                </button>
                            </label>

                            {/* Marketing */}
                            <label className="flex items-center justify-between gap-4 cursor-pointer">
                                <div>
                                    <p className="text-sm font-semibold text-white">Marketing</p>
                                    <p className="text-xs mt-0.5" style={{ color: "#a0826a" }}>
                                        Used for targeted ads and promotions.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setMarketing(v => !v)}
                                    className="w-10 h-5 flex-shrink-0 transition-colors duration-200 flex items-center justify-center border"
                                    style={{
                                        background:  marketing ? "#8B5E3C" : "transparent",
                                        borderColor: "#8B5E3C",
                                    }}
                                >
                                    <span className="text-[10px] font-bold text-white">
                                        {marketing ? "ON" : "OFF"}
                                    </span>
                                </button>
                            </label>
                        </div>
                    </div>
                </div>

                {/* ── MAIN BANNER ROW ── */}
                <div className="px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Message */}
                    <p className="flex-1 text-xs sm:text-sm leading-relaxed" style={{ color: "#c8a98a" }}>
                        We use cookies to improve your experience, analyse site traffic, and
                        personalise content.{" "}
                        <a
                            href="/privacy-policy"
                            className="underline underline-offset-2 hover:text-white transition-colors"
                            style={{ color: "#C49A6C" }}
                        >
                            Privacy Policy
                        </a>
                    </p>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {showSettings ? (
                            <button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-opacity disabled:opacity-50"
                                style={{ background: "#8B5E3C", color: "white" }}
                            >
                                {saving ? "Saving..." : "Save Settings"}
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    disabled={saving}
                                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-colors hover:bg-white/10 disabled:opacity-50"
                                    style={{ borderColor: "#8B5E3C", color: "#C49A6C" }}
                                >
                                    Settings
                                </button>
                                <button
                                    onClick={handleDecline}
                                    disabled={saving}
                                    className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider border transition-colors hover:bg-white/10 disabled:opacity-50"
                                    style={{ borderColor: "#8B5E3C", color: "#C49A6C" }}
                                >
                                    {saving ? "..." : "Decline"}
                                </button>
                                <button
                                    onClick={handleAccept}
                                    disabled={saving}
                                    className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-opacity disabled:opacity-50"
                                    style={{ background: "#8B5E3C", color: "white" }}
                                >
                                    {saving ? "..." : "Accept All"}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
