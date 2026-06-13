"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";

export default function ParticleCanvas({ side }: { side: "left" | "right" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Performance check for low-end devices
    const isLowEnd =
      typeof navigator !== "undefined" &&
      (navigator.hardwareConcurrency || 4) < 4;
    const primaryCount = isLowEnd ? 1500 : 3000;
    const secondaryCount = isLowEnd ? 250 : 500;

    const scene = new THREE.Scene();
    // No scene background — canvas must be transparent so content is visible underneath
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 5;

    // Mouse parallax
    const mouse = { x: 0, y: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(960, 945);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      renderer.dispose();
      return;
    }

    // Main particle system - cylindrical distribution
    const particlesGeometry = new THREE.BufferGeometry();
    const count = primaryCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const brandColor = new THREE.Color("#fd551d");
    const surfaceColor = new THREE.Color("#333333");

    for (let i = 0; i < count * 3; i += 3) {
      const radius = 5 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;

      positions[i] = Math.cos(theta) * radius * (0.5 + Math.random() * 0.5);
      positions[i + 1] = (Math.random() - 0.5) * 35;
      positions[i + 2] =
        Math.sin(theta) * radius * 0.3 + (Math.random() - 0.5) * 5;

      const mixFactor = Math.random();
      const color = brandColor.clone().lerp(surfaceColor, mixFactor);
      if (Math.random() > 0.7) {
        color.lerp(new THREE.Color(0xffffff), 0.1);
      }
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    particlesGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(colors, 3)
    );

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.02,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Secondary particles - larger, more transparent for depth parallax
    const secondaryGeometry = new THREE.BufferGeometry();
    const secCount = secondaryCount;
    const secondaryPositions = new Float32Array(secCount * 3);
    const secondaryColors = new Float32Array(secCount * 3);

    for (let i = 0; i < secCount * 3; i += 3) {
      const radius = 8 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;

      secondaryPositions[i] =
        Math.cos(theta) * radius * (0.5 + Math.random() * 0.5);
      secondaryPositions[i + 1] = (Math.random() - 0.5) * 40;
      secondaryPositions[i + 2] =
        Math.sin(theta) * radius * 0.3 + (Math.random() - 0.5) * 8;

      const mixFactor = Math.random() * 0.5 + 0.5;
      const color = brandColor.clone().lerp(surfaceColor, mixFactor);
      secondaryColors[i] = color.r;
      secondaryColors[i + 1] = color.g;
      secondaryColors[i + 2] = color.b;
    }

    secondaryGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(secondaryPositions, 3)
    );
    secondaryGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(secondaryColors, 3)
    );

    const secondaryMaterial = new THREE.PointsMaterial({
      size: 0.04,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.3,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const secondaryParticles = new THREE.Points(
      secondaryGeometry,
      secondaryMaterial
    );
    scene.add(secondaryParticles);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0003;

      secondaryParticles.rotation.y -= 0.0005;
      secondaryParticles.rotation.x -= 0.0002;

      // Mouse parallax
      camera.position.x += (mouse.x * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (mouse.y * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      secondaryGeometry.dispose();
      secondaryMaterial.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: "12.5%",
        [side]: 0,
        width: "50%",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        data-engine="three.js r182"
        width={960}
        height={945}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
