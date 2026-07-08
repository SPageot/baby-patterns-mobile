export const STICKY_NOTE_COLORS = [
  { bg: '#fff9c4', border: '#f0e68c', shadow: 'rgba(180, 160, 40, 0.25)' },
  { bg: '#ffd6e8', border: '#f5b8d4', shadow: 'rgba(200, 100, 140, 0.22)' },
  { bg: '#d4f5e9', border: '#a8e6cf', shadow: 'rgba(80, 160, 120, 0.2)' },
  { bg: '#d6ecff', border: '#a8d4ff', shadow: 'rgba(80, 140, 200, 0.2)' },
  { bg: '#e8dff5', border: '#cfc0e8', shadow: 'rgba(140, 100, 180, 0.2)' },
  { bg: '#ffe8d6', border: '#f5c9a8', shadow: 'rgba(200, 140, 80, 0.2)' },
] as const

export function stickyNoteColor(index: number) {
  const i = ((index % STICKY_NOTE_COLORS.length) + STICKY_NOTE_COLORS.length) % STICKY_NOTE_COLORS.length
  return STICKY_NOTE_COLORS[i]
}
