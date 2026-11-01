'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MuxPlayer } from './mux-player-client'
import styles from '@/app/video/video.module.css'

type AssetsResponse = {
  source: string
  playbackIds: string[]
  poster?: string
  message?: string
}

const STARTER_FALLBACK =
  'sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc'

export function VideoPageClient() {
  const [playbackId, setPlaybackId] = useState<string | null>(null)
  const [meta, setMeta] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/mux/assets')
        const data = (await res.json()) as AssetsResponse
        if (cancelled) return
        const id = data.playbackIds?.[0] || STARTER_FALLBACK
        setPlaybackId(id)
        if (data.message) setMeta(data.message)
        else setMeta(`Source: ${data.source}`)
      } catch {
        if (!cancelled) {
          setPlaybackId(STARTER_FALLBACK)
          setMeta('Using starter demo playback.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.logos}>
          <Image
            className={styles.icon}
            src="/nextjs.svg"
            alt="Next.js"
            width={72}
            height={72}
            priority
          />
          <Image
            className={styles.icon}
            src="/plus.svg"
            alt=""
            width={18}
            height={18}
            priority
          />
          <Image
            className={styles.icon}
            src="/next-video.svg"
            alt="next-video"
            width={72}
            height={72}
            priority
          />
        </div>

        <p className={styles.lede}>
          Mux streaming on Workers — same look as the{' '}
          <a
            href="https://github.com/muxinc/next-video-starter"
            target="_blank"
            rel="noopener noreferrer"
          >
            next-video-starter
          </a>
          , using <code>@mux/mux-player-react</code> (vinext-compatible).
        </p>

        <div className={styles.video}>
          {playbackId ? (
            <MuxPlayer
              playbackId={playbackId}
              accentColor="#79a9ff"
              style={{ width: '100%', aspectRatio: '16 / 9' }}
              metadata={{
                video_title: 'ONEORIGIN video',
              }}
            />
          ) : (
            <div className={styles.videoSkeleton} aria-busy="true" />
          )}
        </div>

        {meta ? <p className={styles.meta}>{meta}</p> : null}

        <div className={styles.ctas}>
          <Link className={styles.primary} href="/">
            Back to workspace
          </Link>
          <a
            className={styles.secondary}
            href="https://next-video.dev/docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read next-video docs
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://next-video-demo.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/window.svg" alt="" width={16} height={16} aria-hidden />
          Demo
        </a>
        <a
          href="https://www.mux.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image src="/globe.svg" alt="" width={16} height={16} aria-hidden />
          Mux →
        </a>
      </footer>
    </div>
  )
}
