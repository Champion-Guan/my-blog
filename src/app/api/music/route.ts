import { unstable_cache } from "next/cache"
import { NextResponse } from "next/server"
import { listPublicMusicTracks, type MusicTrack } from "@/工具/服务端/音乐"
import { CACHE_TAGS } from "@/工具/服务端/站点缓存"

export type { MusicTrack } from "@/工具/服务端/音乐"

const getCachedPlaylist = unstable_cache(listPublicMusicTracks, ["music-playlist"], {
  tags: [CACHE_TAGS.music],
  revalidate: 3600,
})

async function resolvePlaylist() {
  try {
    return await getCachedPlaylist()
  } catch (error) {
    if (error instanceof Error && error.message.includes("incrementalCache missing")) {
      return listPublicMusicTracks()
    }
    throw error
  }
}

export async function GET() {
  return NextResponse.json(
    { tracks: await resolvePlaylist() satisfies MusicTrack[] },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  )
}
