import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'BrandPilot — AI-Powered Social Media Management';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#09090b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.15) 0%, transparent 60%)',
            display: 'flex',
          }}
        />

        {/* Top border accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: '#f59e0b',
            display: 'flex',
          }}
        />

        {/* Compass icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <svg
            width="72"
            height="72"
            viewBox="0 0 48 48"
            fill="none"
          >
            <circle cx="24" cy="24" r="22" stroke="#3f3f46" strokeWidth="2" fill="#18181b" />
            <path d="M24 8 L32 24 L24 20 L16 24 Z" fill="#f59e0b" />
            <path d="M24 40 L32 24 L24 28 L16 24 Z" fill="#3f3f46" />
            <circle cx="24" cy="24" r="2.5" fill="#fbbf24" />
          </svg>
        </div>

        {/* Brand name */}
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            marginBottom: 16,
          }}
        >
          <span style={{ color: '#ffffff' }}>Brand</span>
          <span style={{ color: '#f59e0b' }}>Pilot</span>
        </div>

        {/* Tagline */}
        <div
          style={{
            color: '#a1a1aa',
            fontSize: 28,
            fontWeight: 400,
            marginBottom: 40,
            display: 'flex',
          }}
        >
          AI-Powered Social Media Management
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          {['Multi-Brand', 'AI Content', '6 Platforms', 'Analytics'].map(
            (label) => (
              <div
                key={label}
                style={{
                  background: '#27272a',
                  color: '#d4d4d8',
                  padding: '10px 24px',
                  borderRadius: 999,
                  fontSize: 18,
                  fontWeight: 500,
                  border: '1px solid #3f3f46',
                  display: 'flex',
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            color: '#71717a',
            fontSize: 20,
            display: 'flex',
          }}
        >
          brandpilots.io
        </div>
      </div>
    ),
    { ...size },
  );
}
