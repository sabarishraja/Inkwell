/**
 * InkwellLetterSection.tsx
 *
 * Sticky scroll-driven letter animation for the landing page.
 *
 * Layout contract:
 *   .ils-scroll-root   — position: relative; height: ~350vh  (scroll distance)
 *     .ils-sticky       — position: sticky; top: 0; height: 100vh  (pinned)
 *       letters         — absolutely positioned, stacked at inkwell centre
 *       inkwell wrapper — centred hero SVG
 *       scroll hint     — "scroll to write" label
 *
 * Animation (pure scroll scrub, no autoplay, no physics):
 *   - GSAP master timeline scrubbed via ScrollTrigger
 *   - Each letter flies from centre → radial screen-edge target
 *   - Continuous rotateX/Y simulates split-flap mechanical tumbling
 *   - Scale up slightly on exit, then fade out near end of journey
 *   - Letters stagger so they don't all leave at once
 *
 * Cleanup: gsap.context scoped to root div, reverted fully on unmount.
 */

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/inkwell-letter-section.css';

gsap.registerPlugin(ScrollTrigger);

// ── Letter pool ───────────────────────────────────────────────────────────────

const LETTER_POOL = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
  '&', '!', '?', '.', ',', '—',
];

const LETTER_COUNT = 20;

/** Seeded deterministic RNG — keeps layout stable between renders. */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface LetterDef {
  char:     string;
  targetX:  number;   // vw offset from viewport centre
  targetY:  number;   // vh offset from viewport centre
  flipX:    number;   // total rotateX accumulated (degrees)
  flipY:    number;   // total rotateY accumulated
  startAt:  number;   // 0..0.7 — where in the scroll timeline this letter begins
  fontSize: number;   // px
  hue:      number;   // warm amber–gold range
}

function buildLetterDefs(): LetterDef[] {
  const rnd = seededRandom(77);
  return Array.from({ length: LETTER_COUNT }, (_, i) => {
    const char  = LETTER_POOL[Math.floor(rnd() * LETTER_POOL.length)];
    // Spread evenly around the viewport using full 360° radial distribution
    const angle  = (i / LETTER_COUNT) * Math.PI * 2 + rnd() * 0.5;
    const dist   = 40 + rnd() * 16;   // 40–56 vmin from centre
    const targetX = Math.cos(angle) * dist;
    const targetY = Math.sin(angle) * dist * 0.62;

    return {
      char,
      targetX,
      targetY,
      flipX:    180 + rnd() * 270,   // 180–450°: multiple full rotations
      flipY:    180 + rnd() * 270,
      startAt:  (i / LETTER_COUNT) * 0.52 + rnd() * 0.08,
      fontSize: 18 + Math.floor(rnd() * 46),  // 18–64 px
      hue:      30 + Math.floor(rnd() * 30),  // warm amber → gold
    };
  });
}

const LETTER_DEFS = buildLetterDefs();

// ── Inkwell SVG — same graphic used across the app ────────────────────────────

