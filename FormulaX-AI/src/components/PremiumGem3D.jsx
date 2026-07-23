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

// Vòng hào quang xoay quanh viên đá — CHỈ tự xoay quanh trục Z của chính nó, KHÔNG nằm
// trong Float (khác với Gem) nên góc nghiêng luôn cố định, không bị Float làm chao đảo
// khiến có lúc nhìn gần như cạnh (edge-on) trông như bị "đứt" cắt ngang qua viên đá.
// Góc nghiêng gần 90° (nhìn gần như cạnh) để trông NGANG qua "eo" viên đá kiểu vành đai
// sao Thổ, chỉ xéo nhẹ — trước đây từng để góc này cao nhưng gộp chung Float nên chao đảo
// gây lỗi, giờ đã tách riêng nên nghiêng sâu vẫn ổn định, không còn bị "đứt".
// Bán kính đủ lớn để bao trọn viên đá, không cắt vào thân đá ở góc nhìn nào.
function HaloRing({ reducedMotion }) {
  const ringRef = useRef();
  useFrame((_, delta) => {
    if (reducedMotion || !ringRef.current) return;
    ringRef.current.rotation.z -= delta * 0.25;
  });
  return (
    <mesh ref={ringRef} rotation={[Math.PI / 2.35, 0.1, 0]}>
      <torusGeometry args={[2.15, 0.04, 16, 100]} />
      <meshStandardMaterial color="#FCD34D" emissive="#F59E0B" emissiveIntensity={0.6} metalness={0.9} roughness={0.25} />
    </mesh>
  );
}

// Cụm viên đá + vòng hào quang được đẩy lên phía trên (position Y dương) trong khung hình
// full-bleed rộng hơn, để giữ đúng vị trí thị giác cũ (phía trên tiêu đề) thay vì rơi vào
// giữa khung — kích thước bản thân viên đá không đổi, chỉ khung canvas rộng ra.
function GemGroup({ reducedMotion }) {
  return (
    <group position={[0, 1.5, 0]}>
      <Float speed={reducedMotion ? 0 : 1.8} rotationIntensity={reducedMotion ? 0 : 0.6} floatIntensity={reducedMotion ? 0 : 0.8}>
        <Gem reducedMotion={reducedMotion} />
      </Float>
      <HaloRing reducedMotion={reducedMotion} />
    </group>
  );
}

function Scene({ reducedMotion }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <pointLight position={[3, 4, 3]} intensity={1.6} color="#FEF3C7" />
      <pointLight position={[-3, 0, -2]} intensity={0.6} color="#60A5FA" />
      <Suspense fallback={null}>
        <Environment preset="city" />
      </Suspense>
      {/* Sao trải khắp toàn bộ khung — canvas giờ full-bleed nên scale phải đủ lớn để phủ kín,
          không chỉ co cụm quanh viên đá như trước. */}
      <Sparkles count={160} scale={[9, 11, 5]} size={2.6} speed={reducedMotion ? 0 : 0.4} color="#FDE68A" />
      <Sparkles count={70} scale={[9, 11, 5]} size={4.5} speed={reducedMotion ? 0 : 0.22} color="#FFFFFF" />
      {reducedMotion ? (
        <GemGroup reducedMotion={reducedMotion} />
      ) : (
        <PresentationControls
          global
          rotation={[0, 0, 0]}
          polar={[-0.3, 0.3]}
          azimuth={[-0.6, 0.6]}
          config={{ mass: 1, tension: 170, friction: 26 }}
        >
          <GemGroup reducedMotion={reducedMotion} />
        </PresentationControls>
      )}
    </>
  );
}

// Full-bleed — lấp đầy trọn khung chứa (hero banner), không còn là ô vuông nhỏ cố định.
// Camera lùi xa hơn để giữ đúng kích thước viên đá trên màn hình dù khung canvas rộng ra
// nhiều so với trước (260x260 → nguyên khung hero).
export default function PremiumGem3D() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 13], fov: 32 }} gl={{ antialias: true, alpha: true }}>
        <Scene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}
