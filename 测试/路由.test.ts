import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import test, { after, before } from "node:test"
import assert from "node:assert/strict"
import { NextRequest } from "next/server"
import { buildSessionCookie, createSessionToken } from "../src/工具/服务端/身份验证"
import robots from "../src/app/robots"
// 使用临时工作目录，避免测试读取或修改开发环境的数据库。
const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "myblog-routes-"))
process.env.BLOG_DATA_DIR = workspaceDir
process.env.BLOG_DB_PATH = path.join(workspaceDir, "blog.db")
process.env.BLOG_POSTS_JSON_PATH = path.join(workspaceDir, "文章.json")
process.env.BLOG_COMMENTS_JSON_PATH = path.join(workspaceDir, "评论.json")
delete process.env.DATABASE_URL
delete process.env.VERCEL
fs.writeFileSync(process.env.BLOG_POSTS_JSON_PATH, JSON.stringify({ posts: [{
  id: "welcome", title: "欢迎来到 Champion 的博客", content: "欢迎阅读测试文章。",
  excerpt: "路由测试文章", date: "2026-01-01", category: "测试", tags: ["测试"], draft: false,
}] }))
fs.writeFileSync(process.env.BLOG_COMMENTS_JSON_PATH, JSON.stringify({ comments: {} }))
after(() => {
  globalThis.__championBlogDb?.close()
  globalThis.__championBlogDb = undefined
  fs.rmSync(workspaceDir, { recursive: true, force: true })
})

let postsGet: typeof import("../src/app/api/posts/route")["GET"]
let postsPost: typeof import("../src/app/api/posts/route")["POST"]
let adminMediaDelete: typeof import("../src/app/api/admin/media/route")["DELETE"]
let adminMediaPost: typeof import("../src/app/api/admin/media/route")["POST"]
let adminMediaReindexPost: typeof import("../src/app/api/admin/media/reindex/route")["POST"]
let adminMusicGet: typeof import("../src/app/api/admin/music/route")["GET"]
let adminMusicPost: typeof import("../src/app/api/admin/music/route")["POST"]
let adminMusicDelete: typeof import("../src/app/api/admin/music/route")["DELETE"]
let adminMusicClientUploadPost: typeof import("../src/app/api/admin/music/client-upload/route")["POST"]
let adminMusicFinalizePost: typeof import("../src/app/api/admin/music/finalize/route")["POST"]
let adminSettingsGet: typeof import("../src/app/api/admin/settings/route")["GET"]
let adminSettingsPatch: typeof import("../src/app/api/admin/settings/route")["PATCH"]
let adminBackupGet: typeof import("../src/app/api/admin/backup/route")["GET"]
let authStatusGet: typeof import("../src/app/api/auth/status/route")["GET"]
let feedGet: typeof import("../src/app/api/feed/route")["GET"]
let adminMediaGet: typeof import("../src/app/api/admin/media/route")["GET"]
let publicSiteSettingsGet: typeof import("../src/app/api/site-settings/route")["GET"]
let postViewsPost: typeof import("../src/app/api/posts/[id]/views/route")["POST"]
let postDetailGet: typeof import("../src/app/api/posts/[id]/route")["GET"]
let postPatch: typeof import("../src/app/api/posts/[id]/route")["PATCH"]
let versionsGet: typeof import("../src/app/api/posts/[id]/versions/route")["GET"]
let versionsPost: typeof import("../src/app/api/posts/[id]/versions/route")["POST"]
let manifest: typeof import("../src/app/manifest")["default"]

