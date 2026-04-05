import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../../styles/feature-showcase.css';

gsap.registerPlugin(ScrollTrigger);

const FEATURES = [
  {
    target: 'left',
    headline: 'The empty page, honored.',
    body: 'Your digital desk is cleared. No notifications, no backspacing without consequence. Just the warm hum of your keys, the texture of the grain, and the space to hear your own thoughts.',
  },
  {
    target: 'right',
    headline: 'A quiet companion.',
    body: 'When the words won’t come, Inkwell offers a gentle prompt. Not to write it for you, but to ask the right question. A subtle guide to help you find your footing again.',
  },
  {
    target: 'bottom',
    headline: 'Sealed in wax.',
    body: 'Once you fold the paper and press the stamp, your letter is locked. It becomes a finished artifact. There is no editing, no tweaking—only the honest truth of what you felt in that moment.',
  },
  {
    target: 'top',
    headline: 'Given to time.',
    body: 'Choose when it arrives. Tomorrow, their next birthday, or years from now. By removing the pressure of an immediate reply, you give them the luxury of reading it when the time is right.',
  },
];

export function FeatureShowcase() {
  const rootRef = useRef<HTMLDivElement>(null);
  const textsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Create master timeline for scrub
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // slight smoothing
        },
      });

      // Initial state for texts
      gsap.set(textsRef.current, { opacity: 0, y: 20 });

      // Beat 1 (Left Flap)
      tl.to(textsRef.current[0], { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, "beat1")
        .to('.fs-flap-left', { rotateY: 0, duration: 5, ease: 'power1.inOut' }, "beat1")
        .to(textsRef.current[0], { opacity: 0, y: -20, duration: 1, ease: 'power2.in' }, "beat1+=4");

      // Beat 2 (Right Flap)
      tl.to(textsRef.current[1], { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, "beat2")
        .to('.fs-flap-right', { rotateY: 0, duration: 5, ease: 'power1.inOut' }, "beat2")
        .to(textsRef.current[1], { opacity: 0, y: -20, duration: 1, ease: 'power2.in' }, "beat2+=4");

      // Beat 3 (Bottom Flap)
      tl.to(textsRef.current[2], { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, "beat3")
        .to('.fs-flap-bottom', { rotateX: 0, duration: 5, ease: 'power1.inOut' }, "beat3")
        .to(textsRef.current[2], { opacity: 0, y: -20, duration: 1, ease: 'power2.in' }, "beat3+=4");

      // Beat 4 (Top Flap & Wax Seal)
      tl.to(textsRef.current[3], { opacity: 1, y: 0, duration: 1, ease: 'power2.out' }, "beat4")
        .to('.fs-flap-top', { rotateX: 0, duration: 5, ease: 'power1.inOut' }, "beat4")
        .to('.fs-wax-seal', { scale: 1, duration: 1.5, ease: 'back.out(1.7)' }, "beat4+=4.5");

    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} className="fs-root" aria-label="Feature Showcase">
      <div className="fs-sticky">
        <div className="fs-container">
          {/* Left: Animated Letter */}
          <div className="fs-left">
            <div className="fs-envelope-wrapper">
              <div className="fs-envelope-base">
                <div className="fs-envelope-inner"></div>
              </div>
              
              <div className="fs-flap fs-flap-left">
                <div className="fs-flap-left-back"></div>
              </div>
              <div className="fs-flap fs-flap-right">
                <div className="fs-flap-right-back"></div>
              </div>
              <div className="fs-flap fs-flap-bottom">
                <div className="fs-flap-bottom-back"></div>
              </div>
              <div className="fs-flap fs-flap-top">
                <div className="fs-flap-top-back"></div>
              </div>

              <div className="fs-wax-seal">
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L9 8H3L7 13L5 19L12 16L19 19L17 13L21 8H15L12 2Z" />
                </svg>
              </div>
            </div>
            {/* Center Divider styling */}
            <div className="fs-divider"></div>
          </div>

          {/* Right: Feature Descriptions */}
          <div className="fs-right">
            {FEATURES.map((feature, i) => (
              <div 
                key={i} 
                className={`fs-beat-content fs-beat-content-${i+1}`}
                ref={(el) => { textsRef.current[i] = el; }}
              >
                <h3 className="fs-headline">{feature.headline}</h3>
                <p className="fs-body">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeatureShowcase;
