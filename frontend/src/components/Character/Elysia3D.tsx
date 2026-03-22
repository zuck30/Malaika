import React, { Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useGLTF,
  useAnimations,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Float,
  Center,
} from '@react-three/drei';
import * as THREE from 'three';

interface Elysia3DProps {
  emotion?: string;
  isSpeaking?: boolean;
  isListening?: boolean;
  debugMorphIndex?: number;
}

const Model = ({ emotion, isSpeaking, isListening, debugMorphIndex }: Elysia3DProps) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/elysia_v3.glb');
  const { actions } = useAnimations(animations, group);

  // Clean up the scene: Remove helper meshes and adjust materials
  useEffect(() => {
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        // Hide helper meshes
        if (obj.name.toLowerCase().includes('base_mesh') ||
            obj.name.toLowerCase().includes('line_gp') ||
            obj.name.toLowerCase().includes('grid')) {
          obj.visible = false;
        }

        // Improve material quality
        if (obj.material) {
          obj.material.envMapIntensity = 1.2;
          if (obj.material instanceof THREE.MeshStandardMaterial) {
            obj.material.roughness = 0.4;
          }
        }

        // Cast/Receive shadows
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Handle Animations
  useEffect(() => {
    // Take 001 seems to be the main idle/animation track
    const idleAction = actions['Take 001'];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
      idleAction.timeScale = isSpeaking ? 1.2 : 0.8;
    }
  }, [actions, isSpeaking]);

  // Handle Morph Targets for Expressions
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.morphTargetInfluences) {
        // Debug mode: show only the selected morph target
        if (debugMorphIndex !== undefined && debugMorphIndex >= 0) {
          obj.morphTargetInfluences.fill(0);
          if (debugMorphIndex < obj.morphTargetInfluences.length) {
            obj.morphTargetInfluences[debugMorphIndex] = 1;
          }
          return;
        }

        // Meshes 26, 27, 28 were identified as having morph targets
        // Index 0: Often Blink

        // 1. Blinking (on Mesh 27/28 typically eyes)
        // Natural blink frequency (every ~4-6 seconds)
        const blinkBase = Math.sin(t * 1.2) > 0.96 ? 1 : 0;
        const blink = THREE.MathUtils.lerp(obj.morphTargetInfluences[0] || 0, blinkBase, 0.3);

        // Apply blinking to meshes that look like eyes (usually 27, 28)
        if (obj.name === '2' || obj.name === '1') {
           obj.morphTargetInfluences[0] = blink;
        }

        // 2. Speaking (Mouth movements)
        if (isSpeaking && (obj.name === '0')) { // Mesh 26 (name '0') is likely the face/mouth
           // Simulate mouth opening
           const mouthOpen = (Math.sin(t * 15) + 1) * 0.5;
           obj.morphTargetInfluences[1] = THREE.MathUtils.lerp(obj.morphTargetInfluences[1], mouthOpen, 0.3);
           obj.morphTargetInfluences[2] = THREE.MathUtils.lerp(obj.morphTargetInfluences[2], mouthOpen * 0.3, 0.3);
        } else if (!isSpeaking && obj.name === '0') {
           obj.morphTargetInfluences[1] = THREE.MathUtils.lerp(obj.morphTargetInfluences[1], 0, 0.1);
        }

        // 3. Emotions (Mapped to morph targets 6, 7, 8)
        if (obj.name === '0') {
          // Reset all emotion morphs first or lerp them to 0
          const happyVal = (emotion === 'happy' || emotion === 'joy') ? 0.8 : 0;
          const sadVal = (emotion === 'sad') ? 0.8 : 0;
          const angryVal = (emotion === 'angry') ? 0.8 : 0;

          obj.morphTargetInfluences[6] = THREE.MathUtils.lerp(obj.morphTargetInfluences[6], happyVal, 0.1);
          obj.morphTargetInfluences[7] = THREE.MathUtils.lerp(obj.morphTargetInfluences[7], sadVal, 0.1);
          obj.morphTargetInfluences[8] = THREE.MathUtils.lerp(obj.morphTargetInfluences[8], angryVal, 0.1);

          // Legacy smile index (3) - keeping for compatibility or extra flair
          obj.morphTargetInfluences[3] = THREE.MathUtils.lerp(obj.morphTargetInfluences[3], happyVal * 0.5, 0.1);
        }
      }
    });

    // Subtle breathing/floating
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.5) * 0.05;
    }
  });

  // Mouse tracking for the head
  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.mouse;

    // Find the head bone if possible, or just rotate the group slightly
    // For this model, let's rotate the whole character slightly towards mouse
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.3, 0.1);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.2, 0.1);
  });

  // Scale: The model is ~150 units tall. We want it to be ~2 units tall in our view.
  // 2 / 150 = 0.0133
  const baseScale = 0.012;

  return (
    <group ref={group} scale={baseScale} dispose={null}>
      <Center top>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

const Elysia3D: React.FC<Elysia3DProps> = (props) => {
  const { debugMorphIndex } = props;
  return (
    <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0.5, 4]} fov={45} />

        <ambientLight intensity={0.6} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <directionalLight position={[0, 5, 5]} intensity={1} />

        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
            <Model {...props} />
          </Float>
          <Environment preset="city" />
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Elysia3D;
