import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Environment, PresentationControls, MeshDistortMaterial } from "@react-three/drei";

// Viên đá quý xoay — biểu tượng chính của trang Premium, dùng đúng 2 màu amber/gold
// đã có sẵn trong design token (--color-accent/--color-premium), không bịa màu mới.
function Gem({ reducedMotion }) {
  const meshRef = useRef();

  useFrame((_, delta) => {
    if (reducedMotion || !meshRef.current) return;
    meshRef.current.rotation.y += delta * 0.3;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.2, 0]} />
      <MeshDistortMaterial
        color="#F59E0B"
        emissive="#D97706"
        emissiveIntensity={0.15}
        metalness={0.75}
        roughness={0.15}
        distort={0.2}
        speed={reducedMotion ? 0 : 1.5}
      />
    </mesh>
  );
}

function Scene({ reducedMotion }) {
  const gem = (
    <Float speed={reducedMotion ? 0 : 1.8} rotationIntensity={reducedMotion ? 0 : 0.6} floatIntensity={reducedMotion ? 0 : 0.8}>
      <Gem reducedMotion={reducedMotion} />
    </Float>
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color="#FEF3C7" />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <Sparkles count={40} scale={3.2} size={2.5} speed={reducedMotion ? 0 : 0.4} color="#FDE68A" />
      {reducedMotion ? (
        gem
      ) : (
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-0.3, 0.3]}
          azimuth={[-0.6, 0.6]}
          config={{ mass: 1, tension: 170, friction: 26 }}
        >
          {gem}
        </PresentationControls>
      )}
    </>
  );
}

export default function PremiumGem3D({ size = 220 }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ width: size, height: size }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 4], fov: 40 }} gl={{ antialias: true, alpha: true }}>
        <Scene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