before(async () => {
  ;({ GET: postsGet, POST: postsPost } = await import("../src/app/api/posts/route"))
  ;({ DELETE: adminMediaDelete, POST: adminMediaPost } = await import("../src/app/api/admin/media/route"))
  ;({ POST: adminMediaReindexPost } = await import("../src/app/api/admin/media/reindex/route"))
  ;({ GET: adminMusicGet, POST: adminMusicPost, DELETE: adminMusicDelete } = await import("../src/app/api/admin/music/route"))
  ;({ POST: adminMusicClientUploadPost } = await import("../src/app/api/admin/music/client-upload/route"))
  ;({ POST: adminMusicFinalizePost } = await import("../src/app/api/admin/music/finalize/route"))
  ;({ GET: adminSettingsGet, PATCH: adminSettingsPatch } = await import("../src/app/api/admin/settings/route"))
  ;({ GET: adminBackupGet } = await import("../src/app/api/admin/backup/route"))
  ;({ GET: authStatusGet } = await import("../src/app/api/auth/status/route"))
  ;({ GET: feedGet } = await import("../src/app/api/feed/route"))
  ;({ GET: adminMediaGet } = await import("../src/app/api/admin/media/route"))
  ;({ GET: publicSiteSettingsGet } = await import("../src/app/api/site-settings/route"))
  ;({ POST: postViewsPost } = await import("../src/app/api/posts/[id]/views/route"))
  ;({ GET: postDetailGet, PATCH: postPatch } = await import("../src/app/api/posts/[id]/route"))
  ;({ GET: versionsGet, POST: versionsPost } = await import("../src/app/api/posts/[id]/versions/route"))
  ;({ default: manifest } = await import("../src/app/manifest"))
})

test("订阅接口使用生产域名及 RSS 元信息", async () => {
  const response = await feedGet()
  const xml = await response.text()

  assert.equal(response.headers.get("Content-Type"), "application/xml; charset=utf-8")
  assert.match(xml, /https:\/\/champion\.cc\.cd\/api\/feed/)
  assert.match(xml, /https:\/\/champion\.cc\.cd\/posts\//)
  assert.doesNotMatch(xml, /my-blog-amber-chi\.vercel\.app/)
})

test("元信息接口提供站点身份、爬虫规则和应用清单", async () => {
  const robotsData = robots()
  const manifestData = await manifest()

  assert.equal(robotsData.host, "https://champion.cc.cd")
  assert.equal(robotsData.sitemap, "https://champion.cc.cd/sitemap.xml")
  assert.equal(manifestData.start_url, "/")
  assert.equal(manifestData.display, "standalone")
  assert.equal(typeof manifestData.name, "string")
  assert.equal(manifestData.icons?.[0]?.src, "/favicon.ico")
})

test("登录状态接口反映有效会话凭据", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/auth/status")
  const guestResponse = await authStatusGet(guestRequest)
  const guestPayload = await guestResponse.json()
  assert.equal(guestPayload.authenticated, false)

  const token = createSessionToken()
  const sessionRequest = new NextRequest("https://champion.cc.cd/api/auth/status", {
    headers: {
      cookie: buildSessionCookie(token),
    },
  })
  const sessionResponse = await authStatusGet(sessionRequest)
  const sessionPayload = await sessionResponse.json()
  assert.equal(sessionPayload.authenticated, true)
})

test("公开站点设置接口返回规范化配置", async () => {
  const response = await publicSiteSettingsGet()
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(typeof payload.settings.brandName, "string")
  assert.equal(typeof payload.settings.homeTitle, "string")
})

test("媒体管理接口拒绝未登录访问", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/admin/media")
  const response = await adminMediaGet(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录管理员账号")
})

test("音乐管理接口拒绝未登录访问", async () => {
  const guestListResponse = await adminMusicGet(new NextRequest("https://champion.cc.cd/api/admin/music"))
  const guestListPayload = await guestListResponse.json()
  assert.equal(guestListResponse.status, 401)
  assert.equal(guestListPayload.error, "请先登录管理员账号")

  const guestFinalizeResponse = await adminMusicFinalizePost(
    new NextRequest("https://champion.cc.cd/api/admin/music/finalize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pathname: "music-library/demo.mp3", url: "https://example.com/demo.mp3" }),
    }),
  )
  const guestFinalizePayload = await guestFinalizeResponse.json()
  assert.equal(guestFinalizeResponse.status, 401)
  assert.equal(guestFinalizePayload.error, "请先登录管理员账号")
})

