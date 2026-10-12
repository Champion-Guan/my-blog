import { NextResponse } from 'next/server'
import { getCachedRecentComments } from '@/工具/服务端/站点缓存'

// GET /api/comments - 获取所有评论（最新汇总）
export async function GET() {
  return NextResponse.json({ comments: await getCachedRecentComments() })
}
