import type { Metadata } from "next"
import { getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import MusicPageClient from "./音乐页面"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "音乐",
    description: settings.musicMetaDescription,
    openGraph: {
      title: `音乐 | ${settings.brandName}`,
      description: settings.musicMetaDescription,
    },
  }
}

export default async function MusicPage() {
  const siteSettings = await getSiteSettings()
  return <MusicPageClient brandName={siteSettings.brandName} />
}