test("媒体重建索引接口拒绝未登录访问", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/admin/media/reindex", { method: "POST" })
  const response = await adminMediaReindexPost(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录管理员账号")
})

test("备份接口拒绝未登录访问并向管理员导出快照", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/admin/backup")
  const guestResponse = await adminBackupGet(guestRequest)
  const guestPayload = await guestResponse.json()

  assert.equal(guestResponse.status, 401)
  assert.equal(guestPayload.error, "请先登录管理员账号")

  const authRequest = new NextRequest("https://champion.cc.cd/api/admin/backup", {
    headers: { cookie: buildSessionCookie(createSessionToken()) },
  })
  const authResponse = await adminBackupGet(authRequest)
  const authPayload = await authResponse.json()

  assert.equal(authResponse.status, 200)
  assert.equal(authPayload.manifest.snapshotVersion, 1)
  assert.equal(Array.isArray(authPayload.data.posts), true)
  assert.equal(Array.isArray(authPayload.data.comments), true)
  assert.equal(Array.isArray(authPayload.data.musicTracks), true)
  assert.equal(typeof authPayload.data.siteSettings.settings.brandName, "string")
  assert.match(authResponse.headers.get("Content-Disposition") || "", /site-snapshot-/)
})

test("站点设置接口拒绝未登录访问并校验提交内容", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/admin/settings")
  const guestResponse = await adminSettingsGet(guestRequest)
  const guestPayload = await guestResponse.json()
  assert.equal(guestResponse.status, 401)
  assert.equal(guestPayload.error, "请先登录管理员账号")

  const cookie = buildSessionCookie(createSessionToken())
  const invalidPatchRequest = new NextRequest("https://champion.cc.cd/api/admin/settings", {
    method: "PATCH",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: "null",
  })
  const invalidPatchResponse = await adminSettingsPatch(invalidPatchRequest)
  const invalidPatchPayload = await invalidPatchResponse.json()
  assert.equal(invalidPatchResponse.status, 400)
  assert.equal(invalidPatchPayload.error, "提交的设置内容无效")
})

test("站点设置接口保存已登录用户提交的规范配置", async () => {
  const cookie = buildSessionCookie(createSessionToken())
  const request = new NextRequest("https://champion.cc.cd/api/admin/settings", {
    method: "PATCH",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      brandName: "  My New Blog  ",
      aboutTitle: "",
      homeTitle: "新的首页标题",
    }),
  })

  const response = await adminSettingsPatch(request)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(payload.settings.brandName, "My New Blog")
  assert.equal(payload.settings.homeTitle, "新的首页标题")
  assert.equal(typeof payload.settings.aboutTitle, "string")
  assert.notEqual(payload.settings.aboutTitle, "")
})

