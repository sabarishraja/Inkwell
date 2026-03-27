export function LetterShowcase() {
  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, var(--ink-void), #12100D)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2.5rem',
        padding: '5rem 1.5rem',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', maxWidth: '720px' }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 300,
            fontSize: 'clamp(32px, 5vw, 64px)',
            lineHeight: 1.1,
            color: 'var(--ink-parchment)',
            letterSpacing: '-0.02em',
            margin: '0 0 12px',
          }}
        >
          Write what your heart has always meant to say.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: 'clamp(14px, 1.8vw, 19px)',
            color: 'rgba(245, 230, 200, 0.55)',
            margin: 0,
          }}
        >
          Letters that feel handwritten. Delivered when the time is right.
        </p>
      </div>

      {/* Letter image */}
      <img
        src="/example letter.png"
        alt="Example handwritten letter on aged parchment"
        style={{
          height: 'clamp(420px, 65vh, 700px)',
          width: 'auto',
          display: 'block',
          borderRadius: '4px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  );
}
