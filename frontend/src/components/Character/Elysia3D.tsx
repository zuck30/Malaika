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
}

const Model = ({ emotion, isSpeaking, isListening }: Elysia3DProps) => {
  const group = useRef<THREE.Group>(null);
  const { animations, scene } = useGLTF("/models/elysia_v3.glb") as any;
  const { actions } = useAnimations(animations, group);

  // Optimize and enhance materials for a high-quality "designed" look
  useEffect(() => {
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        // Hide irrelevant helper/grid meshes
        if (obj.name.toLowerCase().includes('base_mesh') ||
            obj.name.toLowerCase().includes('line_gp') ||
            obj.name.toLowerCase().includes('grid')) {
          obj.visible = false;
        }

        if (obj.material) {
          obj.material.roughness = 0.4;
          obj.material.metalness = 0.2;
          obj.material.envMapIntensity = 1.2;
          if (obj.material.map) {
            obj.material.map.anisotropy = 16;
          }
        }

        // Enable casting and receiving shadows for depth
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
  }, [scene]);

  // Handle Animations: Sync idle animation with speaking state
  useEffect(() => {
    const idleAction = actions['Take 001'];
    if (idleAction) {
      idleAction.reset().fadeIn(0.5).play();
      // Increase movement speed slightly when speaking for a more dynamic feel
      idleAction.timeScale = isSpeaking ? 1.2 : 0.8;
    }
  }, [actions, isSpeaking]);

  // Handle Morph Targets for Expressions, Speech, and Blinking
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    scene.traverse((obj: any) => {
      if (obj instanceof THREE.Mesh && obj.morphTargetInfluences) {
        // Targets found on Object_69, Object_70, Object_71
        const isHeadMesh = obj.name === 'Object_69' || obj.name === 'Object_70' || obj.name === 'Object_71';

        if (isHeadMesh) {
          // 1. Natural Blinking (Index 0)
          const blinkBase = Math.sin(t * 0.8) > 0.985 ? 1 : 0;
          obj.morphTargetInfluences[0] = THREE.MathUtils.lerp(obj.morphTargetInfluences[0], blinkBase, 0.4);

          // 2. Dynamic Speech Animation (Index 1 & 2)
          if (isSpeaking) {
            const mouthA = (Math.sin(t * 15) + 1) * 0.45;
            const mouthE = (Math.cos(t * 12) + 1) * 0.25;
            obj.morphTargetInfluences[1] = THREE.MathUtils.lerp(obj.morphTargetInfluences[1], mouthA, 0.4);
            obj.morphTargetInfluences[2] = THREE.MathUtils.lerp(obj.morphTargetInfluences[2], mouthE, 0.4);
          } else {
            obj.morphTargetInfluences[1] = THREE.MathUtils.lerp(obj.morphTargetInfluences[1], 0, 0.2);
            obj.morphTargetInfluences[2] = THREE.MathUtils.lerp(obj.morphTargetInfluences[2], 0, 0.2);
          }

          // 3. Emotion Mapping (6: Happy, 7: Sad, 8: Angry, 9: Surprised)
          const emotions = {
            happy: (emotion === 'happy' || emotion === 'joy' || emotion === 'loving') ? 0.9 : 0,
            sad: (emotion === 'sad' || emotion === 'bored' || emotion === 'anxious') ? 0.9 : 0,
            angry: (emotion === 'angry' || emotion === 'annoyed') ? 0.9 : 0,
            surprised: (emotion === 'surprised' || emotion === 'curious' || emotion === 'confused') ? 0.8 : 0,
          };

          obj.morphTargetInfluences[6] = THREE.MathUtils.lerp(obj.morphTargetInfluences[6], emotions.happy, 0.1);
          obj.morphTargetInfluences[7] = THREE.MathUtils.lerp(obj.morphTargetInfluences[7], emotions.sad, 0.1);
          obj.morphTargetInfluences[8] = THREE.MathUtils.lerp(obj.morphTargetInfluences[8], emotions.angry, 0.1);
          obj.morphTargetInfluences[9] = THREE.MathUtils.lerp(obj.morphTargetInfluences[9], emotions.surprised, 0.1);

          // Subtle blend: slightly happy eyes when surprised
          if (emotion === 'surprised') {
            obj.morphTargetInfluences[6] = THREE.MathUtils.lerp(obj.morphTargetInfluences[6], 0.3, 0.1);
          }
        }
      }
    });

    // Subtle breathing movement
    if (group.current) {
      group.current.position.y = Math.sin(t * 0.5) * 0.05;
    }
  });

  // Interactive head tracking: Follow user's cursor
  useFrame((state) => {
    if (!group.current) return;
    const { x, y } = state.mouse;
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.3, 0.1);
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.2, 0.1);
  });

  // Scale the high-resolution model to fit the viewport perfectly
  const baseScale = 2.2;

  return (
    <group ref={group} scale={baseScale} dispose={null}>
      <Center top>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

const Elysia3D: React.FC<Elysia3DProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[600px] relative">
      <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.3, 3.5], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.6} />
        <spotLight position={[5, 10, 5]} angle={0.3} penumbra={1} intensity={1.5} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.8} color="#e0f2fe" />
        <directionalLight position={[0, 5, 0]} intensity={0.4} />

        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
            <Model {...props} />
          </Float>
          <Environment preset="apartment" blur={0.8} />
          <ContactShadows
            position={[0, -1, 0]}
            opacity={0.5}
            scale={12}
            blur={2.5}
            far={4.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Elysia3D;
