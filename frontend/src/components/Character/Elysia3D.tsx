import React, { useRef, Suspense, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Html } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

interface ElysiaCharacterProps {
  emotion: string;
  isSpeaking: boolean;
  isListening?: boolean;
}

function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
        <div className="text-sky-600 text-lg font-bold bg-white/90 px-4 py-2 rounded-full shadow-md backdrop-blur-md animate-pulse">
          Elysia is arriving...
        </div>
      </div>
    </Html>
  );
}

const ElysiaModel: React.FC<ElysiaCharacterProps> = ({ emotion, isSpeaking, isListening }) => {
  const modelRef = useRef<THREE.Group>(null!);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gltf = useLoader(GLTFLoader, '/models/elysia_v3.glb');

  // Initial setup for the model
  useEffect(() => {
    if (!gltf?.scene) return;

    // Reset materials to be brighter and more vibrant
    gltf.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.4;
          mat.metalness = 0.3;
          mat.envMapIntensity = 2.0;
          // Ensure materials are double sided if needed
          mat.side = THREE.DoubleSide;
        }
      }
    });
  }, [gltf]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation constants
  const baseScale = 0.022; // Larger scale to fit screen better
  const baseY = -1.8; // Positioned lower to center the model better

  useFrame((state) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    // BASE POSE
    // The model from sketchfab is rotated -Math.PI/2 on X (lying flat).
    // We want it standing up.
    let targetRotX = -Math.PI / 2;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetPosY = baseY;
    let targetScale = baseScale;

    // Procedural Breathing (Idle)
    const breathingAmount = 0.03;
    const breathingSpeed = 1.2;
    const breathing = Math.sin(time * breathingSpeed) * breathingAmount;
    targetPosY += breathing;
    targetScale *= (1 + breathing * 0.2);

    // EMOTION MODIFIERS - HIGHLY EXPRESSIVE
    // Mapped to match backend candidate labels: ["happy", "sad", "angry", "surprised", "neutral", "loving", "curious", "bored", "anxious", "confused"]
    switch (emotion) {
      case 'joy':
      case 'excited':
      case 'happy':
        // High energy bouncing
        const joyBounce = Math.abs(Math.sin(time * 6)) * 0.3;
        targetPosY += joyBounce;
        // Happy wiggle
        targetRotZ = Math.sin(time * 4) * 0.15;
        targetScale *= 1.1;
        break;
      case 'sadness':
      case 'sad':
        // Slow, heavy breathing and looking down
        targetRotX += 0.35;
        targetPosY -= 0.1;
        const sadBreathing = Math.sin(time * 0.6) * 0.01;
        targetPosY += sadBreathing;
        break;
      case 'anger':
      case 'angry':
        // Intense vibrating/shaking
        const angerShake = Math.sin(time * 35) * 0.02;
        targetRotY += angerShake;
        targetRotX -= 0.15; // Lean forward aggressively
        targetPosY += 0.05;
        break;
      case 'surprise':
      case 'surprised':
        // Sharp "jump" and lean back
        const surprisePop = Math.exp(-((time * 4) % 4)) * 0.4;
        targetPosY += surprisePop;
        targetRotX -= 0.25;
        targetScale *= 1.15;
        break;
      case 'curious':
      case 'confused':
        // Large, inquisitive head/body tilt
        targetRotZ = Math.sin(time * 1.5) * 0.25;
        targetRotY = Math.cos(time * 1.5) * 0.1;
        break;
      case 'loving':
        // Soft pulsing and gentle swaying
        targetScale *= 1.05 + Math.sin(time * 2) * 0.02;
        targetRotZ = Math.sin(time * 1) * 0.1;
        break;
      case 'bored':
        // Leaning and slow swaying
        targetRotZ = 0.2;
        targetRotX += 0.1;
        const boredSway = Math.sin(time * 0.5) * 0.05;
        targetRotY += boredSway;
        break;
      case 'anxious':
        // Fast subtle jittering
        const anxiousJitter = Math.sin(time * 50) * 0.005;
        targetPosY += anxiousJitter;
        targetRotY += Math.sin(time * 10) * 0.05;
        break;
      default:
        // Neutral or unknown emotion
        break;
    }

    // SPEAKING MODIFIER
    if (isSpeaking) {
      // Rapid mouth-sync simulation via scale and Y-jitter
      const talkEnergy = Math.sin(time * 28) * 0.015;
      const talkPulse = 1 + Math.abs(Math.sin(time * 12)) * 0.04;
      targetPosY += talkEnergy;
      targetScale *= talkPulse;
    }

    // LISTENING MODIFIER
    if (isListening) {
      // Attentive lean
      targetRotX -= 0.1;
      targetScale *= 1.02;
    }

    // MOUSE TRACKING (Look at user)
    const lookAtX = mousePos.y * 0.2;
    const lookAtY = mousePos.x * 0.35;

    // APPLY TRANSFORMATIONS WITH SMOOTHING (Lerp)
    const lerpFactor = 0.1;
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetPosY, lerpFactor);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX + lookAtX, lerpFactor);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ + lookAtY, lerpFactor); // Z used for side-to-side due to model orientation
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, lerpFactor);

    const s = THREE.MathUtils.lerp(group.scale.x, targetScale, lerpFactor);
    group.scale.set(s, s, s);
  });

  return (
    <primitive
      ref={modelRef}
      object={gltf.scene}
      scale={baseScale}
      position={[0, baseY, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
    />
  );
};

const ElysiaCharacter3D: React.FC<ElysiaCharacterProps> = (props) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <Canvas
        gl={{
          alpha: true,
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ position: [0, 0, 5], fov: 40 }}
      >
        {/* Cinematic Lighting */}
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={2.5} castShadow />
        <directionalLight position={[-8, 8, 5]} intensity={1.5} color="#ffffff" />
        <pointLight position={[-5, -5, 5]} intensity={1.2} color="#00B9FF" />
        <pointLight position={[5, 5, 2]} intensity={0.8} color="#FFFC00" />

        <Suspense fallback={<Loader />}>
          <ElysiaModel {...props} />
          <Environment preset="apartment" />
        </Suspense>
      </Canvas>

      {/* Visual background element to ground the character */}
      <div className="absolute inset-0 -z-10 bg-radial-gradient from-sky-100/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default ElysiaCharacter3D;
