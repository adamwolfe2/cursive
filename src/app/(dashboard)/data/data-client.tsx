'use client'

import dynamic from 'next/dynamic'

const AskYourDataSlideOver = dynamic(
  () => import('@/components/intelligence/AskYourDataSlideOver').then(mod => ({ default: mod.AskYourDataSlideOver })),
  { ssr: false }
)

export function DataClientComponents() {
  return <AskYourDataSlideOver />
}
