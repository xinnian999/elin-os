import defaultConfig from "../src/data/default-projects.json";
import defaultProfile from "../src/data/default-profile.json";
import defaultHome from "../src/data/default-home.json";
import { normalizeHome, normalizeProfile, normalizeProjects, parseGithubRepository } from "./schema";
import { parseSingleByteRange } from "./media-range";
import {
  HYL_MUSIC_INTERNAL_ORIGIN,
  HYL_MUSIC_PUBLIC_ORIGIN,
  HYL_MUSIC_PROVIDER,
  isSupportedAudioContentType,
  parseHylArtistAvatar,
  parseHylMusicAudio,
  parseHylMusicDetail,
  parseHylMusicLyrics,
  parseHylMusicSearch,
  trustedMusicMediaUrl,
  type HylMusicAudio,
} from "./music-source";

const WORKS_KEY = "portfolio:works:v1";
const PROFILE_KEY = "portfolio:profile:v1";
const HOME_KEY = "portfolio:home:v2";
const STAR_TTL_SECONDS = 30 * 60;
const CONTRIBUTIONS_TTL_SECONDS = 15 * 60;
const MAX_GITHUB_HTML_BYTES = 512 * 1024;
const MAX_CONFIG_BYTES = 96 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 50 * 1024 * 1024;
const MAX_LYRIC_BYTES = 256 * 1024;
const MAX_MUSIC_SOURCE_JSON_BYTES = 768 * 1024;
const MAX_MUSIC_IMPORT_BYTES = 4 * 1024;
const MAX_LOGIN_BYTES = 1024;
const SESSION_COOKIE = "elin_admin_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const LOCATION_CACHE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};
const AUDIO_TYPES: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "application/ogg": "ogg",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/webm": "webm",
  "audio/flac": "flac",
  "audio/x-flac": "flac",
};
const HYL_SEARCH_LIMIT = 10;

type WorksConfig = {
  projects: ReturnType<typeof normalizeProjects>;
  updatedAt: string | null;
};

type ProfileConfig = {
  profile: ReturnType<typeof normalizeProfile>;
  updatedAt: string | null;
};

type HomeConfig = {
  home: ReturnType<typeof normalizeHome>;
  updatedAt: string | null;
};

type ContributionDay = {
  date: string;
  count: number;
};

type GithubContributionsData = {
  username: string;
  total: number;
  streak: number;
  weeks: ContributionDay[][];
  from: string;
  to: string;
  updatedAt: string;
};

function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json; charset=utf-8");
  headers.set("X-Content-Type-Options", "nosniff");
  return Response.json(data, { ...init, headers });
}

function requestLocation(request: Request): IncomingRequestCfProperties | undefined {
  return request.cf as IncomingRequestCfProperties | undefined;
}

function publicVisitor(request: Request): Response {
  const location = requestLocation(request);
  const forwardedIp = request.headers.get("CF-Connecting-IP") || "";
  return json({
    ip: forwardedIp,
    city: location?.city || "",
    region: location?.region || "",
    regionCode: location?.regionCode || "",
    country: location?.country || "",
    timezone: location?.timezone || "",
    isp: location?.asOrganization || "",
    asn: location?.asn || null,
    locationAvailable: Boolean(location?.latitude && location?.longitude),
  }, { headers: LOCATION_CACHE_HEADERS });
}

type OpenMeteoCurrent = {
  time?: string;
  temperature_2m?: number;
  relative_humidity_2m?: number;
  apparent_temperature?: number;
  weather_code?: number;
  wind_speed_10m?: number;
  is_day?: number;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  timezone?: string;
};

function weatherDescription(code: number, isDay: boolean): { icon: string; text: string } {
  if (code === 0) return { icon: isDay ? "☀️" : "🌙", text: "晴" };
  if (code === 1) return { icon: isDay ? "🌤️" : "🌙", text: "大致晴朗" };
  if (code === 2) return { icon: "⛅", text: "多云" };
  if (code === 3) return { icon: "☁️", text: "阴" };
  if ([45, 48].includes(code)) return { icon: "🌫️", text: "雾" };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: "🌦️", text: "毛毛雨" };
  if ([61, 63, 65, 66, 67].includes(code)) return { icon: "🌧️", text: "雨" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "🌨️", text: "雪" };
  if ([80, 81, 82].includes(code)) return { icon: "🌦️", text: "阵雨" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️", text: "雷暴" };
  return { icon: "🌤️", text: "天气实况" };
}

