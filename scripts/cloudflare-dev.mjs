import { execFile, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const execFileAsync = promisify(execFile)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const wrangler = path.join(root, 'node_modules', '.bin', 'wrangler')
const namespaceId = '56a8ed68dc4a473895acd112b583ad03'
const allowedOrigins = new Set(['http://127.0.0.1:8787', 'http://localhost:8787'])

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration))
const resolveProductionMedia = (value) => {
  if (typeof value === 'string') return value.startsWith('/media/') ? new URL(value, 'https://elin521.cn').toString() : value
  if (Array.isArray(value)) return value.map(resolveProductionMedia)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveProductionMedia(item)]))
}

const readRemoteKey = async (key, optional = false) => {
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { stdout } = await execFileAsync(wrangler, [
        'kv', 'key', 'get', key,
        '--namespace-id', namespaceId,
        '--remote', '--text',
      ], { cwd: root, timeout: 45_000, maxBuffer: 2 * 1024 * 1024 })
      const value = stdout.trim()
      return value ? JSON.parse(value) : null
    } catch (error) {
      lastError = error
      if (attempt < 2) await sleep(600 * (attempt + 1))
    }
  }
  if (optional) return null
  throw lastError
}

const sendJson = (response, status, body, origin) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': origin,
    Vary: 'Origin',
  })
  response.end(JSON.stringify(body))
}

const syncServer = createServer(async (request, response) => {
  const origin = request.headers.origin || ''
  if (!allowedOrigins.has(origin)) {
    sendJson(response, 403, { error: '请求来源无效' }, 'null')
    return
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '600',
      Vary: 'Origin',
    })
    response.end()
    return
  }
  if (request.method !== 'POST' || request.url !== '/api/sync-production') {
    sendJson(response, 404, { error: '接口不存在' }, origin)
    return
  }

  try {
    const [profilePayload, worksPayload, homePayload] = await Promise.all([
      readRemoteKey('portfolio:profile:v1'),
      readRemoteKey('portfolio:works:v1'),
      readRemoteKey('portfolio:home:v2', true),
    ])
    if (!profilePayload?.profile || !Array.isArray(worksPayload?.projects)) {
      throw new Error('线上配置不完整')
    }
    sendJson(response, 200, {
      profile: resolveProductionMedia(profilePayload.profile),
      projects: resolveProductionMedia(worksPayload.projects),
      home: resolveProductionMedia(homePayload?.home || null),
    }, origin)
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error(`[local-sync] ${detail}`)
    sendJson(response, 502, { error: '线上 KV 读取失败，请稍后重试' }, origin)
  }
})

syncServer.listen(8790, '127.0.0.1', () => {
  console.log('⎔ Local production sync ready on http://127.0.0.1:8790')
})

const worker = spawn(wrangler, ['dev'], { cwd: root, stdio: 'inherit', env: process.env })

const shutdown = (signal) => {
  syncServer.close()
  if (!worker.killed) worker.kill(signal)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
worker.on('exit', (code) => {
  syncServer.close()
  process.exitCode = code ?? 1
})
