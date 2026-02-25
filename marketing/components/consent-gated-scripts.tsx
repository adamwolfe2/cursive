"use client"

/**
 * Consent-gated script loader.
 * Non-essential tracking scripts (analytics, pixels) only load after the user
 * explicitly accepts cookies. This ensures GDPR/CCPA compliance: when a visitor
 * declines, no tracking fires.
 *
 * Architecture:
 * - On mount, reads the stored consent decision from localStorage.
 * - Listens for the "cursive:consent" custom event dispatched by CookieConsent.tsx
 *   so scripts load immediately when the user accepts on the same page visit.
 */

import { useEffect, useState } from "react"
import Script from "next/script"
import { hasConsentAccepted } from "@/components/cookie-consent"

export function ConsentGatedScripts() {
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    // Check consent stored from a previous visit
    if (hasConsentAccepted()) {
      setConsented(true)
      return
    }

    // Listen for consent granted during this page visit
    function onConsent(e: Event) {
      const detail = (e as CustomEvent<{ decision: string }>).detail
      if (detail?.decision === "accepted") {
        setConsented(true)
      }
    }
    window.addEventListener("cursive:consent", onConsent)
    return () => window.removeEventListener("cursive:consent", onConsent)
  }, [])

  if (!consented) return null

  return (
    <>
      {/* Google Analytics — only after consent */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-JZ9C4QKCX4"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-JZ9C4QKCX4');
        `}
      </Script>

      {/* RB2B Visitor Identification Pixel — only after consent */}
      <Script id="rb2b-pixel" strategy="afterInteractive">
        {`
          !function(key) {
            if (window.reb2b) return;
            window.reb2b = {loaded: true};
            var s = document.createElement("script");
            s.async = true;
            s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";
            document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);
          }("0NW1GHZ5RRO4");
        `}
      </Script>

      {/* AudienceLab SuperPixel — only after consent */}
      <Script
        src="https://cdn.v3.identitypxl.app/pixels/59aee3ac-1427-495e-b796-9b2ed0153adb/p.js"
        strategy="afterInteractive"
        async
      />
    </>
  )
}
