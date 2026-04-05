import { useRef, useEffect, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Center, Svg } from '@react-three/drei';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Text Data ────────────────────────────────────────────────────────────

const FEATURES = [
  {
    eyebrow: "The Sealing Ritual",
    headline: "Choose your parchment.",
    body: "Customize the physical delivery. Select from 3 premium envelope colors: Classic Parchment, Forest Green, or Midnight Blue to set the atmosphere.",
  },
  {
    eyebrow: "The Sealing Ritual",
    headline: "Secure the contents.",
    body: "Your unedited honesty is folded away. The physical action of sealing ensures your words are locked safely from second-guessing.",
  },
  {
    eyebrow: "The Sealing Ritual",
    headline: "The Wax Seal.",
    body: "Select your signature. Choose between 5 bespoke wax seal designs: a Flower, Infinity Heart, Floral Sprig, classic Heart, or your personal Monogram.",
  },
  {
    eyebrow: "The Sealing Ritual",
    headline: "Stamped in wax.",
    body: "Melt and cast. Choose from 5 wax colors: Classic Red, Deep Burgundy, Gold, Forest Green, or Navy. Hear the paper tear when it's finally sealed.",
  },
];

// ── 3D Scene Components ──────────────────────────────────────────────────

function FlapGeometry({ points }: { points: [number, number][] }) {
  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(points[0][0], points[0][1]);
    for(let i=1; i<points.length; i++) {
        shape.lineTo(points[i][0], points[i][1]);
    }
    shape.lineTo(points[0][0], points[0][1]);
    
    // Extrude for physical thickness WITHOUT expanding edge alignments
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.002,
      bevelEnabled: false
    });
    geometry.computeVertexNormals();
    return geometry;
  }, [JSON.stringify(points)]);

  return <primitive object={geom} attach="geometry" dispose={null} />;
}

function EnvelopeExteriorMaterial() {
  return <meshStandardMaterial color="#f3cf8c" roughness={0.9} side={THREE.DoubleSide} />;
}

function EnvelopeInteriorMaterial() {
  return <meshStandardMaterial color="#e2a54a" roughness={1.0} />;
}

function WaxSeal() {
  // Using Svg and Center components from drei for perfect scaling and transparency
  return (
    <group>
      <mesh receiveShadow castShadow rotation={[Math.PI/2, 0, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.03, 32]} />
        <meshStandardMaterial color="#9b111e" roughness={0.2} metalness={0.1} />
      </mesh>
      <Center position={[0, 0, 0.016]}>
        <Svg src="/assets/seals/heart.svg" scale={0.0016} /> 
      </Center>
    </group>
  );
}


interface EnvelopeSceneProps {
  progressRef: React.MutableRefObject<number>;
}

