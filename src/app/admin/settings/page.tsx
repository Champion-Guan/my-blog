import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { isAuthenticatedServer } from "@/工具/服务端/身份验证"
import { getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import AdminSettingsClient from "./站点设置页面"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getResolvedSeoSettings()
  return {
    title: "站点设置",
    description: `${settings.brandName} 站点文案与品牌设置`,
  }
}

export default async function AdminSettingsPage() {
  const isAuthenticated = await isAuthenticatedServer()
  if (!isAuthenticated) {
    redirect("/home?login=1&next=/admin/settings")
  }

  const settings = await getSiteSettings()
  return <AdminSettingsClient initialSettings={settings} />
}
