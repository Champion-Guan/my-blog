import { NextRequest, NextResponse } from 'next/server'
import type { Post } from '@/工具/文章'
import { filterPostsForListing } from '@/工具/文章搜索'
import { isAuthenticatedRequest } from '@/工具/服务端/身份验证'
import { invalidatePostsCache } from '@/工具/服务端/站点缓存'
import { createPost, listPosts } from '@/工具/服务端/存储'

export async function GET(request: NextRequest) {
  try {
    const includeDrafts = isAuthenticatedRequest(request)
    const url = new URL(request.url)
    const posts = await listPosts({ includeDrafts })
    return NextResponse.json(
      filterPostsForListing(posts, {
        includeDrafts,
        searchQuery: url.searchParams.get('q') || '',
        selectedTag: url.searchParams.get('tag'),
      })
    )
  } catch {
    return NextResponse.json({ error: '数据存储暂不可用' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, slug, excerpt, content, category, tags, draft, pinned, featured, series, seriesOrder, coverImage, bgmSrc } = body

    if (!title || !content) {
      return NextResponse.json({ error: '标题和内容不能为空' }, { status: 400 })
    }

    const newPost: Post = await createPost({
      title,
      slug,
      excerpt,
      content,
      category,
      tags,
      coverImage,
      bgmSrc,
      draft,
      pinned,
      featured,
      series,
      seriesOrder,
    })

    invalidatePostsCache()

    return NextResponse.json(newPost, { status: 201 })
  } catch {
    return NextResponse.json({ error: '保存失败' }, { status: 500 })
  }
}
