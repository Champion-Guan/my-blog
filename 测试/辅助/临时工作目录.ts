import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"

export const repoRoot = path.resolve(process.cwd())

export function resetStoreGlobals() {
  const target = globalThis as Record<string, unknown>
  target.__championBlogDb = undefined
  target.__championBlogSql = undefined
  target.__championBlogStoreReady = undefined
}

export async function withTempWorkspace<T>(
  run: (workspaceDir: string) => Promise<T>,
  overrides?: Partial<Record<string, string>>
) {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "myblog-store-"))
  const dataDir = path.join(workspaceDir, "数据")
  const postsDir = path.join(dataDir, "文章")
  const uploadsDir = path.join(workspaceDir, "public", "uploads")
  const musicDir = path.join(workspaceDir, "public", "音乐")

  fs.mkdirSync(postsDir, { recursive: true })
  fs.mkdirSync(uploadsDir, { recursive: true })
  fs.mkdirSync(musicDir, { recursive: true })
  fs.copyFileSync(path.join(repoRoot, "数据", "文章", "文章.json"), path.join(postsDir, "文章.json"))
  fs.copyFileSync(path.join(repoRoot, "数据", "评论.json"), path.join(dataDir, "评论.json"))

  const previousEnv = {
    BLOG_DATA_DIR: process.env.BLOG_DATA_DIR,
    BLOG_DB_PATH: process.env.BLOG_DB_PATH,
    BLOG_POSTS_JSON_PATH: process.env.BLOG_POSTS_JSON_PATH,
    BLOG_COMMENTS_JSON_PATH: process.env.BLOG_COMMENTS_JSON_PATH,
    BLOG_MEDIA_DIR: process.env.BLOG_MEDIA_DIR,
    BLOG_MUSIC_DIR: process.env.BLOG_MUSIC_DIR,
    DATABASE_URL: process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    AUTH_PASSWORD: process.env.AUTH_PASSWORD,
    AUTH_SECRET: process.env.AUTH_SECRET,
  }

  process.env.BLOG_DATA_DIR = dataDir
  process.env.BLOG_DB_PATH = path.join(dataDir, "blog.db")
  process.env.BLOG_POSTS_JSON_PATH = path.join(postsDir, "文章.json")
  process.env.BLOG_COMMENTS_JSON_PATH = path.join(dataDir, "评论.json")
  process.env.BLOG_MEDIA_DIR = uploadsDir
  process.env.BLOG_MUSIC_DIR = musicDir
  delete process.env.DATABASE_URL
  delete process.env.VERCEL
  delete process.env.BLOB_READ_WRITE_TOKEN
  process.env.AUTH_PASSWORD = overrides?.AUTH_PASSWORD || "integration-admin"
  process.env.AUTH_SECRET = overrides?.AUTH_SECRET || "integration-secret"
  resetStoreGlobals()

  try {
    return await run(workspaceDir)
  } finally {
    for (const [key, value] of Object.entries(previousEnv)) {
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
    resetStoreGlobals()
    fs.rmSync(workspaceDir, { recursive: true, force: true })
  }
}

export async function importFresh<T>(relativePath: string): Promise<T> {
  const absolutePath = path.join(repoRoot, relativePath)
  return (await import(`${pathToFileURL(absolutePath).href}?t=${Date.now()}-${Math.random()}`)) as T
}
