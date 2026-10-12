import { NextResponse } from 'next/server'
import { buildExpiredSessionCookie } from '@/工具/服务端/身份验证'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.headers.append('Set-Cookie', buildExpiredSessionCookie())
  return response
}
