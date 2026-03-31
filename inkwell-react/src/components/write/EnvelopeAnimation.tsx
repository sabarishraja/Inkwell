/**
 * EnvelopeAnimation.tsx
 *
 * Full-screen React Three Fiber scene.  We look at the BACK of the envelope —
 * the sealing side.  The side and bottom flaps are already tucked in (shown as
 * triangular fold overlays forming a diamond pattern).  The sequence:
 *
 *   0.0 – 1.4s  : letter slides down into the open envelope
 *   1.4 – 2.6s  : top flap hinges downward and seals the back
 *   2.8 – 3.8s  : wax seal (with the user's chosen design) stamps down
 *   4.2 – 5.8s  : sealed envelope tilts and flies up off-screen
 *   6.0s        : onComplete fires → navigation to /reflection
 *
 * Z-ordering (all local to root group, camera at z=5):
 *   z = 0.00  Front panel  (address side, faces away from camera)
 *   z = 0.03  Letter       (slides from y=1.2 → y=-0.2)
 *   z = 0.06  Back panel   (sealing side — masks letter once it enters)
 *   z = 0.07  Fold overlays  (side + bottom tucked flaps, diamond pattern)
 *   z = 0.08  Top flap     (hinges at y=0.8, folds downward to close)
 *   z = 0.10  Wax seal     (wax disc + design overlay)
 */

import { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { WAX_COLORS } from './SealPicker';
import type { SealColor, SealDesign, EnvelopeColor } from '../../types/letter';

// ── Types ──────────────────────────────────────────────────────────────────

interface EnvelopeAnimationProps {
  sealColor:     SealColor;
  sealDesign:    SealDesign;
  monogram:      string;
  envelopeColor: EnvelopeColor;
  onComplete:    () => void;
}

interface EnvelopeTheme {
  back:  string;   // back panel (what the camera sees)
  front: string;   // front/address panel (barely visible)
  flap:  string;   // top flap
  fold:  string;   // already-tucked side + bottom fold overlays
}

interface SceneProps {
  waxHex:     string;
  textureUrl: string;
  theme:      EnvelopeTheme;
  onComplete: () => void;
}

// ── Envelope colour themes ─────────────────────────────────────────────────

const ENVELOPE_THEMES: Record<EnvelopeColor, EnvelopeTheme> = {
  'parchment':     { back: '#F0DEB4', front: '#D9C38A', flap: '#F5E8C2', fold: '#D8C090' },
  'forest-green':  { back: '#2E5D35', front: '#1E3E25', flap: '#386842', fold: '#243D2A' },
  'midnight-blue': { back: '#1E2D4A', front: '#141E32', flap: '#253660', fold: '#15203C' },
};

// ── Easing helpers ─────────────────────────────────────────────────────────

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutBack(t: number): number {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function norm(t: number, a: number, b: number): number {
  return Math.max(0, Math.min(1, (t - a) / (b - a)));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── Seal texture URL builder ───────────────────────────────────────────────
//
// For image-based designs, returns the PNG asset path.
// For monogram, renders the letters onto a canvas and returns a data-URL so
// useLoader can treat it identically to a file URL.

function makeSealTextureUrl(design: SealDesign, monogram: string): string {
  if (design !== 'monogram') {
    const map: Partial<Record<SealDesign, string>> = {
      'flower':         '/assets/seals/flower.png',
      'infinity-heart': '/assets/seals/infinity_heart.png',
      'floral':         '/assets/seals/floral.png',
      'heart':          '/assets/seals/heart.png',
    };
    return map[design] ?? '/assets/seals/heart.png';
  }
  // Draw monogram onto an offscreen canvas and export as PNG data-URL
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width  = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/assets/seals/heart.png';
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = 'white';
  ctx.font = `bold ${monogram.length === 1 ? 140 : 100}px Georgia, serif`;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(monogram, size / 2, size / 2);
  return canvas.toDataURL('image/png');
}

// ── Seal design overlay (needs Suspense — useLoader suspends on first load) ─

function SealDesignMesh({ textureUrl }: { textureUrl: string }) {
  const texture = useLoader(THREE.TextureLoader, textureUrl);
  texture.colorSpace = THREE.SRGBColorSpace;
  return (
    // Sits 0.01 units in front of the wax disc within the seal group
    <mesh position={[0, 0, 0.01]}>
      <circleGeometry args={[0.19, 48]} />
      {/* meshBasicMaterial ignores lighting so the design stays crisp white */}
      <meshBasicMaterial map={texture} transparent alphaTest={0.05} />
    </mesh>
  );
}

// ── 3-D envelope scene ─────────────────────────────────────────────────────

function EnvelopeScene({ waxHex, textureUrl, theme, onComplete }: SceneProps) {
  const elapsed = useRef(0);
  const done    = useRef(false);

  const rootRef    = useRef<THREE.Group>(null);
  const letterRef  = useRef<THREE.Mesh>(null);
  const flapRef    = useRef<THREE.Group>(null);
  const sealRef    = useRef<THREE.Group>(null);

  // ── Triangular shapes ──

  // Top flap: full envelope width at pivot (y=0), apex pointing down.
  // Placed in a group whose origin is the hinge line at y=0.8.
  const topFlapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.2, 0);
    s.lineTo(0,   -0.68);
    s.lineTo(1.2,  0);
    s.closePath();
    return s;
  }, []);

  // Left side flap overlay (already tucked):
  //   spans the full left edge, apex slightly left of centre
  const leftFlapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.2,  0.8);
    s.lineTo(-0.15, 0);
    s.lineTo(-1.2, -0.8);
    s.closePath();
    return s;
  }, []);

  // Right side flap overlay (mirror of left)
  const rightFlapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(1.2,  0.8);
    s.lineTo(0.15, 0);
    s.lineTo(1.2, -0.8);
    s.closePath();
    return s;
  }, []);

  // Bottom flap overlay (already tucked): apex pointing up toward centre
  const bottomFlapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-1.2, -0.8);
    s.lineTo(0,    -0.12);
    s.lineTo(1.2,  -0.8);
    s.closePath();
    return s;
  }, []);

  // ── Animation loop ──

  useFrame((_, delta) => {
    if (done.current) return;
    elapsed.current += delta;
    const t = elapsed.current;

    // 1. Letter slides into envelope (0 → 1.4 s)
    //    Visible while its top edge is above y=0.8 (the back panel's top).
    //    Once fully inside, the back panel (z=0.06) depth-masks it.
    if (letterRef.current) {
      const p = easeInOut(norm(t, 0, 1.4));
      letterRef.current.position.y = lerp(1.2, -0.2, p);
    }

    // 2. Top flap hinges downward (1.4 → 2.6 s)
    //    Open:   rotation.x = -PI*0.55  (flap angled toward camera + upward)
    //    Closed: rotation.x = 0         (flap lying flat on the back panel)
    if (flapRef.current) {
      const p = easeInOut(norm(t, 1.4, 2.6));
      flapRef.current.rotation.x = lerp(-Math.PI * 0.55, 0, p);
    }

    // 3. Wax seal stamps down (2.8 → 3.8 s)
    if (sealRef.current && t >= 2.8) {
      const p = norm(t, 2.8, 3.8);
      sealRef.current.scale.setScalar(easeOutBack(Math.min(p, 1)));
      sealRef.current.position.y = lerp(1.0, 0.45, easeInOut(Math.min(p, 1)));
    }

    // 4. Envelope tilts and flies off-screen (4.2 → 5.8 s)
    if (rootRef.current && t >= 4.2) {
      const p = easeInOut(norm(t, 4.2, 5.8));
      rootRef.current.position.y = lerp(0, 8, p);
      rootRef.current.rotation.z = lerp(0, 0.13, p);
    }

    if (t >= 6.0 && !done.current) {
      done.current = true;
      setTimeout(onComplete, 0);
    }
  });

  return (
    <group ref={rootRef}>

      {/* ── Front/address panel (faces away from camera, depth anchor) ── */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 1.6, 0.02]} />
        <meshLambertMaterial color={theme.front} />
      </mesh>

      {/* ── Letter paper ── */}
      {/*    Starts above the envelope, slides down. The back panel (z=0.06)   */}
      {/*    depth-masks it once it drops below y=0.8 (envelope's top edge).   */}
      <mesh ref={letterRef} position={[0, 1.2, 0.03]}>
        <boxGeometry args={[2.0, 1.3, 0.008]} />
        <meshLambertMaterial color="#FDFAF4" />
      </mesh>

      {/* ── Back panel (the sealing face — what the camera looks at) ── */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[2.4, 1.6, 0.01]} />
        <meshLambertMaterial color={theme.back} />
      </mesh>

      {/* ── Already-tucked flap overlays (diamond fold pattern) ── */}
      {/*    These three triangles show the classic crease lines visible         */}
      {/*    on the back of a sealed envelope. They're slightly darker than      */}
      {/*    the back panel to suggest depth/shadow under the top flap.          */}
      <mesh position={[0, 0, 0.07]}>
        <shapeGeometry args={[leftFlapShape]} />
        <meshLambertMaterial color={theme.fold} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <shapeGeometry args={[rightFlapShape]} />
        <meshLambertMaterial color={theme.fold} />
      </mesh>
      <mesh position={[0, 0, 0.07]}>
        <shapeGeometry args={[bottomFlapShape]} />
        <meshLambertMaterial color={theme.fold} />
      </mesh>

      {/* ── Top flap (hinges at y=0.8, the top edge of the back panel) ── */}
      {/*   The group's origin IS the hinge line.  The mesh hangs downward     */}
      {/*   from it (apex at local y=-0.68).                                    */}
      {/*   rotation.x = -PI*0.55 → flap open (angled toward + above camera)  */}
      {/*   rotation.x = 0        → flap closed (flat on the back panel)       */}
      <group
        ref={flapRef}
        position={[0, 0.8, 0.08]}
        rotation={[-Math.PI * 0.55, 0, 0]}
      >
        <mesh>
          <shapeGeometry args={[topFlapShape]} />
          {/* DoubleSide: camera sees the inside face while the flap is open */}
          <meshLambertMaterial color={theme.flap} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* ── Wax seal group — disc + chosen design overlay ── */}
      {/*   Group starts at scale=0 (invisible).  useFrame animates scale      */}
      {/*   (easeOutBack → spring-stamp) and position.y (dropping down).       */}
      <group ref={sealRef} position={[0, 1.0, 0.10]} scale={0}>
        {/* Base wax disc */}
        <mesh>
          <circleGeometry args={[0.22, 48]} />
          <meshLambertMaterial color={waxHex} />
        </mesh>
        {/* Design overlay — async texture load, graceful fallback while loading */}
        <Suspense fallback={null}>
          <SealDesignMesh textureUrl={textureUrl} />
        </Suspense>
      </group>

    </group>
  );
}

