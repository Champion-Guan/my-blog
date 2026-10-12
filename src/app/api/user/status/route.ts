import { NextResponse } from 'next/server'
import { getCommentUserFromServer } from '@/工具/服务端/评论用户身份验证'

export async function GET() {
  const user = await getCommentUserFromServer()
  return NextResponse.json({
    authenticated: Boolean(user),
    userId: user?.userId || null,
    username: user?.username || null,
    displayName: user?.displayName || null,
  })
}
