/**
 * WebMCP (Web Model Context Protocol) TypeScript Type Declarations
 *
 * Based on the W3C Community Group Draft specification:
 * https://webmachinelearning.github.io/webmcp/
 *
 * Chrome 146 Early Preview (stable ~March 10, 2026)
 * API is behind "WebMCP for testing" flag in chrome://flags
 */

export interface ModelContextTool {
  /** Unique tool identifier */
  name: string
  /** Natural language description of what the tool does */
  description: string
  /** JSON Schema describing the tool's input parameters */
  inputSchema?: {
    type: "object"
    properties: Record<
      string,
      {
        type: string
        description?: string
        enum?: string[]
        default?: unknown
      }
    >
    required?: string[]
  }
  /** Callback invoked when an AI agent calls this tool */
  execute: (
    input: Record<string, unknown>,
    client: ModelContextClient
  ) => Promise<unknown>
  /** Optional annotations about tool behavior */
  annotations?: ToolAnnotations
}

export interface ToolAnnotations {
  /** Hint that this tool only reads data and does not modify state */
  readOnlyHint?: boolean
}

export interface ModelContextOptions {
  tools?: ModelContextTool[]
}

export interface ModelContextClient {
  /** Pause agent execution to get explicit user confirmation */
  requestUserInteraction(callback: () => Promise<unknown>): Promise<unknown>
}

export interface ModelContext {
  /** Register a set of tools, replacing any previously set via provideContext */
  provideContext(options?: ModelContextOptions): void
  /** Clear all registered context and tools */
  clearContext(): void
  /** Register a single tool without resetting existing registrations */
  registerTool(tool: ModelContextTool): void
  /** Remove a tool by name */
  unregisterTool(name: string): void
}

declare global {
  interface Navigator {
    readonly modelContext?: ModelContext
  }
}

/**
 * Augment React's JSX attribute types so that WebMCP declarative
 * attributes (toolname, tooldescription, toolparamdescription,
 * toolautosubmit) are valid on forms and inputs without type errors.
 */
declare module "react" {
  interface FormHTMLAttributes<T> {
    toolname?: string
    tooldescription?: string
    toolautosubmit?: string
  }

  interface InputHTMLAttributes<T> {
    toolparamdescription?: string
  }

  interface SelectHTMLAttributes<T> {
    toolparamdescription?: string
  }

  interface TextareaHTMLAttributes<T> {
    toolparamdescription?: string
  }
}
