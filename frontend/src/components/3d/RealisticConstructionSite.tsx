"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sun, Moon, Eye, Camera } from "lucide-react";

type LightingMode = "daylight" | "sunset" | "nightshift";
type CameraPreset = "overview" | "crane" | "rebar" | "mixer" | "highrise";

// PROCEDURAL TEXTURE GENERATORS (Gives real physical texture, zero toy look)
function createConcreteTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#525e75";
  ctx.fillRect(0, 0, 512, 512);

  // Concrete noise & air voids
  for (let i = 0; i < 40000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.15;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Formwork tie holes & seam lines
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 128); ctx.lineTo(512, 128);
  ctx.moveTo(0, 256); ctx.lineTo(512, 256);
  ctx.moveTo(0, 384); ctx.lineTo(512, 384);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

function createRebarRibTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#334155";
  ctx.fillRect(0, 0, 256, 256);

  // Helical rib patterns
  ctx.strokeStyle = "#475569";
  ctx.lineWidth = 14;
  for (let y = -50; y < 350; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y + 100);
    ctx.stroke();
  }

  // Longitudinal rib
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(120, 0, 16, 256);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 8);
  return tex;
}

function createGroundTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#151c2d";
  ctx.fillRect(0, 0, 512, 512);

  // Gravel & dirt speckles
  for (let i = 0; i < 50000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 3 + 1;
    ctx.fillStyle = Math.random() > 0.4 ? "rgba(30,41,59,0.5)" : "rgba(100,116,139,0.3)";
    ctx.fillRect(x, y, size, size);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(12, 12);
  return tex;
}

function createHazardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f59e0b";
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "#111827";
  for (let i = -256; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 0);
    ctx.lineTo(i + 32 + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
}

