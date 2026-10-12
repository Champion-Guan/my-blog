import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedRequest } from '@/工具/服务端/身份验证'

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAuthenticatedRequest(request) })
}
