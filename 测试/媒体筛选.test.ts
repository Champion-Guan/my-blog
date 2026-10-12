import test from "node:test"
import assert from "node:assert/strict"
import { getActiveMediaFilterChips } from "../src/工具/媒体筛选"

test("活动媒体筛选生成对应标签", () => {
  const chips = getActiveMediaFilterChips({
    keyword: "  hero cover  ",
    timeFilter: "7d",
    storageFilter: "blob",
    formatFilter: "webp",
    orientationFilter: "landscape",
    usageFilter: "used",
    usageKindFilter: "mixed",
    sortBy: "most-used",
  })

  assert.deepEqual(chips, [
    { key: "keyword", label: "搜索：hero cover" },
    { key: "timeFilter", label: "时间：7 天内" },
    { key: "storageFilter", label: "来源：Blob" },
    { key: "formatFilter", label: "格式：WebP" },
    { key: "orientationFilter", label: "形态：横图" },
    { key: "usageFilter", label: "使用：使用中" },
    { key: "usageKindFilter", label: "用途：封面+正文" },
    { key: "sortBy", label: "排序：引用最多" },
  ])
})

test("默认媒体筛选不生成标签", () => {
  const chips = getActiveMediaFilterChips({
    keyword: "   ",
    timeFilter: "all",
    storageFilter: "all",
    formatFilter: "all",
    orientationFilter: "all",
    usageFilter: "all",
    usageKindFilter: "all",
    sortBy: "newest",
  })

  assert.deepEqual(chips, [])
})