export default function RealisticConstructionSite() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>("daylight");
  const [camPreset, setCamPreset] = useState<CameraPreset>("overview");

  const setLightingRef = useRef<((mode: LightingMode) => void) | null>(null);
  const setCamPresetRef = useRef<((p: CameraPreset) => void) | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mountRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const container = mountRef.current;
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. SCENE WITH REALISTIC ARCHITECTURAL SKY
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.009);

    // 2. 50MM ARCHITECTURAL PERSPECTIVE CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 400);
    camera.position.set(42, 26, 46);

    // 3. PHYSICALLY ACCURATE RENDERER
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    // 4. PROCEDURAL PHYSICAL TEXTURES
    const texConcrete = createConcreteTexture();
    const texRebar = createRebarRibTexture();
    const texGround = createGroundTexture();
    const texHazard = createHazardTexture();

    // 5. AUTHENTIC INDUSTRIAL MATERIALS
    const matConcrete = new THREE.MeshStandardMaterial({
      map: texConcrete,
      bumpMap: texConcrete,
      bumpScale: 0.05,
      roughness: 0.88,
      metalness: 0.05,
    });

    const matRebarSteel = new THREE.MeshStandardMaterial({
      map: texRebar,
      bumpMap: texRebar,
      bumpScale: 0.08,
      roughness: 0.35,
      metalness: 0.9,
    });

    const matCatYellow = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Real Caterpillar/Komatsu Equipment Yellow
      roughness: 0.4,
      metalness: 0.6,
    });

    const matTataSteel = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.85,
    });

    const matStructuralRed = new THREE.MeshStandardMaterial({
      color: 0xc2410c, // Red Oxide Primer Steel
      roughness: 0.5,
      metalness: 0.65,
    });

    const matHazardTape = new THREE.MeshStandardMaterial({
      map: texHazard,
      roughness: 0.5,
    });

    const matGlassCab = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.8,
      roughness: 0.1,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
    });

    // 6. REALISTIC SUN & SKY LIGHTING (Golden hour warm sun with cool sky fill)
    const hemiLight = new THREE.HemisphereLight(0x94a3b8, 0x1e293b, 1.4);
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xfff1dc, 3.8);
    sunLight.position.set(45, 65, 35);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 150;
    sunLight.shadow.camera.left = -45;
    sunLight.shadow.camera.right = 45;
    sunLight.shadow.camera.top = 45;
    sunLight.shadow.camera.bottom = -45;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Site Halogen Work Lights
    const siteLight1 = new THREE.SpotLight(0xffedd5, 3, 90, Math.PI / 3, 0.4);
    siteLight1.position.set(-25, 20, -20);
    siteLight1.target.position.set(0, 5, 0);
    scene.add(siteLight1);
    scene.add(siteLight1.target);

    const weldingLight = new THREE.PointLight(0x60a5fa, 0, 18);
    weldingLight.position.set(6.4, 18.2, 4.2);
    scene.add(weldingLight);

    // 7. REALISTIC SITE GROUND & CONCRETE SLAB
    const groundGeo = new THREE.PlaneGeometry(180, 180);
    const groundMat = new THREE.MeshStandardMaterial({
      map: texGround,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Cast-in-place concrete foundation raft
    const raftGeo = new THREE.BoxGeometry(34, 1.4, 34);
    const raft = new THREE.Mesh(raftGeo, matConcrete);
    raft.position.set(0, 0.7, 0);
    raft.castShadow = true;
    raft.receiveShadow = true;
    scene.add(raft);

    // Column Starter Dowel Rebars (सरिया)
    const dowelGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8);
    for (let x = -13; x <= 13; x += 3.25) {
      for (let z = -13; z <= 13; z += 3.25) {
        const dowel = new THREE.Mesh(dowelGeo, matRebarSteel);
        dowel.position.set(x, 2.1, z);
        dowel.castShadow = true;
        scene.add(dowel);
      }
    }

    // 8. MULTI-TIER REALISTIC BUILDING FRAME
    const buildingGroup = new THREE.Group();
    const columns: THREE.Mesh[] = [];
    const numFloors = 6;
    const floorH = 4.2;
    const colSpacing = 6.4;
    const totalH = numFloors * floorH;

    // Heavy Structural Flanged Steel Columns
    const colGeo = new THREE.BoxGeometry(0.7, totalH, 0.7);
    colGeo.translate(0, totalH / 2, 0);

    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        if (Math.abs(x) === 2 && Math.abs(z) === 2) continue; // Stepped corner profile
        const col = new THREE.Mesh(colGeo, matStructuralRed);
        col.position.set(x * colSpacing, 1.4, z * colSpacing);
        col.castShadow = true;
        col.receiveShadow = true;
        buildingGroup.add(col);
        columns.push(col);
      }
    }

    // Floor Slabs with Real Concrete Texture & Edge Drop Beams
    const slabGeo = new THREE.BoxGeometry(colSpacing * 4 + 1.2, 0.4, colSpacing * 4 + 1.2);
    for (let f = 1; f <= numFloors; f++) {
      const slab = new THREE.Mesh(slabGeo, matConcrete);
      slab.position.set(0, 1.4 + f * floorH - 0.2, 0);
      slab.castShadow = true;
      slab.receiveShadow = true;
      buildingGroup.add(slab);
    }
    scene.add(buildingGroup);

    // 9. HIGHLY DETAILED LATTICE TOWER CRANE (Caterpillar Yellow)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(16, 0, -14);

    // Heavy Concrete Ballast Base
    const craneBaseGeo = new THREE.BoxGeometry(5, 1.8, 5);
    const craneBase = new THREE.Mesh(craneBaseGeo, matConcrete);
    craneBase.position.y = 0.9;
    craneBase.castShadow = true;
    craneGroup.add(craneBase);

    // Lattice Mast
    const mastH = totalH + 12;
    const mastGeo = new THREE.BoxGeometry(1.8, mastH, 1.8);
    mastGeo.translate(0, mastH / 2, 0);
    const mast = new THREE.Mesh(mastGeo, matCatYellow);
    mast.position.y = 1.8;
    mast.castShadow = true;
    craneGroup.add(mast);

    // Slewing Unit & Operator Cabin
    const cabinGroup = new THREE.Group();
    cabinGroup.position.set(0, 1.8 + mastH, 0);

    const cabGeo = new THREE.BoxGeometry(2.4, 2.2, 2.6);
    const cab = new THREE.Mesh(cabGeo, matCatYellow);
    cabinGroup.add(cab);

    const cabGlassGeo = new THREE.BoxGeometry(2.42, 1.4, 1.6);
    cabGlassGeo.translate(0, 0.2, 0.6);
    const cabGlass = new THREE.Mesh(cabGlassGeo, matGlassCab);
    cabinGroup.add(cabGlass);

    // Rotating Horizontal Jib Assembly
    const jibGroup = new THREE.Group();
    jibGroup.position.set(0, 1.4, 0);

    const jibLen = 34;
    const jibGeo = new THREE.BoxGeometry(jibLen, 1.1, 1.1);
    jibGeo.translate(-jibLen / 2 + 3, 0, 0);
    const mainJib = new THREE.Mesh(jibGeo, matCatYellow);
    mainJib.castShadow = true;
    jibGroup.add(mainJib);

    // Counter-Jib & Ballast with Safety Hazard Stripes
    const counterJibGeo = new THREE.BoxGeometry(10, 1.1, 1.1);
    counterJibGeo.translate(6, 0, 0);
    const counterJib = new THREE.Mesh(counterJibGeo, matCatYellow);
    jibGroup.add(counterJib);

    const ballastGeo = new THREE.BoxGeometry(4.2, 2.2, 2.2);
    ballastGeo.translate(7.8, -0.4, 0);
    const ballast = new THREE.Mesh(ballastGeo, matHazardTape);
    ballast.castShadow = true;
    jibGroup.add(ballast);

    // Trolley & Wire Rope
    const trolleyGroup = new THREE.Group();
    trolleyGroup.position.set(-18, -0.7, 0);

    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 14);
    cableGeo.translate(0, -7, 0);
    const cable = new THREE.Mesh(cableGeo, matTataSteel);
    trolleyGroup.add(cable);

    // Hook Block
    const hookGeo = new THREE.BoxGeometry(0.9, 1.2, 0.9);
    hookGeo.translate(0, -14.2, 0);
    const hook = new THREE.Mesh(hookGeo, matHazardTape);
    trolleyGroup.add(hook);

    // Suspended Heavy Load: Ribbed TMT Steel Rebar Bundle in Slings
    const loadGroup = new THREE.Group();
    loadGroup.position.set(0, -15.4, 0);

    for (let r = 0; r < 14; r++) {
      const angle = (r / 14) * Math.PI * 2;
      const rebarBarGeo = new THREE.CylinderGeometry(0.09, 0.09, 9, 8);
      rebarBarGeo.rotateZ(Math.PI / 2);
      const rebar = new THREE.Mesh(rebarBarGeo, matRebarSteel);
      rebar.position.set(0, Math.sin(angle) * 0.38, Math.cos(angle) * 0.38);
      rebar.castShadow = true;
      loadGroup.add(rebar);
    }
    trolleyGroup.add(loadGroup);
    jibGroup.add(trolleyGroup);

    cabinGroup.add(jibGroup);
    craneGroup.add(cabinGroup);
    scene.add(craneGroup);

    // 10. REALISTIC CONCRETE MIXER TRUCK (TATA / BHARATBENZ STYLE)
    const mixerGroup = new THREE.Group();
    mixerGroup.position.set(-22, 0, 14);
    mixerGroup.rotation.y = Math.PI / 4;

    const chassisGeo = new THREE.BoxGeometry(8.8, 0.6, 2.4);
    chassisGeo.translate(0, 1.1, 0);
    const chassis = new THREE.Mesh(chassisGeo, matTataSteel);
    mixerGroup.add(chassis);

    // 6 Heavy Rubber Tires
    const tireGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.5, 18);
    tireGeo.rotateX(Math.PI / 2);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
    const wheelPositions = [
      [-3.2, 0.7, 1.3], [-3.2, 0.7, -1.3],
      [1.6, 0.7, 1.3], [1.6, 0.7, -1.3],
      [3.1, 0.7, 1.3], [3.1, 0.7, -1.3],
    ];
    wheelPositions.forEach(([wx, wy, wz]) => {
      const wheel = new THREE.Mesh(tireGeo, tireMat);
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      mixerGroup.add(wheel);
    });

    // Driver Cabin
    const truckCabGeo = new THREE.BoxGeometry(2.5, 2.6, 2.4);
    truckCabGeo.translate(-2.9, 2.4, 0);
    const truckCab = new THREE.Mesh(truckCabGeo, matCatYellow);
    truckCab.castShadow = true;
    mixerGroup.add(truckCab);

    // Revolving Drum (Tilted)
    const drumGroup = new THREE.Group();
    drumGroup.position.set(0.6, 2.7, 0);
    drumGroup.rotation.z = -0.22;

    const drumGeo1 = new THREE.CylinderGeometry(1.4, 1.65, 3.0, 16);
    drumGeo1.rotateZ(Math.PI / 2);
    const drumBody = new THREE.Mesh(drumGeo1, matCatYellow);
    drumBody.castShadow = true;
    drumGroup.add(drumBody);

    const drumGeo2 = new THREE.ConeGeometry(1.65, 2.4, 16);
    drumGeo2.rotateZ(-Math.PI / 2);
    drumGeo2.translate(-1.5, 0, 0);
    const drumRear = new THREE.Mesh(drumGeo2, matCatYellow);
    drumGroup.add(drumRear);

    mixerGroup.add(drumGroup);
    scene.add(mixerGroup);

    // 11. MATERIAL STORAGE YARD (Foreground Pallets & Steel Stacks)
    const yardGroup = new THREE.Group();

    // Stacked TMT Steel Bundles on ground
    const rebarYard = new THREE.Group();
    rebarYard.position.set(22, 0, 8);
    for (let layer = 0; layer < 4; layer++) {
      for (let bar = 0; bar < 6 - layer; bar++) {
        const bGeo = new THREE.CylinderGeometry(0.09, 0.09, 11, 8);
        bGeo.rotateZ(Math.PI / 2);
        const b = new THREE.Mesh(bGeo, matRebarSteel);
        b.position.set(0, 0.2 + layer * 0.22, (bar - 2.5 + layer * 0.5) * 0.32);
        b.castShadow = true;
        rebarYard.add(b);
      }
    }
    yardGroup.add(rebarYard);

    // Wooden Pallets with 50kg Cement Bags
    const palletGroup = new THREE.Group();
    palletGroup.position.set(20, 0, -8);

    const palletBaseGeo = new THREE.BoxGeometry(3.2, 0.25, 3.2);
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.85 });
    const palletBase = new THREE.Mesh(palletBaseGeo, woodMat);
    palletBase.position.y = 0.15;
    palletBase.castShadow = true;
    palletGroup.add(palletBase);

    // Stacked Cement Bags (UltraTech Yellow/Orange)
    const bagGeo = new THREE.BoxGeometry(1.3, 0.32, 0.75);
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
    for (let lyr = 0; lyr < 5; lyr++) {
      for (let bx = -0.7; bx <= 0.7; bx += 1.4) {
        for (let bz = -0.9; bz <= 0.9; bz += 0.9) {
          const bag = new THREE.Mesh(bagGeo, bagMat);
          bag.position.set(bx, 0.45 + lyr * 0.35, bz);
          bag.castShadow = true;
          palletGroup.add(bag);
        }
      }
    }
    yardGroup.add(palletGroup);
    scene.add(yardGroup);

    // 12. REALISTIC WELDING SPARKS
    const sparkCount = 70;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities: { x: number; y: number; z: number }[] = [];
    const sparkOrigin = new THREE.Vector3(6.4, 18.2, 4.2);

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = sparkOrigin.x;
      sparkPositions[i * 3 + 1] = sparkOrigin.y;
      sparkPositions[i * 3 + 2] = sparkOrigin.z;

      sparkVelocities.push({
        x: (Math.random() - 0.5) * 1.6,
        y: -Math.random() * 2.8 - 0.5,
        z: (Math.random() - 0.5) * 1.6,
      });
    }

    sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.28,
      blending: THREE.AdditiveBlending,
      transparent: true,
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    scene.add(sparks);

    // 13. CAMERA & GSAP SCROLL INTEGRATION
    const camTarget = new THREE.Vector3(0, 10, 0);
    const scrollObj = { p: 0 };

    const updateCamera = (p: number) => {
      if (p < 0.25) {
        const sub = p / 0.25;
        camera.position.x = THREE.MathUtils.lerp(42, 44, sub);
        camera.position.y = THREE.MathUtils.lerp(26, 16, sub);
        camera.position.z = THREE.MathUtils.lerp(46, 38, sub);
        camTarget.set(0, THREE.MathUtils.lerp(6, 10, sub), 0);
      } else if (p < 0.5) {
        const sub = (p - 0.25) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(44, 28, sub);
        camera.position.y = THREE.MathUtils.lerp(16, 7, sub);
        camera.position.z = THREE.MathUtils.lerp(38, 22, sub);
        camTarget.set(16, 4, 4);
      } else if (p < 0.75) {
        const sub = (p - 0.5) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(28, -20, sub);
        camera.position.y = THREE.MathUtils.lerp(7, 28, sub);
        camera.position.z = THREE.MathUtils.lerp(22, 26, sub);
        camTarget.set(0, 18, 0);
      } else {
        const sub = (p - 0.75) / 0.25;
        camera.position.x = THREE.MathUtils.lerp(-20, 8, sub);
        camera.position.y = THREE.MathUtils.lerp(28, 12, sub);
        camera.position.z = THREE.MathUtils.lerp(26, 46, sub);
        camTarget.set(0, 24, 0);
      }
    };

    const scrollAnim = gsap.to(scrollObj, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: () => updateCamera(scrollObj.p),
      },
    });

    // CAMERA PRESET HANDLER
    setCamPresetRef.current = (preset: CameraPreset) => {
      setCamPreset(preset);
      let targetPos = new THREE.Vector3();
      let targetLook = new THREE.Vector3();

      switch (preset) {
        case "overview":
          targetPos.set(42, 26, 46);
          targetLook.set(0, 10, 0);
          break;
        case "crane":
          targetPos.set(20, 32, -4);
          targetLook.set(0, 20, 0);
          break;
        case "rebar":
          targetPos.set(28, 6, 16);
          targetLook.set(20, 2, 6);
          break;
        case "mixer":
          targetPos.set(-16, 6, 22);
          targetLook.set(-22, 2, 12);
          break;
        case "highrise":
          targetPos.set(4, 12, 42);
          targetLook.set(0, 22, 0);
          break;
      }

      gsap.to(camera.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 1.5,
        ease: "power2.out",
      });
      gsap.to(camTarget, {
        x: targetLook.x,
        y: targetLook.y,
        z: targetLook.z,
        duration: 1.5,
        ease: "power2.out",
      });
    };

    // LIGHTING MODES
    setLightingRef.current = (mode: LightingMode) => {
      setLightingMode(mode);

      if (mode === "daylight") {
        scene.background = new THREE.Color(0x0a0f1d);
        scene.fog = new THREE.FogExp2(0x0a0f1d, 0.009);
        sunLight.intensity = 3.8;
        sunLight.color.setHex(0xfff1dc);
        hemiLight.intensity = 1.4;
      } else if (mode === "sunset") {
        scene.background = new THREE.Color(0x180f1e);
        scene.fog = new THREE.FogExp2(0x180f1e, 0.011);
        sunLight.intensity = 4.2;
        sunLight.color.setHex(0xf97316); // Golden sunset orange
        hemiLight.intensity = 1.1;
      } else if (mode === "nightshift") {
        scene.background = new THREE.Color(0x040711);
        scene.fog = new THREE.FogExp2(0x040711, 0.014);
        sunLight.intensity = 0.4;
        sunLight.color.setHex(0x1e293b);
        hemiLight.intensity = 0.5;
        siteLight1.intensity = 8;
      }
    };

    // MOUSE PARALLAX
    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // RESIZE
    const onResize = () => {
      if (!mountRef.current) return;
      width = mountRef.current.clientWidth;
      height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    // RENDER LOOP
    let animId: number;
    const clock = new THREE.Clock();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Concrete mixer continuous drum spin (12 RPM)
      drumGroup.rotation.x += dt * 2.2;

      // Crane continuous gentle operation & suspended load sway
      jibGroup.rotation.y = Math.sin(elapsed * 0.35) * 0.35 - 0.2;
      loadGroup.rotation.y = Math.sin(elapsed * 0.7) * 0.12;

      // Random welding flash
      if (Math.random() > 0.82) {
        weldingLight.intensity = Math.random() * 8 + 4;
      } else {
        weldingLight.intensity = 0;
      }

      // Welding spark physics
      const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      for (let i = 0; i < sparkCount; i++) {
        positions[i * 3] += sparkVelocities[i].x * dt * 7;
        positions[i * 3 + 1] += sparkVelocities[i].y * dt * 7;
        positions[i * 3 + 2] += sparkVelocities[i].z * dt * 7;

        if (positions[i * 3 + 1] < 1.4) {
          positions[i * 3] = sparkOrigin.x + (Math.random() - 0.5) * 0.2;
          positions[i * 3 + 1] = sparkOrigin.y;
          positions[i * 3 + 2] = sparkOrigin.z + (Math.random() - 0.5) * 0.2;
        }
      }
      posAttr.needsUpdate = true;

      // Smooth camera interpolation
      camera.position.x += (mouseX * 0.4);
      camera.lookAt(camTarget);

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
      scrollAnim.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <>
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

      {/* TACTILE INDUSTRIAL CONTROLLER HUD */}
      <aside
        aria-label="3D Worksite controls"
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
            background: "rgba(13, 18, 31, 0.9)",
            border: "1px solid var(--border-card)",
          }}
        >
          {/* CAMERA PRESETS */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              SITE CAM:
            </span>
            {[
              { id: "overview", label: "Overview" },
              { id: "crane", label: "Crane" },
              { id: "rebar", label: "TMT Yard" },
              { id: "mixer", label: "Mixer Truck" },
              { id: "highrise", label: "High-Rise" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setCamPresetRef.current?.(p.id as any)}
                style={{
                  background: camPreset === p.id ? "var(--accent-amber)" : "rgba(255, 255, 255, 0.05)",
                  color: camPreset === p.id ? "#080c14" : "var(--text-secondary)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontFamily: "var(--font-mono)",
                  fontWeight: camPreset === p.id ? 800 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ width: "1px", height: "16px", background: "rgba(255,255,255,0.15)" }} />

          {/* LIGHTING MODES */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
              LIGHT:
            </span>
            <button
              onClick={() => setLightingRef.current?.("daylight")}
              title="Daylight Worksite"
              style={{
                background: lightingMode === "daylight" ? "rgba(245, 158, 11, 0.25)" : "transparent",
                border: lightingMode === "daylight" ? "1px solid var(--accent-amber)" : "1px solid rgba(255, 255, 255, 0.1)",
                color: lightingMode === "daylight" ? "var(--accent-amber)" : "var(--text-muted)",
                padding: "4px 6px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <Sun size={13} />
            </button>
            <button
              onClick={() => setLightingRef.current?.("sunset")}
              title="Sunset Golden Hour"
              style={{
                background: lightingMode === "sunset" ? "rgba(234, 88, 12, 0.25)" : "transparent",
                border: lightingMode === "sunset" ? "1px solid #ea580c" : "1px solid rgba(255, 255, 255, 0.1)",
                color: lightingMode === "sunset" ? "#ea580c" : "var(--text-muted)",
                padding: "4px 6px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <Eye size={13} />
            </button>
            <button
              onClick={() => setLightingRef.current?.("nightshift")}
              title="Night Shift Work Lights"
              style={{
                background: lightingMode === "nightshift" ? "rgba(56, 189, 248, 0.25)" : "transparent",
                border: lightingMode === "nightshift" ? "1px solid #38bdf8" : "1px solid rgba(255, 255, 255, 0.1)",
                color: lightingMode === "nightshift" ? "#38bdf8" : "var(--text-muted)",
                padding: "4px 6px",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              <Moon size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
