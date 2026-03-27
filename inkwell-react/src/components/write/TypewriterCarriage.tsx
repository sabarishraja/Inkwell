import { useEffect, useRef, useState, type CSSProperties } from 'react';
// Paper text area width: 900px paper - 2 × 36px margin = 828px
const CHAR_WIDTH   = 10;   // px per monospace character
const MAX_TRAVEL   = 828;  // px — full text-area width

interface TypewriterCarriageProps {
  columnIndex: number;   // raw column char count (0 = line start)
  ribbonActive: boolean;
}

export function TypewriterCarriage({ columnIndex, ribbonActive }: TypewriterCarriageProps) {
  const [isReturn, setIsReturn] = useState(false);
  const prevIndexRef = useRef(columnIndex);

  useEffect(() => {
    if (columnIndex === 0 && prevIndexRef.current > 0) {
      setIsReturn(true);
      const t = setTimeout(() => setIsReturn(false), 200);
      prevIndexRef.current = 0;
      return () => clearTimeout(t);
    }
    prevIndexRef.current = columnIndex;
  }, [columnIndex]);

  const translateX = Math.max(-MAX_TRAVEL, -(columnIndex * CHAR_WIDTH));

  return (
    <div
      className={`carriage-overlay${isReturn ? ' carriage-return' : ''}`}
      style={{ '--carriage-x': `${translateX}px` } as CSSProperties}
    >
      <div className={`ribbon-flash${ribbonActive ? ' ribbon-active' : ''}`} />
    </div>
  );
}
