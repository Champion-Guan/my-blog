import test from "node:test"
import assert from "node:assert/strict"
import { buildRecentSearches } from "../src/工具/最近搜索"

test("最近搜索优先保留最新查询并去重", () => {
  const next = buildRecentSearches(["React", "Next.js", "Music"], "next.js")

  assert.deepEqual(next, ["next.js", "React", "Music"])
})

test("最近搜索忽略空值并遵守数量限制", () => {
  const next = buildRecentSearches(
    ["a", "b", "c", "d", "e", "f", "g", "h"],
    "   "
  )

  assert.deepEqual(next, ["a", "b", "c", "d", "e", "f", "g", "h"])
})
