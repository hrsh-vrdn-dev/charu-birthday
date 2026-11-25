import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, Html, ContactShadows } from '@react-three/drei';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { birthdayConfig as config } from './birthdayConfig';

const gold = '#a7f3d0';

function Tier({ radius, height, y, color }: { radius: number; height: number; y: number; color: string }) {
  return <group position={[0, y, 0]}>
    <mesh castShadow receiveShadow><cylinderGeometry args={[radius, radius * 1.04, height, 96, 1]}/><meshPhysicalMaterial color={color} roughness={.28} clearcoat={.3}/></mesh>
    <mesh position={[0, height / 2 + .01, 0]} castShadow><cylinderGeometry args={[radius * 1.01, radius * 1.01, .045, 96]}/><meshStandardMaterial color="#fff4f1" roughness={.25}/></mesh>
    <mesh position={[0, -height / 2 + .08, 0]}><torusGeometry args={[radius * .99, .045, 12, 96]}/><meshStandardMaterial color="#fff0ed" roughness={.3}/></mesh>
    {Array.from({ length: 10 }, (_, i) => <mesh key={i} position={[Math.sin(i * Math.PI / 5) * radius * .97, -height / 2 + .01, Math.cos(i * Math.PI / 5) * radius * .97]} castShadow><sphereGeometry args={[.07, 18, 18]}/><meshStandardMaterial color="#fff1ed" roughness={.26}/></mesh>)}
  </group>;
}

function CakeModel({ blown, candles }: { blown: boolean; candles: number }) {
  const group = useRef<THREE.Group>(null);
  const flameRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flameMaterials = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const extinguishAt = useRef<number | null>(null);
  useFrame(({ clock, pointer }) => {
    if (group.current) {
      group.current.rotation.y += (pointer.x * .28 - group.current.rotation.y) * .025;
      group.current.rotation.x += (-pointer.y * .08 - group.current.rotation.x) * .025;
      group.current.position.y = Math.sin(clock.elapsedTime * .65) * .045;
    }
    if (blown && extinguishAt.current === null) extinguishAt.current = clock.elapsedTime;
    const fade = extinguishAt.current === null ? 1 : Math.max(0, 1 - (clock.elapsedTime - extinguishAt.current) / .42);
    flameRefs.current.forEach((flame, i) => { if (flame) { const flicker = 1 + Math.sin(clock.elapsedTime * 12 + i * 3) * .1; flame.scale.set(flicker * fade, flicker * 1.5 * fade, flicker * fade); } });
    flameMaterials.current.forEach(material => { if (material) material.opacity = fade; });
  });
  const candlePositions = Array.from({ length: candles }, (_, i) => {
    const a = (i / candles) * Math.PI * 2;
    return [Math.sin(a) * .5, 2.56, Math.cos(a) * .5] as [number, number, number];
  });
  return <group ref={group}>
    <Tier radius={1.35} height={.8} y={.52} color="#f7fffb"/>
    <Tier radius={1.02} height={.75} y={1.28} color="#d8f5e8"/>
    <Tier radius={.68} height={.65} y={1.96} color="#effcf5"/>
    {[.91, 1.47, 2.01].map((y, i) => <mesh key={y} position={[0, y, 0]}><torusGeometry args={[(1.35 - i * .33) * .98, .035, 12, 96]}/><meshStandardMaterial color={gold} metalness={.65} roughness={.28}/></mesh>)}
    {Array.from({ length: 7 }, (_, i) => { const a = i * Math.PI * 2 / 7; const x = Math.sin(a) * .83; const z = Math.cos(a) * .83; return <group key={i} position={[x, 1.71 + (i % 2) * .08, z]} rotation={[0, a, -.3]}><mesh castShadow><sphereGeometry args={[.095, 20, 20]}/><meshPhysicalMaterial color="#ef6672" roughness={.25} clearcoat={.7}/></mesh><mesh position={[0, .1, 0]}><coneGeometry args={[.035, .14, 6]}/><meshStandardMaterial color="#32996a"/></mesh></group>; })}
    <Html position={[0, 1.28, 1.04]} center transform distanceFactor={5} occlude={false}><span className="cake-name-label">{config.name.toUpperCase()}</span></Html>
    {candlePositions.map(([x, y, z], i) => <group key={i} position={[x, y, z]}><mesh castShadow><cylinderGeometry args={[.055, .06, .48, 16]}/><meshStandardMaterial color={i % 2 ? '#8dd9b2' : '#f7fff9'} roughness={.35}/></mesh><mesh ref={node => { flameRefs.current[i] = node; }} position={[0, .3, 0]}><sphereGeometry args={[.075, 18, 18]}/><meshBasicMaterial ref={node => { flameMaterials.current[i] = node; }} transparent color="#ffb342"/></mesh><pointLight position={[0, .35, 0]} color="#ffb14d" intensity={blown ? 0 : 1.2} distance={1.5}/></group>)}
    <mesh position={[0, .015, 0]} castShadow><cylinderGeometry args={[1.52, 1.58, .12, 96]}/><meshStandardMaterial color="#d9b879" metalness={.65} roughness={.24}/></mesh>
  </group>;
}

