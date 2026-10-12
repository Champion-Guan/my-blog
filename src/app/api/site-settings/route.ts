import { NextResponse } from "next/server"
import { getSiteSettings } from "@/工具/服务端/站点设置"

export async function GET() {
  return NextResponse.json({ settings: await getSiteSettings() })
}
