import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Cursive — AI-Powered Lead Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px',
        }}
      >
        {/* Logo mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'white',
              borderRadius: '12px',
              marginRight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#0A0A0A',
                borderRadius: '6px',
              }}
            />
          </div>
          <span
            style={{
              color: 'white',
              fontSize: '48px',
              fontWeight: '700',
              fontFamily: 'sans-serif',
              letterSpacing: '-1px',
            }}
          >
            Cursive
          </span>
        </div>

        {/* Main headline */}
        <div
          style={{
            color: 'white',
            fontSize: '64px',
            fontWeight: '800',
            fontFamily: 'sans-serif',
            lineHeight: 1.1,
            marginBottom: '28px',
            maxWidth: '900px',
            letterSpacing: '-2px',
          }}
        >
          Turn Website Visitors Into Pipeline
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#888888',
            fontSize: '28px',
            fontFamily: 'sans-serif',
            fontWeight: '400',
            letterSpacing: '-0.5px',
          }}
        >
          AI-powered B2B lead intelligence · meetcursive.com
        </div>
      </div>
    ),
    { ...size }
  )
}
