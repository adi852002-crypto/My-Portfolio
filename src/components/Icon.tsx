/* Small line icons. Decorative: always paired with a visible text label,
   so every icon is aria-hidden at the call site. */
const PATHS: Record<string, React.ReactNode> = {
  flow: (
    <>
      <rect x="2.5" y="3" width="6" height="5" rx="1.2" />
      <rect x="15.5" y="3" width="6" height="5" rx="1.2" />
      <rect x="9" y="16" width="6" height="5" rx="1.2" />
      <path d="M8.5 5.5h7M5.5 8v5.5h13V8M12 13.5V16" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 6M17.5 14.9c2.1.6 3.5 2.4 3.5 5.1" />
    </>
  ),
  chip: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
      <path d="M10 6V3M14 6V3M10 21v-3M14 21v-3M6 10H3M6 14H3M21 10h-3M21 14h-3" />
    </>
  ),
  doc: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 12h6M9 16h6" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10.4 5.2 8.4 4.5 6 4.5H3.5v13H6c2.4 0 4.4.7 6 2 1.6-1.3 3.6-2 6-2h2.5v-13H18c-2.4 0-4.4.7-6 2z" />
      <path d="M12 6.5v12" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4 12.5l5 5L20 6.5" />,
};

export function Icon({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name] ?? PATHS.doc}
    </svg>
  );
}
