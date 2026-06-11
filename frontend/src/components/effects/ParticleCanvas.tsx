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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(960, 945);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Main particle system
    const particlesGeometry = new THREE.BufferGeometry();
    const count = 2000;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const brandColor = new THREE.Color("#fd551d");
    const surfaceColor = new THREE.Color("#333333");

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 10;
      positions[i + 1] = (Math.random() - 0.5) * 10;
      positions[i + 2] = (Math.random() - 0.5) * 10;

      const mixFactor = Math.random();
      const color = brandColor.clone().lerp(surfaceColor, mixFactor);
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

    // Second layer - smaller particles for depth
    const depthGeometry = new THREE.BufferGeometry();
    const depthCount = 1000;
    const depthPositions = new Float32Array(depthCount * 3);
    const depthColors = new Float32Array(depthCount * 3);

    for (let i = 0; i < depthCount * 3; i += 3) {
      depthPositions[i] = (Math.random() - 0.5) * 15;
      depthPositions[i + 1] = (Math.random() - 0.5) * 15;
      depthPositions[i + 2] = (Math.random() - 0.5) * 15;

      const mixFactor = Math.random() * 0.5 + 0.5;
      const color = brandColor.clone().lerp(surfaceColor, mixFactor);
      depthColors[i] = color.r;
      depthColors[i + 1] = color.g;
      depthColors[i + 2] = color.b;
    }

    depthGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(depthPositions, 3)
    );
    depthGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(depthColors, 3)
    );

    const depthMaterial = new THREE.PointsMaterial({
      size: 0.01,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const depthParticles = new THREE.Points(depthGeometry, depthMaterial);
    scene.add(depthParticles);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      particles.rotation.y += 0.0005;
      particles.rotation.x += 0.0002;

      depthParticles.rotation.y -= 0.0003;
      depthParticles.rotation.x -= 0.0001;

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
      renderer.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      depthGeometry.dispose();
      depthMaterial.dispose();
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
