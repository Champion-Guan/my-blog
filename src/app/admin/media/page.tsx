import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { parseMediaQueryState } from "@/工具/媒体查询"
import { isAuthenticatedServer } from "@/工具/服务端/身份验证"
import SectionPageShell from "@/组件/栏目页框架"
import { canWriteMediaLibrary, getMediaLibraryWarning as getImageLibraryWarning, listMediaAssets } from "@/工具/服务端/媒体"
import {
  canUseDirectBlobMusicUpload,
  canWriteMusicLibrary,
  getMusicLibraryWarning,
  listMusicLibraryTracks,
} from "@/工具/服务端/音乐"
import { getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import AdminMediaClient from "./媒体管理页面"
import AdminMusicClient from "../music/音乐管理页面"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "素材库",
    description: `${settings.brandName} 图片与音乐素材管理`,
  }
}

interface AdminMediaPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminMediaPage({ searchParams }: AdminMediaPageProps) {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/media")
  }

  const resolvedSearchParams = (await searchParams) || {}
  const rawTab = Array.isArray(resolvedSearchParams.tab)
    ? resolvedSearchParams.tab[0]
    : resolvedSearchParams.tab
  const activeTab = rawTab === "music" ? "music" : "images"
  const state = parseMediaQueryState(resolvedSearchParams)
  const [assets, tracks, siteSettings] = await Promise.all([
    listMediaAssets(),
    listMusicLibraryTracks(),
    getSiteSettings(),
  ])
  const imageTabHref = "/admin/media"
  const musicTabHref = "/admin/media?tab=music"

  return (
    <SectionPageShell
      navLabel="素材库"
      activeNav="media"
      brandLabel={siteSettings.brandName}
      title="素材库"
      description="把图片素材和在线曲库收在一个后台入口里，减少菜单层级，也更方便集中管理。"
      headerActions={
        <div className="flex flex-wrap gap-2 rounded-full border border-border/50 bg-card p-1">
          <Link
            href={imageTabHref}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "images" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            图片素材
          </Link>
          <Link
            href={musicTabHref}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "music" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            在线曲库
          </Link>
        </div>
      }
    >
      {activeTab === "music" ? (
          <AdminMusicClient
            initialTracks={tracks}
            initialWarning={getMusicLibraryWarning()}
            initialCanUpload={canWriteMusicLibrary()}
            directBlobUploadEnabled={canUseDirectBlobMusicUpload()}
            brandName={siteSettings.brandName}
            embedded
          />
        ) : (
          <AdminMediaClient
            initialAssets={assets}
            initialWarning={getImageLibraryWarning()}
            initialCanUpload={canWriteMediaLibrary()}
            brandName={siteSettings.brandName}
            initialKeyword={state.keyword}
            initialTimeFilter={state.timeFilter}
            initialStorageFilter={state.storageFilter}
            initialFormatFilter={state.formatFilter}
            initialOrientationFilter={state.orientationFilter}
            initialUsageFilter={state.usageFilter}
            initialUsageKindFilter={state.usageKindFilter}
            initialSortBy={state.sortBy}
            initialPage={state.currentPage}
            embedded
          />
        )}
    </SectionPageShell>
  )
}
