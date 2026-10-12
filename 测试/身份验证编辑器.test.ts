import test from "node:test"
import assert from "node:assert/strict"
import { buildEditorImageTag, normalizeEditorImageFile } from "../src/工具/编辑器媒体"
import { buildExpiredSessionCookie, buildSessionCookie, createSessionToken, getAuthPassword, isValidSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "../src/工具/服务端/身份验证"

test("编辑器图片标签使用指定地址和替代文本", () => {
  const tag = buildEditorImageTag("https://example.com/cover.png", "封面")

  assert.match(tag, /https:\/\/example\.com\/cover\.png/)
  assert.match(tag, /alt="封面"/)
  assert.match(tag, /max-width:100%/)
})

test("非 HEIC 图片规范化保持原文件", async () => {
  const file = new File(["hello"], "hello.png", { type: "image/png" })
  const normalized = await normalizeEditorImageFile(file)

  assert.strictEqual(normalized, file)
})

test("会话生命周期工具生成可用凭据", () => {
  const token = createSessionToken()

  assert.equal(isValidSessionToken(token), true)

  const cookie = buildSessionCookie(token)
  assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=`))
  assert.match(cookie, new RegExp(`Max-Age=${SESSION_MAX_AGE}`))
  assert.match(cookie, /HttpOnly/)

  const expiredCookie = buildExpiredSessionCookie()
  assert.match(expiredCookie, /Max-Age=0/)
})

test("密码配置优先使用服务端环境变量", () => {
  const previousAuth = process.env.AUTH_PASSWORD
  const previousPublic = process.env.NEXT_PUBLIC_PASSWORD

  process.env.AUTH_PASSWORD = "server-password"
  process.env.NEXT_PUBLIC_PASSWORD = "public-password"
  assert.equal(getAuthPassword(), "server-password")

  delete process.env.AUTH_PASSWORD
  assert.equal(getAuthPassword(), "public-password")

  if (previousAuth === undefined) {
    delete process.env.AUTH_PASSWORD
  } else {
    process.env.AUTH_PASSWORD = previousAuth
  }

  if (previousPublic === undefined) {
    delete process.env.NEXT_PUBLIC_PASSWORD
  } else {
    process.env.NEXT_PUBLIC_PASSWORD = previousPublic
  }
})
