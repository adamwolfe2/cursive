import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { generateMetadata } from "@/lib/seo/metadata";
import { ClientLayout } from "@/components/client-layout";
import { ExitIntentPopup } from "@/components/exit-intent-popup";
import { CookieConsent } from "@/components/cookie-consent";
import { WebMCPProvider } from "@/components/webmcp-provider"
import { ConsentGatedScripts } from "@/components/consent-gated-scripts";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const dancingScript = Dancing_Script({
  variable: "--font-dancing-script",
  subsets: ["latin"],
  weight: ['400'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.meetcursive.com'),
  ...generateMetadata({
    title: "Turn Website Visitors Into Booked Meetings",
    description: "Identify 70% of website visitors and automate personalized outreach. Turn anonymous traffic into booked meetings with AI-powered lead generation.",
    keywords: ['website visitor identification', 'B2B lead generation', 'anonymous visitor tracking', 'automated outbound', 'AI SDR', 'lead enrichment', 'outbound automation', 'intent data', 'visitor deanonymization'],
    canonical: 'https://www.meetcursive.com',
  }),
  icons: {
    icon: '/cursive-logo.png',
    shortcut: '/cursive-logo.png',
    apple: '/cursive-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Preconnect hints for external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cal.com" />
        <link rel="dns-prefetch" href="https://leads.meetcursive.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* RSS Feed discovery */}
        <link rel="alternate" type="application/rss+xml" title="Cursive Blog" href="https://www.meetcursive.com/feed.xml" />
        {/* Crisp Chat — functional, loads unconditionally for support */}
        <Script id="crisp-chat" strategy="afterInteractive">
          {`
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="74f01aba-2977-4100-92ed-3297d60c6fcb";
            (function(){
              var d=document;
              var s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `}
        </Script>
      </head>
      <body
        className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}
      >
        <ClientLayout>
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
          <ExitIntentPopup />
          <CookieConsent />
          <ConsentGatedScripts />
          <WebMCPProvider />
        </ClientLayout>
      </body>
    </html>
  );
}
