// OpenAI Service
// Handles AI-powered email reply generation and intent classification

export interface OpenAIConfig {
  apiKey: string
  model?: string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionOptions {
  messages: Message[]
  temperature?: number
  maxTokens?: number
  model?: string
}

export interface ChatCompletionResponse {
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class OpenAIClient {
  private apiKey: string
  private defaultModel: string
  private baseUrl = 'https://api.openai.com/v1'

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.defaultModel = config.model || 'gpt-4o-mini'
  }

  async chatCompletion(options: ChatCompletionOptions): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: options.model || this.defaultModel,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 1000,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorBody}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    if (!choice?.message?.content) {
      throw new Error('OpenAI API returned empty response')
    }

    return {
      content: choice.message.content,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    }
  }
}

// Factory function
export function createOpenAIClient(apiKey: string, model?: string): OpenAIClient {
  return new OpenAIClient({ apiKey, model })
}
