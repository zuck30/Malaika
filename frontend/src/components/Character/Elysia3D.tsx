import React, { useRef, Suspense, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Html, ContactShadows, Center, useAnimations } from '@react-three/drei';
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
  const blinkState = useRef({ nextBlink: 0, blinking: false, influence: 0 });
  const gltf = useLoader(GLTFLoader, '/models/elysia_v3.glb');
  const { actions } = useAnimations(gltf.animations, modelRef);

  // Play the idle animation
  useEffect(() => {
    const idleAction = actions['Take 001'];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
    }
  }, [actions]);

  // Scene structure analysis and preparation
  const scene = useMemo(() => {
    const s = gltf.scene.clone();
    s.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;

        // Hide potential background objects if they still persist
        if (mesh.name.toLowerCase().includes('flower') ||
            mesh.name.toLowerCase().includes('shape') ||
            mesh.name.toLowerCase().includes('background')) {
          mesh.visible = false;
        }

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.roughness = 0.6;
          mat.metalness = 0.1;
          mat.envMapIntensity = 1.0;
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

  const baseScale = 0.25;

  useFrame((state) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    // Procedural Breathing (Idle)
    const breathingAmount = 0.01;
    const breathingSpeed = 1.0;
    const breathing = Math.sin(time * breathingSpeed) * breathingAmount;

    const lookAtX = mousePos.y * 0.1;
    const lookAtY = mousePos.x * 0.15;

    const lerpFactor = 0.1;
    group.position.y = THREE.MathUtils.lerp(group.position.y, breathing, lerpFactor);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, lookAtX, lerpFactor);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, lookAtY, lerpFactor);

    // PROCEDURAL BLINKING
    if (time > blinkState.current.nextBlink) {
      blinkState.current.blinking = true;
      if (blinkState.current.influence >= 1) {
        blinkState.current.blinking = false;
        blinkState.current.nextBlink = time + 2 + Math.random() * 5;
      }
    }
    if (blinkState.current.blinking) {
      blinkState.current.influence = THREE.MathUtils.lerp(blinkState.current.influence, 1.2, 0.4);
    } else {
      blinkState.current.influence = THREE.MathUtils.lerp(blinkState.current.influence, 0, 0.2);
    }

    // EXPRESSIONS & LIP SYNC
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
        const mesh = child as THREE.Mesh;
        const influences = mesh.morphTargetInfluences!;

        // Reset all
        for (let i = 0; i < influences.length; i++) {
          if (i === 1) continue; // Keep blink influence separate
          influences[i] = THREE.MathUtils.lerp(influences[i], 0, 0.1);
        }

        influences[1] = blinkState.current.influence;

        if (isSpeaking) {
          const mouthOpen = Math.abs(Math.sin(time * 15)) * 0.8;
          const phoneticA = Math.abs(Math.cos(time * 12)) * 0.4;
          const phoneticO = Math.abs(Math.sin(time * 10)) * 0.3;
          influences[0] = THREE.MathUtils.lerp(influences[0], mouthOpen, 0.2);
          influences[3] = THREE.MathUtils.lerp(influences[3], phoneticA, 0.2);
          influences[8] = THREE.MathUtils.lerp(influences[8], phoneticO, 0.2);
        }

        switch (emotion) {
          case 'joy':
          case 'happy':
            influences[4] = THREE.MathUtils.lerp(influences[4], 0.8, 0.1);
            break;
          case 'sad':
          case 'sadness':
            influences[13] = THREE.MathUtils.lerp(influences[13], 0.7, 0.1);
            break;
          case 'angry':
          case 'anger':
            influences[7] = THREE.MathUtils.lerp(influences[7], 0.9, 0.1);
            break;
          case 'surprise':
          case 'fear':
            influences[9] = THREE.MathUtils.lerp(influences[9], 0.6, 0.1);
            influences[0] = THREE.MathUtils.lerp(influences[0], 0.3, 0.1);
            break;
        }
      }
    });
  });

  return (
    <primitive
      ref={modelRef}
      object={scene}
      scale={baseScale}
      rotation={[0, 0, 0]}
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
        camera={{ position: [0, 0, 1.8], fov: 35 }}
      >
        <ambientLight intensity={1.5} />
        <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={5} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={1.5} castShadow />
        <pointLight position={[0, 0, 2]} intensity={2} color="#ffffff" />

        <Suspense fallback={<Loader />}>
          <Center top position={[0, -1.0, 0]}>
            <ElysiaModel {...props} />
          </Center>

          <ContactShadows
            position={[0, -0.8, 0]}
            opacity={0.4}
            scale={10}
            blur={2.5}
            far={10}
            color="#000000"
          />

          <Environment preset="city" />
        </Suspense>
      </Canvas>

      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-sky-50/20 to-white/0 pointer-events-none" />
    </div>
  );
};

export default ElysiaCharacter3D;
