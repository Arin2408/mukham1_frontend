"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Clock, Globe, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#02040a] text-white selection:bg-primary/30 overflow-x-hidden relative flex flex-col">
      {/* Aurora Atmosphere */}
      <div className="fixed inset-0 aurora-flow opacity-30 pointer-events-none" />
      <div className="fixed inset-0 cyber-grid opacity-10 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 text-center">
        <div className="max-w-[1200px] mx-auto space-y-12">
          <h1 className="text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none text-reveal">
            MUKHAM
          </h1>

          <p className="max-w-xl mx-auto text-lg md:text-xl text-muted-foreground/80 leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
            The next generation of organizational intelligence. Secure, real-time monitoring 
            and workforce management for high-performance teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-8 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 border-none transition-all active:scale-95 group shimmer-btn">
                Org Login <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/member-login">
              <Button size="lg" className="h-14 px-10 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold uppercase tracking-widest text-[10px] backdrop-blur-sm transition-all active:scale-95">
                Member Access
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="h-14 px-10 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-widest text-[10px] backdrop-blur-sm transition-all active:scale-95">
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
                color: "text-indigo-400",
              },
              {
                title: "Shift Orchestration",
                desc: "Schedule and manage shifts efficiently with our intuitive interface. Keep your team organized, informed, and synchronized.",
                icon: Building2,
                color: "text-emerald-400",
              },
            ].map((feature, i) => (
              <Card key={i} className="glass-card p-10 group hover:border-primary/50 transition-all duration-500">
                <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight uppercase">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {feature.desc}
                </p>
                <div className="mt-8 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-white/5 relative">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.4em]">
            © {new Date().getFullYear()} MUKHAM. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}