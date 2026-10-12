import test from "node:test"
import assert from "node:assert/strict"
import type { Post } from "../src/工具/文章"
import {
  filterPostsForListing,
  getPostCategoryBreakdown,
  getPostContentSnippet,
  getPostTagBreakdown,
  getPostSearchFallbackSuggestions,
  getPostSearchMatchScope,
  getPostSearchSuggestions,
  getPopularSearchTerms,
  matchesPostSearch,
  sortSearchResults,
  splitHighlightedText,
} from "../src/工具/文章搜索"

const posts: Post[] = [
  {
    id: "react-note",
    title: "React Hooks 心得",
    excerpt: "关于 useEffect 和副作用的整理",
    date: "2026-04-20",
    category: "前端",
    tags: ["React", "Hooks"],
    content: "<p>这篇文章会详细聊 useEffect、依赖数组和副作用时机。</p>",
    featured: true,
  },
  {
    id: "music-draft",
    title: "播放器草稿",
    excerpt: "还没写完的音乐页思路",
    date: "2026-04-18",
    category: "产品",
    tags: ["Music"],
    content: "<p>这里记录歌词滚动、收藏和最近播放的交互。</p>",
    draft: true,
  },
]

test("文章搜索匹配正文和元信息", () => {
  assert.equal(matchesPostSearch(posts[0], "useEffect"), true)
  assert.equal(matchesPostSearch(posts[0], "前端"), true)
  assert.equal(matchesPostSearch(posts[0], "Hooks"), true)
  assert.equal(matchesPostSearch(posts[0], "不存在"), false)
})

test("文章列表筛选遵守草稿、标签和搜索条件", () => {
  const result = filterPostsForListing(posts, {
    includeDrafts: false,
    searchQuery: "歌词",
    selectedTag: "Music",
  })

  assert.deepEqual(result, [])

  const withDraft = filterPostsForListing(posts, {
    includeDrafts: true,
    searchQuery: "歌词",
    selectedTag: "Music",
  })

  assert.deepEqual(withDraft.map((post) => post.id), ["music-draft"])
})

test("文章列表筛选遵守分类条件", () => {
  const result = filterPostsForListing(posts, {
    includeDrafts: true,
    searchQuery: "",
    selectedTag: null,
    selectedCategory: "前端",
  })

  assert.deepEqual(result.map((post) => post.id), ["react-note"])
})

test("搜索匹配范围说明命中的文章字段", () => {
  const scope = getPostSearchMatchScope(posts[0], "useEffect")

  assert.deepEqual(scope, {
    title: false,
    excerpt: true,
    category: false,
    series: false,
    tags: false,
    content: true,
  })
})

test("高亮文本保持顺序并标记命中片段", () => {
  const parts = splitHighlightedText("React Hooks 心得", "react")

  assert.deepEqual(parts, [
    { text: "React", match: true },
    { text: " Hooks 心得", match: false },
  ])
})

test("搜索建议匹配标签和系列并优先前缀匹配", () => {
  const suggestions = getPostSearchSuggestions(
    ["React", "Hooks", "前端工程"],
    ["React 深入", "音乐设计", "Hooks 细节"],
    "re"
  )

  assert.deepEqual(suggestions, [
    { type: "tag", value: "React" },
    { type: "series", value: "React 深入" },
  ])
})

test("搜索结果支持按新旧时间排序", () => {
  assert.deepEqual(
    sortSearchResults(posts, "newest").map((post) => post.id),
    ["react-note", "music-draft"]
  )

  assert.deepEqual(
    sortSearchResults(posts, "oldest").map((post) => post.id),
    ["music-draft", "react-note"]
  )
})

test("分类统计按文章数量汇总", () => {
  assert.deepEqual(getPostCategoryBreakdown(posts), [
    { category: "产品", count: 1 },
    { category: "前端", count: 1 },
  ])
})

test("标签统计按文章数量汇总", () => {
  assert.deepEqual(getPostTagBreakdown(posts), [
    { tag: "Hooks", count: 1 },
    { tag: "Music", count: 1 },
    { tag: "React", count: 1 },
  ])
})

test("拼写错误的搜索返回近似建议", () => {
  const suggestions = getPostSearchFallbackSuggestions(
    ["React", "Hooks"],
    ["React 深入", "音乐设计"],
    ["前端", "产品"],
    "Ract"
  )

  assert.deepEqual(suggestions, [
    { type: "tag", value: "React" },
  ])
})

test("文章摘要提取命中位置周边内容", () => {
  const snippet = getPostContentSnippet(
    "<p>这里记录歌词滚动、收藏和最近播放的交互。</p>",
    "收藏"
  )

  assert.equal(snippet, "这里记录歌词滚动、收藏和最近播放的交互。")
  assert.equal(getPostContentSnippet("<p>只是一段普通文本</p>", "不存在"), null)
})

test("热门搜索合并标签、系列和分类候选项", () => {
  const popularTerms = getPopularSearchTerms([
    ...posts,
    {
      id: "react-series",
      title: "React 状态管理",
      excerpt: "再聊一次 React",
      date: "2026-04-21",
      category: "前端",
      tags: ["React"],
      content: "<p>zustand</p>",
      series: "React 深入",
    },
  ])

  assert.deepEqual(popularTerms.slice(0, 4), [
    { type: "tag", value: "React", count: 2 },
    { type: "category", value: "前端", count: 2 },
    { type: "tag", value: "Hooks", count: 1 },
    { type: "tag", value: "Music", count: 1 },
  ])
})
