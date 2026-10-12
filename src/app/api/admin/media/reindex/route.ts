import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/工具/服务端/身份验证'
import { listPosts, listPostMediaReferenceDetails, syncAllPostMediaReferences } from '@/工具/服务端/存储'

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录管理员账号' }, { status: 401 })
  }

  try {
    const posts = await listPosts({ includeDrafts: true })
    await syncAllPostMediaReferences(posts)
    const references = await listPostMediaReferenceDetails()

    return NextResponse.json({
      success: true,
      postCount: posts.length,
      referenceCount: references.length,
    })
  } catch {
    return NextResponse.json({ error: '重建引用索引失败' }, { status: 500 })
  }
}
