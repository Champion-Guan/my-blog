import test from "node:test"
import assert from "node:assert/strict"
import { normalizeCommentLink, parseCommentMarkdown } from "../src/工具/评论Markdown"

test("评论链接仅接受允许的协议", () => {
  assert.equal(normalizeCommentLink("https://example.com/post"), "https://example.com/post")
  assert.equal(normalizeCommentLink("http://example.com/post"), "http://example.com/post")
  assert.equal(normalizeCommentLink("mailto:test@example.com"), "mailto:test@example.com")
  assert.equal(normalizeCommentLink("javascript:alert(1)"), null)
  assert.equal(normalizeCommentLink("data:text/html;base64,abc"), null)
  assert.equal(normalizeCommentLink("ftp://example.com/file"), null)
})

test("评论 Markdown 清除不安全链接", () => {
  const html = parseCommentMarkdown("看看这个 [危险链接](javascript:alert(1)) 和 [正常链接](https://example.com)")

  assert.ok(!html.includes('href="javascript:alert(1)"'))
  assert.ok(html.includes(">危险链接</a>") === false)
  assert.ok(html.includes("危险链接"))
  assert.ok(html.includes('href="https://example.com"'))
  assert.ok(html.includes('rel="noopener noreferrer"'))
})
