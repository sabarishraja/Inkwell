import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Nav } from '../components/layout/Nav';
import { ThreeEnvelopeShowcase } from '../components/landing/ThreeEnvelopeShowcase';
import '../styles/landing.css';

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Inkwell — Write Letters That Wait';

    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // ── Hero Build-In Timeline ─────────────────────────
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .to('.hero-eyebrow', { opacity: 1, y: 0, duration: 1, delay: 0.2 })
        .to('.hero-headline', { opacity: 1, y: 0, duration: 1.5 }, "-=0.6")
        .to('.hero-sub', { opacity: 1, y: 0, duration: 1 }, "-=1.2")
        .to('.hero-cta', { opacity: 1, y: 0, duration: 1 }, "-=0.8");

      // Set initial state for hero elements to enable sliding
      gsap.set('.hero-eyebrow, .hero-headline, .hero-sub, .hero-cta', { y: 30 });

      // ── Philosophy Statement Stagger ───────────────────
      ScrollTrigger.create({
        trigger: '.philosophy-section',
        start: 'top 75%',
        once: true,
        animation: gsap.fromTo('.philosophy-word', 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: 'power2.out' }
        )
      });


      // ── Final CTA Fade In ──────────────────────────────
      ScrollTrigger.create({
        trigger: '.final-cta-section',
        start: 'top 80%',
        once: true,
        animation: gsap.fromTo(
          ['.final-cta-title', '.final-cta-sub', '.final-cta-btn'],
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.2, ease: 'power2.out' }
        )
      });

    }, root);

    return () => ctx.revert();
  }, []);

  const philosophyText = "Some things deserve more than a text message. A letter is a ".split(" ");

  return (
    <div className="desk-bg landing-page" ref={rootRef}>
      <Nav />

      {/* ── 1. Hero Atmosphere ─────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-glow"></div>
        <div className="hero-content">
          <p className="hero-eyebrow">A letter is a gift of time</p>
          <h1 className="hero-headline">
            <span>Write what</span>
            <span>you mean.</span>
          </h1>
          <p className="hero-sub">
            The sanctuary for your unhurried thoughts. Load your paper, write with purpose, and choose the perfect moment for it to arrive.
          </p>
          <Link to="/coach" className="hero-cta" aria-label="Begin writing a letter">
            Begin Writing
          </Link>
        </div>
      </section>

      {/* ── 2. Philosophy Statement ────────────────────────────────── */}
      <section className="landing-section philosophy-section">
        <h2 className="philosophy-text" aria-label="Some things deserve more than a text message. A letter is a gift of time.">
          {philosophyText.map((word, i) => (
            <span key={i} className="philosophy-word" aria-hidden="true">{word}</span>
          ))}
          <span className="philosophy-word philosophy-highlight" aria-hidden="true">gift of time.</span>
        </h2>
      </section>

      {/* ── 2.5 The Final Artifact ─────────────────────────────────── */}
      <section className="landing-section example-letter-section">
        <h2 className="example-title">The Finished Artifact</h2>
        <div className="example-image-container">
          <img src="/example letter.png" alt="An example letter in Inkwell" />
        </div>
      </section>

      {/* ── 3. Features 3D Showcase ────────────────────────────────── */}
      <ThreeEnvelopeShowcase />

      {/* ── 4. Final CTA ───────────────────────────────────────────── */}
      <section className="landing-section final-cta-section">
        <h2 className="final-cta-title">Ready to draft your first letter?</h2>
        <p className="final-cta-sub">Take a seat at the desk.</p>
        <Link to="/coach" className="hero-cta final-cta-btn" aria-label="Open Inkwell">
          Open Inkwell
        </Link>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="site-footer">
        <div className="footer__logo">Inkwell</div>
        <nav className="footer__links" aria-label="Footer navigation">
          <Link to="#">Privacy</Link>
          <Link to="#">Terms</Link>
        </nav>
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} Inkwell. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default LandingPage;
