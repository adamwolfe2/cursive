/**
 * Test Utilities
 * OpenInfo Platform
 *
 * Custom render function and testing utilities that extend @testing-library/react.
 */

import React, { ReactElement } from 'react'
import { render as rtlRender, RenderOptions, RenderResult, fireEvent } from '@testing-library/react'

// Re-export everything from testing-library
export * from '@testing-library/react'

// Simplified user interaction helper using fireEvent
const user = {
  click: async (element: Element) => {
    fireEvent.click(element)
  },
  type: async (element: Element, text: string) => {
    fireEvent.change(element, { target: { value: text } })
  },
  clear: async (element: Element) => {
    fireEvent.change(element, { target: { value: '' } })
  },
  hover: async (element: Element) => {
    fireEvent.mouseEnter(element)
  },
  unhover: async (element: Element) => {
    fireEvent.mouseLeave(element)
  },
  tab: async () => {
    fireEvent.keyDown(document.activeElement || document.body, { key: 'Tab' })
  },
}

// Custom render result that includes user interaction helper
interface CustomRenderResult extends RenderResult {
  user: typeof user
}

/**
 * Custom render function that includes user interaction helper
 */
function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult {
  const renderResult = rtlRender(ui, options)

  return {
    ...renderResult,
    user,
  }
}

export { render }
