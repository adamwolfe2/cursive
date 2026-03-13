/**
 * FAQ Schema Generation Helpers
 *
 * Helper functions for generating FAQ schema markup optimized for
 * answer engines, featured snippets, and AI citation.
 *
 * Based on Schema.org FAQPage specification:
 * https://schema.org/FAQPage
 */

export interface FAQItem {
  question: string
  answer: string
}

export interface FAQSchemaOptions {
  /**
   * Array of FAQ items to include in schema
   */
  faqs: FAQItem[]

  /**
   * Optional: Page URL for mainEntity reference
   */
  pageUrl?: string

  /**
   * Optional: Additional schema properties
   */
  additionalProperties?: Record<string, unknown>
}

/**
 * Generates FAQ schema markup for a page
 *
 * @param options - FAQ schema configuration
 * @returns JSON-LD schema object
 *
 * @example
 * const schema = generateFAQSchema({
 *   faqs: [
 *     {
 *       question: "What is visitor identification?",
 *       answer: "Visitor identification reveals the companies and individuals browsing your website—even if they don't fill out a form."
 *     }
 *   ]
 * })
 */
export function generateFAQSchema(options: FAQSchemaOptions) {
  const { faqs, pageUrl, additionalProperties = {} } = options

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
    ...(pageUrl && { url: pageUrl }),
    ...additionalProperties,
  }
}

/**
 * Generates individual Question schema (for use outside FAQPage)
 *
 * @param question - The question text
 * @param answer - The answer text
 * @returns JSON-LD schema object
 *
 * @example
 * const schema = generateQuestionSchema(
 *   "How does Cursive identify visitors?",
 *   "Cursive uses IP intelligence and device fingerprinting to identify visitors in real-time."
 * )
 */
export function generateQuestionSchema(question: string, answer: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  }
}

/**
 * Extracts FAQ items from markdown content
 *
 * Parses markdown looking for FAQ sections with ### headings as questions
 * and following paragraphs as answers.
 *
 * @param markdown - Markdown content containing FAQ section
 * @returns Array of FAQ items
 *
 * @example
 * const faqs = extractFAQsFromMarkdown(`
 * ## Frequently Asked Questions
 *
 * ### What is visitor identification?
 *
 * Visitor identification reveals companies and individuals browsing your website.
 *
 * ### How accurate is it?
 *
 * Cursive identifies up to 70% of B2B traffic.
 * `)
 */
export function extractFAQsFromMarkdown(markdown: string): FAQItem[] {
  const faqs: FAQItem[] = []

  // Match FAQ section (everything after "Frequently Asked Questions" or "FAQ")
  const faqSectionMatch = markdown.match(
    /##\s+(Frequently Asked Questions|FAQ|Common Questions)[^\n]*\n([\s\S]*?)(?=\n##\s+|$)/i
  )

  if (!faqSectionMatch) {
    return faqs
  }

  const faqSection = faqSectionMatch[2]

  // Match ### headings (questions) and their following content (answers)
  const questionPattern = /###\s+([^\n]+)\n\n([\s\S]*?)(?=\n###\s+|$)/g

  let match
  while ((match = questionPattern.exec(faqSection)) !== null) {
    const question = match[1].trim()
    const answer = match[2].trim()

    // Clean up the answer (remove extra whitespace, normalize)
    const cleanAnswer = answer
      .replace(/\n\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    if (question && cleanAnswer) {
      faqs.push({
        question,
        answer: cleanAnswer,
      })
    }
  }

  return faqs
}