async function publicWeather(request: Request): Promise<Response> {
  const location = requestLocation(request);
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
    || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return json({ error: "暂时无法识别当前位置" }, { status: 503, headers: LOCATION_CACHE_HEADERS });
  }

  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    timezone: "auto",
    forecast_days: "1",
  });

  try {
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`, {
      headers: { Accept: "application/json", "User-Agent": "elin-os-portfolio" },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) {
      console.warn(JSON.stringify({ message: "weather service unavailable", status: response.status }));
      return json({ error: "天气服务暂时不可用" }, { status: 502, headers: LOCATION_CACHE_HEADERS });
    }
    const data = await response.json<OpenMeteoResponse>();
    const current = data.current;
    if (!current || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.weather_code)) {
      return json({ error: "天气数据暂时不可用" }, { status: 502, headers: LOCATION_CACHE_HEADERS });
    }
    const condition = weatherDescription(current.weather_code as number, current.is_day !== 0);
    return json({
      temp: Math.round(current.temperature_2m as number),
      feelsLike: Number.isFinite(current.apparent_temperature) ? Math.round(current.apparent_temperature as number) : null,
      humidity: Number.isFinite(current.relative_humidity_2m) ? Math.round(current.relative_humidity_2m as number) : null,
      wind: Number.isFinite(current.wind_speed_10m) ? Math.round(current.wind_speed_10m as number) : null,
      icon: condition.icon,
      text: condition.text,
      city: location?.city || location?.region || "当前位置",
      observedAt: current.time || null,
      timezone: data.timezone || location?.timezone || "",
    }, { headers: LOCATION_CACHE_HEADERS });
  } catch (error) {
    console.warn(JSON.stringify({ message: "weather request failed", error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "天气服务暂时不可用" }, { status: 502, headers: LOCATION_CACHE_HEADERS });
  }
}

async function verifyToken(provided: string, expected: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [providedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
  ]);
  return crypto.subtle.timingSafeEqual(providedHash, expectedHash);
}

function base64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function cookieValue(request: Request, name: string): string {
  const cookies = request.headers.get("Cookie") || "";
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return "";
}

async function hmac(value: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

async function createSession(secret: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_SECONDS * 1000;
  const payload = `${expiresAt}.${crypto.randomUUID()}`;
  return `${payload}.${base64Url(await hmac(payload, secret))}`;
}

async function verifySession(value: string, secret: string): Promise<boolean> {
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expiresAt = Number(parts[0]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const expected = base64Url(await hmac(payload, secret));
  return verifyToken(parts[2], expected);
}

async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!env.ADMIN_TOKEN) return false;
  const session = cookieValue(request, SESSION_COOKIE);
  return session ? verifySession(session, env.ADMIN_TOKEN) : false;
}

async function requireAuthorization(request: Request, env: Env): Promise<Response | null> {
  if (await isAuthorized(request, env)) return null;
  return json({ error: "登录已失效，请重新输入管理密码" }, { status: 401, headers: { "Cache-Control": "no-store" } });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin");
  return !origin || origin === new URL(request.url).origin;
}

async function login(request: Request, env: Env): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "请求来源无效" }, { status: 403 });
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength || contentLength > MAX_LOGIN_BYTES) return json({ error: "登录请求格式错误" }, { status: 400 });
  const body = await request.json<unknown>();
  const password = body && typeof body === "object" && !Array.isArray(body) ? (body as { password?: unknown }).password : "";
  if (typeof password !== "string" || !env.ADMIN_TOKEN || !(await verifyToken(password, env.ADMIN_TOKEN))) {
    return json({ error: "管理密码错误" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const session = await createSession(env.ADMIN_TOKEN);
  return json({ ok: true }, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": `${SESSION_COOKIE}=${session}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure}`,
    },
  });
}

function logout(request: Request): Response {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return json({ ok: true }, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
    },
  });
}

async function readConfig(env: Env, fresh = false): Promise<WorksConfig> {
  const stored = fresh
    ? await env.WORKS.get<WorksConfig>(WORKS_KEY, { type: "json" })
    : await env.WORKS.get<WorksConfig>(WORKS_KEY, { type: "json", cacheTtl: 30 });
  if (!stored) return { projects: normalizeProjects(defaultConfig.projects), updatedAt: null };
  try {
    return { projects: normalizeProjects(stored.projects), updatedAt: stored.updatedAt || null };
  } catch (error) {
    console.error(JSON.stringify({ message: "invalid works config in KV", error: error instanceof Error ? error.message : String(error) }));
    return { projects: normalizeProjects(defaultConfig.projects), updatedAt: null };
  }
}

async function readProfile(env: Env, fresh = false): Promise<ProfileConfig> {
  const stored = fresh
    ? await env.WORKS.get<ProfileConfig>(PROFILE_KEY, { type: "json" })
    : await env.WORKS.get<ProfileConfig>(PROFILE_KEY, { type: "json", cacheTtl: 30 });
  if (!stored) return { profile: normalizeProfile(defaultProfile), updatedAt: null };
  try {
    return { profile: normalizeProfile(stored.profile), updatedAt: stored.updatedAt || null };
  } catch (error) {
    console.error(JSON.stringify({ message: "invalid profile config in KV", error: error instanceof Error ? error.message : String(error) }));
    return { profile: normalizeProfile(defaultProfile), updatedAt: null };
  }
}

async function readHome(env: Env, fresh = false): Promise<HomeConfig> {
  const stored = fresh
    ? await env.WORKS.get<HomeConfig>(HOME_KEY, { type: "json" })
    : await env.WORKS.get<HomeConfig>(HOME_KEY, { type: "json", cacheTtl: 30 });
  if (!stored) return { home: normalizeHome(defaultHome), updatedAt: null };
  try {
    return { home: normalizeHome(stored.home), updatedAt: stored.updatedAt || null };
  } catch (error) {
    console.error(JSON.stringify({ message: "invalid home config in KV", error: error instanceof Error ? error.message : String(error) }));
    return { home: normalizeHome(defaultHome), updatedAt: null };
  }
}

async function githubStars(env: Env, repository: string, fallback: number | null): Promise<number | null> {
  const cacheKey = `github:stars:${repository.toLowerCase()}`;
  const cached = await env.WORKS.get(cacheKey, { type: "text", cacheTtl: 30 });
  if (cached !== null) {
    const value = Number(cached);
    return Number.isFinite(value) ? value : fallback;
  }

  try {
    const response = await fetch(`https://img.shields.io/github/stars/${repository}.json`, {
      headers: { Accept: "application/json", "User-Agent": "elin-os-portfolio" },
      signal: AbortSignal.timeout(2_500),
    });
    if (!response.ok) {
      console.warn(JSON.stringify({ message: "github stars unavailable", repository, status: response.status }));
      return fallback;
    }
    const data = await response.json<{ value?: unknown; message?: unknown }>();
    const rawValue = typeof data.value === "string" || typeof data.value === "number" ? data.value : data.message;
    const compact = String(rawValue ?? "").trim().toLowerCase().replaceAll(",", "");
    const match = compact.match(/^(\d+(?:\.\d+)?)([kmb])?$/);
    const multiplier = match?.[2] === "k" ? 1_000 : match?.[2] === "m" ? 1_000_000 : match?.[2] === "b" ? 1_000_000_000 : 1;
    const stars = match ? Math.round(Number(match[1]) * multiplier) : fallback;
    if (stars !== null) await env.WORKS.put(cacheKey, String(stars), { expirationTtl: STAR_TTL_SECONDS });
    return stars;
  } catch (error) {
    console.warn(JSON.stringify({ message: "github stars request failed", repository, error: error instanceof Error ? error.message : String(error) }));
    return fallback;
  }
}

