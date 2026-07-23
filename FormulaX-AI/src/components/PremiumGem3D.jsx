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
    <mesh ref={meshRef} scale={1.15}>
      <icosahedronGeometry args={[1.2, 0]} />
      <MeshDistortMaterial
        color="#F59E0B"
        emissive="#D97706"
        emissiveIntensity={0.35}
        metalness={0.85}
        roughness={0.1}
        distort={0.2}
        speed={reducedMotion ? 0 : 1.5}
      />
    </mesh>
  );
}

// Vòng hào quang xoay quanh viên đá — tự quay ngược chiều gem để tạo cảm giác chuyển
// động lớp lang, giống huy hiệu/hào quang thay vì chỉ 1 khối tĩnh.
function HaloRing({ reducedMotion }) {
  const ringRef = useRef();
  useFrame((_, delta) => {
    if (reducedMotion || !ringRef.current) return;
    ringRef.current.rotation.z -= delta * 0.25;
  });
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[1.85, 0.035, 16, 100]} />
      <meshStandardMaterial color="#FCD34D" emissive="#F59E0B" emissiveIntensity={0.6} metalness={0.9} roughness={0.25} />
    </mesh>
  );
}

function Scene({ reducedMotion }) {
  const gem = (
    <Float speed={reducedMotion ? 0 : 1.8} rotationIntensity={reducedMotion ? 0 : 0.6} floatIntensity={reducedMotion ? 0 : 0.8}>
      <Gem reducedMotion={reducedMotion} />
      <HaloRing reducedMotion={reducedMotion} />
    </Float>
  );

  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 3, 3]} intensity={1.6} color="#FEF3C7" />
      <pointLight position={[-3, -2, -2]} intensity={0.6} color="#60A5FA" />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      <Sparkles count={70} scale={3.6} size={3} speed={reducedMotion ? 0 : 0.45} color="#FDE68A" />
      <Sparkles count={25} scale={4.2} size={5} speed={reducedMotion ? 0 : 0.25} color="#FFFFFF" />
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
