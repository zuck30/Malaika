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
      <div className="text-white text-xl font-bold bg-black/50 p-4 rounded">
        Loading Elysia...
      </div>
    </Html>
  );
}

const ElysiaModel: React.FC<ElysiaCharacterProps> = ({ isSpeaking, isListening }) => {
  const modelRef = useRef<THREE.Group>(null!);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const gltf = useLoader(GLTFLoader, '/models/elysia_v3.glb');

  useEffect(() => {
    if (!gltf?.scene) return;

    console.log('Animations found:', gltf.animations?.length || 0);

    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(gltf.scene);
      mixerRef.current = mixer;
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
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

  useFrame((state, delta) => {
    const group = modelRef.current;
    if (!group) return;

    const time = state.clock.elapsedTime;

    group.position.y = -1.5 + Math.sin(time * 1.5) * 0.01;

    const baseRotationY = Math.PI;
    const targetRotY = baseRotationY + (mousePos.x * 0.3);
    const targetRotX = mousePos.y * 0.15;

    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, targetRotY, 0.05);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, targetRotX, 0.05);

    if (isSpeaking) {
      group.position.y += Math.sin(time * 12) * 0.015;
    }
    
    if (isListening) {
      group.rotation.z = Math.sin(time * 2.5) * 0.03;
    } else {
      group.rotation.z = THREE.MathUtils.lerp(group.rotation.z, 0, 0.1);
    }

    mixerRef.current?.update(delta);
  });

  return (
    <primitive 
      ref={modelRef}
      object={gltf.scene} 
      scale={1.3} 
      position={[0, -1.5, 0]} 
      rotation={[0, Math.PI, 0]}
    />
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
          outputColorSpace: THREE.SRGBColorSpace 
        }}
      >
        <ambientLight intensity={0.7} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, 5, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          <ElysiaModel {...props} />
          <Environment preset="city" />
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