function githubUsername(profileUrl: string): string | null {
  try {
    const url = new URL(profileUrl);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const username = url.pathname.split("/").filter(Boolean)[0] || "";
    return /^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(username) ? username : null;
  } catch {
    return null;
  }
}

async function readLimitedText(response: Response, maxBytes: number, tooLargeMessage = "响应内容过大"): Promise<string> {
  const contentLength = Number(response.headers.get("Content-Length") || 0);
  if (contentLength > maxBytes) throw new Error(tooLargeMessage);
  if (!response.body) return "";

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = "";
  let bytesRead = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > maxBytes) {
      await reader.cancel("Response exceeded size limit");
      throw new Error(tooLargeMessage);
    }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

function previousUtcDate(date: string): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function parseGithubContributions(html: string, username: string): GithubContributionsData {
  const dayIds = new Map<string, string>();
  const dayTag = /<td\b(?=[^>]*\bdata-date="(\d{4}-\d{2}-\d{2})")(?=[^>]*\bid="([^"]+)")(?=[^>]*\bclass="[^"]*\bContributionCalendar-day\b)[^>]*>/g;
  for (const match of html.matchAll(dayTag)) dayIds.set(match[2], match[1]);

  const counts = new Map<string, number>();
  const tooltip = /<tool-tip\b(?=[^>]*\bfor="([^"]+)")[^>]*>([^<]*)<\/tool-tip>/g;
  for (const match of html.matchAll(tooltip)) {
    const date = dayIds.get(match[1]);
    if (!date) continue;
    const countMatch = match[2].trim().match(/^(\d+) contributions? on\b/i);
    counts.set(date, countMatch ? Number(countMatch[1]) : 0);
  }

  const days = [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (days.length < 350) throw new Error("GitHub contribution calendar format changed");

  const weeks: ContributionDay[][] = [];
  for (let index = 0; index < days.length; index += 7) weeks.push(days.slice(index, index + 7));

  const total = days.reduce((sum, day) => sum + day.count, 0);
  let cursor = days.at(-1)?.date || "";
  if (cursor && (counts.get(cursor) || 0) === 0) cursor = previousUtcDate(cursor);
  let streak = 0;
  while (cursor && (counts.get(cursor) || 0) > 0) {
    streak += 1;
    cursor = previousUtcDate(cursor);
  }

  return {
    username,
    total,
    streak,
    weeks,
    from: days[0].date,
    to: days[days.length - 1].date,
    updatedAt: new Date().toISOString(),
  };
}

