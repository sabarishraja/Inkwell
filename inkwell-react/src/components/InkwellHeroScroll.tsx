/**
 * InkwellHeroScroll.tsx
 *
 * A "Sticky Hero Object" scroll interaction for the Inkwell UI.
 *
 * Layout contract:
 *   .ihs-scroll-root   — position: relative; height: 400vh  (creates scroll distance)
 *     .ihs-sticky       — position: sticky; top: 0; height: 100vh  (pinned viewport)
 *       .ihs-inkwell    — centred hero object (SVG inkwell graphic)
 *       .ihs-letter × N — absolutely positioned, start at inkwell, fly outward on scroll
 *
 * Animation:
 *   - GSAP ScrollTrigger maps scroll progress → master timeline
 *   - Letters stagger out from inkwell centre, fly to random screen-edge targets
 *   - Each letter continuously rotateX / rotateY to simulate a split-flap / paper flap
 *   - perspective on parent gives true 3-D depth to the rotation
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/inkwell-hero-scroll.css';

gsap.registerPlugin(ScrollTrigger);

// ── Letter data ───────────────────────────────────────────────────────────────

/** The alphabet pool the inkwell "dispenses". */
const LETTER_POOL = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  '&', '!', '?', '.', ',', '—',
];

/** How many flying letters to render. */
const LETTER_COUNT = 22;

// Seeded deterministic layout so SSR/hydration is consistent.
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface LetterDef {
  char:     string;
  /** Final destination relative to viewport centre, in vw/vh units */
  targetX:  number;   // -50 .. 50  (vw)
  targetY:  number;   // -50 .. 50  (vh)
  /** Rotation magnitudes for the flap animation */
  flipX:    number;   // degrees
  flipY:    number;
  /** Stagger offset — which part of scroll timeline this letter starts */
  startAt:  number;   // 0..0.7
  fontSize: number;   // px
  hue:      number;   // colour tint
}

function buildLetterDefs(): LetterDef[] {
  const rnd = seededRandom(42);
  return Array.from({ length: LETTER_COUNT }, (_, i) => {
    const char = LETTER_POOL[Math.floor(rnd() * LETTER_POOL.length)];
    // Spread targets around ALL edges of the viewport
    const angle = (i / LETTER_COUNT) * Math.PI * 2 + rnd() * 0.6;
    const dist  = 42 + rnd() * 14;   // 42..56 vmin from centre
    const targetX = Math.cos(angle) * dist;
    const targetY = Math.sin(angle) * dist * 0.65;

    return {
      char,
      targetX,
      targetY,
      flipX:    180 + rnd() * 270,  // 180–450 °
      flipY:    180 + rnd() * 270,
      startAt:  (i / LETTER_COUNT) * 0.55 + rnd() * 0.08,
      fontSize: 18 + Math.floor(rnd() * 46),  // 18–64 px
      hue:      30 + Math.floor(rnd() * 30),  // warm amber to gold
    };
  });
}

const LETTER_DEFS = buildLetterDefs();

// ── Inkwell SVG graphic ────────────────────────────────────────────────────────

