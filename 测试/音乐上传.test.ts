import test from "node:test"
import assert from "node:assert/strict"
import {
  buildManagedMusicPath,
  getMusicUploadAcceptValue,
  MUSIC_UPLOAD_MAX_BYTES,
  validateMusicUploadInput,
} from "../src/工具/音乐上传"

test("音乐上传拒绝空文件、超大文件和不支持的音频", () => {
  const emptyResult = validateMusicUploadInput({ name: "empty.mp3", size: 0, type: "audio/mpeg" } as File)
  assert.equal(emptyResult.ok, false)

  const oversizeResult = validateMusicUploadInput({
    name: "huge.flac",
    size: MUSIC_UPLOAD_MAX_BYTES + 1,
    type: "audio/flac",
  } as File)
  assert.equal(oversizeResult.ok, false)

  const unsupportedResult = validateMusicUploadInput({
    name: "note.txt",
    size: 10,
    type: "text/plain",
  } as File)
  assert.equal(unsupportedResult.ok, false)
})

test("音乐上传接受支持的音频且路径保持在允许范围内", () => {
  const result = validateMusicUploadInput({
    name: "张杰 - 最美的太阳.mp3",
    size: 1024,
    type: "audio/mpeg",
  } as File)
  assert.equal(result.ok, true)
  assert.match(getMusicUploadAcceptValue(), /\.mp3/)

  const pathname = buildManagedMusicPath("张杰 - 最美的太阳.mp3")
  assert.match(pathname, /^music-library\//)
  assert.match(pathname, /\.mp3$/)
})
