// Unified AI Provider
// Abstracts away the underlying AI service (Claude primary, OpenAI fallback)

import { createAnthropicClient, type AnthropicClient, CLAUDE_MODELS } from './anthropic'
import { createOpenAIClient, type OpenAIClient } from './openai'

export type AIProviderType = 'anthropic' | 'openai' | 'openrouter'

export interface AIProviderConfig {
  provider: AIProviderType
  apiKey: string
  model?: string
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionOptions {
  messages: AIMessage[]
  system?: string
  temperature?: number
  maxTokens?: number
}

export interface AICompletionResponse {
  content: string
  provider: AIProviderType
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
}

/**
 * Unified AI Provider that supports multiple backends
 */
export class AIProvider {
  private anthropicClient?: AnthropicClient
  private openaiClient?: OpenAIClient
  private primaryProvider: AIProviderType
  private model: string

  constructor(config: AIProviderConfig) {
    this.primaryProvider = config.provider
    this.model = config.model || this.getDefaultModel(config.provider)

    if (config.provider === 'anthropic') {
      this.anthropicClient = createAnthropicClient(config.apiKey, this.model)
    } else {
      this.openaiClient = createOpenAIClient(config.apiKey, this.model)
    }
  }

  private getDefaultModel(provider: AIProviderType): string {
    switch (provider) {
      case 'anthropic':
        return CLAUDE_MODELS['claude-3-5-sonnet']
      case 'openai':
        return 'gpt-4o-mini'
      case 'openrouter':
        return 'anthropic/claude-3.5-sonnet'
      default:
        return 'gpt-4o-mini'
    }
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResponse> {
    if (this.primaryProvider === 'anthropic' && this.anthropicClient) {
      return this.completeWithAnthropic(options)
    } else if (this.openaiClient) {
      return this.completeWithOpenAI(options)
    }

    throw new Error('No AI provider configured')
  }

  private async completeWithAnthropic(options: AICompletionOptions): Promise<AICompletionResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not configured')
    }

    // Extract system message and convert to Anthropic format
    const systemMessage = options.messages.find(m => m.role === 'system')
    const conversationMessages = options.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await this.anthropicClient.chatCompletion({
      messages: conversationMessages,
      system: options.system || systemMessage?.content,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })

    return {
      content: response.content,
      provider: 'anthropic',
      model: this.model,
      usage: {
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
      },
    }
  }

  private async completeWithOpenAI(options: AICompletionOptions): Promise<AICompletionResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not configured')
    }

    // Add system message if provided separately
    let messages = [...options.messages]
    if (options.system && !messages.find(m => m.role === 'system')) {
      messages = [{ role: 'system', content: options.system }, ...messages]
    }

    const response = await this.openaiClient.chatCompletion({
      messages,
      temperature: options.temperature,
      maxTokens: options.maxTokens,
    })

    return {
      content: response.content,
      provider: this.primaryProvider,
      model: this.model,
      usage: {
        inputTokens: response.usage.promptTokens,
        outputTokens: response.usage.completionTokens,
      },
    }
  }
}

/**
 * Create an AI provider with fallback support
 * Tries Claude first, falls back to OpenAI if Claude key not available
 */
export function createAIProvider(options: {
  anthropicKey?: string
  openaiKey?: string
  preferredProvider?: AIProviderType
  model?: string
}): AIProvider {
  const { anthropicKey, openaiKey, preferredProvider, model } = options

  // Determine which provider to use
  let provider: AIProviderType
  let apiKey: string

  if (preferredProvider === 'anthropic' && anthropicKey) {
    provider = 'anthropic'
    apiKey = anthropicKey
  } else if (preferredProvider === 'openai' && openaiKey) {
    provider = 'openai'
    apiKey = openaiKey
  } else if (anthropicKey) {
    // Default to Claude if available
    provider = 'anthropic'
    apiKey = anthropicKey
  } else if (openaiKey) {
    provider = 'openai'
    apiKey = openaiKey
  } else {
    throw new Error('No AI API key provided. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.')
  }

  return new AIProvider({ provider, apiKey, model })
}

/**
 * Get AI provider from environment with agent overrides
 */
export function getAIProviderForAgent(agent: {
  ai_provider: string
  ai_model: string
  openai_api_key?: string | null
  anthropic_api_key?: string | null
}): AIProvider {
  // Check for agent-specific keys first
  const anthropicKey = agent.anthropic_api_key || process.env.ANTHROPIC_API_KEY
  const openaiKey = agent.openai_api_key || process.env.OPENAI_API_KEY

  // Map agent provider to our provider type
  const providerMap: Record<string, AIProviderType> = {
    anthropic: 'anthropic',
    claude: 'anthropic',
    openai: 'openai',
    openrouter: 'openrouter',
  }

  const preferredProvider = providerMap[agent.ai_provider] || 'anthropic'

  return createAIProvider({
    anthropicKey,
    openaiKey,
    preferredProvider,
    model: agent.ai_model,
  })
}