function InkwellGraphic() {
  return (
    <svg
      className="ihs-inkwell-svg"
      viewBox="0 0 160 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Inkwell"
      role="img"
    >
      {/* Glow / ambient fill */}
      <defs>
        <radialGradient id="ihs-inkGlow" cx="50%" cy="70%" r="50%">
          <stop offset="0%"   stopColor="#C9974A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0D0B09" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="ihs-bodyGrad" cx="38%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#3A2210" />
          <stop offset="100%" stopColor="#1A0E06" />
        </radialGradient>
        <radialGradient id="ihs-inkPool" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#1E0F07" />
          <stop offset="100%" stopColor="#0A0604" />
        </radialGradient>
        <filter id="ihs-softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient glow behind inkwell */}
      <ellipse cx="80" cy="180" rx="60" ry="18" fill="url(#ihs-inkGlow)" />

      {/* Base / stand */}
      <ellipse cx="80" cy="195" rx="48" ry="8"
        fill="#1A0E06" stroke="#C9974A" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Body of the inkwell — tapered octagonal jar */}
      <path
        d="M 46 195 L 38 120 Q 38 100 50 96 L 48 72 Q 50 60 80 60 Q 110 60 112 72 L 110 96 Q 122 100 122 120 L 114 195 Z"
        fill="url(#ihs-bodyGrad)"
        stroke="#C9974A"
        strokeWidth="1.2"
        strokeOpacity="0.55"
      />

      {/* Glass highlight on body */}
      <path
        d="M 54 100 Q 54 84 68 80 L 66 68 Q 68 64 80 64"
        stroke="rgba(255,230,180,0.18)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Shoulder ring */}
      <path
        d="M 48 96 Q 80 88 112 96"
        stroke="#C9974A"
        strokeWidth="1"
        strokeOpacity="0.6"
        fill="none"
      />

      {/* Ink pool inside neck */}
      <ellipse cx="80" cy="72" rx="30" ry="12"
        fill="url(#ihs-inkPool)"
        stroke="#C9974A"
        strokeWidth="0.8"
        strokeOpacity="0.3"
      />

      {/* Neck / collar */}
      <rect x="58" y="52" width="44" height="22" rx="6"
        fill="#231208"
        stroke="#C9974A"
        strokeWidth="1.2"
        strokeOpacity="0.6"
      />

      {/* Ink surface shimmer */}
      <ellipse cx="80" cy="65" rx="18" ry="5"
        fill="rgba(201,151,74,0.08)"
      />

      {/* Drip from nib suggestion */}
      <path
        d="M 80 52 Q 80 38 82 28 Q 83 22 80 18 Q 77 22 78 28 Q 80 38 80 52"
        fill="#C9974A"
        fillOpacity="0.7"
        filter="url(#ihs-softGlow)"
      />

      {/* Nib tip glow */}
      <ellipse cx="80" cy="17" rx="3" ry="5"
        fill="#E8B86D"
        fillOpacity="0.9"
        filter="url(#ihs-softGlow)"
      />

      {/* Ink drop about to fall */}
      <ellipse cx="80" cy="13" rx="2.5" ry="3.5"
        fill="#C9974A"
        fillOpacity="0.8"
        className="ihs-inkdrop"
      />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InkwellHeroScroll() {
  const rootRef    = useRef<HTMLDivElement>(null);
  const stickyRef  = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root   = rootRef.current;
    const sticky = stickyRef.current;
    if (!root || !sticky) return;

    const ctx = gsap.context(() => {
      // ── master timeline scrubbed by ScrollTrigger ──────────────────────────
      const master = gsap.timeline({
        scrollTrigger: {
          trigger:      root,
          start:        'top top',
          end:          'bottom bottom',
          scrub:        1.2,          // lag for cinematic feel
        },
      });

      // ── per-letter animations ──────────────────────────────────────────────
      LETTER_DEFS.forEach((def, i) => {
        const el = lettersRef.current[i];
        if (!el) return;

        const spanDuration = 1 - def.startAt;  // normalized timeline units

        // Continuous flap rotation tween (loops within the exit span)
        // We use a nested timeline so we can stagger properly inside master.
        const flapTl = gsap.timeline({ repeat: -1 });
        flapTl
          .to(el, {
            rotateX: def.flipX,
            rotateY: def.flipY,
            ease:    'none',
            duration: 0.8,
          })
          .to(el, {
            rotateX: def.flipX * 1.5,
            rotateY: def.flipY * 1.3,
            ease:    'none',
            duration: 0.8,
          });

        // Translate + scale + opacity as one scrubbed sub-tween
        master.fromTo(
          el,
          {
            x:       0,
            y:       0,
            scale:   0,
            opacity: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: (Math.random() - 0.5) * 20,
          },
          {
            x:         `${def.targetX}vw`,
            y:         `${def.targetY}vh`,
            scale:     1,
            opacity:   1,
            rotateX:   def.flipX,
            rotateY:   def.flipY,
            rotateZ:   (Math.random() - 0.5) * 30,
            ease:      'power2.out',
            duration:  spanDuration * 0.8,
          },
          def.startAt,          // position within master timeline
        );

        // Fade-out near the very end of the scroll
        master.to(
          el,
          {
            opacity:  0,
            scale:    0.6,
            ease:     'power1.in',
            duration: spanDuration * 0.2,
          },
          def.startAt + spanDuration * 0.8,
        );
      });

      // ── Inkwell subtle pulse on scroll ────────────────────────────────────
      master.fromTo(
        '.ihs-inkwell-svg',
        { scale: 1,    filter: 'brightness(1)'   },
        { scale: 1.08, filter: 'brightness(1.18)', ease: 'sine.inOut', duration: 0.5, yoyo: true, repeat: 1 },
        0.1,
      );

    }, root);    // scope the GSAP context to root div

    return () => ctx.revert();   // cleanup: kills ScrollTrigger, frees tweens
  }, []);

  return (
    <section
      ref={rootRef}
      className="ihs-scroll-root"
      aria-label="Inkwell letter animation"
    >
      {/* ── Sticky viewport ───────────────────────────────────────────────── */}
      <div ref={stickyRef} className="ihs-sticky">

        {/* Ambient background radial glow */}
        <div className="ihs-bg-glow" aria-hidden="true" />

        {/* Floating letter particles */}
        {LETTER_DEFS.map((def, i) => (
          <span
            key={i}
            ref={(el) => { lettersRef.current[i] = el; }}
            className="ihs-letter"
            aria-hidden="true"
            style={{
              fontSize:    `${def.fontSize}px`,
              color:       `hsl(${def.hue}, 72%, 66%)`,
              willChange:  'transform, opacity',
            }}
          >
            {def.char}
          </span>
        ))}

        {/* Hero inkwell graphic */}
        <div className="ihs-inkwell-wrapper" aria-label="Inkwell">
          <div className="ihs-inkwell-glow" aria-hidden="true" />
          <InkwellGraphic />
          <p className="ihs-inkwell-label" aria-hidden="true">Inkwell</p>
        </div>

        {/* Scroll progress label */}
        <div className="ihs-scroll-hint" aria-hidden="true">
          <span className="ihs-scroll-hint__line" />
          <span className="ihs-scroll-hint__text">Scroll to release</span>
          <span className="ihs-scroll-hint__line" />
        </div>

      </div>
    </section>
  );
}

export default InkwellHeroScroll;
