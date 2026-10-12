import { NextResponse } from 'next/server'
import { buildExpiredUserSessionCookie } from '@/工具/服务端/评论用户身份验证'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildExpiredUserSessionCookie())
  return response
}
