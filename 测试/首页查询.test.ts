import test from "node:test"
import assert from "node:assert/strict"
import { parseHomeQueryState } from "../src/工具/首页查询"

test("首页查询解析规范化地址状态", () => {
  const state = parseHomeQueryState({
    q: " React ",
    tag: "前端",
    page: "3",
    drafts: "1",
    login: "1",
    next: "/admin",
  })

  assert.deepEqual(state, {
    searchQuery: "React",
    selectedTag: "前端",
    currentPage: 3,
    showDrafts: true,
    loginRequested: true,
    nextPath: "/admin",
  })
})

test("首页查询无效值回退到安全默认值", () => {
  const state = parseHomeQueryState({
    page: "-2",
    drafts: "0",
    next: "https://evil.example",
  })

  assert.equal(state.searchQuery, "")
  assert.equal(state.selectedTag, null)
  assert.equal(state.currentPage, 1)
  assert.equal(state.showDrafts, false)
  assert.equal(state.loginRequested, false)
  assert.equal(state.nextPath, null)
})
