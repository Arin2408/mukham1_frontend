"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ScanFace,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Moon,
  Sun,
} from "lucide-react";

const FEATURES = [
  { icon: ScanFace, text: "Face liveness verification on every check-in" },
  { icon: MapPin, text: "Geofenced attendance for each office location" },
  { icon: Clock, text: "Shifts, late marks and working hours in one place" },
];

// Shared split-screen layout for login / register / member / password pages.
// Purely presentational: the page passes its own form as children.
export function AuthShell({ children }) {
  const [isMounted, setIsMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setIsMounted(true), []);

  const isDark = !isMounted || resolvedTheme !== "light";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden lg:grid lg:grid-cols-2">
      {/* Theme toggle */}
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="absolute top-5 right-5 z-30 h-9 w-9 flex items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      {/* ---------------- Brand panel (desktop) ---------------- */}
      <aside className="hidden lg:flex relative flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        {/* Moving light blobs */}
        <div className="auth-blob absolute -top-24 -left-24 w-96 h-96 rounded-full bg-cyan-400/30 blur-3xl" />
        <div className="auth-blob absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/30 blur-3xl [animation-delay:-6s]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 75%)",
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3 auth-fade-up">
          <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur border border-white/25 flex items-center justify-center">
            <ScanFace className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Mukham</span>
        </Link>

        {/* Face scan illustration */}
        <div className="relative z-10 flex items-center justify-center py-10">
          <div className="relative w-56 h-56">
            <span className="auth-ring absolute inset-0 rounded-[2.5rem] border-2 border-white/40" />
            <span className="auth-ring absolute inset-0 rounded-[2.5rem] border-2 border-white/30 [animation-delay:1.5s]" />

            <div className="absolute inset-0 rounded-[2.5rem] bg-white/10 backdrop-blur-md border border-white/25 shadow-2xl overflow-hidden flex items-center justify-center">
              <ScanFace className="h-28 w-28 text-white/90" strokeWidth={1.25} />
              <span className="auth-scan-line absolute left-6 right-6 h-0.5 rounded-full bg-cyan-300 shadow-[0_0_16px_4px_rgba(103,232,249,0.7)]" />
            </div>

            {/* Corner brackets */}
            <span className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-2xl" />
            <span className="absolute -top-2 -right-2 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-2xl" />
            <span className="absolute -bottom-2 -left-2 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-2xl" />
            <span className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-2xl" />

            {/* Floating status chips (illustrative) */}
            <div className="auth-float absolute -right-36 top-6 flex items-center gap-2 rounded-xl bg-white/95 text-gray-900 px-3 py-2 shadow-xl">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs font-semibold">Face verified</span>
            </div>
            <div className="auth-float absolute -left-36 bottom-10 flex items-center gap-2 rounded-xl bg-white/95 text-gray-900 px-3 py-2 shadow-xl [animation-delay:-2s]">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-semibold">Inside office zone</span>
            </div>
            <div className="auth-float absolute -right-28 -bottom-8 flex items-center gap-2 rounded-xl bg-white/95 text-gray-900 px-3 py-2 shadow-xl [animation-delay:-4s]">
              <ShieldCheck className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-semibold">Checked in</span>
            </div>
          </div>
        </div>

        {/* Headline + features */}
        <div className="relative z-10 space-y-6">
          <div className="auth-fade-up [animation-delay:150ms]">
            <h2 className="text-4xl font-bold leading-tight">
              Attendance you can trust.
            </h2>
            <p className="mt-2 text-white/75 text-lg">
              Real faces, real locations, real time.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((feature, i) => (
              <li
                key={feature.text}
                className="auth-fade-up flex items-center gap-3 text-white/90"
                style={{ animationDelay: `${300 + i * 120}ms` }}
              >
                <span className="w-8 h-8 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
                  <feature.icon className="h-4 w-4" />
                </span>
                <span className="text-sm">{feature.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* ---------------- Form side ---------------- */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
        <div className="auth-blob absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="auth-blob absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none [animation-delay:-9s]" />

        {/* Mobile logo */}
        <Link href="/" className="lg:hidden relative z-10 mb-8 flex items-center gap-3 auth-fade-up">
          <div className="w-10 h-10 brand-tile rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <ScanFace className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-blue-500">Mukham</span>
        </Link>

        <div className="relative z-10 w-full flex justify-center auth-fade-up [animation-delay:100ms]">
          {children}
        </div>

        <p className="relative z-10 mt-10 text-xs text-muted-foreground/60">
          Mukham Security Systems &copy; {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
