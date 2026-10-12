import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { isAuthenticatedRequest } from "@/工具/服务端/身份验证"
import { getSiteSettings, updateSiteSettings } from "@/工具/服务端/站点设置"
import type { SiteSettings } from "@/工具/站点设置"

function safeRevalidatePath(path: string, type?: "page" | "layout") {
  try {
    revalidatePath(path, type)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("static generation store missing")
    ) {
      return
    }
    throw error
  }
}

function revalidateSiteSettingsPaths() {
  safeRevalidatePath("/")
  safeRevalidatePath("/about")
  safeRevalidatePath("/music")
  safeRevalidatePath("/tags")
  safeRevalidatePath("/tags/[tag]", "page")
  safeRevalidatePath("/series")
  safeRevalidatePath("/series/[series]", "page")
}

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  return NextResponse.json({ settings: await getSiteSettings() })
}

export async function PATCH(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "请先登录管理员账号" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as Partial<SiteSettings> | null
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "提交的设置内容无效" }, { status: 400 })
  }

  const settings = await updateSiteSettings(payload)
  revalidateSiteSettingsPaths()
  return NextResponse.json({ settings })
}
