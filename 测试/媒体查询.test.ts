import test from "node:test"
import assert from "node:assert/strict"
import { buildMediaQueryString, parseMediaQueryState } from "../src/工具/媒体查询"

test("媒体查询解析规范化后台参数", () => {
  const state = parseMediaQueryState({
    q: "  cover  ",
    time: "7d",
    storage: "blob",
    format: "webp",
    orientation: "portrait",
    usage: "unused",
    kind: "cover",
    sort: "most-used",
    page: "3",
  })

  assert.equal(state.keyword, "cover")
  assert.equal(state.timeFilter, "7d")
  assert.equal(state.storageFilter, "blob")
  assert.equal(state.formatFilter, "webp")
  assert.equal(state.orientationFilter, "portrait")
  assert.equal(state.usageFilter, "unused")
  assert.equal(state.usageKindFilter, "cover")
  assert.equal(state.sortBy, "most-used")
  assert.equal(state.currentPage, 3)
})

test("媒体查询无效值回退到安全默认值", () => {
  const state = parseMediaQueryState({
    q: ["", "ignored"],
    time: "invalid",
    sort: "weird",
  })

  assert.equal(state.keyword, "")
  assert.equal(state.timeFilter, "all")
  assert.equal(state.storageFilter, "all")
  assert.equal(state.formatFilter, "all")
  assert.equal(state.orientationFilter, "all")
  assert.equal(state.usageFilter, "all")
  assert.equal(state.usageKindFilter, "all")
  assert.equal(state.sortBy, "newest")
  assert.equal(state.currentPage, 1)
})

test("媒体查询字符串省略默认值并保留活动筛选", () => {
  const query = buildMediaQueryString({
    keyword: "  hero cover  ",
    timeFilter: "7d",
    storageFilter: "blob",
    formatFilter: "webp",
    orientationFilter: "portrait",
    usageFilter: "used",
    usageKindFilter: "cover",
    sortBy: "most-used",
    currentPage: 2,
  })

  assert.equal(
    query,
    "q=hero+cover&time=7d&storage=blob&format=webp&orientation=portrait&usage=used&kind=cover&sort=most-used&page=2"
  )
})

test("默认媒体查询状态生成空字符串", () => {
  const query = buildMediaQueryString({
    keyword: "   ",
    timeFilter: "all",
    storageFilter: "all",
    formatFilter: "all",
    orientationFilter: "all",
    usageFilter: "all",
    usageKindFilter: "all",
    sortBy: "newest",
    currentPage: 1,
  })

  assert.equal(query, "")
})
