/**
 * RecipientPage.tsx — Public letter-reading experience for recipients.
 *
 * Accessible at /r/:id — no authentication required.
 * The letter must have status = 'delivered' for the RLS policy to allow reading.
 *
 * Reveal sequence:
 *   1. 500ms dark screen
 *   2. "You have a letter." fades in for 1600ms then fades out
 *   3. Paper slides up, date + title appear
 *   4. Body types out character by character (45ms/char) with typewriter sounds
 *   5. Ambient loop plays during typing, fades out when done
 *   6. "Download PDF" button and branding footer fade in
 *
 * PDF export:
 *   Uses html2canvas to capture the styled paper DOM node then jsPDF to
 *   package it as a downloadable PDF — preserving the parchment texture,
 *   fonts, and ruled lines exactly as they appear on screen.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams }    from 'react-router-dom';
import jsPDF            from 'jspdf';
import html2canvas      from 'html2canvas';
import { getLetter }    from '../services/lettersService';
import { useAudio }     from '../hooks/useAudio';
import { htmlToPlain, formatDate } from '../lib/utils';
import type { Letter }  from '../types/letter';
import '../styles/recipient.css';

type RevealStep = 'dark' | 'intro' | 'paper' | 'complete' | 'not-found';

const CHAR_SPEED_MS = 45;

export function RecipientPage() {
  const { id }  = useParams<{ id: string }>();
  const audio   = useAudio();

  const [step,         setStep]         = useState<RevealStep>('dark');
  const [letter,       setLetter]       = useState<Letter | null>(null);
  const [typedText,    setTypedText]    = useState('');
  const [dateVisible,  setDateVisible]  = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [doneVisible,  setDoneVisible]  = useState(false);
  const [cursorDone,   setCursorDone]   = useState(false);
  const [pdfBusy,      setPdfBusy]      = useState(false);

  const paperRef   = useRef<HTMLDivElement>(null);
  const cancelRef  = useRef<(() => void) | null>(null);

  // ---- Load + reveal sequence ----------------------------------------
  useEffect(() => {
    document.title = 'You have a letter — Inkwell';
    if (!id) { setStep('not-found'); return; }

    getLetter(id).then((found) => {
      if (!found || found.status !== 'delivered') {
        setStep('not-found');
        return;
      }
      setLetter(found);
      startReveal(found);
    });

    return () => { cancelRef.current?.(); };
  }, [id]);

  function startReveal(l: Letter) {
    // Phase 1: dark → intro
    const t1 = setTimeout(() => {
      setStep('intro');

      // Phase 2: intro → paper
      const t2 = setTimeout(() => {
        setStep('paper');
        audio.startAmbientLoop();

        const t3 = setTimeout(() => setDateVisible(true),  600);
        const t4 = setTimeout(() => setTitleVisible(true), 1000);

        // Phase 3: begin typewriter replay
        const t5 = setTimeout(() => {
          const plainText = htmlToPlain(l.body);
          typeReplay(plainText);
        }, 1400);

        cancelRef.current = () => {
          clearTimeout(t3); clearTimeout(t4); clearTimeout(t5);
        };
      }, 1600);

      cancelRef.current = () => clearTimeout(t2);
    }, 500);

    cancelRef.current = () => clearTimeout(t1);
  }

  function typeReplay(plainText: string) {
    let i = 0;

    const tick = () => {
      if (i >= plainText.length) {
        finishReveal();
        return;
      }
      const char = plainText[i];
      setTypedText(plainText.slice(0, ++i));

      if (char === '\n') audio.playCarriageReturn();
      else if (char !== ' ') audio.playKeyClack();

      const timer = setTimeout(tick, CHAR_SPEED_MS);
      cancelRef.current = () => clearTimeout(timer);
    };

    tick();
  }

  function finishReveal() {
    setStep('complete');
    setCursorDone(true);
    audio.stopAmbientLoop(2500);
    setTimeout(() => setDoneVisible(true), 1800);
  }

  // Skip typing on click during replay
  const handleSkip = useCallback(() => {
    if (step !== 'paper' || !letter) return;
    cancelRef.current?.();
    setTypedText(htmlToPlain(letter.body));
    finishReveal();
  }, [step, letter]);

  // ---- PDF export ----------------------------------------------------
  const handleDownloadPdf = useCallback(async () => {
    if (!paperRef.current || !letter || pdfBusy) return;
    setPdfBusy(true);

    try {
      await document.fonts.ready;

      const canvas = await html2canvas(paperRef.current, {
        scale:           2,
        useCORS:         true,
        backgroundColor: null,
        logging:         false,
      });

      const imgData   = canvas.toDataURL('image/jpeg', 0.95);
      const pdf       = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW     = pdf.internal.pageSize.getWidth();
      const imgH      = (canvas.height * pageW) / canvas.width;

      // If content is taller than A4, jsPDF will clip — add new pages as needed
      const pageH     = pdf.internal.pageSize.getHeight();
      let   remaining = imgH;
      let   offset    = 0;

      while (remaining > 0) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, -offset, pageW, imgH);
        offset    += pageH;
        remaining -= pageH;
      }

      pdf.save(`${letter.title.replace(/[^\w\s-]/g, '').trim() || 'letter'}.pdf`);
    } catch (err) {
      console.error('PDF export error:', err);
    } finally {
      setPdfBusy(false);
    }
  }, [letter, pdfBusy]);

  // ---- Not found / pending -------------------------------------------
  if (step === 'not-found') {
    return (
      <div className="recipient-page" aria-live="polite">
        <div className="recipient-error error--visible" role="alert">
          <p>
            This letter has not arrived yet,<br />
            or the link is incorrect.
          </p>
        </div>
      </div>
    );
  }

  const isTyping = step === 'paper';

  return (
    <div
      className="recipient-page"
      onClick={isTyping ? handleSkip : undefined}
      aria-label={isTyping ? 'Click anywhere to skip replay' : undefined}
    >
      {/* ---- Intro overlay ---- */}
      <div
        className={`recipient-intro ${step === 'intro' ? 'intro--visible' : ''}`}
        role="status"
        aria-live="polite"
      >
        <p className="intro-text">You have a letter.</p>
      </div>

      {/* ---- Letter paper ---- */}
      <div
        className={`letter-wrapper ${step === 'paper' || step === 'complete' ? 'letter--visible' : ''}`}
        role="article"
        aria-label="Your letter"
      >
        <div ref={paperRef} className="paper paper-parchment recipient-paper">
          <div className="paper-lines" aria-hidden="true" />

          <div
            className={`recipient-date ${dateVisible ? 'el--visible' : ''}`}
            aria-label={letter ? `Written ${formatDate(letter.created_at)}` : ''}
          >
            {letter ? formatDate(letter.created_at) : ''}
          </div>

          {letter?.title && (
            <div className={`recipient-title ${titleVisible ? 'el--visible' : ''}`}>
              {letter.title}
            </div>
          )}

          <div className="recipient-text" aria-live="polite" aria-label="Letter content">
            {typedText}
            {!cursorDone && (
              <span className="replay-cursor" aria-hidden="true" />
            )}
          </div>
        </div>

        {/* ---- Post-reveal actions ---- */}
        <div className={`recipient-done ${doneVisible ? 'done--visible' : ''}`}>
          <button
            className="pdf-download-btn"
            onClick={handleDownloadPdf}
            disabled={pdfBusy}
            aria-busy={pdfBusy}
            aria-label="Download this letter as a PDF"
          >
            {pdfBusy ? 'Generating…' : 'Download as PDF'}
          </button>
        </div>
      </div>

      {/* ---- Branding footer ---- */}
      <footer
        className={`recipient-footer ${doneVisible ? 'footer--visible' : ''}`}
      >
        <p>Written with Inkwell.</p>
      </footer>
    </div>
  );
}