test("媒体管理接口校验已登录上传和删除参数", async () => {
  const cookie = buildSessionCookie(createSessionToken())

  const uploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: new FormData(),
  })
  const uploadResponse = await adminMediaPost(uploadRequest)
  const uploadPayload = await uploadResponse.json()
  assert.equal(uploadResponse.status, 400)
  assert.equal(uploadPayload.error, "请选择要上传的图片")

  const deleteRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "DELETE",
    headers: { cookie },
  })
  const deleteResponse = await adminMediaDelete(deleteRequest)
  const deletePayload = await deleteResponse.json()
  assert.equal(deleteResponse.status, 400)
  assert.equal(deletePayload.error, "缺少素材标识")

  const unsupportedUploadFormData = new FormData()
  unsupportedUploadFormData.append("file", new File(["hello"], "note.txt", { type: "text/plain" }))
  const unsupportedUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: unsupportedUploadFormData,
  })
  const unsupportedUploadResponse = await adminMediaPost(unsupportedUploadRequest)
  const unsupportedUploadPayload = await unsupportedUploadResponse.json()
  assert.equal(unsupportedUploadResponse.status, 400)
  assert.match(unsupportedUploadPayload.error, /JPG、PNG、WebP、GIF、SVG/)

  const emptyUploadFormData = new FormData()
  emptyUploadFormData.append("file", new File([], "empty.png", { type: "image/png" }))
  const emptyUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: emptyUploadFormData,
  })
  const emptyUploadResponse = await adminMediaPost(emptyUploadRequest)
  const emptyUploadPayload = await emptyUploadResponse.json()
  assert.equal(emptyUploadResponse.status, 400)
  assert.equal(emptyUploadPayload.error, "图片内容为空，请重新选择")

  const mixedUploadFormData = new FormData()
  mixedUploadFormData.append("file", new File(["hello"], "note.txt", { type: "text/plain" }))
  mixedUploadFormData.append("file", new File(["<svg xmlns=\"http://www.w3.org/2000/svg\"></svg>"], "ok.svg", { type: "image/svg+xml" }))
  const mixedUploadRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "POST",
    headers: { cookie },
    body: mixedUploadFormData,
  })
  const mixedUploadResponse = await adminMediaPost(mixedUploadRequest)
  const mixedUploadPayload = await mixedUploadResponse.json()
  assert.equal(mixedUploadResponse.status, 201)
  assert.equal(Array.isArray(mixedUploadPayload.assets), true)
  assert.equal(mixedUploadPayload.assets.length, 1)
  assert.equal(Array.isArray(mixedUploadPayload.failures), true)
  assert.equal(mixedUploadPayload.failures.length, 1)

  const invalidBatchDeleteRequest = new NextRequest("https://champion.cc.cd/api/admin/media", {
    method: "DELETE",
    headers: {
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ ids: [] }),
  })
  const invalidBatchDeleteResponse = await adminMediaDelete(invalidBatchDeleteRequest)
  const invalidBatchDeletePayload = await invalidBatchDeleteResponse.json()
  assert.equal(invalidBatchDeleteResponse.status, 400)
  assert.equal(invalidBatchDeletePayload.error, "缺少素材标识")
})

test("音乐管理接口校验已登录上传和删除参数", async () => {
  const cookie = buildSessionCookie(createSessionToken())

  const uploadRequest = new NextRequest("https://champion.cc.cd/api/admin/music", {
    method: "POST",
    headers: { cookie },
    body: new FormData(),
  })
  const uploadResponse = await adminMusicPost(uploadRequest)
  const uploadPayload = await uploadResponse.json()
  assert.equal(uploadResponse.status, 400)
  assert.equal(uploadPayload.error, "请选择要上传的音频文件")

  const deleteRequest = new NextRequest("https://champion.cc.cd/api/admin/music", {
    method: "DELETE",
    headers: { cookie },
  })
  const deleteResponse = await adminMusicDelete(deleteRequest)
  const deletePayload = await deleteResponse.json()
  assert.equal(deleteResponse.status, 400)
  assert.equal(deletePayload.error, "缺少歌曲标识")

  const unsupportedUploadFormData = new FormData()
  unsupportedUploadFormData.append("file", new File(["hello"], "note.txt", { type: "text/plain" }))
  const unsupportedUploadResponse = await adminMusicPost(
    new NextRequest("https://champion.cc.cd/api/admin/music", {
      method: "POST",
      headers: { cookie },
      body: unsupportedUploadFormData,
    }),
  )
  const unsupportedUploadPayload = await unsupportedUploadResponse.json()
  assert.equal(unsupportedUploadResponse.status, 400)
  assert.match(unsupportedUploadPayload.error, /MP3、WAV、M4A、AAC、FLAC、OGG/)

  const emptyUploadFormData = new FormData()
  emptyUploadFormData.append("file", new File([], "empty.mp3", { type: "audio/mpeg" }))
  const emptyUploadResponse = await adminMusicPost(
    new NextRequest("https://champion.cc.cd/api/admin/music", {
      method: "POST",
      headers: { cookie },
      body: emptyUploadFormData,
    }),
  )
  const emptyUploadPayload = await emptyUploadResponse.json()
  assert.equal(emptyUploadResponse.status, 400)
  assert.equal(emptyUploadPayload.error, "音频内容为空，请重新选择")

  const invalidFinalizeResponse = await adminMusicFinalizePost(
    new NextRequest("https://champion.cc.cd/api/admin/music/finalize", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ pathname: "", url: "" }),
    }),
  )
  const invalidFinalizePayload = await invalidFinalizeResponse.json()
  assert.equal(invalidFinalizeResponse.status, 400)
  assert.equal(invalidFinalizePayload.error, "缺少上传完成后的音频信息")

  const clientUploadResponse = await adminMusicClientUploadPost(
    new NextRequest("https://champion.cc.cd/api/admin/music/client-upload", {
      method: "POST",
      headers: {
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        type: "blob.generate-client-token",
        payload: {
          pathname: "bad/demo.mp3",
          multipart: false,
          clientPayload: null,
        },
      }),
    }),
  )
  const clientUploadPayload = await clientUploadResponse.json()
  assert.equal(clientUploadResponse.status, 400)
  assert.equal(typeof clientUploadPayload.error, "string")
})

