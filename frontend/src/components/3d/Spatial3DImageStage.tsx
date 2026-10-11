"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Compass,
  HardHat,
  ShieldCheck,
  Ruler,
  Move3d,
  Layers,
  Sparkles,
  Maximize2,
  Eye,
  Grid,
} from "lucide-react";

interface StageData {
  index: number;
  title: string;
  subtitle: string;
  elevation: string;
  load: string;
  status: string;
  imageSrc: string;
  accentCode: string;
  detailSpec: string;
}

const STAGES: StageData[] = [
  {
    index: 1,
    title: "STAGE 01 // TOWER CRANE HOIST & STRUCTURAL RIGGING",
    subtitle: "Heavy Tower Crane 60m Boom Hoisting Primary Structural Columns",
    elevation: "+18.40 M",
    load: "1,450 kN",
    status: "CRANE HOISTING ACTIVE",
    imageSrc: "/images/hero-site.jpg",
    accentCode: "IS:456 COL-01",
    detailSpec: "TOWER CRANE CAPACITY: 12.5T // JIB RADIUS: 60M // RIGGING: 4-LEG WIRE ROPE",
  },
  {
    index: 2,
    title: "STAGE 02 // TMT REBAR PRIMARY MILL STOCKYARD",
    subtitle: "Ribbed Fe-550D High Ductility Deformed Bars with Mill Test Tags",
    elevation: "+32.60 M",
    load: "2,890 kN",
    status: "PRIMARY MILL BATCH VERIFIED",
    imageSrc: "/images/rebar-yard.jpg",
    accentCode: "IS:1786 Fe-550D",
    detailSpec: "YIELD STRENGTH: 585 MPa // ELONGATION: 16.2% // PRIMARY MILL DIRECT",
  },
  {
    index: 3,
    title: "STAGE 03 // TRANSIT MIXER & CORE FOUNDATION POUR",
    subtitle: "High Early Strength OPC-53 Ready-Mix Slump Continuous Placement",
    elevation: "+54.20 M",
    load: "4,120 kN",
    status: "CORE SLAB CASTING 14 RPM",
    imageSrc: "/images/concrete-pour.jpg",
    accentCode: "IS:12269 OPC-53",
    detailSpec: "SLUMP CONE: 145mm // COMPRESSIVE 28-DAY: 58.5 N/mm² // CHILLED WATER AGGREGATE",
  },
  {
    index: 4,
    title: "STAGE 04 // COMPLETED COMMERCIAL LANDMARK TOWER",
    subtitle: "Luxury High-Rise Megastructure Tower at Blue Hour Twilight",
    elevation: "+88.00 M",
    load: "5,800 kN",
    status: "NABL VERIFIED OCCUPANCY",
    imageSrc: "/images/finished-tower.jpg",
    accentCode: "LEED PLATINUM",
    detailSpec: "88M ARCHITECTURAL CREST // DOUBLE-GLAZED CURTAIN WALL // ZERO DEFECT SLAB",
  },
];

