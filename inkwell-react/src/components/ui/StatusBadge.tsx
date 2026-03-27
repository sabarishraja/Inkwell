/**
 * StatusBadge.tsx — Letter status pill badge (Sealed / Delivered / Opened).
 */

import type { LetterStatus } from '../../types/letter';

interface Props {
  status: LetterStatus;
}

const LABELS: Record<LetterStatus, string> = {
  pending:   'Pending',
  delivered: 'Delivered',
};

const CLASSES: Record<LetterStatus, string> = {
  pending:   'badge--pending',
  delivered: 'badge--delivered',
};

export function StatusBadge({ status }: Props) {
  return (
    <span className={`status-badge ${CLASSES[status]}`} aria-label={`Status: ${LABELS[status]}`}>
      {LABELS[status]}
    </span>
  );
}
