"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Compass, HardHat, ShieldCheck, Ruler, Camera } from "lucide-react";

interface StageInfo {
  index: number;
  title: string;
  subtitle: string;
  elevation: string;
  load: string;
  status: string;
  imageSrc: string;
}

const STAGES: StageInfo[] = [
  {
    index: 1,
    title: "STAGE 01 // CRANE ERECTION & FOUNDATION",
    subtitle: "Heavy Tower Crane Assembly & Substructure Raft Dowels",
    elevation: "+12.40 M",
    load: "1,200 kN",
    status: "CRANE HOISTING",
    imageSrc: "/images/hero-site.jpg",
  },
  {
    index: 2,
    title: "STAGE 02 // TMT REBAR STOCKYARD ALLOCATION",
    subtitle: "Primary Mill Fe-550D Deformed Bars & Mill Test Tags",
    elevation: "+24.80 M",
    load: "2,650 kN",
    status: "DISPATCHED FROM MILL",
    imageSrc: "/images/rebar-yard.jpg",
  },
  {
    index: 3,
    title: "STAGE 03 // TRANSIT MIXER & CORE SLAB CASTING",
    subtitle: "Direct Chute Pouring of High-Early Strength OPC-53",
    elevation: "+42.60 M",
    load: "3,980 kN",
    status: "ACTIVE SLAB CASTING",
    imageSrc: "/images/concrete-pour.jpg",
  },
  {
    index: 4,
    title: "STAGE 04 // SUPERSTRUCTURE OCCUPANCY READY",
    subtitle: "Completed Luxury Landmark Commercial Megastructure",
    elevation: "+78.20 M",
    load: "5,400 kN",
    status: "NABL VERIFIED OCCUPANCY",
    imageSrc: "/images/finished-tower.jpg",
  },
];