function CakeCanvas({ blown, candles }: { blown: boolean; candles: number }) {
  return <Canvas shadows dpr={[1, 1.6]} camera={{ position: [0, 3.2, 7.5], fov: 36 }} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={1.1}/><hemisphereLight args={['#f2fff8', '#102d25', 1.4]}/>
    <spotLight position={[4, 7, 5]} intensity={100} angle={.45} penumbra={1} castShadow color="#d8fff0"/>
    <pointLight position={[-4, 3, -3]} intensity={35} color="#38c887"/>
    <CakeModel blown={blown} candles={candles}/>
    <Sparkles count={blown ? 110 : 55} scale={[5, 4, 5]} size={3} speed={.3} color="#a7f3d0"/>
    <ContactShadows position={[0, -.08, 0]} opacity={.5} scale={6} blur={2.6} far={3}/>
  </Canvas>;
}

function GiftModel({ opened, onOpen }: { opened: boolean; onOpen: () => void }) {
  const box = useRef<THREE.Group>(null); const lid = useRef<THREE.Group>(null);
  useFrame(({ clock, pointer }) => {
    if (box.current) { box.current.rotation.y = Math.sin(clock.elapsedTime * .35) * .16 + pointer.x * .2; box.current.position.y = Math.sin(clock.elapsedTime * .8) * .08; }
    if (lid.current) { lid.current.position.y += ((opened ? 2.35 : 1.34) - lid.current.position.y) * .07; lid.current.rotation.z += ((opened ? -.22 : 0) - lid.current.rotation.z) * .07; }
  });
  return <group ref={box} onClick={onOpen} onPointerOver={() => { document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = 'auto'; }}>
    {opened && <pointLight position={[0, 1.5, 0]} color="#d7ffeb" intensity={16} distance={5}/>}
    <mesh castShadow position={[0, .64, 0]}><boxGeometry args={[1.95, 1.3, 1.65]}/><meshPhysicalMaterial color="#087f5b" roughness={.26} metalness={.12} clearcoat={.55}/></mesh>
    <mesh position={[0, .65, .84]}><boxGeometry args={[.24, 1.28, .025]}/><meshStandardMaterial color={gold} metalness={.65} roughness={.25}/></mesh>
    <group ref={lid} position={[0, 1.34, 0]}><mesh castShadow><boxGeometry args={[2.12, .28, 1.82]}/><meshPhysicalMaterial color="#3eb489" roughness={.22} metalness={.2} clearcoat={.8}/></mesh><mesh position={[0, 0, .92]}><boxGeometry args={[.25, .3, .035]}/><meshStandardMaterial color={gold} metalness={.65}/></mesh><mesh position={[0, .25, 0]}><torusGeometry args={[.34, .07, 14, 36, Math.PI * 1.9]}/><meshStandardMaterial color={gold} metalness={.65} roughness={.22}/></mesh><mesh position={[0, .25, 0]} rotation={[0, Math.PI, 0]}><torusGeometry args={[.34, .07, 14, 36, Math.PI * 1.9]}/><meshStandardMaterial color="#effff7" metalness={.65} roughness={.22}/></mesh></group>
  </group>;
}

export function Gift3D({ opened, onOpen, className = '' }: { opened: boolean; onOpen: () => void; className?: string }) {
  return <div className={className}><Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 2.5, 5.7], fov: 38 }} gl={{ antialias: true, alpha: true }}>
    <ambientLight intensity={1.1}/><spotLight position={[4, 6, 5]} intensity={75} angle={.5} penumbra={1} castShadow color="#edfff5"/><pointLight position={[-3, 2, -1]} intensity={28} color="#53d39e"/>
    <Float speed={1.2} rotationIntensity={.12} floatIntensity={.3}><GiftModel opened={opened} onOpen={onOpen}/></Float>
    <Sparkles count={opened ? 150 : 60} scale={[4.8, 4.8, 4.8]} size={4} speed={.5} color="#b8ffe0"/><ContactShadows position={[0, -.12, 0]} opacity={.5} scale={5} blur={2.5}/>
  </Canvas></div>;
}

export function Cake3D({ blown, candles }: { blown: boolean; candles: number }) { return <div className="cake-canvas"><CakeCanvas blown={blown} candles={candles}/></div>; }

export function Particles3D({ className = '' }: { className?: string }) {
  const points = useMemo(() => { const values = new Float32Array(240 * 3); for (let i = 0; i < values.length; i++) values[i] = (Math.random() - .5) * 12; return values; }, []);
  return <div className={className} aria-hidden="true"><Canvas camera={{ position: [0, 0, 7], fov: 60 }} gl={{ alpha: true, antialias: false }}><points><bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]}/></bufferGeometry><pointsMaterial size={.025} color="#ead2ff" transparent opacity={.65} sizeAttenuation/></points></Canvas></div>;
}
