import test from "node:test"
import assert from "node:assert/strict"
import { clampOgText, pickOgCategoryLabel } from "../src/工具/分享图片"

test("分享图片文本去除空白，必要时添加省略号", () => {
  assert.equal(clampOgText("  Hello    world  ", 20), "Hello world")
  assert.equal(clampOgText("1234567890", 6), "12345…")
})

test("分享图片优先使用系列名称，其次分类，最后站点品牌", () => {
  assert.equal(pickOgCategoryLabel("技术", "工程化改造"), "系列 · 工程化改造")
  assert.equal(pickOgCategoryLabel("技术", ""), "技术")
  assert.equal(pickOgCategoryLabel("", ""), "Champion 的博客")
})
