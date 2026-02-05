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

/**
 * Validates FAQ items for optimal answer engine performance
 *
 * Checks:
 * - Question ends with question mark
 * - Question length is reasonable (10-100 chars)
 * - Answer length is optimal (50-300 words for schema, 40-100 for snippets)
 * - Answer doesn't start with the question
 *
 * @param faqs - FAQ items to validate
 * @returns Validation results with warnings
 *
 * @example
 * const validation = validateFAQs(faqs)
 * if (validation.warnings.length > 0) {
 *   console.warn('FAQ validation warnings:', validation.warnings)
 * }
 */
export function validateFAQs(faqs: FAQItem[]): {
  isValid: boolean
  warnings: string[]
} {
  const warnings: string[] = []

  faqs.forEach((faq, index) => {
    const { question, answer } = faq

    // Question validation
    if (!question.endsWith('?')) {
      warnings.push(`FAQ ${index + 1}: Question should end with '?'`)
    }

    if (question.length < 10) {
      warnings.push(`FAQ ${index + 1}: Question is too short (< 10 chars)`)
    }

    if (question.length > 200) {
      warnings.push(`FAQ ${index + 1}: Question is too long (> 200 chars)`)
    }

    // Answer validation
    const wordCount = answer.split(/\s+/).length

    if (wordCount < 10) {
      warnings.push(`FAQ ${index + 1}: Answer is too short (< 10 words)`)
    }

    if (wordCount > 300) {
      warnings.push(
        `FAQ ${index + 1}: Answer is too long (> 300 words). Consider 50-100 words for featured snippets.`
      )
    }

    // Check if answer starts with question (redundant)
    if (answer.toLowerCase().startsWith(question.toLowerCase().replace('?', ''))) {
      warnings.push(`FAQ ${index + 1}: Answer shouldn't repeat the question`)
    }

    // Check for empty or placeholder content
    if (answer.toLowerCase().includes('[insert') || answer.toLowerCase().includes('lorem ipsum')) {
      warnings.push(`FAQ ${index + 1}: Answer contains placeholder content`)
    }
  })

  return {
    isValid: warnings.length === 0,
    warnings,
  }
}

/**
 * Optimizes FAQ answer length for featured snippets
 *
 * Truncates answers to optimal length (40-60 words) for featured snippet
 * extraction while preserving complete sentences.
 *
 * @param answer - Original answer text
 * @param targetWords - Target word count (default: 50)
 * @returns Optimized answer
 *
 * @example
 * const optimized = optimizeFAQAnswerForSnippet(
 *   "Long answer with multiple sentences...",
 *   50
 * )
 */
export function optimizeFAQAnswerForSnippet(
  answer: string,
  targetWords: number = 50
): string {
  const words = answer.split(/\s+/)

  if (words.length <= targetWords) {
    return answer
  }

  // Find the last complete sentence within target word count
  const sentences = answer.match(/[^.!?]+[.!?]+/g) || [answer]
  let optimized = ''
  let wordCount = 0

  for (const sentence of sentences) {
    const sentenceWords = sentence.split(/\s+/).length

    if (wordCount + sentenceWords <= targetWords + 10) {
      // Allow 10-word buffer
      optimized += sentence
      wordCount += sentenceWords
    } else {
      break
    }
  }

  return optimized.trim() || answer // Fallback to original if no complete sentence found
}

/**
 * Generates FAQ schema with AEO optimizations
 *
 * Creates FAQ schema optimized for:
 * - Featured snippets (answer length)
 * - Voice search (conversational questions)
 * - AI citation (clear structure)
 *
 * @param options - FAQ configuration with optional optimizations
 * @returns JSON-LD schema object
 *
 * @example
 * const schema = generateOptimizedFAQSchema({
 *   faqs: rawFaqs,
 *   optimizeForSnippets: true,
 *   validateSchema: true
 * })
 */
export function generateOptimizedFAQSchema(
  options: FAQSchemaOptions & {
    /**
     * Optimize answer length for featured snippets (40-60 words)
     */
    optimizeForSnippets?: boolean

    /**
     * Validate FAQ items before generating schema
     */
    validateSchema?: boolean

    /**
     * Log validation warnings to console
     */
    logWarnings?: boolean
  }
) {
  const {
    faqs,
    pageUrl,
    additionalProperties,
    optimizeForSnippets = false,
    validateSchema = true,
    logWarnings = false,
  } = options

  // Validate if requested
  if (validateSchema) {
    const validation = validateFAQs(faqs)

    if (!validation.isValid && logWarnings) {
      console.warn('FAQ Schema validation warnings:', validation.warnings)
    }
  }

  // Optimize answers if requested
  const processedFaqs = optimizeForSnippets
    ? faqs.map(faq => ({
        question: faq.question,
        answer: optimizeFAQAnswerForSnippet(faq.answer),
      }))
    : faqs

  return generateFAQSchema({
    faqs: processedFaqs,
    pageUrl,
    additionalProperties,
  })
}

/**
 * Merges multiple FAQ schema objects into one
 *
 * Useful when combining FAQs from different sections of a page.
 *
 * @param schemas - Array of FAQ schema objects
 * @param pageUrl - Optional URL for the combined schema
 * @returns Combined FAQ schema
 *
 * @example
 * const combined = mergeFAQSchemas([schema1, schema2, schema3])
 */
export function mergeFAQSchemas(
  schemas: ReturnType<typeof generateFAQSchema>[],
  pageUrl?: string
) {
  const allEntities = schemas.flatMap(schema => schema.mainEntity)

  return {
    '@context': 'https://schema.org' as const,
    '@type': 'FAQPage' as const,
    mainEntity: allEntities,
    ...(pageUrl && { url: pageUrl }),
  }
}

/**
 * Converts FAQ schema to HTML for rendering
 *
 * Generates semantic HTML with proper microdata for FAQ schema.
 *
 * @param faqs - FAQ items
 * @returns HTML string
 *
 * @example
 * const html = generateFAQHTML(faqs)
 */
export function generateFAQHTML(faqs: FAQItem[]): string {
  return `
<div itemScope itemType="https://schema.org/FAQPage">
  ${faqs
    .map(
      faq => `
  <div itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
    <h3 itemProp="name">${faq.question}</h3>
    <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
      <p itemProp="text">${faq.answer}</p>
    </div>
  </div>
  `
    )
    .join('\n')}
</div>
  `.trim()
}

/**
 * Type guard to check if content has FAQ schema potential
 *
 * @param content - Content to check
 * @returns True if content contains FAQ markers
 */
export function hasFAQContent(content: string): boolean {
  const faqMarkers = [
    /##\s+(Frequently Asked Questions|FAQ|Common Questions)/i,
    /###\s+.*\?/g, // H3 headings with questions
  ]

  return faqMarkers.some(pattern => pattern.test(content))
}

/**
 * Generates "People Also Ask" optimized FAQ items
 *
 * Helper to create FAQs that match Google's "People Also Ask" patterns.
 *
 * @param topic - Main topic/keyword
 * @param paaQuestions - Questions from PAA research
 * @returns Array of FAQ items with optimized structure
 */
export function generatePAAOptimizedFAQs(
  topic: string,
  paaQuestions: Array<{ question: string; answer: string }>
): FAQItem[] {
  return paaQuestions.map(paa => ({
    question: paa.question,
    answer: optimizeFAQAnswerForSnippet(paa.answer, 50),
  }))
}
