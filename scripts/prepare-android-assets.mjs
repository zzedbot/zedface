import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const assets = join(root, 'android-tv/app/src/main/assets')
const webTarget = join(assets, 'www')
const modelTarget = join(assets, 'model-cn')
const cacheDir = join(root, '.cache')
const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-cn-0.22.zip'
const expectedSha256 = '3af8b0e7e0f835ae9d414ce5df580237a3cfb08d586c9fbbb0f7ff29ad5b14ba'
const archive = join(cacheDir, basename(modelUrl))

async function sha256(path) {
  const hash = createHash('sha256')
  hash.update(await readFile(path))
  return hash.digest('hex')
}

async function downloadModel() {
  await mkdir(cacheDir, { recursive: true })
  let valid = false
  try {
    valid = await sha256(archive) === expectedSha256
  } catch {
    // Download below.
  }
  if (!valid) {
    const response = await fetch(modelUrl)
    if (!response.ok || !response.body) throw new Error(`Model download failed: HTTP ${response.status}`)
    await pipeline(response.body, createWriteStream(archive))
  }
  const actual = await sha256(archive)
  if (actual !== expectedSha256) throw new Error(`Unexpected model SHA-256: ${actual}`)
}

await rm(webTarget, { recursive: true, force: true })
await mkdir(webTarget, { recursive: true })
await cp(join(root, 'dist'), webTarget, { recursive: true })

await downloadModel()
await rm(modelTarget, { recursive: true, force: true })
const extractDir = join(cacheDir, 'model-extract')
await rm(extractDir, { recursive: true, force: true })
await mkdir(extractDir, { recursive: true })
await execFileAsync('unzip', ['-q', archive, '-d', extractDir])
await cp(join(extractDir, 'vosk-model-small-cn-0.22'), modelTarget, { recursive: true })
await writeFile(join(modelTarget, 'uuid'), '3af8b0e7-e0f8-35ae-9d41-4ce5df580237\n')

console.log(`Prepared Android assets in ${assets}`)
