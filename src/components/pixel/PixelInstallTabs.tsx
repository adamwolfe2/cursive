'use client'

import { useState } from 'react'
import { CheckCircle, Copy } from 'lucide-react'

const TABS = ['HTML', 'Next.js', 'React', 'GTM', 'Shopify'] as const
type Tab = typeof TABS[number]

function CodeBlock({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) {
  return (
    <div className="relative">
      <pre className="bg-zinc-950 text-zinc-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
        {code}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 transition-colors"
        title="Copy code"
      >
        {copied
          ? <CheckCircle className="h-3.5 w-3.5 text-green-400" />
          : <Copy className="h-3.5 w-3.5 text-zinc-400" />
        }
      </button>
    </div>
  )
}

export function PixelInstallTabs({ pixelId }: { pixelId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('HTML')
  const [copiedTab, setCopiedTab] = useState<Tab | null>(null)

  const pixelUrl = `https://cdn.meetcursive.com/pixel.js`

  const getCode = (tab: Tab): string => {
    switch (tab) {
      case 'HTML':
        return `<!-- Cursive SuperPixel — paste before </head> -->
<script>
  (function(c,u,r,s,i,v,e){c[i]=c[i]||function(){
    (c[i].q=c[i].q||[]).push(arguments)};
    v=u.createElement(r);v.async=1;v.src=s;
    e=u.getElementsByTagName(r)[0];e.parentNode.insertBefore(v,e)
  })(window,document,'script','${pixelUrl}','cursive');
  cursive('init', '${pixelId}');
</script>`

      case 'Next.js':
        return `// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="cursive-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: \`
              (function(c,u,r,s,i,v,e){c[i]=c[i]||function(){
                (c[i].q=c[i].q||[]).push(arguments)};
                v=u.createElement(r);v.async=1;v.src=s;
                e=u.getElementsByTagName(r)[0];e.parentNode.insertBefore(v,e)
              })(window,document,'script','${pixelUrl}','cursive');
              cursive('init', '${pixelId}');
            \`
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`

      case 'React':
        return `// Add to your root App component or index.js
import { useEffect } from 'react'

function useCursivePixel() {
  useEffect(() => {
    if (window.cursive) return // Already loaded

    const script = document.createElement('script')
    script.src = '${pixelUrl}'
    script.async = true
    script.onload = () => {
      window.cursive?.('init', '${pixelId}')
    }
    document.head.appendChild(script)
  }, [])
}

// In your App component:
export default function App() {
  useCursivePixel()
  return <YourApp />
}`

      case 'GTM':
        return `// In Google Tag Manager:
// 1. Create a new Tag → Custom HTML
// 2. Paste this code:

<script>
  (function(c,u,r,s,i,v,e){c[i]=c[i]||function(){
    (c[i].q=c[i].q||[]).push(arguments)};
    v=u.createElement(r);v.async=1;v.src=s;
    e=u.getElementsByTagName(r)[0];e.parentNode.insertBefore(v,e)
  })(window,document,'script','${pixelUrl}','cursive');
  cursive('init', '${pixelId}');
</script>

// 3. Set trigger to: All Pages
// 4. Click Save, then Publish`

      case 'Shopify':
        return `{% comment %} Paste in theme.liquid before </head> {% endcomment %}
<script>
  (function(c,u,r,s,i,v,e){c[i]=c[i]||function(){
    (c[i].q=c[i].q||[]).push(arguments)};
    v=u.createElement(r);v.async=1;v.src=s;
    e=u.getElementsByTagName(r)[0];e.parentNode.insertBefore(v,e)
  })(window,document,'script','${pixelUrl}','cursive');
  cursive('init', '${pixelId}');
</script>

{%- comment -%}
  Or use Shopify's Customer Events (Settings → Customer events)
  to add the pixel without editing theme files.
{%- endcomment -%}`
    }
  }

  const handleCopy = async (tab: Tab) => {
    const code = getCode(tab)
    await navigator.clipboard.writeText(code).catch(() => {})
    setCopiedTab(tab)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-0 border border-border rounded-lg overflow-hidden mb-3 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-r border-border last:border-r-0 transition-colors ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Code */}
      <CodeBlock
        code={getCode(activeTab)}
        onCopy={() => handleCopy(activeTab)}
        copied={copiedTab === activeTab}
      />

      {/* Helper text */}
      <p className="text-xs text-muted-foreground mt-2">
        {activeTab === 'HTML' && 'Paste this snippet before the closing </head> tag on every page you want to track.'}
        {activeTab === 'Next.js' && 'Uses next/script with afterInteractive strategy to load after the page hydrates.'}
        {activeTab === 'React' && 'Loads the pixel once on mount. Works with Create React App, Vite, and any React setup.'}
        {activeTab === 'GTM' && 'Add as a Custom HTML tag with All Pages trigger in Google Tag Manager.'}
        {activeTab === 'Shopify' && 'Paste into theme.liquid or add via Shopify Customer Events for codeless installation.'}
      </p>
    </div>
  )
}
