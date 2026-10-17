"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Clock, Globe, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// Tells search engines what Mukham is (schema.org), for richer results.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: `${SITE_URL}/icon-512.png` },
    {
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web, Android",
    },
  ],
};

// Fades its children in once they scroll into view
function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${isVisible ? "reveal-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden relative flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
      />
      {/* Aurora Atmosphere */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="auth-blob absolute -top-32 left-[10%] w-[30rem] h-[30rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="auth-blob absolute top-1/3 right-[5%] w-[32rem] h-[32rem] rounded-full bg-purple-500/10 blur-3xl" style={{ animationDelay: "-9s" }} />
      </div>
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 text-center">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 animate-in fade-in duration-700 fill-mode-both">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            Face + location attendance
          </div>

          <h1 className="!mt-6 text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] font-bold tracking-tight leading-none text-shine">
            MUKHAM
          </h1>

          <p className="max-w-xl mx-auto text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
            The next generation of organizational intelligence. Secure, real-time monitoring
            and workforce management for high-performance teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
            <Link href="/login">
              <Button size="lg" className="h-11 px-6 bg-primary hover:bg-primary/90 text-white font-medium text-sm shadow-2xl shadow-primary/20 border-none transition-all active:scale-95 group shimmer-btn">
                Org Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/member-login">
              <Button size="lg" className="h-11 px-6 bg-foreground/5 hover:bg-foreground/10 text-foreground border border-foreground/10 font-medium text-sm backdrop-blur-sm transition-all active:scale-95">
                Member Access
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="h-11 px-6 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium text-sm backdrop-blur-sm transition-all active:scale-95">
                Establish Org
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section (Reverted to Old Style) */}
      <section className="relative py-24 px-6 flex-grow">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Neural Role Management",
                desc: "Sophisticated permission layers with real-time biometric verification support. Assign roles and track responsibilities with enterprise-grade precision.",
                icon: ShieldCheck,
                color: "text-primary",
              },
              {
                title: "Pulse Tracking",
                desc: "Live attendance monitoring with sub-second synchronization across all nodes. Monitor your workforce in real-time.",
                icon: Clock,
                color: "text-indigo-600 dark:text-indigo-400",
              },
              {
                title: "Shift Orchestration",
                desc: "Schedule and manage shifts efficiently with our intuitive interface. Keep your team organized, informed, and synchronized.",
                icon: Building2,
                color: "text-emerald-600 dark:text-emerald-400",
              },
            ].map((feature, i) => (
              <Reveal key={i} delay={i * 120}>
              <Card className="quantanex-card h-full p-8 group [animation:none] hover:border-primary/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
                <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
              </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-foreground/5 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <nav className="mb-4 flex justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
            <Link href="/login" className="hover:text-foreground transition-colors">Sign in</Link>
          </nav>
          <p className="text-xs font-bold text-muted-foreground/40">
            © {new Date().getFullYear()} MUKHAM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
