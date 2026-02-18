'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export function CrispChat() {
  const [shouldLoad, setShouldLoad] = useState(false)

  // Defer Crisp loading by 3 seconds after page becomes interactive
  // to avoid blocking initial page rendering and TTI
  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!shouldLoad) return null

  return (
    <Script
      id="crisp-chat"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="74f01aba-2977-4100-92ed-3297d60c6fcb";
          (function(){
            var d=document;
            var s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `,
      }}
    />
  )
}