export default function Spatial3DImageStage() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeStage, setActiveStage] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isUltra3D, setIsUltra3D] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // References to pass state into WebGL loop without re-triggering useEffect
  const settingsRef = useRef({
    ultra3D: true,
    showGrid: true,
    dragRotationX: 0,
    dragRotationY: 0,
    isMouseDown: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  useEffect(() => {
    settingsRef.current.ultra3D = isUltra3D;
  }, [isUltra3D]);

  useEffect(() => {
    settingsRef.current.showGrid = showGrid;
  }, [showGrid]);

  useEffect(() => {
    if (typeof window === "undefined" || !mountRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080c14);
    scene.fog = new THREE.FogExp2(0x080c14, 0.012);

    // 2. PERSPECTIVE CAMERA
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32);

    // 3. RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. TEXTURE LOADING WITH SPATIAL CURVATURE
    const textureLoader = new THREE.TextureLoader();
    const textures = STAGES.map((s) => textureLoader.load(s.imageSrc));

    // Curved IMAX-style Cylindrical Screen Mesh (Provides authentic 3D spatial perspective distortion!)
    const planeWidth = 38;
    const planeHeight = 21.4;
    const planeGeo = new THREE.PlaneGeometry(planeWidth, planeHeight, 40, 40);
    const posAttr = planeGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      // Gentle parabolic curvature in Z so left & right wrap naturally towards the viewer
      const zCurvature = -((x * x) * 0.007);
      posAttr.setZ(i, zCurvature);
    }
    planeGeo.computeVertexNormals();

    // Create 4 interactive 3D Spatial Image Planes arranged with depth
    const imagePlanes: THREE.Mesh[] = [];
    const wireframeOverlays: THREE.LineSegments[] = [];

    textures.forEach((tex, i) => {
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;

      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: i === 0 ? 1 : 0,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(0, 0, -i * 6);
      scene.add(mesh);
      imagePlanes.push(mesh);

      // Architectural CAD Wireframe Overlay
      const wireMat = new THREE.LineBasicMaterial({
        color: 0xf59e0b,
        transparent: true,
        opacity: 0.08,
      });
      const wireGeo = new THREE.WireframeGeometry(planeGeo);
      const wireframe = new THREE.LineSegments(wireGeo, wireMat);
      mesh.add(wireframe);
      wireframeOverlays.push(wireframe);
    });

    // 5. ARCHITECTURAL CAD 3D GRID FLOOR
    const gridFloor = new THREE.GridHelper(140, 44, 0xf59e0b, 0x1e293b);
    gridFloor.position.y = -11.2;
    gridFloor.position.z = -10;
    scene.add(gridFloor);

    // 6. FOREGROUND REAL 3D SWINGING STEEL I-BEAM (TRUE PHYSICAL 3D LAYER)
    const foregroundCraneGroup = new THREE.Group();
    foregroundCraneGroup.position.set(7.5, 2.5, 15);

    // Heavy Steel I-beam with Caterpillar Safety Amber finish
    const beamGeo = new THREE.BoxGeometry(9.5, 0.6, 0.6);
    const beamMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Safety Amber
      roughness: 0.35,
      metalness: 0.85,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    foregroundCraneGroup.add(beamMesh);

    // Crane Hoist Steel Cables
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const cableGeo1 = new THREE.CylinderGeometry(0.025, 0.025, 18);
    cableGeo1.translate(-3.2, 9, 0);
    const cable1 = new THREE.Mesh(cableGeo1, cableMat);
    foregroundCraneGroup.add(cable1);

    const cableGeo2 = new THREE.CylinderGeometry(0.025, 0.025, 18);
    cableGeo2.translate(3.2, 9, 0);
    const cable2 = new THREE.Mesh(cableGeo2, cableMat);
    foregroundCraneGroup.add(cable2);

    // Industrial Hoist Hook at center
    const hookGeo = new THREE.TorusGeometry(0.5, 0.08, 12, 24, Math.PI * 1.3);
    const hookMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const hookMesh = new THREE.Mesh(hookGeo, hookMat);
    hookMesh.position.set(0, 1.2, 0);
    hookMesh.rotation.z = Math.PI / 2;
    foregroundCraneGroup.add(hookMesh);

    scene.add(foregroundCraneGroup);

    // 7. FLOATING 3D HOLOGRAPHIC LASER RETICLE (IN FRONT OF IMAGE)
    const holoGroup = new THREE.Group();
    holoGroup.position.set(0, 0, 4);

    // Rotating 3D Datum Ring
    const ringGeo = new THREE.RingGeometry(2.2, 2.26, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    holoGroup.add(ringMesh);

    // Crosshairs
    const lineMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 });
    const crossGeoX = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3.2, 0, 0),
      new THREE.Vector3(3.2, 0, 0),
    ]);
    holoGroup.add(new THREE.Line(crossGeoX, lineMat));

    const crossGeoY = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -3.2, 0),
      new THREE.Vector3(0, 3.2, 0),
    ]);
    holoGroup.add(new THREE.Line(crossGeoY, lineMat));
    scene.add(holoGroup);

    // 8. 3D FLOATING DUST MOTES & VOLUMETRIC SPARK FIELD
    const particleCount = 280;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 60;
      particlePos[i + 1] = (Math.random() - 0.5) * 36;
      particlePos[i + 2] = Math.random() * 28 + 2; // In front of image planes
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xfbbf24,
      size: 0.24,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(dustPoints);

    // 9. DYNAMIC LIGHTING (Ambient + Cursor Spotlight that illuminates the scene)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffedd5, 2.8);
    dirLight.position.set(20, 25, 25);
    scene.add(dirLight);

    const cursorSpotLight = new THREE.SpotLight(0xffd8a8, 3.2, 60, Math.PI / 4, 0.4, 1.1);
    cursorSpotLight.position.set(0, 6, 26);
    scene.add(cursorSpotLight);
    scene.add(cursorSpotLight.target);

    // 10. GSAP SCROLL-DRIVEN 3D CAMERA FLIGHT
    const scrollObj = { p: 0 };
    const lookTarget = new THREE.Vector3(0, 0, 0);

    const update3DStage = (progress: number) => {
      setScrollProgress(progress);
      const stageIdx = Math.min(Math.floor(progress * 4), 3);
      setActiveStage(stageIdx);

      // Camera 3D Flight & Crossfade between the 4 Construction Megastructure Images
      imagePlanes.forEach((mesh, idx) => {
        const mat = mesh.material as THREE.MeshBasicMaterial;
        const startP = idx * 0.25;
        const endP = (idx + 1) * 0.25;

        let opacity = 0;
        if (progress >= startP && progress <= endP) {
          opacity = 1;
        } else if (progress < startP && idx > 0 && progress >= startP - 0.08) {
          opacity = (progress - (startP - 0.08)) / 0.08;
        } else if (progress > endP && idx < 3 && progress <= endP + 0.08) {
          opacity = 1 - (progress - endP) / 0.08;
        }
        mat.opacity = Math.max(0, Math.min(1, opacity));

        // 3D scale and Z movement during this stage
        const localP = Math.max(0, Math.min(1, (progress - startP) / 0.25));
        mesh.scale.setScalar(1.0 + localP * 0.08);
        mesh.position.z = -idx * 2 + localP * 2.2;
      });

      // Fly camera dynamically on scroll
      camera.position.z = 32 - progress * 9;
      camera.position.y = (progress - 0.5) * -7;
      lookTarget.y = (progress - 0.5) * -4.5;

      // Animate foreground crane load position with scroll
      foregroundCraneGroup.position.y = 2.5 + progress * 9;
      foregroundCraneGroup.position.x = 7.5 - progress * 16;

      // Move 3D Holographic Reticle
      holoGroup.position.x = (stageIdx % 2 === 0 ? 5 : -5) + Math.sin(progress * 8) * 1.5;
      holoGroup.position.y = (progress - 0.5) * -5;
    };

    const scrollAnim = gsap.to(scrollObj, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: () => update3DStage(scrollObj.p),
      },
    });

    // 11. MOUSE-REACTIVE 3D PARALLAX & DRAG ROTATION
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;

      // Spotlight tracking
      cursorSpotLight.target.position.x = mouseX * 18;
      cursorSpotLight.target.position.y = -mouseY * 12;

      // If dragging with mouse
      if (settingsRef.current.isMouseDown) {
        const deltaX = e.clientX - settingsRef.current.lastMouseX;
        const deltaY = e.clientY - settingsRef.current.lastMouseY;
        settingsRef.current.dragRotationY += deltaX * 0.005;
        settingsRef.current.dragRotationX += deltaY * 0.005;
        settingsRef.current.lastMouseX = e.clientX;
        settingsRef.current.lastMouseY = e.clientY;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Allow drag on canvas or when holding alt/ctrl or drag mode
      settingsRef.current.isMouseDown = true;
      settingsRef.current.lastMouseX = e.clientX;
      settingsRef.current.lastMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      settingsRef.current.isMouseDown = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    // RESIZE
    const handleResize = () => {
      if (!mountRef.current) return;
      width = mountRef.current.clientWidth;
      height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // 12. RENDER LOOP (CONTINUOUS 3D MOTION & DEPTH)
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();
      const settings = settingsRef.current;
      const intensity = settings.ultra3D ? 1.8 : 0.9;

      // Continuous subtle pendulum sway of foreground steel beam
      foregroundCraneGroup.rotation.z = Math.sin(time * 0.85) * 0.09;
      foregroundCraneGroup.rotation.y = Math.cos(time * 0.55) * 0.07;

      // Rotate Holographic Datum Ring
      ringMesh.rotation.z = time * 0.4;

      // Gentle floating drift of dust particles
      dustPoints.rotation.y = time * 0.02;
      dustPoints.position.y = Math.sin(time * 0.35) * 0.45;

      // Grid Floor Visibility
      gridFloor.visible = settings.showGrid;
      wireframeOverlays.forEach((wf) => {
        const mat = wf.material as THREE.LineBasicMaterial;
        mat.opacity = settings.showGrid ? 0.08 : 0;
      });

      // Smooth decay of manual drag rotation
      if (!settings.isMouseDown) {
        settings.dragRotationX *= 0.94;
        settings.dragRotationY *= 0.94;
      }

      // Camera Parallax & Bank Angle
      const targetCamX = mouseX * 5.5 * intensity + settings.dragRotationY * 15;
      const targetCamY =
        -mouseY * 3.5 * intensity +
        (scrollObj.p - 0.5) * -7 +
        -settings.dragRotationX * 10;
      camera.position.x += (targetCamX - camera.position.x) * 0.045;
      camera.position.y += (targetCamY - camera.position.y) * 0.045;

      // Camera Z-roll banking (makes flight feel like a real drone/camera jib!)
      camera.rotation.z += (mouseX * -0.035 * intensity - camera.rotation.z) * 0.04;
      camera.lookAt(lookTarget);

      // 3D perspective pitch and yaw on active curved image plane
      const activeMesh = imagePlanes[Math.min(Math.floor(scrollObj.p * 4), 3)];
      if (activeMesh) {
        const targetRotY = mouseX * 0.16 * intensity + settings.dragRotationY * 0.5;
        const targetRotX = -mouseY * 0.1 * intensity + settings.dragRotationX * 0.5;
        activeMesh.rotation.y += (targetRotY - activeMesh.rotation.y) * 0.06;
        activeMesh.rotation.x += (targetRotX - activeMesh.rotation.x) * 0.06;
      }

      // Parallax offset for foreground crane beam (moves faster for intense depth)
      foregroundCraneGroup.position.x +=
        (7.5 - scrollObj.p * 16 - mouseX * 3.5 * intensity - foregroundCraneGroup.position.x) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      scrollAnim.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const current = STAGES[activeStage];

  const handleJumpToStage = (idx: number) => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const targetY = (idx * 0.25 + 0.02) * totalHeight;
    window.scrollTo({ top: targetY, behavior: "smooth" });
  };

  return (
    <>
      {/* 1. FULLSCREEN 3D WEBGL MOVING IMAGES VIEWPORT */}
      <div
        ref={mountRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />

      {/* 2. REALISTIC TELEMETRY HUD (TOP RIGHT) */}
      <aside
        aria-label="Real-time site construction telemetry"
        style={{
          position: "fixed",
          right: "24px",
          top: "95px",
          zIndex: 40,
          maxWidth: "340px",
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="live-indicator" />
              <span
                style={{
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-amber)",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                }}
              >
                SPATIAL 3D TELEMETRY // ACTIVE
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
              {Math.round(scrollProgress * 100)}% ASSEMBLED
            </span>
          </div>

          <div
            style={{
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
              paddingBottom: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                fontFamily: "var(--font-mono)",
                color: "var(--accent-amber)",
                fontWeight: 700,
              }}
            >
              {current.accentCode}
            </div>
            <h2
              style={{
                fontSize: "13px",
                fontWeight: 800,
                color: "#f8fafc",
                margin: "4px 0",
                letterSpacing: "0.2px",
                lineHeight: 1.3,
              }}
            >
              {current.title.split("//")[1]?.trim() || current.title}
            </h2>
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                lineHeight: 1.4,
              }}
            >
              {current.subtitle}
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  fontSize: "10px",
                }}
              >
                <Compass size={11} color="var(--accent-amber)" />
                <span>ELEVATION</span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "#f8fafc",
                  marginTop: "2px",
                }}
              >
                {current.elevation}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid rgba(255, 255, 255, 0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  color: "var(--text-muted)",
                  fontSize: "10px",
                }}
              >
                <Ruler size={11} color="var(--accent-amber)" />
                <span>LIVE LOAD</span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "#f8fafc",
                  marginTop: "2px",
                }}
              >
                {current.load}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(245, 158, 11, 0.08)",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              padding: "8px 12px",
              borderRadius: "6px",
              marginBottom: "10px",
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

          {/* Micro Specification Bar */}
          <div
            style={{
              fontSize: "9.5px",
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
              background: "rgba(0, 0, 0, 0.3)",
              padding: "6px 8px",
              borderRadius: "4px",
              lineHeight: 1.3,
            }}
          >
            {current.detailSpec}
          </div>

          <div style={{ marginTop: "12px" }}>
            <div
              style={{
                width: "100%",
                height: "3px",
                background: "rgba(255, 255, 255, 0.1)",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
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

      {/* 3. TACTILE SPATIAL 3D CONTROLLER & STAGE SELECTOR (BOTTOM BAR) */}
      <aside
        aria-label="3D Spatial Stage Selector"
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
            gap: "12px",
            background: "rgba(13, 18, 31, 0.94)",
            border: "1px solid var(--border-card)",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)",
          }}
        >
          {/* Spatial Mode Indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Move3d size={15} color="var(--accent-amber)" />
            <span
              style={{
                fontSize: "11px",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                fontWeight: 700,
              }}
            >
              3D CAMERA STAGE:
            </span>
          </div>

          {/* Quick Jump Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {[
              { idx: 0, label: "01. Crane Hoist" },
              { idx: 1, label: "02. Rebar Yard" },
              { idx: 2, label: "03. Concrete Pour" },
              { idx: 3, label: "04. Finished Tower" },
            ].map((s) => (
              <button
                key={s.idx}
                onClick={() => handleJumpToStage(s.idx)}
                style={{
                  background:
                    activeStage === s.idx
                      ? "var(--accent-amber)"
                      : "rgba(255, 255, 255, 0.05)",
                  color: activeStage === s.idx ? "#080c14" : "var(--text-secondary)",
                  border:
                    activeStage === s.idx
                      ? "1px solid var(--accent-amber)"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "5px 9px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: activeStage === s.idx ? 800 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div
            style={{
              width: "1px",
              height: "20px",
              background: "rgba(255, 255, 255, 0.1)",
              margin: "0 2px",
            }}
          />

          {/* Ultra 3D Parallax Boost Toggle */}
          <button
            onClick={() => setIsUltra3D(!isUltra3D)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: isUltra3D ? "rgba(245, 158, 11, 0.18)" : "rgba(255, 255, 255, 0.04)",
              color: isUltra3D ? "var(--accent-amber)" : "var(--text-muted)",
              border: isUltra3D
                ? "1px solid rgba(245, 158, 11, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              padding: "5px 9px",
              borderRadius: "4px",
              fontSize: "10.5px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle high-intensity 3D mouse parallax tilt"
          >
            <Sparkles size={12} />
            <span>{isUltra3D ? "3D DEPTH: ULTRA" : "3D DEPTH: STD"}</span>
          </button>

          {/* CAD Wireframe Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              background: showGrid ? "rgba(245, 158, 11, 0.18)" : "rgba(255, 255, 255, 0.04)",
              color: showGrid ? "var(--accent-amber)" : "var(--text-muted)",
              border: showGrid
                ? "1px solid rgba(245, 158, 11, 0.4)"
                : "1px solid rgba(255, 255, 255, 0.08)",
              padding: "5px 9px",
              borderRadius: "4px",
              fontSize: "10.5px",
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            title="Toggle BIM CAD architectural grid floor"
          >
            <Grid size={12} />
            <span>{showGrid ? "CAD GRID: ON" : "CAD GRID: OFF"}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
