const PATHS = {
  map: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  graph: 'M6 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M18 6m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M12 18m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M7.5 7.5L11 16M16.5 7.5L13 16M8 6h8',
  review: 'M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5',
  compare: 'M12 4v16M5 20h14M7 8l-3 6h6zM17 8l-3 6h6zM5 8h14',
  formula: 'M17 5H8l5 7-5 7h9',
  book: 'M5 4h9a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h9',
  settings: 'M12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6zM12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1L7 17M17 7l2.1-2.1',
} as const;

export function Icon({ name }: { name: keyof typeof PATHS }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
