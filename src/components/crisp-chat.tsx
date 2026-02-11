'use client'

import Script from 'next/script'

export function CrispChat() {
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
