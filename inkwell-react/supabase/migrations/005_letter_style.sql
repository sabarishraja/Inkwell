-- ---- Letter style preferences ----------------------------------------
-- Adds font and paper columns so the writer's stationery choices
-- are stored with the letter and render correctly everywhere:
-- the owner's view, the recipient's reading experience, and PDF export.

ALTER TABLE letters
  ADD COLUMN IF NOT EXISTS font  TEXT NOT NULL DEFAULT 'typewriter',
  ADD COLUMN IF NOT EXISTS paper TEXT NOT NULL DEFAULT 'parchment';
