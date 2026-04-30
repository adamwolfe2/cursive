/**
 * Standalone layout for the /enterprise-deck sales presentation.
 * Suppresses the global site header, footer, and popups so the
 * deck fills the full viewport with its own chrome.
 */
export const metadata = {
  title: 'Enterprise Overview | Cursive',
  description: 'Cursive enterprise platform overview — visitor identification, intent data, AI outbound, and full-funnel pipeline acceleration.',
  openGraph: {
    title: 'Enterprise Overview | Cursive',
    description: 'Cursive enterprise platform overview — visitor identification, intent data, AI outbound, and full-funnel pipeline acceleration.',
  },
}

export default function EnterpriseDeckLayout({ children }: { children: React.ReactNode }) {
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
