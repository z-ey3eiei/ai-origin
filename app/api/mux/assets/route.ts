import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public demo playback from muxinc/next-video-starter (get-started). */
export const STARTER_PLAYBACK_ID =
  "sxY31L6Opl02RWPpm3Gro9XTe7fRHBjs92x93kiB1vpc";

type MuxAsset = {
  id: string;
  status: string;
  duration?: number;
  playback_ids?: Array<{ id: string; policy: string }>;
};

/**
 * Returns playback IDs for the Mux account bound to MUX_TOKEN_ID /
 * MUX_TOKEN_SECRET. Falls back to the next-video-starter demo asset when
 * credentials are missing or the account has no ready public playbacks.
 */
export async function GET() {
  const tokenId = process.env.MUX_TOKEN_ID;
  const tokenSecret = process.env.MUX_TOKEN_SECRET;
  const pinned = process.env.MUX_PLAYBACK_ID?.trim();

  if (pinned) {
    return NextResponse.json({
      source: "env",
      playbackIds: [pinned],
      poster: `https://image.mux.com/${pinned}/thumbnail.webp`,
    });
  }

  if (!tokenId || !tokenSecret) {
    return NextResponse.json({
      source: "starter-fallback",
      playbackIds: [STARTER_PLAYBACK_ID],
      poster: `https://image.mux.com/${STARTER_PLAYBACK_ID}/thumbnail.webp`,
      message: "MUX_TOKEN_ID / MUX_TOKEN_SECRET not configured; using starter demo.",
    });
  }

  try {
    const auth = btoa(`${tokenId}:${tokenSecret}`);
    const res = await fetch("https://api.mux.com/video/v1/assets?limit=10", {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({
        source: "starter-fallback",
        playbackIds: [STARTER_PLAYBACK_ID],
        poster: `https://image.mux.com/${STARTER_PLAYBACK_ID}/thumbnail.webp`,
        message: `Mux API ${res.status}; using starter demo.`,
      });
    }

    const body = (await res.json()) as { data?: MuxAsset[] };
    const playbackIds = (body.data ?? [])
      .filter((a) => a.status === "ready")
      .flatMap((a) => a.playback_ids ?? [])
      .filter((p) => p.policy === "public")
      .map((p) => p.id);

    if (playbackIds.length === 0) {
      return NextResponse.json({
        source: "starter-fallback",
        playbackIds: [STARTER_PLAYBACK_ID],
        poster: `https://image.mux.com/${STARTER_PLAYBACK_ID}/thumbnail.webp`,
        message: "No ready public Mux assets; using starter demo.",
      });
    }

    return NextResponse.json({
      source: "mux",
      playbackIds,
      poster: `https://image.mux.com/${playbackIds[0]}/thumbnail.webp`,
    });
  } catch {
    return NextResponse.json({
      source: "starter-fallback",
      playbackIds: [STARTER_PLAYBACK_ID],
      poster: `https://image.mux.com/${STARTER_PLAYBACK_ID}/thumbnail.webp`,
      message: "Mux request failed; using starter demo.",
    });
  }
}
