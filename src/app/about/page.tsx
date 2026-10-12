import type { Metadata } from "next"
import StructuredDataScript from "@/组件/结构化数据脚本"
import { buildAboutStructuredData, getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import AboutClient from "./关于页面"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "关于",
    description: settings.aboutMetaDescription,
    openGraph: {
      title: `关于 | ${settings.brandName}`,
      description: settings.aboutMetaDescription,
    },
  }
}

export default async function AboutPage() {
  const [siteSettings, aboutStructuredData] = await Promise.all([
    getSiteSettings(),
    buildAboutStructuredData(),
  ])

  return (
    <>
      <StructuredDataScript id="about-structured-data" data={aboutStructuredData} />
      <AboutClient siteSettings={siteSettings} />
    </>
  )
}
