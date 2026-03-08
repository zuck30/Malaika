import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Environment, Html, OrbitControls } from '@react-three/drei';
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
      <div className="text-white text-xl font-bold bg-black/50 p-4 rounded">Loading Elysia...</div>
    </Html>
  );
}

const ElysiaModel: React.FC<ElysiaCharacterProps> = ({ emotion, isSpeaking, isListening }) => {
  const modelRef = useRef<THREE.Group>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<{ [key: string]: THREE.AnimationAction }>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const gltf = useLoader(GLTFLoader, '/models/elysia_v3.glb');

  useEffect(() => {
    if (!gltf?.scene) return;

    console.log('Animations found:', gltf.animations?.map(a => a.name));

    // Log morph targets
    gltf.scene.traverse((obj: any) => {
      if (obj.morphTargetDictionary) {
        console.log('Morph targets for', obj.name, obj.morphTargetDictionary);
      }
    });

    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      mixerRef.current = mixer;

      gltf.animations.forEach(clip => {
        actionsRef.current[clip.name] = mixer.clipAction(clip);
      });

      // Default idle
      const idleClip = gltf.animations.find(a =>
        a.name.toLowerCase().includes('idle') ||
        a.name.toLowerCase().includes('base')
      ) || gltf.animations[0];

      if (idleClip) {
        actionsRef.current[idleClip.name].play();
      }

      mixer.update(0.01);
    } else {
      console.log('No animations, arms down');
      gltf.scene.traverse((obj: any) => {
        if (!obj.isBone) return;
        const name = obj.name.toLowerCase();

        if (name.includes('upperarm') || name.includes('upper_arm')) {
          obj.rotation.x = Math.PI / 2;
          obj.rotation.z = 0;
          obj.rotation.y = 0;
        }

        if (name.includes('lowerarm') || name.includes('lower_arm')) {
          obj.rotation.x = 0;
          obj.rotation.z = 0;
          obj.rotation.y = 0;
        }

        if (name.includes('hand') && !name.includes('wrist')) {
          obj.rotation.x = 0;
          obj.rotation.y = 0;
          obj.rotation.z = 0;
        }
      });
    }

    return () => {
      mixerRef.current?.stopAllAction();
    };
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

  useEffect(() => {
    if (!gltf?.scene) return;

    const emotionMorphs: { [key: string]: { [key: string]: number } } = {
      joy: { 'Fcl_ALL_Joy': 1, 'Fcl_MTH_Joy': 1, 'Fcl_EYE_Joy': 1 },
      sadness: { 'Fcl_ALL_Sorrow': 1, 'Fcl_MTH_Sorrow': 1, 'Fcl_EYE_Sorrow': 1 },
      anger: { 'Fcl_ALL_Angry': 1, 'Fcl_MTH_Angry': 1, 'Fcl_EYE_Angry': 1 },
      surprise: { 'Fcl_ALL_Surprised': 1, 'Fcl_MTH_Surprised': 1, 'Fcl_EYE_Surprised': 1 },
      neutral: { 'Fcl_ALL_Neutral': 1 },
      kiss: { 'Fcl_MTH_U': 1, 'Fcl_EYE_Joy': 0.5 },
      excited: { 'Fcl_ALL_Fun': 1, 'Fcl_MTH_Fun': 1, 'Fcl_EYE_Fun': 1 },
      love: { 'Fcl_ALL_Joy': 1, 'Fcl_EYE_Joy': 1, 'Fcl_MTH_Small': 0.5 }
    };

    const targetMorphs = emotionMorphs[emotion] || emotionMorphs['neutral'];

    gltf.scene.traverse((obj: any) => {
      if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
        const dict = obj.morphTargetDictionary;

        // Reset all emotion-related morphs first (keep speech ones)
        Object.keys(dict).forEach(key => {
          if (key.startsWith('Fcl_ALL_') || key.startsWith('Fcl_BRW_') || key.startsWith('Fcl_EYE_') || (key.startsWith('Fcl_MTH_') && !['Fcl_MTH_A', 'Fcl_MTH_I', 'Fcl_MTH_U', 'Fcl_MTH_E', 'Fcl_MTH_O'].includes(key))) {
             const idx = dict[key];
             obj.morphTargetInfluences[idx] = THREE.MathUtils.lerp(obj.morphTargetInfluences[idx], 0, 1.0);
          }
        });

        // Apply new ones
        Object.entries(targetMorphs).forEach(([name, val]) => {
          if (dict[name] !== undefined) {
            obj.morphTargetInfluences[dict[name]] = val;
          }
        });
      }
    });

    // Also handle animations if available
    if (!mixerRef.current) return;
    const emotionMap: { [key: string]: string } = {
      joy: 'happy',
      sadness: 'sad',
      anger: 'angry',
      surprise: 'surprised',
      kiss: 'kiss',
      excited: 'excited',
      love: 'love',
    };
    const animName = emotionMap[emotion] || 'idle';
    const targetAction = Object.keys(actionsRef.current).find(name =>
      name.toLowerCase().includes(animName)
    );
    if (targetAction) {
      const action = actionsRef.current[targetAction];
      action.reset().fadeIn(0.5).play();
      Object.entries(actionsRef.current).forEach(([name, act]) => {
        if (name !== targetAction) act.fadeOut(0.5);
      });
    }
  }, [emotion, gltf]);

  useFrame((state, delta) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    // Lip sync / Mouth movement using model-specific targets (Fcl_MTH_A, Fcl_MTH_O)
    group.traverse((obj: any) => {
      if (obj.morphTargetDictionary && obj.morphTargetInfluences) {
        const dict = obj.morphTargetDictionary;
        const mthA = dict['Fcl_MTH_A'];
        const mthO = dict['Fcl_MTH_O'];
        const mthI = dict['Fcl_MTH_I'];
        const mthE = dict['Fcl_MTH_E'];
        const mthU = dict['Fcl_MTH_U'];

        if (mthA !== undefined) {
          if (isSpeaking) {
            // More dynamic viseme cycling for natural talking feel
            // Speed adjusted to match faster AvaNeural voice (roughly 12-18Hz)
            const speed = 16;
            const waveA = Math.sin(time * speed);
            const waveO = Math.cos(time * speed * 0.8);
            const waveI = Math.sin(time * speed * 1.2);

            const intensity = 0.6 + Math.random() * 0.4;

            obj.morphTargetInfluences[mthA] = THREE.MathUtils.lerp(
              obj.morphTargetInfluences[mthA],
              Math.max(0, waveA) * intensity,
              0.4
            );

            if (mthO !== undefined) {
              obj.morphTargetInfluences[mthO] = THREE.MathUtils.lerp(
                obj.morphTargetInfluences[mthO],
                Math.max(0, waveO) * intensity * 0.4,
                0.3
              );
            }

            if (mthI !== undefined) {
                obj.morphTargetInfluences[mthI] = THREE.MathUtils.lerp(
                  obj.morphTargetInfluences[mthI],
                  Math.max(0, waveI) * intensity * 0.2,
                  0.3
                );
            }
          } else {
            // Close mouth
            [mthA, mthO, mthI, mthE, mthU].forEach(idx => {
              if (idx !== undefined) {
                obj.morphTargetInfluences[idx] = THREE.MathUtils.lerp(obj.morphTargetInfluences[idx], 0, 0.2);
              }
            });
          }
        }
      }
    });

    group.position.y = -1.5 + Math.sin(time * 1.5) * 0.01;

    const baseRotationY = Math.PI;
    const targetRotY = baseRotationY + mousePos.x * 0.3;
    const targetRotX = mousePos.y * 0.15;

    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.05);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.05);

    if (isSpeaking) {
      // Body "pulse" and natural head tilt when speaking
      group.position.y += Math.sin(time * 8) * 0.005;
      group.rotation.x += Math.sin(time * 4) * 0.015;
      group.rotation.z += Math.cos(time * 3) * 0.01; // Subtle side tilt
    } else {
        // Natural idle breathing/sway
        group.position.y += Math.sin(time * 1.5) * 0.002;
        group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, Math.sin(time * 0.8) * 0.005, 0.05);
    }

    if (isListening) {
      group.rotation.z = Math.sin(time * 2.5) * 0.03;
      group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, 0.1, 0.1); // Lean in slightly
    }

    mixerRef.current?.update(delta);
  });

  return (
    <primitive ref={modelRef} object={gltf.scene} scale={1.3} position={[0, -1.5, 0]} rotation={[0, Math.PI, 0]} />
  );
};

const ElysiaCharacter3D: React.FC<ElysiaCharacterProps> = (props) => {
  return (
    <div className="relative w-full h-full min-h-[600px] bg-transparent">
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{
          alpha: true,
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
      >
        {/* Brighter lights for light background */}
        <ambientLight intensity={1.2} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
        <pointLight position={[-10, 5, -10]} intensity={0.8} />

        <Suspense fallback={<Loader />}>
          <ElysiaModel {...props} />
          <Environment preset="apartment" />
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            target={[0, 0, 0]}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.5}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ElysiaCharacter3D;