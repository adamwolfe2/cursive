import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { generateMetadata } from "@/lib/seo/metadata";
import { ClientLayout } from "@/components/client-layout";
import { ExitIntentPopup } from "@/components/exit-intent-popup";

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
    description: "Cursive identifies your anonymous website visitors, enriches them with verified contact data, and automates personalized outreach across email, LinkedIn, and SMS—so you book more meetings on autopilot.",
    keywords: ['website visitor identification', 'B2B lead generation', 'anonymous visitor tracking', 'automated outbound', 'AI SDR', 'lead enrichment', 'outbound automation', 'intent data', 'visitor deanonymization'],
    canonical: 'https://meetcursive.com',
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
      </head>
      <body
        className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}
      >
        <ClientLayout>
          <Header />
          <main className="pt-16">{children}</main>
          <Footer />
          <ExitIntentPopup />
        </ClientLayout>
      </body>
    </html>
  );
}
