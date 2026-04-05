import { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Nav } from '../components/layout/Nav';
import { ThreeEnvelopeShowcase } from '../components/landing/ThreeEnvelopeShowcase';
import '../styles/landing.css';
import '../styles/feature-showcase.css';

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

      gsap.set('.hero-eyebrow, .hero-headline, .hero-sub, .hero-cta', { y: 30, opacity: 0 });

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

      // ── Fade In Feature Sections ────────────────────────
      const featureSections = gsap.utils.toArray('.fs-section');
      featureSections.forEach((section: any) => {
        gsap.from(section, {
          opacity: 0,
          y: 30,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            once: true
          }
        });
      });

      // ── Final CTA Fade In ──────────────────────────────
      ScrollTrigger.create({
        trigger: '.final-cta-section',
        start: 'top 80%',
        once: true,
        animation: gsap.from(
          ['.final-cta-title', '.final-cta-sub', '.final-cta-btn'],
          { opacity: 0, y: 30, duration: 1, stagger: 0.2, ease: 'power2.out' }
        )
      });

    }, root);

    return () => ctx.revert();
  }, []);

  const philosophyText = "Some things deserve more than a text message. A letter is a ".split(" ");

  return (
    <div className="desk-bg landing-page" ref={rootRef}>
      <Nav />

      {/* ── 0. Interactive Hero ─────────────────────────────────────── */}
      <section className="hero-section" style={{ minHeight: 'auto', paddingTop: '8rem', paddingBottom: '4rem' }}>
        <div className="hero-glow"></div>
        <div className="hero-content" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p className="hero-eyebrow" style={{ color: '#cba265' }}>The Typewriter Experience</p>
          <h1 className="hero-headline" style={{ marginBottom: '1.5rem' }}>
            <span>Write what</span>
            <span>you mean.</span>
          </h1>
          <p className="hero-sub" style={{ marginBottom: '3rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Someone who wants a typewriter wants the ritual, not just the output. Experience the authentic sound, the deliberate keystrokes, and the absolute focus of the blank page.
          </p>

          <Link to="/coach" className="hero-cta" aria-label="Begin writing a letter" style={{ display: 'inline-block' }}>
            Begin Writing
          </Link>
        </div>
      </section>

      {/* ── Philosophy Statement ────────────────────────────────── */}
      <section className="landing-section philosophy-section" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '4rem' }}>
        <h2 className="philosophy-text" aria-label="Some things deserve more than a text message. A letter is a gift of time.">
          {philosophyText.map((word, i) => (
            <span key={i} className="philosophy-word" aria-hidden="true">{word} </span>
          ))}
          <span className="philosophy-word philosophy-highlight" aria-hidden="true">gift of time.</span>
        </h2>
      </section>

      {/* ── 1. The Writing Ritual ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">1. The Mechanical Truth</p>
          <h2 className="fs-headline">The Writing Ritual</h2>
          <p className="fs-body">
            Feel the weight of every word. Live keystroke sounds with randomized pitches ensure no two keys sound identical. The margin bell warns you as you approach the edge. When you hit enter, hear the satisfying sweep of the carriage return lever. Paste is disabled—every single word must be typed deliberately, with the rhythm of your own hands.
          </p>
        </div>
        <div className="fs-visual" style={{ padding: 0, overflow: 'hidden' }}>
          <video 
            src="/hero-key-strike.mp4" 
            autoPlay 
            muted 
            loop 
            playsInline 
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }}
          />
        </div>
      </section>

      {/* ── 2. The Coach ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">2. Before You Write</p>
          <h2 className="fs-headline">The Blank Page Guide</h2>
          <p className="fs-body">
            A 3-question guided ritual greets you before you face the blank page. Powered by an empathetic AI, Inkwell asks clarifying questions that appear character-by-character to help you pinpoint exactly what needs to be said, leaving you with a personal structural anchor.
          </p>
        </div>
        <div className="fs-visual" style={{alignItems: 'flex-start'}}>
          <div className="fs-coach-line" style={{color: '#cba265'}}>Inkwell:</div>
          <div className="fs-coach-line">What is the underlying truth you are trying to tell them?</div>
          <div className="fs-coach-line" style={{marginTop: '2rem', color: '#cba265'}}>You:</div>
          <div className="fs-coach-line">I want them to know that I never gave up.</div>
        </div>
      </section>

      {/* ── 3. AI Nudge ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">3. When You're Stuck</p>
          <h2 className="fs-headline">A Gentle Nudge</h2>
          <p className="fs-body">
            Writer's block happens. One tap on "Stuck?" surfaces a deeply human, compassionate writing prompt physically dropped off as a tilted sticky note. It’s a nudge, not a crutch. It dismisses automatically after 30 seconds so you can return to the keys.
          </p>
        </div>
        <div className="fs-visual">
           <div className="fs-sticky-note">
             Prompt: What do you wish they truly understood about that day?
           </div>
        </div>
      </section>

      {/* ── 4. The Sealing Ritual (3D Canvas) ────────────────────────────────── */}
      <ThreeEnvelopeShowcase />


      {/* ── 5. Letters That Wait ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">5. Emotional Core</p>
          <h2 className="fs-headline">Letters That Wait</h2>
          <p className="fs-body">
            This is not instant messaging. This is deliberate, delayed delivery. Send it to arrive today, pick any date in the future for an anniversary or birthday, or choose "Surprise Me" for a random delivery within 30 days when they will least expect it.
          </p>
        </div>
        <div className="fs-visual">
           <div className="fs-timeline">
             <div className="fs-time-option">
               <span>Send Now</span>
               <span style={{color: '#555'}}>Delivers within the hour</span>
             </div>
             <div className="fs-time-option active">
               <span>Specific Date</span>
               <span style={{color: '#cba265'}}>June 14, 2027</span>
             </div>
             <div className="fs-time-option">
               <span>Surprise Me</span>
               <span style={{color: '#555'}}>Within 30 Days</span>
             </div>
           </div>
        </div>
      </section>

      {/* ── 6. The Recipient Experience ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">6. Unboxing</p>
          <h2 className="fs-headline">The Grand Reveal</h2>
          <p className="fs-body">
            When someone receives an Inkwell letter, they are greeted by a black screen and a fade-in: "You have a letter." The paper slides up. The body types out character-by-character with typewriter sounds. They can immerse in the delivery or download the completed artifact globally as a PDF.
          </p>
        </div>
        <div className="fs-visual">
          <div className="fs-coach-line" style={{ textAlign: 'center', paddingTop: '2rem', fontSize: '1.4rem' }}>
             "You have a letter."
          </div>
        </div>
      </section>

      {/* ── 7. The Vault ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">7. Your Archives</p>
          <h2 className="fs-headline">The Vault</h2>
          <p className="fs-body">
            Every letter you've ever drafted lives permanently in the Vault. Track delivery status, watch the countdown progress bar until it arrives, and securely manage your most important thoughts. Read past letters with full parchment rendering or export them.
          </p>
        </div>
        <div className="fs-visual">
           <div className="fs-vault-card">
              <div className="fs-vault-title">For when you graduate</div>
              <div className="fs-vault-status">Delivering in 730 days</div>
              <div className="fs-vault-bar">
                 <div className="fs-vault-progress" style={{width: '24%'}}></div>
              </div>
           </div>
           <div className="fs-vault-card">
              <div className="fs-vault-title">The truth about that night</div>
              <div className="fs-vault-status">Delivered</div>
              <div className="fs-vault-bar">
                 <div className="fs-vault-progress" style={{width: '100%'}}></div>
              </div>
           </div>
        </div>
      </section>

      {/* ── 8. Works Offline ────────────────────────────────── */}
      <section className="fs-section">
        <div className="fs-text">
          <p className="fs-eyebrow">8. Installable</p>
          <h2 className="fs-headline">Works Offline</h2>
          <p className="fs-body">
            Inspiration strikes anywhere. Inkwell operates as a full PWA installable to your home screen or desktop. All assets, sounds, and fonts are precached. Your letters-in-progress are saved automatically, seamlessly syncing the moment you regain connection.
          </p>
        </div>
        <div className="fs-visual">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cba265" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
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
