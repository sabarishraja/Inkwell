/**
 * LandingPage.tsx — Inkwell marketing/onboarding page.
 *
 * Sections:
 *   Hero → How It Works (4 steps) → AI Coach feature → Wax Seal feature
 *   → Letter Showcase → Time Capsule → Footer
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/landing.css';
import { Nav }           from '../components/layout/Nav';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { LetterShowcase }  from '../components/LetterShowcase';

export function LandingPage() {
  useScrollReveal();

  useEffect(() => { document.title = 'Inkwell — Write Letters That Wait'; }, []);

  return (
    <div className="landing-page">
      <Nav />

      {/* ---- Hero -------------------------------------------- */}
      <section className="hero" aria-labelledby="hero-headline">
        <div className="hero__content">
          <p className="hero__eyebrow" data-animate>
            A letter is a gift of time.
          </p>

          <h1 id="hero-headline" className="hero__headline" data-animate data-delay="1">
            Some things deserve more than a text message.
          </h1>

          <p className="hero__sub" data-animate data-delay="2">
            Write it. Seal it. Let it arrive when the time is right.
          </p>

          <Link
            to="/coach"
            className="btn-cta"
            data-animate
            data-delay="3"
            aria-label="Begin writing a letter"
          >
            Begin Writing
          </Link>

          {/* Decorative quill motif */}
          <div className="hero__quill" data-animate data-delay="4" aria-hidden="true">
            <svg width="40" height="60" viewBox="0 0 40 60" fill="none">
              <path d="M20 2 C35 10, 38 35, 20 58" stroke="#C9974A" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              <path d="M20 2 C5 10, 2 35, 20 58" stroke="#C9974A" strokeWidth="0.8" fill="none" strokeLinecap="round" opacity="0.6"/>
              <path d="M14 20 C20 22, 26 20, 20 58" stroke="#C9974A" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.4"/>
              <line x1="20" y1="50" x2="20" y2="60" stroke="#C9974A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <div className="scroll-indicator" aria-hidden="true">
          <div className="scroll-indicator__line" />
        </div>
      </section>

      {/* ---- How It Works ------------------------------------ */}
      <section className="how-it-works" aria-labelledby="hiw-title">
        <div className="section-header">
          <p className="section-label" data-animate>The ritual</p>
          <h2 id="hiw-title" className="section-title" data-animate data-delay="1">
            Four steps. One letter. A lifetime of meaning.
          </h2>
        </div>

        <div className="steps-grid steps-grid--4">
          <article className="step-card" data-animate>
            <div className="step-number" aria-hidden="true">01</div>
            <h3 className="step-title">Prepare</h3>
            <p className="step-desc">
              Meet your AI writing coach. Answer three questions and arrive at
              the page knowing exactly what you want to say.
            </p>
          </article>

          <article className="step-card" data-animate data-delay="1">
            <div className="step-number" aria-hidden="true">02</div>
            <h3 className="step-title">Write</h3>
            <p className="step-desc">
              Load your paper. Type with purpose. Hear the keys. If you get
              stuck, ask for a nudge.
            </p>
          </article>

          <article className="step-card" data-animate data-delay="2">
            <div className="step-number" aria-hidden="true">03</div>
            <h3 className="step-title">Seal</h3>
            <p className="step-desc">
              Choose your wax seal design and color. Press the stamp.
              It&rsquo;s locked. No going back.
            </p>
          </article>

          <article className="step-card" data-animate data-delay="3">
            <div className="step-number" aria-hidden="true">04</div>
            <h3 className="step-title">Deliver</h3>
            <p className="step-desc">
              Choose when it arrives. Tomorrow. Their birthday. A surprise.
              The waiting is part of the gift.
            </p>
          </article>
        </div>
      </section>

      {/* ---- AI Writing Coach Feature ------------------------ */}
      <section className="feature-coach" aria-labelledby="coach-title">
        <div className="feature-coach__inner">
          <div className="feature-coach__copy">
            <p className="section-label" data-animate>AI Writing Coach</p>
            <h2 id="coach-title" className="feature-coach__headline" data-animate data-delay="1">
              A ritual before the first word.
            </h2>
            <p className="feature-coach__body" data-animate data-delay="2">
              Before you write, Inkwell asks you three questions — who are you
              writing to, what do you want them to feel, what has been left
              unsaid. Your answers shape a personal writing intention that stays
              with you at the page.
            </p>
            <p className="feature-coach__body" data-animate data-delay="3">
              And if the words stop mid-letter, one tap surfaces a quiet,
              considered question — not a prompt, a provocation — to pull
              something true out of you.
            </p>
            <Link
              to="/coach"
              className="btn-cta btn-cta--ghost"
              data-animate
              data-delay="4"
              aria-label="Try the writing coach"
            >
              Try the Coach
            </Link>
          </div>

          {/* Coach visual — three question dots */}
          <div className="coach-visual" data-animate aria-hidden="true">
            <div className="coach-visual__card">
              <div className="coach-visual__step-dots">
                <span className="coach-visual__dot coach-visual__dot--done" />
                <span className="coach-visual__dot coach-visual__dot--done" />
                <span className="coach-visual__dot coach-visual__dot--active" />
              </div>
              <p className="coach-visual__question">
                What has been left unsaid between you two?
              </p>
              <div className="coach-visual__cursor" aria-hidden="true" />
            </div>
            <div className="coach-visual__nudge-pill">
              <span className="coach-visual__nudge-dot" />
              STUCK?
            </div>
          </div>
        </div>
      </section>

      {/* ---- Wax Seal Customization Feature ------------------ */}
      <section className="feature-seal" aria-labelledby="seal-title">
        <div className="feature-seal__inner">
          {/* Seal palette visual */}
          <div className="seal-visual" data-animate aria-hidden="true">
            <div className="seal-visual__grid">
              {/* Row of seal color swatches */}
              <div className="seal-visual__swatches">
                <span className="seal-swatch" style={{ background: 'radial-gradient(circle at 35% 35%, #C0392B, #6B0E0E)' }} />
                <span className="seal-swatch" style={{ background: 'radial-gradient(circle at 35% 35%, #7B2D42, #3D0F1E)' }} />
                <span className="seal-swatch seal-swatch--active" style={{ background: 'radial-gradient(circle at 35% 35%, #D4A843, #8A6210)' }} />
                <span className="seal-swatch" style={{ background: 'radial-gradient(circle at 35% 35%, #2D6A4F, #0F3020)' }} />
                <span className="seal-swatch" style={{ background: 'radial-gradient(circle at 35% 35%, #1A3A6B, #070E2A)' }} />
              </div>
              {/* Large seal preview */}
              <div className="seal-visual__preview">
                <div className="seal-visual__wax">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4 C16 4, 20 10, 28 12 C26 20, 22 24, 16 28 C10 24, 6 20, 4 12 C12 10, 16 4, 16 4Z" fill="rgba(245,200,160,0.5)" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="feature-seal__copy">
            <p className="section-label" data-animate>Wax Seal Customization</p>
            <h2 id="seal-title" className="feature-seal__headline" data-animate data-delay="1">
              Every seal tells a story.
            </h2>
            <p className="feature-seal__body" data-animate data-delay="2">
              Choose from five hand-crafted wax seal designs — a heart, a flower,
              an infinity heart, a floral crest, or your own monogram — and five
              rich wax colors from classic crimson to forest green to midnight navy.
            </p>
            <p className="feature-seal__body" data-animate data-delay="3">
              Your seal is pressed onto every letter you send. A small, permanent
              mark of who you are — and that you meant it.
            </p>
          </div>
        </div>
      </section>

      {/* ---- Letter Showcase --------------------------------- */}
      <LetterShowcase />

      {/* ---- Time Capsule Feature ---------------------------- */}
      <section className="feature-capsule" aria-labelledby="capsule-title">
        <div className="feature-capsule__inner">
          <div className="feature-capsule__copy">
            <h2 id="capsule-title" className="feature-capsule__headline" data-animate>
              Letters that arrive when you choose.
            </h2>
            <p className="feature-capsule__body" data-animate data-delay="1">
              Some words need time before they land. Write your letter today, then
              choose when it arrives — tomorrow, on their birthday, or whenever the
              moment feels right.
            </p>
            <p className="feature-capsule__body" data-animate data-delay="2">
              The waiting is part of the gift. Inkwell holds it safely until then.
            </p>
          </div>

          <div className="envelope-wrap" data-animate aria-hidden="true">
            <div className="envelope-date-tag">Arriving — whenever you decide</div>
            <div className="envelope">
              <div className="envelope__seal" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Footer ------------------------------------------ */}
      <footer className="site-footer">
        <div className="footer__inner">
          <div className="footer__logo">Inkwell</div>
          <p className="footer__tagline">Write what you mean.</p>
          <nav className="footer__links" aria-label="Footer navigation">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </nav>
          <p className="footer__copy">
            &copy; {new Date().getFullYear()} Inkwell. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