async function publicGithubContributions(env: Env): Promise<Response> {
  const { profile } = await readProfile(env);
  const username = githubUsername(profile.githubUrl);
  if (!username) return json({ error: "GitHub 用户名未配置" }, { status: 404, headers: { "Cache-Control": "no-store" } });

  const cacheKey = `github:contributions:v1:${username.toLowerCase()}`;
  const cached = await env.WORKS.get<GithubContributionsData>(cacheKey, { type: "json", cacheTtl: 60 });
  if (cached) {
    return json(cached, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
  }

  try {
    const response = await fetch(`https://github.com/users/${encodeURIComponent(username)}/contributions`, {
      headers: {
        Accept: "text/html",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "elin-os-portfolio",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      console.warn(JSON.stringify({ message: "github contributions unavailable", username, status: response.status }));
      return json({ error: "GitHub 贡献数据暂时不可用" }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }
    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.includes("text/html")) {
      return json({ error: "GitHub 贡献数据格式异常" }, { status: 502, headers: { "Cache-Control": "no-store" } });
    }

    const data = parseGithubContributions(await readLimitedText(response, MAX_GITHUB_HTML_BYTES, "GitHub contribution response is too large"), username);
    await env.WORKS.put(cacheKey, JSON.stringify(data), { expirationTtl: CONTRIBUTIONS_TTL_SECONDS });
    return json(data, { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } });
  } catch (error) {
    console.warn(JSON.stringify({ message: "github contributions request failed", username, error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "GitHub 贡献数据暂时不可用" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

async function publicWorks(request: Request, env: Env): Promise<Response> {
  const local = isLocalRequest(request);
  const config = await readConfig(env, local);
  const projects = await Promise.all(config.projects.map(async (project) => {
    const repository = parseGithubRepository(project.githubUrl);
    if (!repository) return project;
    return { ...project, stars: await githubStars(env, repository, project.stars) };
  }));
  return json({ ...config, projects }, { headers: { "Cache-Control": local ? "no-store" : "public, max-age=30, stale-while-revalidate=120" } });
}

async function publicProfile(request: Request, env: Env): Promise<Response> {
  const local = isLocalRequest(request);
  return json(await readProfile(env, local), { headers: { "Cache-Control": local ? "no-store" : "public, max-age=30, stale-while-revalidate=120" } });
}

async function publicHome(request: Request, env: Env): Promise<Response> {
  const local = isLocalRequest(request);
  return json(await readHome(env, local), { headers: { "Cache-Control": local ? "no-store" : "public, max-age=30, stale-while-revalidate=120" } });
}

function isLocalRequest(request: Request): boolean {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

async function saveWorks(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength) return json({ error: "无法确认配置大小" }, { status: 411 });
  if (contentLength > MAX_CONFIG_BYTES) return json({ error: "作品配置过大" }, { status: 413 });
  const body = await request.json<unknown>();
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式错误" }, { status: 400 });
  let projects;
  try {
    projects = normalizeProjects((body as { projects?: unknown }).projects);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "作品配置格式错误" }, { status: 400 });
  }
  const config: WorksConfig = { projects, updatedAt: new Date().toISOString() };
  await env.WORKS.put(WORKS_KEY, JSON.stringify(config));
  return json(config);
}

async function saveProfile(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength) return json({ error: "无法确认配置大小" }, { status: 411 });
  if (contentLength > MAX_CONFIG_BYTES) return json({ error: "简介配置过大" }, { status: 413 });
  const body = await request.json<unknown>();
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式错误" }, { status: 400 });
  let profile;
  try {
    profile = normalizeProfile((body as { profile?: unknown }).profile);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "简介配置格式错误" }, { status: 400 });
  }
  const config: ProfileConfig = { profile, updatedAt: new Date().toISOString() };
  await env.WORKS.put(PROFILE_KEY, JSON.stringify(config));
  return json(config);
}

async function saveHome(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength) return json({ error: "无法确认配置大小" }, { status: 411 });
  if (contentLength > MAX_CONFIG_BYTES) return json({ error: "主页配置过大" }, { status: 413 });
  const body = await request.json<unknown>();
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式错误" }, { status: 400 });
  let home;
  try {
    home = normalizeHome((body as { home?: unknown }).home);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "主页配置格式错误" }, { status: 400 });
  }
  const config: HomeConfig = { home, updatedAt: new Date().toISOString() };
  await env.WORKS.put(HOME_KEY, JSON.stringify(config));
  return json(config);
}

async function uploadMedia(request: Request, env: Env): Promise<Response> {
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
  const extension = IMAGE_TYPES[contentType];
  if (!extension) return json({ error: "只支持 PNG、JPEG、WebP 和 GIF 图片" }, { status: 415 });
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength) return json({ error: "无法确认图片大小" }, { status: 411 });
  if (contentLength > MAX_IMAGE_BYTES) return json({ error: "图片不能超过 5 MB" }, { status: 413 });
  if (!request.body) return json({ error: "没有收到图片内容" }, { status: 400 });

  const now = new Date();
  const key = `works/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${extension}`;
  const encodedName = request.headers.get("X-File-Name") || "";
  let originalName = "upload";
  try { originalName = decodeURIComponent(encodedName).slice(0, 180) || "upload"; } catch { originalName = "upload"; }
  const result = await env.MEDIA.put(key, request.body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName },
  });
  if (!result) return json({ error: "图片上传未完成" }, { status: 500 });
  return json({ key, url: `/media/${key}` }, { status: 201 });
}

