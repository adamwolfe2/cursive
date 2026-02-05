import type { Metadata } from "next";
import { Inter, Dancing_Script } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { generateMetadata } from "@/lib/seo/metadata";

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
  icons: {
    icon: [
      { url: '/cursive-logo.png', sizes: '512x442', type: 'image/png' },
      { url: '/cursive-logo.png', sizes: '32x32', type: 'image/png' },
      { url: '/cursive-logo.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/cursive-logo.png',
    apple: '/cursive-logo.png',
    other: {
      rel: 'icon',
      url: '/cursive-logo.png',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.variable} ${dancingScript.variable} font-sans antialiased`}
      >
        <Header />
        <main className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
