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

        // The Shibahu model has some extra background/reference meshes that should be hidden
        // Based on analysis, Object_8 and Shibahu_Reference are candidates
        if (mesh.name.includes('Object_8') || mesh.name.includes('Reference') || mesh.name.includes('base_mesh')) {
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

  const baseScale = 0.25; // Balanced scale for the Shibahu model

  useFrame((state) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    // BASE POSE
    let targetRotX = 0;
    let targetRotY = 0;
    let targetRotZ = 0;
    let targetScale = baseScale;
    let targetPosY = 0;

    // Procedural Breathing (Idle) - complementary to the baked animation
    const breathingAmount = 0.01;
    const breathingSpeed = 1.0;
    const breathing = Math.sin(time * breathingSpeed) * breathingAmount;
    targetPosY += breathing;

    // MOUSE TRACKING
    const lookAtX = mousePos.y * 0.1;
    const lookAtY = mousePos.x * 0.15;

    // APPLY TRANSFORMATIONS WITH SMOOTHING
    const lerpFactor = 0.1;
    group.position.y = THREE.MathUtils.lerp(group.position.y, targetPosY, lerpFactor);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX + lookAtX, lerpFactor);
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY + lookAtY, lerpFactor);
    group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, targetRotZ, lerpFactor);

    const s = THREE.MathUtils.lerp(group.scale.x, targetScale, lerpFactor);
    group.scale.set(s, s, s);

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

    // EXPRESSIONS & LIP SYNC via Morph Targets
    group.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetInfluences) {
        const mesh = child as THREE.Mesh;
        const influences = mesh.morphTargetInfluences!;

        // Reset all
        for (let i = 0; i < influences.length; i++) {
          // Keep blink influence separate
          if (i === 1) continue;
          influences[i] = THREE.MathUtils.lerp(influences[i], 0, 0.1);
        }

        // Apply Blink
        influences[1] = blinkState.current.influence;

        // Apply Lip Sync if speaking (Verified visemes for Shibahu: 0, 3, 5, 8)
        if (isSpeaking) {
          const mouthOpen = Math.abs(Math.sin(time * 15)) * 0.8;
          const phoneticA = Math.abs(Math.cos(time * 12)) * 0.4;
          const phoneticO = Math.abs(Math.sin(time * 10)) * 0.3;

          influences[0] = THREE.MathUtils.lerp(influences[0], mouthOpen, 0.2);
          influences[3] = THREE.MathUtils.lerp(influences[3], phoneticA, 0.2);
          influences[8] = THREE.MathUtils.lerp(influences[8], phoneticO, 0.2);
        }

        // Apply Emotion (Verified mappings for Shibahu model)
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
            influences[9] = THREE.MathUtils.lerp(influences[9], 0.6, 0.1); // Eyebrows up
            influences[0] = THREE.MathUtils.lerp(influences[0], 0.3, 0.1); // Slight mouth open
            break;
        }
      }
    });
  });

  return (
    <>
      <primitive
        ref={modelRef}
        object={scene}
        scale={baseScale}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </>
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
        camera={{ position: [0, 0, 1.8], fov: 35 }} // Adjusted camera for closer look
      >
        <ambientLight intensity={2.0} />
        <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={5} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={2} castShadow />
        <pointLight position={[0, 0, 2]} intensity={3} color="#ffffff" />

        <Suspense fallback={<Loader />}>
          <Center top position={[0, -1.1, 0]}>
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
