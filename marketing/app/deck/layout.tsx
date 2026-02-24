/**
 * Standalone layout for the /deck sales presentation.
 * Suppresses the global site header, footer, and popups so the
 * deck fills the full viewport with its own chrome.
 */
export default function DeckLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        /* Hide global site chrome — deck has its own */
        header.fixed           { display: none !important; }
        footer                 { display: none !important; }
        main                   { padding-top: 0 !important; }
        [data-exit-intent]     { display: none !important; }
        [data-cookie-consent]  { display: none !important; }
      `}</style>
      {children}
    </>
  )
}