test("文章创建接口拒绝未登录请求", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts", {
    method: "POST",
    body: JSON.stringify({ title: "Test", content: "Hello" }),
    headers: { "content-type": "application/json" },
  })
  const response = await postsPost(request)
  const payload = await response.json()

  assert.equal(response.status, 401)
  assert.equal(payload.error, "请先登录")
})

test("文章列表接口支持公开搜索筛选", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts?q=%E6%AC%A2%E8%BF%8E")
  const response = await postsGet(request)
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.equal(Array.isArray(payload), true)
  assert.equal(payload.length >= 1, true)
  assert.equal(payload.some((post: { title?: string }) => post.title?.includes("欢迎")), true)
})

test("文章详情为公开请求隐藏内容，向已登录用户提供内容", async () => {
  const guestRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome")
  const guestResponse = await postDetailGet(guestRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const guestPayload = await guestResponse.json()
  assert.equal(guestResponse.status, 200)
  assert.equal("content" in guestPayload, false)
  assert.equal(guestPayload.title, "欢迎来到 Champion 的博客")

  const authRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome", {
    headers: { cookie: buildSessionCookie(createSessionToken()) },
  })
  const authResponse = await postDetailGet(authRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const authPayload = await authResponse.json()
  assert.equal(authResponse.status, 200)
  assert.equal(typeof authPayload.content, "string")
})

test("文章修改和版本接口拒绝未登录访问", async () => {
  const patchRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome", {
    method: "PATCH",
    body: JSON.stringify({ title: "New title" }),
    headers: { "content-type": "application/json" },
  })
  const patchResponse = await postPatch(patchRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const patchPayload = await patchResponse.json()
  assert.equal(patchResponse.status, 401)
  assert.equal(patchPayload.error, "请先登录")

  const versionsRequest = new NextRequest("https://champion.cc.cd/api/posts/welcome/versions")
  const versionsResponse = await versionsGet(versionsRequest, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const versionsPayload = await versionsResponse.json()
  assert.equal(versionsResponse.status, 401)
  assert.equal(versionsPayload.error, "请先登录")
})

test("版本恢复在身份验证后校验版本标识", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts/welcome/versions", {
    method: "POST",
    headers: {
      cookie: buildSessionCookie(createSessionToken()),
      "content-type": "application/json",
    },
    body: JSON.stringify({}),
  })
  const response = await versionsPost(request, {
    params: Promise.resolve({ id: "welcome" }),
  })
  const payload = await response.json()

  assert.equal(response.status, 400)
  assert.equal(payload.error, "缺少版本 ID")
})

test("缺失文章的浏览量接口返回 404", async () => {
  const request = new NextRequest("https://champion.cc.cd/api/posts/missing/views", { method: "POST" })
  const response = await postViewsPost(request, {
    params: Promise.resolve({ id: "missing-post-id" }),
  })
  const payload = await response.json()

  assert.equal(response.status, 404)
  assert.equal(payload.error, "文章不存在")
})
