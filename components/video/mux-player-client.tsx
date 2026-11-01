'use client'

import dynamic from 'next/dynamic'

/**
 * Mux player is browser-only (custom elements / media). Load with ssr:false
 * so vinext Workers never evaluate it during SSR.
 */
export const MuxPlayer = dynamic(
  () => import('@mux/mux-player-react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div
        className="mux-player-skeleton"
        aria-busy="true"
        style={{
          aspectRatio: '16 / 9',
          width: '100%',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
        }}
      />
    ),
  },
)
