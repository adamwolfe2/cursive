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
import { WebMCPProvider } from "@/components/webmcp-provider";
import { Analytics } from "@vercel/analytics/next";

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
        {/* Google tag (gtag.js) */}
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
        {/* RB2B Pixel */}
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
        {/* Visitor Identification Pixel */}
        <Script
          src="https://cdn.v3.identitypxl.app/pixels/59aee3ac-1427-495e-b796-9b2ed0153adb/p.js"
          strategy="afterInteractive"
          async
        />
        {/* Crisp Chat */}
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
          <WebMCPProvider />
        </ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
