import test from "node:test"
import assert from "node:assert/strict"
import {
  buildMediaAssetCsv,
  buildMediaAssetBatchText,
  extractClipboardMediaFiles,
  formatMediaUploadBatchMessage,
  getMediaFormatFilter,
  getMediaOrientation,
  getMediaUploadHint,
  sortMediaAssets,
  validateMediaUploadInput,
} from "../src/工具/媒体上传"
import { countMediaAssetUsage, describeMediaAssetUsage, getMediaUsageHref, getMediaUsageScope } from "../src/工具/媒体使用情况"

test("媒体上传校验拒绝空文件、超大文件和不支持的格式", () => {
  assert.equal(validateMediaUploadInput({ size: 0, type: "image/png" }), "图片内容为空，请重新选择")
  assert.match(String(validateMediaUploadInput({ size: 1024, type: "text/plain" })), /JPG、PNG、WebP、GIF、SVG/)
  assert.match(
    String(validateMediaUploadInput({ size: 5 * 1024 * 1024, type: "image/png" })),
    /4.5MB/
  )
})

test("媒体上传接受支持的图片并同步提示", () => {
  assert.equal(validateMediaUploadInput({ size: 1024, type: "image/png" }), null)
  assert.match(getMediaUploadHint(), /JPG、PNG、WebP、GIF、SVG/)
  assert.match(getMediaUploadHint(), /4.5MB/)
})

test("上传结果提示汇总单文件和批量上传", () => {
  assert.equal(formatMediaUploadBatchMessage({ successCount: 1, failures: [] }), "素材上传成功")
  assert.equal(formatMediaUploadBatchMessage({ successCount: 3, failures: [] }), "已上传 3 张素材")
  assert.match(
    formatMediaUploadBatchMessage({
      successCount: 2,
      failures: [{ name: "bad.png", reason: "图片内容为空，请重新选择" }],
    }),
    /已上传 2 张，1 张失败/
  )
})

test("剪贴板提取仅保留支持的图片文件", () => {
  const pngFile = new File(["ok"], "clip.png", { type: "image/png" })
  const textFile = new File(["note"], "note.txt", { type: "text/plain" })

  const files = extractClipboardMediaFiles([
    {
      kind: "file",
      type: "image/png",
      getAsFile: () => pngFile,
    },
    {
      kind: "file",
      type: "text/plain",
      getAsFile: () => textFile,
    },
    {
      kind: "string",
      type: "text/plain",
      getAsFile: () => null,
    },
  ])

  assert.equal(files.length, 1)
  assert.equal(files[0]?.name, "clip.png")
})

test("批量媒体复制支持地址、Markdown 和 HTML", () => {
  const assets = [
    { name: "封面图", url: "https://example.com/a.webp" },
    { name: "插图", url: "https://example.com/b.webp" },
  ]

  assert.equal(
    buildMediaAssetBatchText(assets, "url"),
    "https://example.com/a.webp\nhttps://example.com/b.webp"
  )
  assert.match(buildMediaAssetBatchText(assets, "markdown"), /!\[封面图\]\(https:\/\/example.com\/a.webp\)/)
  assert.match(buildMediaAssetBatchText(assets, "html"), /<img src="https:\/\/example.com\/b.webp" alt="插图" \/>/)
})

test("媒体导出生成结构稳定的 CSV 表格", () => {
  const csv = buildMediaAssetCsv([
    {
      name: '封面图 "A"',
      url: "https://example.com/a.webp",
      size: 1024,
      width: 1600,
      height: 900,
      storage: "blob",
      usageCount: 2,
      usageScope: "封面+正文",
      usageTitles: "首页封面 | 关于页插图",
      updatedAt: "2026-04-22T10:00:00.000Z",
    },
  ])

  assert.match(csv, /^name,url,size,dimensions,storage,usageCount,usageScope,usageTitles,updatedAt/m)
  assert.match(csv, /"封面图 ""A"""/)
  assert.match(csv, /1600x900/)
  assert.match(csv, /blob/)
  assert.match(csv, /封面\+正文/)
  assert.match(csv, /首页封面 \| 关于页插图/)
  assert.match(csv, /2026-04-22T10:00:00.000Z/)
})

