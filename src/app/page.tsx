import type { Metadata } from "next"
import { getAllPosts, getAllSeries, getAllTags } from "@/工具/文章"
import { parseHomeQueryState } from "@/工具/首页查询"
import { filterPostsForListing } from "@/工具/文章搜索"
import { getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import HomeClient from "./home/首页内容"

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: settings.brandName,
    description: settings.siteDescription,
    openGraph: {
      title: settings.brandName,
      description: settings.siteDescription,
    },
  }
}

interface HomePageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const state = parseHomeQueryState((await searchParams) || {})
  const [posts, allTags, allSeries, siteSettings] = await Promise.all([
    getAllPosts({ includeDrafts: false, cached: true }),
    getAllTags(),
    getAllSeries(),
    getSiteSettings(),
  ])
  const initialPosts = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: state.searchQuery,
    selectedTag: state.selectedTag,
  })

  return (
    <HomeClient
      posts={initialPosts}
      allTags={allTags}
      allSeries={allSeries}
      siteSettings={siteSettings}
      initialSearchQuery={state.searchQuery}
      initialSelectedTag={state.selectedTag}
      initialPage={state.currentPage}
      initialShowDrafts={state.showDrafts}
      loginRequested={state.loginRequested}
      nextPath={state.nextPath}
    />
  )
}
