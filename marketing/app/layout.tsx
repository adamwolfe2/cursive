import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL('https://www.meetcursive.com'),
  ...generateMetadata({
    title: "Find your buyers, reach them, run it",
    description: "Cursive finds your buyers, reaches them for you, and gives you the system to run it. Paste your website and get 25 free leads: decision makers with checked work emails and why each one fits. No card.",
    keywords: ['B2B leads', 'free leads', 'lead generation', 'decision makers', 'work emails', 'LinkedIn outreach', 'done-for-you outreach', 'visitor pixel'],
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
        className={`${inter.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[#007AFF] focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:ring-offset-2"
        >
          Skip to content
        </a>
        <ClientLayout>
          <Header />
          <main id="main-content" tabIndex={-1} className="pt-16 focus:outline-none">{children}</main>
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