function InkwellGraphic() {
  return (
    <svg
      className="ils-inkwell-svg"
      viewBox="0 0 160 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Inkwell"
      role="img"
    >
      <defs>
        <radialGradient id="ils-inkGlow" cx="50%" cy="70%" r="50%">
          <stop offset="0%"   stopColor="#C9974A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0D0B09" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="ils-bodyGrad" cx="38%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#3A2210" />
          <stop offset="100%" stopColor="#1A0E06" />
        </radialGradient>
        <radialGradient id="ils-inkPool" cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#1E0F07" />
          <stop offset="100%" stopColor="#0A0604" />
        </radialGradient>
        <filter id="ils-softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient glow */}
      <ellipse cx="80" cy="180" rx="60" ry="18" fill="url(#ils-inkGlow)" />

      {/* Base */}
      <ellipse cx="80" cy="195" rx="48" ry="8"
        fill="#1A0E06" stroke="#C9974A" strokeWidth="0.8" strokeOpacity="0.4" />

      {/* Body */}
      <path
        d="M 46 195 L 38 120 Q 38 100 50 96 L 48 72 Q 50 60 80 60 Q 110 60 112 72 L 110 96 Q 122 100 122 120 L 114 195 Z"
        fill="url(#ils-bodyGrad)"
        stroke="#C9974A"
        strokeWidth="1.2"
        strokeOpacity="0.55"
      />

      {/* Glass highlight */}
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
        stroke="#C9974A" strokeWidth="1" strokeOpacity="0.6" fill="none"
      />

      {/* Ink pool inside neck */}
      <ellipse cx="80" cy="72" rx="30" ry="12"
        fill="url(#ils-inkPool)"
        stroke="#C9974A" strokeWidth="0.8" strokeOpacity="0.3"
      />

      {/* Neck/collar */}
      <rect x="58" y="52" width="44" height="22" rx="6"
        fill="#231208"
        stroke="#C9974A" strokeWidth="1.2" strokeOpacity="0.6"
      />

      {/* Shimmer */}
      <ellipse cx="80" cy="65" rx="18" ry="5"
        fill="rgba(201,151,74,0.08)"
      />

      {/* Drip */}
      <path
        d="M 80 52 Q 80 38 82 28 Q 83 22 80 18 Q 77 22 78 28 Q 80 38 80 52"
        fill="#C9974A" fillOpacity="0.7"
        filter="url(#ils-softGlow)"
      />

      {/* Nib glow */}
      <ellipse cx="80" cy="17" rx="3" ry="5"
        fill="#E8B86D" fillOpacity="0.9"
        filter="url(#ils-softGlow)"
      />

      {/* Ink drop */}
      <ellipse cx="80" cy="13" rx="2.5" ry="3.5"
        fill="#C9974A" fillOpacity="0.8"
        className="ils-inkdrop"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InkwellLetterSection() {
  const rootRef    = useRef<HTMLDivElement>(null);
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {

      // Master timeline — progress driven entirely by scroll scrub
      const master = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start:   'top top',
          end:     'bottom bottom',
          scrub:   1.4,
        },
      });

      // Per-letter: fly outward with continuous rotateX/Y flap
      LETTER_DEFS.forEach((def, i) => {
        const el = lettersRef.current[i];
        if (!el) return;

        const spanDuration = 1 - def.startAt;

        // Exit translation + scale + flap rotation (scrubbed)
        master.fromTo(
          el,
          {
            x:       0,
            y:       0,
            scale:   0,
            opacity: 0,
            rotateX: 0,
            rotateY: 0,
            rotateZ: (i % 2 === 0 ? 1 : -1) * (8 + (i % 7) * 3),
          },
          {
            x:        `${def.targetX}vw`,
            y:        `${def.targetY}vh`,
            scale:    1.15,                   // slight scale-up on exit
            opacity:  1,
            rotateX:  def.flipX,             // multiple full rotations = flap
            rotateY:  def.flipY,
            rotateZ:  (i % 2 === 0 ? -1 : 1) * (15 + (i % 5) * 4),
            ease:     'power2.out',
            duration: spanDuration * 0.78,
          },
          def.startAt,
        );

        // Fade out near the end of this letter's journey
        master.to(
          el,
          {
            opacity:  0,
            scale:    0.55,
            ease:     'power1.in',
            duration: spanDuration * 0.22,
          },
          def.startAt + spanDuration * 0.78,
        );
      });

      // Subtle inkwell pulse on scroll progress
      master.fromTo(
        '.ils-inkwell-svg',
        { scale: 1,    filter: 'brightness(1)'    },
        { scale: 1.07, filter: 'brightness(1.15)', ease: 'sine.inOut', duration: 0.4, yoyo: true, repeat: 1 },
        0.08,
      );

    }, root);   // scope to root element

    return () => ctx.revert();  // full cleanup on unmount
  }, []);

  return (
    <section
      ref={rootRef}
      className="ils-scroll-root"
      aria-label="Letters emerging from the inkwell"
    >
      {/* Sticky viewport — pinned for full 350vh of scroll */}
      <div className="ils-sticky">

        {/* Subtle background radial glow */}
        <div className="ils-bg-glow" aria-hidden="true" />

        {/* Flying letter particles — all start at inkwell centre */}
        {LETTER_DEFS.map((def, i) => (
          <span
            key={i}
            ref={(el) => { lettersRef.current[i] = el; }}
            className="ils-letter"
            aria-hidden="true"
            style={{
              fontSize:   `${def.fontSize}px`,
              color:      `hsl(${def.hue}, 70%, 64%)`,
              willChange: 'transform, opacity',
            }}
          >
            {def.char}
          </span>
        ))}

        {/* Inkwell graphic */}
        <div className="ils-inkwell-wrapper" aria-label="Inkwell graphic">
          <div className="ils-inkwell-glow" aria-hidden="true" />
          <InkwellGraphic />
          <p className="ils-inkwell-label" aria-hidden="true">Inkwell</p>
        </div>

        {/* Scroll hint */}
        <div className="ils-scroll-hint" aria-hidden="true">
          <span className="ils-scroll-hint__line" />
          <span className="ils-scroll-hint__text">scroll to write</span>
          <span className="ils-scroll-hint__line" />
        </div>

      </div>
    </section>
  );
}

export default InkwellLetterSection;