async function uploadMusic(request: Request, env: Env): Promise<Response> {
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
  const extension = AUDIO_TYPES[contentType];
  if (!extension) return json({ error: "只支持 MP3、M4A、AAC、OGG、WAV、WebM 和 FLAC 音频" }, { status: 415 });
  const contentLengthHeader = request.headers.get("Content-Length");
  if (!contentLengthHeader) return json({ error: "无法确认音频大小" }, { status: 411 });
  const contentLength = Number(contentLengthHeader);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return json({ error: "音频大小无效" }, { status: 400 });
  if (contentLength > MAX_AUDIO_BYTES) return json({ error: "音频不能超过 50 MB" }, { status: 413 });
  if (!request.body) return json({ error: "没有收到音频内容" }, { status: 400 });

  const key = datedMusicKey(extension);
  const encodedName = request.headers.get("X-File-Name") || "";
  let originalName = "audio";
  try { originalName = decodeURIComponent(encodedName).slice(0, 180) || "audio"; } catch { originalName = "audio"; }
  let result: R2Object;
  try {
    result = await env.MEDIA.put(key, request.body, {
      httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable, no-transform" },
      customMetadata: { originalName },
    });
  } catch (error) {
    console.error(JSON.stringify({ message: "music upload failed", error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "音频上传失败，请稍后重试" }, { status: 502 });
  }
  if (!result) return json({ error: "音频上传未完成" }, { status: 500 });
  return json({ key, url: `/media/${key}`, originalName, size: result.size, contentType }, { status: 201 });
}

function datedMusicKey(extension: string): string {
  const now = new Date();
  return `music/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${extension}`;
}

async function uploadMusicImage(request: Request, env: Env): Promise<Response> {
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
  const extension = IMAGE_TYPES[contentType];
  if (!extension) return json({ error: "封面只支持 PNG、JPEG、WebP 和 GIF" }, { status: 415 });
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return json({ error: "无法确认封面大小" }, { status: 411 });
  if (contentLength > MAX_IMAGE_BYTES) return json({ error: "封面不能超过 5 MB" }, { status: 413 });
  if (!request.body) return json({ error: "没有收到封面内容" }, { status: 400 });

  const key = datedMusicKey(extension);
  const object = await env.MEDIA.put(key, request.body, {
    httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { mediaRole: "music-cover" },
  });
  if (!object) return json({ error: "封面上传未完成" }, { status: 500 });
  return json({ key, url: `/media/${key}`, size: object.size, contentType }, { status: 201 });
}

async function uploadMusicLyric(request: Request, env: Env): Promise<Response> {
  const contentType = (request.headers.get("Content-Type") || "").split(";")[0].toLowerCase();
  if (contentType !== "text/plain") return json({ error: "请选择 LRC 或 TXT 歌词文件" }, { status: 415 });
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return json({ error: "无法确认歌词大小" }, { status: 411 });
  if (contentLength > MAX_LYRIC_BYTES) return json({ error: "歌词不能超过 256 KB" }, { status: 413 });
  if (!request.body) return json({ error: "没有收到歌词内容" }, { status: 400 });

  const key = datedMusicKey("lrc");
  const object = await env.MEDIA.put(key, request.body, {
    httpMetadata: { contentType: "text/plain; charset=utf-8", cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { mediaRole: "music-lyric" },
  });
  if (!object) return json({ error: "歌词上传未完成" }, { status: 500 });
  return json({ key, url: `/media/${key}`, size: object.size, contentType: "text/plain" }, { status: 201 });
}

async function hylMusicJson(env: Env, pathname: string, search: Record<string, string>, maxBytes = MAX_MUSIC_SOURCE_JSON_BYTES): Promise<unknown> {
  const url = new URL(pathname, HYL_MUSIC_INTERNAL_ORIGIN);
  for (const [key, value] of Object.entries(search)) url.searchParams.set(key, value);
  const init = { headers: { Accept: "application/json", "User-Agent": "elin-os-music-import" }, signal: AbortSignal.timeout(20_000) };
  let response: Response;
  try {
    response = await env.HYL_MUSIC.fetch(new Request(url, init));
  } catch {
    const publicUrl = new URL(pathname, HYL_MUSIC_PUBLIC_ORIGIN);
    for (const [key, value] of Object.entries(search)) publicUrl.searchParams.set(key, value);
    response = await fetch(new Request(publicUrl, init));
  }
  if (!response.ok) throw new Error(`小琳音乐站暂时不可用（${response.status}）`);
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.toLowerCase().includes("application/json")) throw new Error("小琳音乐站返回了异常数据");
  const raw = await readLimitedText(response, maxBytes, "小琳音乐站返回的数据过大");
  try { return JSON.parse(raw) as unknown; }
  catch { throw new Error("小琳音乐站返回了无法解析的数据"); }
}

async function searchHylMusic(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") || "").trim();
  if (!query) return json({ error: "请输入歌名、歌手或专辑" }, { status: 400 });
  if (query.length > 80) return json({ error: "搜索关键词不能超过 80 个字符" }, { status: 400 });
  const requestedLimit = Number(url.searchParams.get("limit") || HYL_SEARCH_LIMIT);
  const limit = Number.isSafeInteger(requestedLimit) ? Math.max(1, Math.min(HYL_SEARCH_LIMIT, requestedLimit)) : HYL_SEARCH_LIMIT;
  try {
    const result = await hylMusicJson(env, "/api/cloudsearch", {
      keywords: query,
      type: "1",
      limit: String(limit),
      offset: "0",
    });
    return json({ query, tracks: parseHylMusicSearch(result).slice(0, limit) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.warn(JSON.stringify({ message: "xiaolin music search failed", error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "暂时无法搜索歌曲，请稍后重试" }, { status: 502 });
  }
}

type RemoteMusicAsset = {
  response: Response;
  contentType: string;
  size: number;
  extension: string;
};

async function fetchTrustedMusicAsset(
  sourceUrl: string,
  kind: "audio" | "image",
  maxBytes: number,
  audio?: HylMusicAudio,
): Promise<RemoteMusicAsset> {
  let currentUrl = trustedMusicMediaUrl(sourceUrl);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      headers: { Accept: kind === "audio" ? "audio/*" : "image/*", "User-Agent": "elin-os-music-import" },
      signal: AbortSignal.timeout(45_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      await response.body?.cancel();
      if (!location || redirectCount === 3) throw new Error(`${kind === "audio" ? "音频" : "图片"}重定向异常`);
      currentUrl = trustedMusicMediaUrl(new URL(location, currentUrl).toString());
      continue;
    }
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new Error(`${kind === "audio" ? "音频" : "图片"}下载失败`);
    }
    const size = Number(response.headers.get("Content-Length") || 0);
    if (!Number.isSafeInteger(size) || size <= 0) {
      await response.body.cancel();
      throw new Error(`无法确认${kind === "audio" ? "音频" : "图片"}大小`);
    }
    if (size > maxBytes) {
      await response.body.cancel();
      throw new Error(`${kind === "audio" ? "音频" : "图片"}文件过大`);
    }
    const contentType = (response.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    const extension = kind === "audio" ? audio?.extension || "" : IMAGE_TYPES[contentType] || "";
    if (kind === "audio" ? !audio || !isSupportedAudioContentType(contentType, audio.extension) : !extension) {
      await response.body.cancel();
      throw new Error(`${kind === "audio" ? "音频" : "图片"}格式不受支持`);
    }
    if (kind === "audio" && audio && audio.size !== size) {
      await response.body.cancel();
      throw new Error("音源声明的音频大小不一致");
    }
    return { response, contentType, size, extension };
  }
  throw new Error("媒体重定向次数过多");
}

async function putRemoteMusicAsset(
  env: Env,
  key: string,
  asset: RemoteMusicAsset,
  maxBytes: number,
  metadata: Record<string, string>,
): Promise<R2Object> {
  if (!asset.response.body) throw new Error("媒体响应没有内容");
  let seen = 0;
  const stream = asset.response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength;
      if (seen > maxBytes) throw new Error("媒体流超过大小限制");
      controller.enqueue(chunk);
    },
  }));
  const fixedLength = new FixedLengthStream(asset.size);
  const pump = stream.pipeTo(fixedLength.writable);
  const put = env.MEDIA.put(key, fixedLength.readable, {
    httpMetadata: { contentType: asset.contentType, cacheControl: "public, max-age=31536000, immutable, no-transform" },
    customMetadata: metadata,
  });
  const results = await Promise.allSettled([pump, put]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  const object = (results[1] as PromiseFulfilledResult<R2Object>).value;
  if (!object || object.size !== seen || seen !== asset.size) throw new Error("媒体写入不完整");
  return object;
}

