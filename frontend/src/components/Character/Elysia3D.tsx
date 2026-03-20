import React, { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Html, OrbitControls, ContactShadows, Center } from '@react-three/drei';
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

  // Scene structure analysis and preparation
  const scene = useMemo(() => {
    const s = gltf.scene.clone();
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Hide large background shells/containers
        // Based on analysis, Object_8 is the surrounding environment
        if (mesh.name.includes('Object_8')) {
          mesh.visible = false;
        }

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.5;
          mat.metalness = 0.2;
          mat.envMapIntensity = 1.5;
          mat.side = THREE.DoubleSide;
        }
      }
    });
    return s;
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
  // Native center of character meshes is high (~72), so we'll rely on <Center /> from drei
  // but we still need a reasonable base scale.
  const baseScale = 0.025;

  useFrame((state) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    // BASE POSE
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetScale = baseScale;
    let targetPosY = 0; // Relative to Center component

    // Procedural Breathing (Idle)
    const breathingAmount = 0.02;
    const breathingSpeed = 1.2;
    const breathing = Math.sin(time * breathingSpeed) * breathingAmount;
    targetPosY += breathing;
    targetScale *= (1 + breathing * 0.1);

    // EMOTION MODIFIERS
    switch (emotion) {
      case 'joy':
      case 'excited':
      case 'happy':
        const joyBounce = Math.abs(Math.sin(time * 6)) * 0.2;
        targetPosY += joyBounce;
        targetRotZ = Math.sin(time * 4) * 0.1;
        targetScale *= 1.05;
        break;
      case 'sadness':
      case 'sad':
        targetRotX += 0.25;
        targetPosY -= 0.05;
        break;
      case 'anger':
      case 'angry':
        const angerShake = Math.sin(time * 35) * 0.01;
        targetRotY += angerShake;
        targetRotX -= 0.1;
        break;
      case 'surprise':
      case 'surprised':
        targetRotX -= 0.2;
        targetScale *= 1.1;
        break;
      case 'loving':
        targetScale *= 1.03 + Math.sin(time * 2) * 0.02;
        targetRotZ = Math.sin(time * 1) * 0.05;
        break;
      default:
        break;
    }

    if (isSpeaking) {
      const talkEnergy = Math.sin(time * 28) * 0.01;
      const talkPulse = 1 + Math.abs(Math.sin(time * 12)) * 0.03;
      targetPosY += talkEnergy;
      targetScale *= talkPulse;
    }

    // MOUSE TRACKING
    const lookAtX = mousePos.y * 0.15;
    const lookAtY = mousePos.x * 0.25;

    // APPLY TRANSFORMATIONS WITH SMOOTHING
    const lerpFactor = 0.1;
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetPosY, lerpFactor);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX + lookAtX, lerpFactor);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY + lookAtY, lerpFactor);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, lerpFactor);

    const s = THREE.MathUtils.lerp(group.scale.x, targetScale, lerpFactor);
    group.scale.set(s, s, s);
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={baseScale}
    />
  );
};

const ElysiaCharacter3D: React.FC<ElysiaCharacterProps> = (props) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <Canvas
        shadows
        gl={{
          alpha: true,
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        camera={{ position: [0, 1, 5], fov: 40 }}
      >
        <ambientLight intensity={1.0} />
        <spotLight position={[10, 15, 10]} angle={0.25} penumbra={1} intensity={1.5} castShadow />
        <directionalLight position={[-8, 8, 5]} intensity={1.0} color="#ffffff" castShadow />
        <pointLight position={[-5, -5, 5]} intensity={1.5} color="#00B9FF" />
        <pointLight position={[5, 5, 2]} intensity={1.0} color="#FFFC00" />

        <Suspense fallback={<Loader />}>
          <Center top position={[0, -1, 0]}>
            <ElysiaModel {...props} />
          </Center>

          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={10}
            resolution={256}
            color="#000000"
          />

          <Environment preset="city" />
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={10}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Background visual cue */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-100/30 to-white/0 pointer-events-none" />
    </div>
  );
};

export default ElysiaCharacter3D;