function EnvelopeScene({ progressRef }: EnvelopeSceneProps) {
  // Reduced scale standard envelope
  const w = 3.6;
  const h = 2.4;

  // Exact coordinates forming perfect CCW triangles for each flap
  const pointsTop = [ [1.8, 0], [0, 1.5], [-1.8, 0] ] as [number, number][];
  const pointsBottom = [ [1.8, 0], [-1.8, 0], [0, -1.25] ] as [number, number][];
  const pointsLeft = [ [0, 1.2], [-1.8, 0], [0, -1.2] ] as [number, number][];
  const pointsRight = [ [0, 1.2], [0, -1.2], [1.8, 0] ] as [number, number][];

  // Refs for animation
  const containerGroup = useRef<THREE.Group>(null);
  const leftFlap = useRef<THREE.Group>(null);
  const rightFlap = useRef<THREE.Group>(null);
  const bottomFlap = useRef<THREE.Group>(null);
  const topFlap = useRef<THREE.Group>(null);
  const sealGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = progressRef.current; // 0 to 1
    
    // Beat 1: Side Flaps fold together (0.1 to 0.3)
    const p1 = Math.min(Math.max((p - 0.1) / 0.2, 0), 1);
    if (leftFlap.current) leftFlap.current.rotation.y = p1 * Math.PI;
    if (rightFlap.current) rightFlap.current.rotation.y = p1 * -Math.PI;

    // Beat 2: Bottom Flap folds (0.3 to 0.5)
    const p2 = Math.min(Math.max((p - 0.3) / 0.2, 0), 1);
    if (bottomFlap.current) bottomFlap.current.rotation.x = p2 * -Math.PI;

    // Beat 3: Top Flap folds (0.5 to 0.7)
    const p3 = Math.min(Math.max((p - 0.5) / 0.2, 0), 1);
    if (topFlap.current) topFlap.current.rotation.x = p3 * Math.PI;

    // Beat 4: Wax Seal Pop (0.7 to 0.9)
    const p4 = Math.min(Math.max((p - 0.7) / 0.2, 0), 1);
    if (sealGroup.current) {
        // slight bounce effect
        const scale = p4 > 0 ? p4 + Math.sin(p4 * Math.PI) * 0.2 : 0;
        sealGroup.current.scale.setScalar(Math.max(scale, 0));
    }

    if (containerGroup.current) {
      containerGroup.current.position.y = Math.sin(Date.now() / 2000) * 0.05;
    }
  });

  return (
    <group ref={containerGroup} rotation={[0, 0, 0]}>
      
      <ambientLight intensity={0.6} color="#ffffff" />
      <directionalLight 
        position={[4, 6, 4]} 
        intensity={1.2} 
        color="#fffaf0" 
        castShadow 
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.001}
      />
      <pointLight position={[-4, -2, 3]} intensity={0.4} color="#e0a15e" />

      {/* Envelope Backed Base (Interior Layer) */}
      <mesh receiveShadow position={[0, 0, -0.008]}>
        <boxGeometry args={[w, h, 0.002]} />
        <EnvelopeInteriorMaterial />
      </mesh>
      
      {/* Envelope Backed Base (Exterior Layer) */}
      <mesh receiveShadow position={[0, 0, -0.012]}>
        <boxGeometry args={[w, h, 0.002]} />
        <EnvelopeExteriorMaterial />
      </mesh>

      {/* Flaps perfectly layered atop one another (Trapezoids) */}
      <group position={[-w/2, 0, 0.005]} ref={leftFlap}>
        <mesh receiveShadow castShadow>
          <FlapGeometry points={pointsLeft} />
          <EnvelopeExteriorMaterial />
        </mesh>
      </group>

      <group position={[w/2, 0, 0.010]} ref={rightFlap}>
        <mesh receiveShadow castShadow>
          <FlapGeometry points={pointsRight} />
          <EnvelopeExteriorMaterial />
        </mesh>
      </group>

      <group position={[0, -h/2, 0.015]} ref={bottomFlap}>
        <mesh receiveShadow castShadow>
          <FlapGeometry points={pointsBottom} />
          <EnvelopeExteriorMaterial />
        </mesh>
      </group>

      <group position={[0, h/2, 0.020]} ref={topFlap}>
        <mesh receiveShadow castShadow>
          <FlapGeometry points={pointsTop} />
          <EnvelopeExteriorMaterial />
        </mesh>
      </group>

      {/* Wax Seal Overlay */}
      <group position={[0, -0.1, 0.025]} ref={sealGroup} scale={0}>
        <Suspense fallback={null}>
          <WaxSeal />
        </Suspense>
      </group>

    </group>
  );
}

// ── Main Layout Component ────────────────────────────────────────────────

export function ThreeEnvelopeShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  // Progress tracker for Three.js
  const progress = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // The Scrub Timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth dampening
          onUpdate: (self) => {
            progress.current = self.progress;
          }
        },
      });

      // Initially hide all text elements
      gsap.set(textsRef.current, { opacity: 0, y: 30 });

      // Build 4 text fade-ins synced to the 4 geometric events
      FEATURES.forEach((_, i) => {
        // Space them evenly with a 10% root delay buffer
        const startTime = 0.1 + i * 0.2;
        tl.to(textsRef.current[i], { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' }, startTime)
          .to(textsRef.current[i], { opacity: 0, y: -20, duration: 0.08, ease: 'power2.in' }, startTime + 0.17);
      });

    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="tes-root" aria-label="Feature Showcase">
      <div ref={containerRef} className="tes-sticky">
        
        {/* Left Half: 3D Canvas */}
        <div className="tes-left">
          <div className="tes-canvas-wrapper">
            <Canvas 
              camera={{ position: [0, 0, 9], fov: 40 }}
              shadows
              dpr={[1, 1.5]}
              gl={{ antialias: true }}
            >
              <Suspense fallback={null}>
                <Environment preset="city" environmentIntensity={0.2} />
                <EnvelopeScene progressRef={progress} />
              </Suspense>
            </Canvas>
          </div>
        </div>

        {/* Right Half: Synced HTML Copy */}
        <div className="tes-right">
          {FEATURES.map((feature, i) => (
            <div 
              key={i} 
              className="tes-beat-content"
              ref={(el) => { textsRef.current[i] = el; }}
            >
              <p className="tes-eyebrow">{feature.eyebrow}</p>
              <h3 className="tes-headline">{feature.headline}</h3>
              <p className="tes-body">{feature.body}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default ThreeEnvelopeShowcase;
