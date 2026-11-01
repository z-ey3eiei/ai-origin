import type { Metadata } from 'next'
import { VideoPageClient } from '@/components/video/video-page-client'

export const metadata: Metadata = {
  title: 'Video',
  description:
    'Mux video streaming on ONEORIGIN — next-video-starter look with @mux/mux-player-react on Cloudflare Workers.',
}

export default function VideoPage() {
  return <VideoPageClient />
}
