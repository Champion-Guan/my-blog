import { defaultSiteSettings, normalizeSiteSettings, type SiteSettings } from "@/工具/站点设置"
import { getSiteSettingsRecord, saveSiteSettingsRecord } from "./存储设置"

export async function getSiteSettings(): Promise<SiteSettings> {
  const record = await getSiteSettingsRecord()
  if (!record) return defaultSiteSettings

  try {
    return normalizeSiteSettings(JSON.parse(record.settings_json) as Partial<SiteSettings>)
  } catch {
    return defaultSiteSettings
  }
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  const nextSettings = normalizeSiteSettings(input)
  await saveSiteSettingsRecord(JSON.stringify(nextSettings))
  return nextSettings
}
