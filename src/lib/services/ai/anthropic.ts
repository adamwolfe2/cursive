// Anthropic Claude API Client
// Primary AI provider for email generation and analysis

export interface AnthropicConfig {
  apiKey: string
  model?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: Message[]
  system?: string
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface ChatCompletionResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
  }
  stopReason: string
}

export class AnthropicClient {
  private apiKey: string
  private defaultModel: string
  private baseUrl = 'https://api.anthropic.com/v1'
  private apiVersion = '2023-06-01'

  constructor(config: AnthropicConfig) {
    this.apiKey = config.apiKey
    this.defaultModel = config.model || 'claude-3-5-sonnet-20241022'
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': this.apiVersion,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens ?? 1024,
        system: options.system,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Anthropic API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()

    // Extract text content from response
    const textContent = data.content?.find((c: { type: string }) => c.type === 'text')
    if (!textContent?.text) {
      throw new Error('Anthropic API returned empty response')
    }

    return {
      content: textContent.text,
      usage: {
        inputTokens: data.usage?.input_tokens || 0,
        outputTokens: data.usage?.output_tokens || 0,
      },
      stopReason: data.stop_reason || 'end_turn',
    }
  }
}

// Factory function
export function createAnthropicClient(apiKey: string, model?: string): AnthropicClient {
  return new AnthropicClient({ apiKey, model })
}

// Available Claude models
export const CLAUDE_MODELS = {
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku': 'claude-3-5-haiku-20241022',
  'claude-3-opus': 'claude-3-opus-20240229',
  'claude-3-sonnet': 'claude-3-sonnet-20240229',
  'claude-3-haiku': 'claude-3-haiku-20240307',
} as const
