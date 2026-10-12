import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next'
import StructuredDataScript from "@/组件/结构化数据脚本"
import { MusicProvider } from "@/上下文/音乐上下文"
import { buildRootMetadata, buildWebsiteStructuredData } from "@/工具/服务端/站点metadata"
import "./全局样式.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  return buildRootMetadata()
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const websiteStructuredData = await buildWebsiteStructuredData()

  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <StructuredDataScript id="website-structured-data" data={websiteStructuredData} />
        <MusicProvider>
          {children}
        </MusicProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}
