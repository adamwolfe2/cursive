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
    title: "AI Intent Systems That Never Sleep",
    description: "Identify and track website visitors, build targeted lists, launch direct mail campaigns, and maximize ad performance—all from one platform that unites verified B2C and B2B data.",
    keywords: ['B2B lead generation', 'visitor identification', 'intent data', 'direct mail marketing', 'audience targeting', 'AI SDR', 'outbound automation'],
    canonical: 'https://meetcursive.com',
  }),
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
