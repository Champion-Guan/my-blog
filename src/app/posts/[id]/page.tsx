import type { Metadata } from "next"
import StructuredDataScript from "@/组件/结构化数据脚本"
import { redirect } from "next/navigation"
import { notFound } from "next/navigation"
import { getAdjacentPosts, getAllPosts, getPost, getPostContent, calculateReadingTime, extractHeadings, getRelatedPosts } from "@/工具/文章"
import { isAuthenticatedServer } from "@/工具/服务端/身份验证"
import { buildBlogPostingStructuredData, getResolvedSeoSettings } from "@/工具/服务端/站点metadata"
import { getSiteSettings } from "@/工具/服务端/站点设置"
import PostClient from "./文章页面"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const [post, settings] = await Promise.all([getPost(id), getResolvedSeoSettings()])
  
  if (!post) {
    return {
      title: `文章未找到 | ${settings.brandName}`,
    }
  }

  const postOgImage = `/posts/${post.slug || post.id}/opengraph-image`

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: `${post.title} | ${settings.brandName}`,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      authors: [settings.authorName],
      images: [{ url: postOgImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [postOgImage],
    },
  }
}

export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  const posts = await getAllPosts({ includeDrafts: false, cached: true })
  return posts.map((post) => ({
    id: post.slug || post.id,
  }))
}

export default async function PostPage({ params }: Props) {
  const { id } = await params
  const decodedId = decodeURIComponent(id)
  const post = await getPost(decodedId)

  if (!post) {
    notFound()
  }

  // 草稿文章在渲染前先进行服务端身份验证。
  if (post.draft) {
    const isAuthenticated = await isAuthenticatedServer()
    if (!isAuthenticated) {
      redirect(`/home?login=1&next=/write/${post.id}`)
    }
    // 已登录用户查看草稿时，跳转到编辑页。
    redirect(`/write/${post.id}`)
  }

  const content = await getPostContent(decodedId)

  // 给标题注入 ID，便于目录跳转
  const contentWithIds = content.replace(/<h([23])([^>]*)>([^<]+)<\/h([23])>/gi, (match, level, attrs, text, closeLevel) => {
    const headingId = text.trim().toLowerCase().replace(/[^\u4e00-\u9fa5a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h${level}${attrs} id="${headingId}">${text}</h${closeLevel}>`
  })

  const readingTime = calculateReadingTime(content)
  const headings = extractHeadings(contentWithIds)
  const [relatedPosts, adjacentPosts, siteSettings, blogPostingStructuredData] = await Promise.all([
    getRelatedPosts(post),
    getAdjacentPosts(post),
    getSiteSettings(),
    buildBlogPostingStructuredData(post),
  ])

  return (
    <>
      <StructuredDataScript id="post-structured-data" data={blogPostingStructuredData} />
      <PostClient
        post={post}
        content={contentWithIds}
        readingTime={readingTime}
        headings={headings}
        relatedPosts={relatedPosts}
        previousPost={adjacentPosts.previousPost}
        nextPost={adjacentPosts.nextPost}
        brandName={siteSettings.brandName}
        footerText={siteSettings.footerText}
      />
    </>
  )
}