export default function CinematicScrollStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      // SCROLL-DRIVEN 3D CAMERA AND IMAGE CROSSFADE
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: (self) => {
          const p = self.progress;
          setScrollProgress(p);

          // Calculate which stage (0, 1, 2, 3)
          const stageIdx = Math.min(Math.floor(p * 4), 3);
          setActiveStage(stageIdx);

          // Animate opacities and 3D scales for each stage image
          imageRefs.current.forEach((el, idx) => {
            if (!el) return;
            const startP = idx * 0.25;
            const endP = (idx + 1) * 0.25;

            // Calculate weight / opacity
            let opacity = 0;
            if (p >= startP && p <= endP) {
              opacity = 1;
            } else if (p < startP && idx > 0 && p >= startP - 0.1) {
              opacity = (p - (startP - 0.1)) / 0.1;
            } else if (p > endP && idx < 3 && p <= endP + 0.1) {
              opacity = 1 - (p - endP) / 0.1;
            }

            // 3D scale zoom as you scroll through that section
            const localProgress = Math.max(0, Math.min(1, (p - startP) / 0.25));
            const scale = 1.05 + localProgress * 0.12;
            const translateY = (localProgress - 0.5) * -30;

            gsap.set(el, {
              opacity: Math.max(0, Math.min(1, opacity)),
              scale: scale,
              y: translateY,
              force3D: true,
            });
          });
        },
      });
    }, containerRef);

    // MOUSE PARALLAX TILT
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      if (containerRef.current) {
        gsap.to(containerRef.current, {
          rotateY: mouseX * 2.5,
          rotateX: -mouseY * 2.0,
          duration: 1.2,
          ease: "power2.out",
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, []);

  const current = STAGES[activeStage];

  const handleJumpToStage = (idx: number) => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (idx * 0.25 + 0.05) * totalHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <>
      {/* 1. FIXED 3D PERSPECTIVE BACKGROUND STAGE */}
      <div
        ref={containerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          perspective: "1400px",
          transformStyle: "preserve-3d",
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* FOUR CINEMATIC GENERATED IMAGES (3D Parallax Layers) */}
        {STAGES.map((stage, idx) => (
          <div
            key={stage.index}
            ref={(el) => {
              imageRefs.current[idx] = el;
            }}
            style={{
              position: "absolute",
              inset: "-5%", // slight bleed to allow 3D parallax without edge clipping
              width: "110%",
              height: "110%",
              opacity: idx === 0 ? 1 : 0,
              willChange: "transform, opacity",
              transformStyle: "preserve-3d",
            }}
          >
            <Image
              src={stage.imageSrc}
              alt={stage.title}
              fill
              priority={idx === 0}
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 35%",
              }}
            />

            {/* REALISTIC ARCHITECTURAL DUSK GRADIENT OVERLAYS */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(8, 12, 20, 0.75) 0%, rgba(8, 12, 20, 0.55) 40%, rgba(8, 12, 20, 0.88) 85%, #080c14 100%)",
              }}
            />

            {/* Subtle Vignette */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(ellipse at center, transparent 35%, rgba(8, 12, 20, 0.7) 100%)",
              }}
            />
          </div>
        ))}

        {/* 3D Blueprint Depth Lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            opacity: 0.7,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* 2. REALISTIC TELEMETRY HUD (TOP RIGHT) */}
      <aside
        aria-label="Real-time site construction telemetry"
        style={{
          position: "fixed",
          right: "24px",
          top: "95px",
          zIndex: 40,
          maxWidth: "320px",
          pointerEvents: "auto",
        }}
        className="hidden lg:block"
      >
        <div
          className="arch-card"
          style={{
            padding: "16px 20px",
            background: "rgba(13, 18, 31, 0.92)",
            border: "1px solid var(--border-card)",
            boxShadow: "0 15px 35px rgba(0, 0, 0, 0.7)",
          }}
        >
          {/* HEADER */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-indicator" />
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
                SITE TELEMETRY // ACTIVE
              </span>
            </div>
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "#ffffff",
                fontWeight: 800,
              }}
            >
              {Math.round(scrollProgress * 100)}% ERECTED
            </span>
          </div>

          {/* CURRENT STAGE */}
          <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px", marginBottom: "12px" }}>
            <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontWeight: 700 }}>
              {current.title.split("//")[0].trim()}
            </div>
            <h2 style={{ fontSize: "13px", fontWeight: 800, color: "#f8fafc", margin: "3px 0", letterSpacing: "0.2px" }}>
              {current.title.split("//")[1]?.trim() || current.title}
            </h2>
            <p style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {current.subtitle}
            </p>
          </div>

          {/* METRICS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "10px" }}>
                <Compass size={11} color="var(--accent-amber)" />
                <span>ELEVATION</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f8fafc", marginTop: "2px" }}>
                {current.elevation}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "var(--text-muted)", fontSize: "10px" }}>
                <Ruler size={11} color="var(--accent-amber)" />
                <span>DESIGN LOAD</span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#f8fafc", marginTop: "2px" }}>
                {current.load}
              </div>
            </div>
          </div>

          {/* CERTIFICATION SEAL */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              padding: "8px 12px",
              borderRadius: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <ShieldCheck size={14} color="var(--accent-amber)" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#f8fafc" }}>
                {current.status}
              </span>
            </div>
            <HardHat size={13} color="var(--accent-amber)" />
          </div>

          {/* PROGRESS LINE */}
          <div style={{ marginTop: "12px" }}>
            <div style={{ width: "100%", height: "3px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "2px", overflow: "hidden" }}>
              <div
                style={{
                  width: `${scrollProgress * 100}%`,
                  height: "100%",
                  background: "var(--accent-amber)",
                  transition: "width 0.15s ease-out",
                }}
              />
            </div>
          </div>
        </div>
      </aside>

      {/* 3. TACTILE STAGE SELECTOR (BOTTOM LEFT) */}
      <aside
        aria-label="Interactive 3D Stage Selector"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "24px",
          zIndex: 45,
          pointerEvents: "auto",
        }}
        className="hidden md:flex flex-col gap-2"
      >
        <div
          className="arch-card"
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(13, 18, 31, 0.92)",
            border: "1px solid var(--border-card)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              CONSTRUCTION PHASE:
            </span>
            {[
              { idx: 0, label: "1. Crane & Tower" },
              { idx: 1, label: "2. TMT Rebar Yard" },
              { idx: 2, label: "3. Concrete Pour" },
              { idx: 3, label: "4. Finished Tower" },
            ].map((s) => (
              <button
                key={s.idx}
                onClick={() => handleJumpToStage(s.idx)}
                style={{
                  background: activeStage === s.idx ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.05)",
                  color: activeStage === s.idx ? "#080c14" : "var(--text-secondary)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: activeStage === s.idx ? 800 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
