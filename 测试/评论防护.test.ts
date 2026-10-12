import test from "node:test"
import assert from "node:assert/strict"
import { validateCommentContent } from "../src/工具/服务端/评论防护"
import { normalizeCommentStatus } from "../src/工具/服务端/存储"

test("评论校验拒绝过短、被屏蔽及含可疑链接的内容", () => {
  assert.equal(validateCommentContent("哈"), "评论至少写两个字吧")
  assert.equal(validateCommentContent("加微信聊一下"), "评论里包含了不适合公开展示的内容")
  assert.equal(validateCommentContent("https://a.co"), "带链接的评论太短了，系统先拦一下")
})

test("评论校验接受正常内容", () => {
  assert.equal(validateCommentContent("这篇文章写得很舒服，收藏了。"), "")
})

test("评论状态仅保留支持的审核值", () => {
  assert.equal(normalizeCommentStatus("pending"), "pending")
  assert.equal(normalizeCommentStatus("rejected"), "rejected")
  assert.equal(normalizeCommentStatus("approved"), "approved")
  assert.equal(normalizeCommentStatus("unexpected"), "approved")
  assert.equal(normalizeCommentStatus(undefined), "approved")
})