// ── Public component ───────────────────────────────────────────────────────

export function EnvelopeAnimation({
  sealColor,
  sealDesign,
  monogram,
  envelopeColor,
  onComplete,
}: EnvelopeAnimationProps) {
  const colorEntry = WAX_COLORS.find(c => c.id === sealColor);
  const waxHex     = colorEntry?.light ?? '#8B1A1A';
  const theme      = ENVELOPE_THEMES[envelopeColor];
  const textureUrl = useMemo(
    () => makeSealTextureUrl(sealDesign, monogram),
    [sealDesign, monogram],
  );

  return (
    <div
      style={{
        position:    'fixed',
        inset:       0,
        zIndex:      9999,
        background:  'rgb(13, 11, 9)',
        touchAction: 'none',
      }}
    >
      {/*
        Camera is slightly elevated (y=0.4) so the viewer has a gentle
        downward perspective — this makes the open top flap more visible
        before it folds down, and gives the envelope nice depth.
      */}
      <Canvas camera={{ position: [0, 0.4, 5], fov: 40 }}>
        <ambientLight     intensity={2.2} color="#FFF6DC" />
        <directionalLight intensity={0.9} color="#FFECB0" position={[1.5, 3, 4]} />
        <EnvelopeScene
          waxHex={waxHex}
          textureUrl={textureUrl}
          theme={theme}
          onComplete={onComplete}
        />
      </Canvas>
    </div>
  );
}