async function importHylMusic(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!Number.isSafeInteger(contentLength) || contentLength <= 0) return json({ error: "无法读取要导入的歌曲" }, { status: 411 });
  if (contentLength > MAX_MUSIC_IMPORT_BYTES) return json({ error: "歌曲信息异常，请重新选择" }, { status: 413 });
  const body = await request.json<unknown>();
  const rawSourceId = body && typeof body === "object" && !Array.isArray(body)
    ? (body as { sourceId?: unknown }).sourceId
    : undefined;
  const sourceId = typeof rawSourceId === "string" && /^\d+$/.test(rawSourceId) ? Number(rawSourceId) : rawSourceId;
  if (!Number.isSafeInteger(sourceId) || Number(sourceId) <= 0) return json({ error: "歌曲信息无效，请重新选择" }, { status: 400 });
  const id = String(sourceId);
  const cleanupKeys: string[] = [];

  try {
    const [detailResult, audioResult, lyricResult] = await Promise.all([
      hylMusicJson(env, "/api/song/detail", { ids: id }, 256 * 1024),
      hylMusicJson(env, "/api/song/url", { id, br: "128000" }, 128 * 1024),
      hylMusicJson(env, "/api/lyric", { id }, MAX_MUSIC_SOURCE_JSON_BYTES),
    ]);
    const metadata = parseHylMusicDetail(detailResult, id);
    const audio = parseHylMusicAudio(audioResult, id);
    if (audio.size > MAX_AUDIO_BYTES) throw new Error("音频不能超过 50 MB");
    const lyrics = parseHylMusicLyrics(lyricResult);

    if (metadata.primaryArtistId && metadata.artist) {
      try {
        const artistResult = await hylMusicJson(env, "/api/cloudsearch", {
          keywords: metadata.artist.split("、")[0], type: "100", limit: "10", offset: "0",
        }, 256 * 1024);
        metadata.artistAvatarUrl = parseHylArtistAvatar(artistResult, metadata.primaryArtistId);
      } catch {
        metadata.artistAvatarUrl = "";
      }
    }

    const remoteRequests: Array<Promise<RemoteMusicAsset>> = [fetchTrustedMusicAsset(audio.url, "audio", MAX_AUDIO_BYTES, audio)];
    if (metadata.coverUrl) remoteRequests.push(fetchTrustedMusicAsset(metadata.coverUrl, "image", MAX_IMAGE_BYTES));
    const avatarSharesCover = Boolean(metadata.artistAvatarUrl && metadata.artistAvatarUrl === metadata.coverUrl);
    if (metadata.artistAvatarUrl && !avatarSharesCover) remoteRequests.push(fetchTrustedMusicAsset(metadata.artistAvatarUrl, "image", MAX_IMAGE_BYTES));
    const remoteResults = await Promise.allSettled(remoteRequests);
    const failedDownload = remoteResults.find((result) => result.status === "rejected");
    if (failedDownload?.status === "rejected") {
      await Promise.all(remoteResults.map((result) => result.status === "fulfilled" ? result.value.response.body?.cancel() : undefined));
      throw failedDownload.reason;
    }
    const remoteAssets = remoteResults.map((result) => (result as PromiseFulfilledResult<RemoteMusicAsset>).value);
    const audioAsset = remoteAssets[0];
    let nextAssetIndex = 1;
    const coverAsset = metadata.coverUrl ? remoteAssets[nextAssetIndex++] : null;
    const artistAsset = metadata.artistAvatarUrl && !avatarSharesCover ? remoteAssets[nextAssetIndex] : null;

    const audioKey = datedMusicKey(audioAsset.extension);
    const coverKey = coverAsset ? datedMusicKey(coverAsset.extension) : "";
    const artistKey = artistAsset ? datedMusicKey(artistAsset.extension) : "";
    const lyricPayload = JSON.stringify({
      lrc: lyrics.lrc,
      translatedLrc: lyrics.translatedLrc,
      romanizedLrc: lyrics.romanizedLrc,
    });
    const lyricBytes = new TextEncoder().encode(lyricPayload).byteLength;
    if (lyricBytes > MAX_LYRIC_BYTES) throw new Error("歌词内容超过 256 KB");
    const lyricKey = lyrics.lrc || lyrics.translatedLrc || lyrics.romanizedLrc ? datedMusicKey("json") : "";
    cleanupKeys.push(audioKey, ...[coverKey, artistKey, lyricKey].filter(Boolean));

    const writes: Array<Promise<R2Object>> = [
      putRemoteMusicAsset(env, audioKey, audioAsset, MAX_AUDIO_BYTES, { source: HYL_MUSIC_PROVIDER, sourceId: id, mediaRole: "audio" }),
    ];
    if (coverAsset && coverKey) writes.push(putRemoteMusicAsset(env, coverKey, coverAsset, MAX_IMAGE_BYTES, { source: HYL_MUSIC_PROVIDER, sourceId: id, mediaRole: "cover" }));
    if (artistAsset && artistKey) writes.push(putRemoteMusicAsset(env, artistKey, artistAsset, MAX_IMAGE_BYTES, { source: HYL_MUSIC_PROVIDER, sourceId: id, mediaRole: "artist-avatar" }));
    if (lyricKey) {
      writes.push(env.MEDIA.put(lyricKey, lyricPayload, {
        httpMetadata: { contentType: "application/json; charset=utf-8", cacheControl: "public, max-age=31536000, immutable" },
        customMetadata: { source: HYL_MUSIC_PROVIDER, sourceId: id, mediaRole: "lyrics" },
      }).then((object) => {
        if (!object || object.size !== lyricBytes) throw new Error("歌词写入不完整");
        return object;
      }));
    }
    const writeResults = await Promise.allSettled(writes);
    const failedWrite = writeResults.find((result) => result.status === "rejected");
    if (failedWrite?.status === "rejected") {
      await env.MEDIA.delete(cleanupKeys);
      cleanupKeys.length = 0;
      throw failedWrite.reason;
    }

    return json({
      track: {
        id: `xiaolin-${id}`,
        name: metadata.name,
        artist: metadata.artist,
        album: metadata.album,
        url: `/media/${audioKey}`,
        coverUrl: coverKey ? `/media/${coverKey}` : "",
        artistAvatarUrl: avatarSharesCover && coverKey ? `/media/${coverKey}` : artistKey ? `/media/${artistKey}` : "",
        lyricUrl: lyricKey ? `/media/${lyricKey}` : "",
        durationMs: metadata.durationMs || audio.durationMs,
        sourceType: HYL_MUSIC_PROVIDER,
        sourceId: id,
        enabled: true,
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (cleanupKeys.length) {
      try { await env.MEDIA.delete(cleanupKeys); }
      catch (cleanupError) {
        console.error(JSON.stringify({ message: "xiaolin music cleanup failed", sourceId: id, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) }));
      }
    }
    console.error(JSON.stringify({ message: "xiaolin music import failed", sourceId: id, error: error instanceof Error ? error.message : String(error) }));
    return json({ error: "歌曲导入失败，请稍后重试" }, { status: 502 });
  }
}

function mediaHeaders(object: R2Object): Headers {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Length", String(object.size));
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  return headers;
}

async function serveMedia(request: Request, env: Env, pathname: string): Promise<Response> {
  let key: string;
  try { key = decodeURIComponent(pathname.slice("/media/".length)); } catch { return new Response("Bad Request", { status: 400 }); }
  if (!key || key.includes("..")) return new Response("Not Found", { status: 404 });

  const rangeHeader = request.headers.get("Range");
  if (request.method === "HEAD" || rangeHeader) {
    const head = await env.MEDIA.head(key);
    if (!head) return new Response("Not Found", { status: 404 });
    const headers = mediaHeaders(head);
    if (request.headers.get("If-None-Match") === head.httpEtag) return new Response(null, { status: 304, headers });
    if (request.method === "HEAD") return new Response(null, { status: 200, headers });

    const parsedRange = parseSingleByteRange(rangeHeader, head.size);
    if (parsedRange.kind !== "range") {
      headers.set("Content-Range", `bytes */${head.size}`);
      headers.set("Content-Length", "0");
      return new Response(null, { status: 416, headers });
    }
    const object = await env.MEDIA.get(key, { range: { offset: parsedRange.offset, length: parsedRange.length } });
    if (!object) return new Response("Not Found", { status: 404 });
    headers.set("Content-Length", String(parsedRange.length));
    headers.set("Content-Range", `bytes ${parsedRange.offset}-${parsedRange.end}/${head.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = mediaHeaders(object);
  if (request.headers.get("If-None-Match") === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/api/works") return publicWorks(request, env);
      if (request.method === "GET" && url.pathname === "/api/profile") return publicProfile(request, env);
      if (request.method === "GET" && url.pathname === "/api/home") return publicHome(request, env);
      if (request.method === "GET" && url.pathname === "/api/visitor") return publicVisitor(request);
      if (request.method === "GET" && url.pathname === "/api/weather") return publicWeather(request);
      if (request.method === "GET" && url.pathname === "/api/github-contributions") return publicGithubContributions(env);
      if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/media/")) return serveMedia(request, env, url.pathname);

      if (url.pathname.startsWith("/api/admin/")) {
        if (url.pathname === "/api/admin/session") {
          if (request.method === "POST") return login(request, env);
          if (request.method === "DELETE") return logout(request);
          if (request.method === "GET") {
            return (await isAuthorized(request, env))
              ? json({ ok: true }, { headers: { "Cache-Control": "no-store" } })
              : json({ error: "未登录" }, { status: 401, headers: { "Cache-Control": "no-store" } });
          }
        }
        const unauthorized = await requireAuthorization(request, env);
        if (unauthorized) return unauthorized;
        if (!sameOrigin(request)) return json({ error: "请求来源无效" }, { status: 403 });
        if (request.method === "PUT" && url.pathname === "/api/admin/works") return saveWorks(request, env);
        if (request.method === "PUT" && url.pathname === "/api/admin/profile") return saveProfile(request, env);
        if (request.method === "PUT" && url.pathname === "/api/admin/home") return saveHome(request, env);
        if (request.method === "POST" && url.pathname === "/api/admin/media") return uploadMedia(request, env);
        if (request.method === "GET" && url.pathname === "/api/admin/music/search") return searchHylMusic(request, env);
        if (request.method === "POST" && url.pathname === "/api/admin/music/import") return importHylMusic(request, env);
        if (request.method === "POST" && url.pathname === "/api/admin/music/image") return uploadMusicImage(request, env);
        if (request.method === "POST" && url.pathname === "/api/admin/music/lyric") return uploadMusicLyric(request, env);
        if (request.method === "POST" && url.pathname === "/api/admin/music") return uploadMusic(request, env);
        return json({ error: "请求的功能不存在" }, { status: 404 });
      }

      if (url.pathname.startsWith("/api/")) return json({ error: "请求的功能不存在" }, { status: 404 });
      return env.ASSETS.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      console.error(JSON.stringify({ message: "request failed", method: request.method, path: url.pathname, error: message }));
      return json({ error: message }, { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;