test("媒体排序支持时间、大小和名称", () => {
  const assets = [
    { name: "b-file", url: "/b", size: 300, updatedAt: "2026-04-20T10:00:00.000Z", usageCount: 3 },
    { name: "a-file", url: "/a", size: 100, updatedAt: "2026-04-22T10:00:00.000Z", usageCount: 1 },
    { name: "c-file", url: "/c", size: 200, updatedAt: "2026-04-21T10:00:00.000Z", usageCount: 0 },
  ]

  assert.deepEqual(sortMediaAssets(assets, "newest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "oldest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "largest").map((asset) => asset.name), ["b-file", "c-file", "a-file"])
  assert.deepEqual(sortMediaAssets(assets, "smallest").map((asset) => asset.name), ["a-file", "c-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "most-used").map((asset) => asset.name), ["b-file", "a-file", "c-file"])
  assert.deepEqual(sortMediaAssets(assets, "least-used").map((asset) => asset.name), ["c-file", "a-file", "b-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-asc").map((asset) => asset.name), ["a-file", "b-file", "c-file"])
  assert.deepEqual(sortMediaAssets(assets, "name-desc").map((asset) => asset.name), ["c-file", "b-file", "a-file"])
})

test("媒体方向识别横图、竖图、方图和未知尺寸", () => {
  assert.equal(getMediaOrientation(1600, 900), "landscape")
  assert.equal(getMediaOrientation(900, 1600), "portrait")
  assert.equal(getMediaOrientation(1080, 1080), "square")
  assert.equal(getMediaOrientation(null, 1080), "unknown")
})

test("媒体格式筛选归类常见图片格式", () => {
  assert.equal(getMediaFormatFilter("image/webp"), "webp")
  assert.equal(getMediaFormatFilter("image/svg+xml"), "svg")
  assert.equal(getMediaFormatFilter("image/gif"), "gif")
  assert.equal(getMediaFormatFilter("image/png"), "png")
  assert.equal(getMediaFormatFilter("image/jpeg"), "jpeg")
  assert.equal(getMediaFormatFilter("application/octet-stream"), "other")
})

test("媒体引用统计追踪各文章封面和正文", () => {
  const assets = [
    { id: "cover", url: "https://example.com/cover.webp" },
    { id: "inline", url: "https://example.com/inline.webp" },
    { id: "unused", url: "https://example.com/unused.webp" },
  ]
  const posts = [
    {
      id: "post-a",
      title: "示例文章甲",
      coverImage: "https://example.com/cover.webp",
      content: '<p><img src="https://example.com/inline.webp" /></p>',
    },
    {
      id: "post-b",
      title: "示例文章乙",
      coverImage: "",
      content: '<p><img src="https://example.com/inline.webp" /></p>',
    },
  ]

  const usage = countMediaAssetUsage(assets, posts)
  assert.equal(usage.get("cover"), 1)
  assert.equal(usage.get("inline"), 2)
  assert.equal(usage.get("unused"), 0)
})

test("媒体引用描述保留引用详情及类型", () => {
  const assets = [
    { id: "hero", url: "https://example.com/hero.webp", pathname: "hero.webp" },
    { id: "inline", url: "https://example.com/inline.webp", pathname: "inline.webp" },
  ]
  const posts = [
    {
      id: "post-a",
      title: "第一篇",
      slug: "first-post",
      draft: false,
      coverImage: "https://example.com/hero.webp",
      content: '<p><img src="inline.webp" /></p>',
    },
    {
      id: "post-b",
      title: "第二篇",
      slug: "second-post",
      draft: true,
      coverImage: "https://example.com/hero.webp",
      content: '<p><img src="https://example.com/hero.webp" /></p>',
    },
  ]

  const usage = describeMediaAssetUsage(assets, posts)
  assert.equal(usage.get("hero")?.count, 2)
  assert.equal(usage.get("hero")?.posts[0]?.kind, "cover")
  assert.equal(usage.get("hero")?.posts[1]?.kind, "cover+content")
  assert.equal(usage.get("hero")?.posts[1]?.draft, true)
  assert.equal(usage.get("inline")?.count, 1)
  assert.equal(usage.get("inline")?.posts[0]?.kind, "content")
})

test("草稿引用链接指向编辑器，已发布文章指向阅读页", () => {
  assert.equal(
    getMediaUsageHref({ postId: "draft-1", postSlug: "draft-slug", draft: true }),
    "/write/draft-1"
  )
  assert.equal(
    getMediaUsageHref({ postId: "post-1", postSlug: "hello-world", draft: false }),
    "/posts/hello-world"
  )
  assert.equal(
    getMediaUsageHref({ postId: "post-2", draft: false }),
    "/posts/post-2"
  )
})

test("媒体使用范围区分封面、正文、混合和未使用", () => {
  assert.equal(getMediaUsageScope(), "unused")
  assert.equal(
    getMediaUsageScope([{ postId: "1", postTitle: "封面稿", draft: false, kind: "cover" }]),
    "cover"
  )
  assert.equal(
    getMediaUsageScope([{ postId: "2", postTitle: "正文稿", draft: false, kind: "content" }]),
    "content"
  )
  assert.equal(
    getMediaUsageScope([{ postId: "3", postTitle: "双用途稿", draft: false, kind: "cover+content" }]),
    "mixed"
  )
})
