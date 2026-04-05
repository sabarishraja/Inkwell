/**
 * EnvelopeScene.tsx — Three.js envelope for the landing page hero.
 *
 * Renders inside a React Three Fiber <Canvas>.
 * Reads scroll progress (0–1) from a shared ref updated by GSAP ScrollTrigger
 * in the parent. All animation runs in useFrame — no React state changes.
 *
 * Envelope geometry (all pure Three.js — no imported models):
 *   Back body  — PlaneGeometry
 *   Inner face — PlaneGeometry (lighter parchment, sits on top of body)
 *   4 flaps    — ShapeGeometry (trapezoids / triangles) inside pivot Groups
 *   Wax seal   — CircleGeometry, scales in with spring bounce
 *
 * Flap pivot convention:
 *   Each flap's Group is placed at its hinge edge.
 *   The ShapeGeometry extends from y=0 (hinge) inward/upward so that
 *   rotation.x=0 / rotation.y=0 is the CLOSED (flat) state and
 *   rotation = ±OPEN is the fully open/splayed state.
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ─── Public interface ────────────────────────────────────────────────────────

export interface ScrollState {
  progress: number; // 0 → 1 over the full 500 vh scroll
}

interface Props {
  scrollState: ScrollState;
}

// ─── Envelope dimensions (world units) ───────────────────────────────────────

const W  = 2.8;    // full width
const H  = 1.9;    // full height
const HW = W / 2;  // 1.4
const HH = H / 2;  // 0.95

// How far each flap is fanned out when fully open (radians, ~126°)
const OPEN = 2.2;

// ─── Math helpers ────────────────────────────────────────────────────────────

function invlerp(a: number, b: number, v: number): number {
  return Math.max(0, Math.min(1, (v - a) / (b - a)));
}

function easeOut3(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EnvelopeScene({ scrollState }: Props) {
  const envelopeRef = useRef<THREE.Group>(null);
  const bottomRef   = useRef<THREE.Group>(null);
  const leftRef     = useRef<THREE.Group>(null);
  const rightRef    = useRef<THREE.Group>(null);
  const topRef      = useRef<THREE.Group>(null);
  const sealRef     = useRef<THREE.Mesh>(null);

  // ── Geometries (created once) ──────────────────────────────────────────────

  const bodyGeom = useMemo(() => new THREE.PlaneGeometry(W, H), []);

  const innerGeom = useMemo(() => new THREE.PlaneGeometry(W * 0.97, H * 0.97), []);

  // Bottom flap — trapezoid, hinge at y=0, extends upward to y=+0.68
  // Wide at hinge (full envelope width), narrows to ~43 % width at top
  const bottomGeom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-HW, 0);
    s.lineTo( HW, 0);
    s.lineTo( 0.60, 0.68);
    s.lineTo(-0.60, 0.68);
    s.closePath();
    return new THREE.ShapeGeometry(s, 1);
  }, []);

  // Left flap — triangle, hinge at x=0, apex points rightward toward center
  const leftGeom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0,  HH);
    s.lineTo(0, -HH);
    s.lineTo(0.76, 0);
    s.closePath();
    return new THREE.ShapeGeometry(s, 1);
  }, []);

  // Right flap — mirror of left
  const rightGeom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0,  HH);
    s.lineTo(0, -HH);
    s.lineTo(-0.76, 0);
    s.closePath();
    return new THREE.ShapeGeometry(s, 1);
  }, []);

  // Top flap — large trapezoid, hinge at y=0, extends downward to y=−1.08
  // Wider at hinge, tapers to narrow tongue at bottom
  const topGeom = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-HW, 0);
    s.lineTo( HW, 0);
    s.lineTo( 0.44, -1.08);
    s.lineTo(-0.44, -1.08);
    s.closePath();
    return new THREE.ShapeGeometry(s, 1);
  }, []);

  // ── Per-frame animation ────────────────────────────────────────────────────

  useFrame((state) => {
    const p = scrollState.progress;
    const t = state.clock.elapsedTime;

    // ── Flap fold progress ─────────────────────────────────────────────────
    // Each flap has an exclusive scroll window so they fold one at a time.
    // easeOut3 gives a satisfying deceleration as the flap lands flat.

    const btT = easeOut3(invlerp(0.15, 0.36, p)); // bottom: folds during section 1
    const lfT = easeOut3(invlerp(0.36, 0.54, p)); // left:   folds during section 2
    const rfT = easeOut3(invlerp(0.54, 0.72, p)); // right:  folds during section 3
    const tfT = easeOut3(invlerp(0.72, 0.88, p)); // top:    folds during section 4

    if (bottomRef.current) bottomRef.current.rotation.x =  OPEN * (1 - btT);
    if (leftRef.current)   leftRef.current.rotation.y   = -OPEN * (1 - lfT);
    if (rightRef.current)  rightRef.current.rotation.y  =  OPEN * (1 - rfT);
    if (topRef.current)    topRef.current.rotation.x    = -OPEN * (1 - tfT);

    // ── Wax seal — spring bounce in after top flap closes ─────────────────
    if (sealRef.current) {
      const sp = invlerp(0.88, 1.0, p);
      let sc = 0;
      if (sp > 0) {
        // Two-phase spring: overshoot to ~1.18 then settle at 1.0
        sc = sp < 0.55
          ? easeOut3(sp / 0.55) * 1.22
          : 1.22 - 0.22 * easeInOut((sp - 0.55) / 0.45);
      }
      sealRef.current.scale.setScalar(Math.max(0, sc));
    }

    // ── Envelope float + gentle rotation ──────────────────────────────────
    if (envelopeRef.current) {
      // Floating bob fades out as user scrolls (no distraction mid-scroll)
      const floatDamp = Math.max(0, 1 - p * 3.5);
      const floatY    = Math.sin(t * 0.72) * 0.055 * floatDamp;
      const floatTilt = Math.sin(t * 0.41) * 0.010 * floatDamp;

      envelopeRef.current.position.y = floatY - 0.08;

      // Slow Y-axis rotation sweeps from slight right-lean to slight left-lean
      envelopeRef.current.rotation.y = 0.13 - p * 0.26 + floatTilt;
      // Subtle X tilt deepens slightly as sections progress
      envelopeRef.current.rotation.x = -0.04 + p * 0.09;
    }
  });

  // ── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Scene background — matches the site's ink-void color */}
      <color attach="background" args={['#0D0B09']} />

      {/*
        Lighting — warm candlelight feel.
        Main key light: warm gold, above and to the right.
        Fill:           dim amber, below and left (prevents total shadow).
      */}
      <ambientLight intensity={0.28} color="#ffecd0" />
      <pointLight position={[4,  5, 5]}  intensity={58} color="#ffd07a" decay={2} />
      <pointLight position={[-3, -2, 3]} intensity={11} color="#ff8c40" decay={2} />

      {/* ── Envelope group ─────────────────────────────────────────────── */}
      <group ref={envelopeRef} position={[0, -0.08, 0]}>

        {/* Back body — the base of the envelope */}
        <mesh geometry={bodyGeom} position={[0, 0, 0]}>
          <meshStandardMaterial
            color="#b8944a"
            roughness={0.88}
            metalness={0.04}
          />
        </mesh>

        {/* Inner face — lighter parchment, represents the interior */}
        <mesh geometry={innerGeom} position={[0, 0, 0.003]}>
          <meshStandardMaterial
            color="#ead9a4"
            roughness={0.92}
            metalness={0}
          />
        </mesh>

        {/* ── Bottom flap ── */}
        <group
          ref={bottomRef}
          position={[0, -HH, 0.005]}
          rotation={[OPEN, 0, 0]}
        >
          <mesh geometry={bottomGeom}>
            <meshStandardMaterial
              color="#b49048"
              roughness={0.90}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ── Left flap ── */}
        <group
          ref={leftRef}
          position={[-HW, 0, 0.005]}
          rotation={[0, -OPEN, 0]}
        >
          <mesh geometry={leftGeom}>
            <meshStandardMaterial
              color="#9a7230"
              roughness={0.90}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ── Right flap ── */}
        <group
          ref={rightRef}
          position={[HW, 0, 0.005]}
          rotation={[0, OPEN, 0]}
        >
          <mesh geometry={rightGeom}>
            <meshStandardMaterial
              color="#9a7230"
              roughness={0.90}
              metalness={0.02}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ── Top flap — largest, seals last ── */}
        <group
          ref={topRef}
          position={[0, HH, 0.008]}
          rotation={[-OPEN, 0, 0]}
        >
          <mesh geometry={topGeom}>
            <meshStandardMaterial
              color="#c0913e"
              roughness={0.85}
              metalness={0.04}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* ── Wax seal — deep crimson, springs in at the end ── */}
        <mesh ref={sealRef} position={[0, -0.06, 0.014]} scale={0}>
          <circleGeometry args={[0.28, 40]} />
          <meshStandardMaterial
            color="#8b1414"
            roughness={0.52}
            metalness={0.28}
          />
        </mesh>

        {/* Embossed 'I' mark on the seal */}
        <mesh position={[0, -0.06, 0.016]} scale={0} ref={null}>
          <planeGeometry args={[0.055, 0.22]} />
          <meshStandardMaterial
            color="#c04040"
            roughness={0.4}
            metalness={0.1}
            transparent
            opacity={0.65}
          />
        </mesh>

      </group>
    </>
  );
}
