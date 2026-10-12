import test from "node:test"
import assert from "node:assert/strict"
import { absoluteUrl, siteConfig } from "../src/工具/站点配置"
import { defaultSiteSettings, normalizeSiteSettings } from "../src/工具/站点设置"

test("绝对地址使用生产域名生成根路径和嵌套路径", () => {
  assert.equal(absoluteUrl("/"), "https://champion.cc.cd/")
  assert.equal(absoluteUrl("/posts/hello-world"), "https://champion.cc.cd/posts/hello-world")
  assert.equal(absoluteUrl("about"), "https://champion.cc.cd/about")
})

test("站点配置保留预期的公开元信息默认值", () => {
  assert.equal(siteConfig.name, "Champion 的博客")
  assert.equal(siteConfig.url, "https://champion.cc.cd")
  assert.equal(siteConfig.rssPath, "/api/feed")
  assert.ok(siteConfig.keywords.includes("博客"))
})

test("系列页面绝对地址保留已编码路径", () => {
  assert.equal(
    absoluteUrl(`/series/${encodeURIComponent("工程化改造")}`),
    "https://champion.cc.cd/series/%E5%B7%A5%E7%A8%8B%E5%8C%96%E6%94%B9%E9%80%A0",
  )
})

test("站点设置空值回退到默认配置", () => {
  const normalized = normalizeSiteSettings({
    brandName: "  ",
    authorName: "",
    twitterHandle: "   ",
    seoKeywords: "",
    contactEmail: "   ",
    githubUrl: "",
    xProfileUrl: "",
    primaryLinkLabel: "",
    primaryLinkUrl: "",
    homeTitle: "新的首页标题",
    footerText: "",
  })

  assert.equal(normalized.brandName, defaultSiteSettings.brandName)
  assert.equal(normalized.authorName, defaultSiteSettings.authorName)
  assert.equal(normalized.twitterHandle, "")
  assert.equal(normalized.seoKeywords, defaultSiteSettings.seoKeywords)
  assert.equal(normalized.contactEmail, "")
  assert.equal(normalized.githubUrl, "")
  assert.equal(normalized.xProfileUrl, "")
  assert.equal(normalized.primaryLinkLabel, defaultSiteSettings.primaryLinkLabel)
  assert.equal(normalized.primaryLinkUrl, "")
  assert.equal(normalized.homeTitle, "新的首页标题")
  assert.equal(normalized.footerText, defaultSiteSettings.footerText)
})

test("站点设置清理联系链接和社交账号", () => {
  const normalized = normalizeSiteSettings({
    twitterHandle: "champion_dev",
    contactEmail: " hello@example.com ",
    githubUrl: "javascript:alert(1)",
    xProfileUrl: "https://x.com/champion_dev",
    primaryLinkUrl: "https://example.com/profile",
  })

  assert.equal(normalized.twitterHandle, "@champion_dev")
  assert.equal(normalized.contactEmail, "hello@example.com")
  assert.equal(normalized.githubUrl, "")
  assert.equal(normalized.xProfileUrl, "https://x.com/champion_dev")
  assert.equal(normalized.primaryLinkUrl, "https://example.com/profile")
})
