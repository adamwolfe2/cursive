import { generateMetadata as genMeta } from '@/lib/seo/metadata'
import { StructuredData } from '@/components/seo/structured-data'
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo/structured-data'

export const metadata = genMeta({
  title: 'What is Visitor Deanonymization? Complete Technical Guide (2026)',
  description: 'Learn how visitor deanonymization works, including IP resolution, device fingerprinting, probabilistic and deterministic matching, confidence scoring, and how to turn anonymous website traffic into identified business contacts.',
  keywords: [
    'visitor deanonymization',
    'website visitor deanonymization',
    'anonymous visitor identification',
    'IP address resolution',
    'device fingerprinting',
    'identity resolution',
    'probabilistic matching',
    'deterministic matching',
    'B2B visitor identification',
    'visitor deanonymization tools',
  ],
  canonical: 'https://www.meetcursive.com/what-is-visitor-deanonymization',
})

const deanonymizationFAQs = [
  {
    question: 'What is visitor deanonymization?',
    answer: 'Visitor deanonymization is the technical process of converting an anonymous website session into an identified individual profile. Whereas a traditional web analytics tool shows you a session from "unknown user, IP 192.168.1.1," deanonymization software resolves that session to a specific person — revealing their name, email, company, and contact information by matching session signals against identity databases.',
  },
  {
    question: 'What is the difference between deanonymization and doxxing?',
    answer: 'Visitor deanonymization for B2B marketing is fundamentally different from doxxing. Deanonymization uses privacy-compliant identity matching against opted-in or publicly available professional profiles for legitimate commercial purposes. The data comes from business sources (LinkedIn, company directories, opt-in databases) and is used for B2B sales outreach — a standard commercial practice. Doxxing involves revealing private information maliciously without consent. B2B deanonymization operates under legitimate interest frameworks (CCPA, GDPR) with opt-out mechanisms.',
  },
  {
    question: 'What technical methods are used for visitor deanonymization?',
    answer: 'Four primary techniques: (1) IP resolution — mapping an IP address to a known company or ISP network to identify the visiting organization; (2) Device fingerprinting — combining browser version, screen resolution, timezone, installed fonts, and other signals into a probabilistic device fingerprint; (3) Probabilistic identity matching — cross-referencing multiple signals against an identity graph to generate a confidence score for a potential match; (4) Deterministic matching — directly matching a visitor against a known cookie or login ID. Enterprise tools combine all four for maximum identification rates.',
  },
  {
    question: 'What is probabilistic vs deterministic matching?',
    answer: 'Deterministic matching is 100% certain — a visitor is logged into an account, and you know exactly who they are. Probabilistic matching uses statistical models to infer identity from indirect signals (device type + IP range + browser fingerprint + time-of-day pattern). Probabilistic matches come with confidence scores (e.g., 87% likely to be John Smith). Best tools use deterministic data where available and fall back to probabilistic — Cursive\'s 70% identification rate reflects this combined approach.',
  },
  {
    question: 'How accurate is visitor deanonymization?',
    answer: 'For B2B US website traffic, leading deanonymization tools identify 50-70% of visitors as specific individuals. Cursive achieves ~70% person-level identification of US B2B visitors. Accuracy is highest for visitors from corporate IP ranges (office networks), lower for visitors on consumer ISPs (home, mobile). Email deliverability on identified contacts averages 95%+ for verified profiles, ensuring the data quality is usable for outreach.',
  },
  {
    question: 'Is visitor deanonymization GDPR compliant?',
    answer: 'For US B2B traffic, visitor deanonymization operates under legitimate interest and commercial use standards, which is CCPA-compliant. For EU visitors under GDPR, the situation is more nuanced — some forms of deanonymization require a valid legal basis. Most B2B tools, including Cursive, provide a consent-based opt-out mechanism and honor all suppression lists. Processing EU visitor data for marketing purposes typically requires legitimate interest documentation or explicit consent.',
  },
  {
    question: 'What can I do with deanonymized visitor data?',
    answer: 'Common use cases: (1) Push identified visitors to CRM with automatic sales alerts; (2) Trigger personalized email or LinkedIn outreach within hours of a high-intent page visit; (3) Send triggered direct mail to hot prospects; (4) Build retargeting audiences on LinkedIn, Google, and Meta with real B2B profiles; (5) Score and prioritize existing pipeline by overlapping with active website visitors; (6) Identify which marketing campaigns are driving your highest-intent traffic.',
  },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData data={[
        generateBreadcrumbSchema([
          { name: 'Home', url: 'https://www.meetcursive.com' },
          { name: 'What is Visitor Deanonymization?', url: 'https://www.meetcursive.com/what-is-visitor-deanonymization' },
        ]),
        generateFAQSchema(deanonymizationFAQs),
      ]} />
      {children}
    </>
  )
}
