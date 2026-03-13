'use client'

import { useState } from 'react'
import Image from 'next/image'

// Integration logo configuration - using uploaded files from public folder
export const INTEGRATION_LOGOS: Record<string, { src: string; alt: string }> = {
  slack: { src: '/Slack_icon_2019.svg.png', alt: 'Slack' },
  zapier: { src: '/zapier-logo-png-transparent.png', alt: 'Zapier' },
  salesforce: { src: '/Salesforce.com_logo.svg.png', alt: 'Salesforce' },
  hubspot: { src: '/free-hubspot-logo-icon-svg-download-png-2944939.webp', alt: 'HubSpot' },
  pipedrive: { src: '/Pipedrive_Monogram_Green background.png', alt: 'Pipedrive' },
  'google-sheets': { src: '/Google_Sheets_Logo_512px.png', alt: 'Google Sheets' },
  'microsoft-teams': { src: '/Microsoft_Teams.png', alt: 'Microsoft Teams' },
  discord: { src: '/concours-discord-cartes-voeux-fortnite-france-6.png', alt: 'Discord' },
}

// Fallback icon component when logo is not available
export function FallbackIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    salesforce: 'bg-blue-500',
    hubspot: 'bg-orange-500',
    pipedrive: 'bg-green-600',
    'google-sheets': 'bg-green-500',
    'microsoft-teams': 'bg-indigo-500',
    discord: 'bg-indigo-600',
  }

  const labels: Record<string, string> = {
    salesforce: 'SF',
    hubspot: 'HS',
    pipedrive: 'PD',
    'google-sheets': 'GS',
    'microsoft-teams': 'MT',
    discord: 'DC',
  }

  return (
    <div className={`w-10 h-10 rounded-lg ${icons[name] || 'bg-zinc-400'} flex items-center justify-center text-white text-xs font-bold`}>
      {labels[name] || name.slice(0, 2).toUpperCase()}
    </div>
  )
}

// Integration logo component with fallback
export function IntegrationLogo({ name }: { name: string }) {
  const [hasError, setHasError] = useState(false)
  const logo = INTEGRATION_LOGOS[name]

  if (!logo || hasError) {
    return <FallbackIcon name={name} />
  }

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={40}
      height={40}
      className="object-contain"
      onError={() => setHasError(true)}
    />
  )
}
