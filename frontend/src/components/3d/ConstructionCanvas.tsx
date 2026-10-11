"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ConstructionCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mountRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // SCENE SETUP
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040711);
    scene.fog = new THREE.FogExp2(0x040711, 0.012);

    // CAMERA SETUP
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(22, 38, 48);

    // RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // LIGHTING
    const ambientLight = new THREE.AmbientLight(0x101a33, 1.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff3e0, 2.5);
    sunLight.position.set(40, 60, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const cyanSpotlight = new THREE.SpotLight(0x00f0ff, 4, 120, Math.PI / 4, 0.4);
    cyanSpotlight.position.set(-30, 45, 30);
    scene.add(cyanSpotlight);

    const orangeLight = new THREE.PointLight(0xff6a00, 3, 50);
    orangeLight.position.set(0, 18, 0);
    scene.add(orangeLight);

    // Welding spark light
    const weldLight = new THREE.PointLight(0x00f0ff, 0, 15);
    weldLight.position.set(4, 20, 4);
    scene.add(weldLight);

    // 1. BLUEPRINT GROUND & GRID
    const gridHelper = new THREE.GridHelper(120, 60, 0x00f0ff, 0x0f2444);
    gridHelper.position.y = -0.05;
    scene.add(gridHelper);

    // Ground Plane with subtle reflection
    const groundGeo = new THREE.PlaneGeometry(160, 160);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x060c1c,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);

    // Holographic radar circles
    const radarGroup = new THREE.Group();
    const ringGeo1 = new THREE.RingGeometry(14, 14.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat);
    ring1.rotation.x = -Math.PI / 2;
    ring1.position.y = 0.05;
    radarGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(22, 22.4, 64);
    const ring2 = new THREE.Mesh(ringGeo2, ringMat.clone());
    ring2.rotation.x = -Math.PI / 2;
    ring2.position.y = 0.05;
    radarGroup.add(ring2);
    scene.add(radarGroup);

    // 2. BUILDING ROOT GROUP
    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);

    // Shared Materials
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0xff6a00,
      metalness: 0.85,
      roughness: 0.25,
      emissive: 0x331400,
    });

    const steelDarkMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.3,
    });

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.8,
      thickness: 1.2,
      transparent: true,
      opacity: 0.7,
      reflectivity: 0.9,
    });

    const emissiveLineMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
    });

    // A. FOUNDATION PIERS (Stage 1)
    const foundationPads: THREE.Mesh[] = [];
    const padGeo = new THREE.BoxGeometry(3.5, 1.2, 3.5);
    const colSpacing = 6;
    for (let x = -1.5; x <= 1.5; x++) {
      for (let z = -1.5; z <= 1.5; z++) {
        const pad = new THREE.Mesh(padGeo, concreteMat);
        pad.position.set(x * colSpacing, 0.6, z * colSpacing);
        pad.castShadow = true;
        pad.receiveShadow = true;
        buildingGroup.add(pad);
        foundationPads.push(pad);
      }
    }

    // B. VERTICAL STEEL COLUMNS (Stage 2)
    const totalFloors = 7;
    const floorHeight = 4.2;
    const maxHeight = totalFloors * floorHeight;
    const columns: THREE.Mesh[] = [];
    const columnGeo = new THREE.BoxGeometry(0.55, maxHeight, 0.55);
    columnGeo.translate(0, maxHeight / 2, 0); // anchor at base

    for (let x = -1.5; x <= 1.5; x++) {
      for (let z = -1.5; z <= 1.5; z++) {
        const col = new THREE.Mesh(columnGeo, steelMat);
        col.position.set(x * colSpacing, 1.2, z * colSpacing);
        col.scale.y = 0.05; // start small
        col.castShadow = true;
        buildingGroup.add(col);
        columns.push(col);
      }
    }

    // C. HORIZONTAL STEEL BEAMS (Floors 1-7)
    const horizontalBeams: THREE.Mesh[] = [];
    const beamGeoX = new THREE.BoxGeometry(colSpacing * 3, 0.35, 0.35);
    const beamGeoZ = new THREE.BoxGeometry(0.35, 0.35, colSpacing * 3);

    for (let f = 1; f <= totalFloors; f++) {
      const yPos = 1.2 + f * floorHeight;
      for (let z = -1.5; z <= 1.5; z++) {
        const beamX = new THREE.Mesh(beamGeoX, steelDarkMat);
        beamX.position.set(0, yPos, z * colSpacing);
        beamX.scale.set(0.01, 1, 0.01);
        buildingGroup.add(beamX);
        horizontalBeams.push(beamX);
      }
      for (let x = -1.5; x <= 1.5; x++) {
        const beamZ = new THREE.Mesh(beamGeoZ, steelDarkMat);
        beamZ.position.set(x * colSpacing, yPos, 0);
        beamZ.scale.set(0.01, 1, 0.01);
        buildingGroup.add(beamZ);
        horizontalBeams.push(beamZ);
      }
    }

    // D. CAST CONCRETE FLOOR SLABS (Stage 3)
    const floorSlabs: THREE.Mesh[] = [];
    const slabGeo = new THREE.BoxGeometry(colSpacing * 3 + 2, 0.45, colSpacing * 3 + 2);
    for (let f = 1; f <= totalFloors; f++) {
      const slab = new THREE.Mesh(slabGeo, concreteMat);
      slab.position.set(0, 1.2 + f * floorHeight - 0.2, 0);
      slab.scale.set(0.01, 1, 0.01);
      slab.castShadow = true;
      slab.receiveShadow = true;
      buildingGroup.add(slab);
      floorSlabs.push(slab);
    }

    // E. GLASS FAÇADE CURTAIN WALLS (Stage 4)
    const glassPanels: THREE.Mesh[] = [];
    const glassHeight = floorHeight * 5;
    const glassGeo = new THREE.BoxGeometry(colSpacing * 3 + 0.6, glassHeight, colSpacing * 3 + 0.6);
    const glassBuilding = new THREE.Mesh(glassGeo, glassMat);
    glassBuilding.position.set(0, 1.2 + glassHeight / 2, 0);
    glassBuilding.visible = false;
    buildingGroup.add(glassBuilding);
    glassPanels.push(glassBuilding);

    // Holographic wireframe edges for glass facade
    const wireGeo = new THREE.EdgesGeometry(glassGeo);
    const wireLines = new THREE.LineSegments(wireGeo, emissiveLineMat);
    wireLines.position.copy(glassBuilding.position);
    wireLines.visible = false;
    buildingGroup.add(wireLines);

    // F. ROOFTOP ARCHITECTURAL SPIRE & BEACON
    const spireGeo = new THREE.CylinderGeometry(0.05, 0.4, 9, 8);
    spireGeo.translate(0, 4.5, 0);
    const spire = new THREE.Mesh(spireGeo, steelMat);
    spire.position.set(0, 1.2 + maxHeight, 0);
    spire.scale.y = 0.01;
    buildingGroup.add(spire);

    const beaconGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff0044 });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 1.2 + maxHeight + 9, 0);
    beacon.visible = false;
    buildingGroup.add(beacon);

    // G. TOWER CRANE (Construction active)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(13, 0, -11);

    // Crane Mast
    const craneMastHeight = maxHeight + 14;
    const craneMastGeo = new THREE.BoxGeometry(1.6, craneMastHeight, 1.6);
    craneMastGeo.translate(0, craneMastHeight / 2, 0);
    const craneMast = new THREE.Mesh(craneMastGeo, steelMat);
    craneGroup.add(craneMast);

    // Crane Slewing Unit & Operator Cab
    const cabGeo = new THREE.BoxGeometry(2.2, 1.8, 2.2);
    const cab = new THREE.Mesh(cabGeo, steelDarkMat);
    cab.position.set(0, craneMastHeight, 0);
    craneGroup.add(cab);

    // Crane Jib Arm (Rotates)
    const craneArmGroup = new THREE.Group();
    craneArmGroup.position.set(0, craneMastHeight + 1, 0);

    const jibGeo = new THREE.BoxGeometry(26, 0.9, 0.9);
    jibGeo.translate(-10, 0, 0);
    const jib = new THREE.Mesh(jibGeo, steelMat);
    craneArmGroup.add(jib);

    // Counterweight
    const counterGeo = new THREE.BoxGeometry(6, 1.5, 1.8);
    counterGeo.translate(4.5, 0, 0);
    const counterWeight = new THREE.Mesh(counterGeo, concreteMat);
    craneArmGroup.add(counterWeight);

    // Hoist Cable & Suspended Truss
    const cableGeo = new THREE.CylinderGeometry(0.04, 0.04, 12);
    cableGeo.translate(0, -6, 0);
    const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
    const cable = new THREE.Mesh(cableGeo, cableMat);
    cable.position.set(-16, 0, 0);
    craneArmGroup.add(cable);

    const suspendedBeamGeo = new THREE.BoxGeometry(6, 0.4, 0.4);
    const suspendedBeam = new THREE.Mesh(suspendedBeamGeo, steelMat);
    suspendedBeam.position.set(-16, -12, 0);
    craneArmGroup.add(suspendedBeam);

    craneGroup.add(craneArmGroup);
    scene.add(craneGroup);

    // H. FLOATING ATMOSPHERIC PARTICLES
    const particleCount = 400;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 80;
      particlePositions[i + 1] = Math.random() * 55;
      particlePositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.35,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // GSAP SCROLLTRIGGER SYNC OBJECT
    const progressObj = { value: 0 };
    const lookAtTarget = new THREE.Vector3(0, 10, 0);

    const scrollAnim = gsap.to(progressObj, {
      value: 1,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: () => {
          const p = progressObj.value;

          // CAMERA CHOREOGRAPHY
          if (p < 0.25) {
            // Stage 1: Blueprint Overview
            const sub = p / 0.25;
            camera.position.x = THREE.MathUtils.lerp(24, 28, sub);
            camera.position.y = THREE.MathUtils.lerp(38, 22, sub);
            camera.position.z = THREE.MathUtils.lerp(48, 36, sub);
            lookAtTarget.y = THREE.MathUtils.lerp(6, 12, sub);

            // Columns rising
            columns.forEach((c) => (c.scale.y = THREE.MathUtils.lerp(0.05, 0.45, sub)));
          } else if (p < 0.5) {
            // Stage 2: Steel Framing & Girder Assembly
            const sub = (p - 0.25) / 0.25;
            camera.position.x = THREE.MathUtils.lerp(28, -22, sub);
            camera.position.y = THREE.MathUtils.lerp(22, 26, sub);
            camera.position.z = THREE.MathUtils.lerp(36, 32, sub);
            lookAtTarget.y = THREE.MathUtils.lerp(12, 18, sub);

            columns.forEach((c) => (c.scale.y = THREE.MathUtils.lerp(0.45, 1.0, sub)));
            horizontalBeams.forEach((b) => {
              const bScale = THREE.MathUtils.lerp(0.01, 1, sub);
              b.scale.set(bScale, 1, bScale);
            });
          } else if (p < 0.75) {
            // Stage 3: Floor Slab Casting
            const sub = (p - 0.5) / 0.25;
            camera.position.x = THREE.MathUtils.lerp(-22, 18, sub);
            camera.position.y = THREE.MathUtils.lerp(26, 34, sub);
            camera.position.z = THREE.MathUtils.lerp(32, 26, sub);
            lookAtTarget.y = THREE.MathUtils.lerp(18, 24, sub);

            floorSlabs.forEach((s) => {
              const sScale = THREE.MathUtils.lerp(0.01, 1, sub);
              s.scale.set(sScale, 1, sScale);
            });
            spire.scale.y = THREE.MathUtils.lerp(0.01, 0.5, sub);
          } else {
            // Stage 4: Finished Futuristic Skyscraper Hero Reveal
            const sub = (p - 0.75) / 0.25;
            camera.position.x = THREE.MathUtils.lerp(18, 6, sub);
            camera.position.y = THREE.MathUtils.lerp(34, 14, sub);
            camera.position.z = THREE.MathUtils.lerp(26, 42, sub);
            lookAtTarget.y = THREE.MathUtils.lerp(24, 32, sub);

            glassBuilding.visible = true;
            wireLines.visible = true;
            beacon.visible = true;
            spire.scale.y = THREE.MathUtils.lerp(0.5, 1.0, sub);
          }
        },
      },
    });

    // MOUSE PARALLAX TRACKING
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 6;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // RESIZE LISTENER
    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // ANIMATION RENDER LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Radar rotation
      radarGroup.rotation.y = time * 0.15;

      // Crane continuous gentle operation
      craneArmGroup.rotation.y = Math.sin(time * 0.4) * 0.45 - 0.5;
      suspendedBeam.rotation.y = Math.sin(time * 0.8) * 0.15;

      // Random welding flash simulation
      if (Math.random() > 0.85) {
        weldLight.intensity = Math.random() * 8 + 4;
      } else {
        weldLight.intensity = 0;
      }

      // Beacon blink
      if (beacon.visible) {
        beacon.scale.setScalar(1 + Math.sin(time * 6) * 0.25);
      }

      // Particles subtle drift
      particles.rotation.y = time * 0.02;

      // Mouse Parallax Lerp
      camera.position.x += (mouseX - camera.position.x + camera.position.x) * 0.02;
      camera.lookAt(lookAtTarget);

      renderer.render(scene, camera);
    };

    animate();

    // CLEANUP
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      scrollAnim.kill();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
