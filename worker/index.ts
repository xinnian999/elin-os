import defaultConfig from "../src/data/default-projects.json";
import defaultProfile from "../src/data/default-profile.json";
import defaultHome from "../src/data/default-home.json";
import { normalizeHome, normalizeProfile, normalizeProjects, parseGithubRepository } from "./schema";

const WORKS_KEY = "portfolio:works:v1";
const PROFILE_KEY = "portfolio:profile:v1";
const HOME_KEY = "portfolio:home:v2";
const STAR_TTL_SECONDS = 30 * 60;
const MAX_CONFIG_BYTES = 96 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_LOGIN_BYTES = 1024;
const SESSION_COOKIE = "elin_admin_session";
const SESSION_SECONDS = 30 * 24 * 60 * 60;
const LOCATION_CACHE_HEADERS = { "Cache-Control": "private, no-store, max-age=0" };
const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

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

async function readConfig(env: Env): Promise<WorksConfig> {
  const stored = await env.WORKS.get<WorksConfig>(WORKS_KEY, { type: "json", cacheTtl: 30 });
  if (!stored) return { projects: normalizeProjects(defaultConfig.projects), updatedAt: null };
  try {
    return { projects: normalizeProjects(stored.projects), updatedAt: stored.updatedAt || null };
  } catch (error) {
    console.error(JSON.stringify({ message: "invalid works config in KV", error: error instanceof Error ? error.message : String(error) }));
    return { projects: normalizeProjects(defaultConfig.projects), updatedAt: null };
  }
}

async function readProfile(env: Env): Promise<ProfileConfig> {
  const stored = await env.WORKS.get<ProfileConfig>(PROFILE_KEY, { type: "json", cacheTtl: 30 });
  if (!stored) return { profile: normalizeProfile(defaultProfile), updatedAt: null };
  try {
    return { profile: normalizeProfile(stored.profile), updatedAt: stored.updatedAt || null };
  } catch (error) {
    console.error(JSON.stringify({ message: "invalid profile config in KV", error: error instanceof Error ? error.message : String(error) }));
    return { profile: normalizeProfile(defaultProfile), updatedAt: null };
  }
}

async function readHome(env: Env): Promise<HomeConfig> {
  const stored = await env.WORKS.get<HomeConfig>(HOME_KEY, { type: "json", cacheTtl: 30 });
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

async function publicWorks(env: Env): Promise<Response> {
  const config = await readConfig(env);
  const projects = await Promise.all(config.projects.map(async (project) => {
    const repository = parseGithubRepository(project.githubUrl);
    if (!repository) return project;
    return { ...project, stars: await githubStars(env, repository, project.stars) };
  }));
  return json({ ...config, projects }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function publicProfile(env: Env): Promise<Response> {
  return json(await readProfile(env), { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function publicHome(env: Env): Promise<Response> {
  return json(await readHome(env), { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}

async function saveWorks(request: Request, env: Env): Promise<Response> {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (!contentLength) return json({ error: "无法确认配置大小" }, { status: 411 });
  if (contentLength > MAX_CONFIG_BYTES) return json({ error: "作品配置过大" }, { status: 413 });
  const body = await request.json<unknown>();
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "请求格式错误" }, { status: 400 });
  const projects = normalizeProjects((body as { projects?: unknown }).projects);
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
  const profile = normalizeProfile((body as { profile?: unknown }).profile);
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
  const home = normalizeHome((body as { home?: unknown }).home);
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

async function serveMedia(request: Request, env: Env, pathname: string): Promise<Response> {
  let key: string;
  try { key = decodeURIComponent(pathname.slice("/media/".length)); } catch { return new Response("Bad Request", { status: 400 }); }
  if (!key || key.includes("..")) return new Response("Not Found", { status: 404 });
  const object = await env.MEDIA.get(key);
  if (!object) return new Response("Not Found", { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("X-Content-Type-Options", "nosniff");
  if (request.headers.get("If-None-Match") === object.httpEtag) return new Response(null, { status: 304, headers });
  return new Response(object.body, { status: 200, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/api/works") return publicWorks(env);
      if (request.method === "GET" && url.pathname === "/api/profile") return publicProfile(env);
      if (request.method === "GET" && url.pathname === "/api/home") return publicHome(env);
      if (request.method === "GET" && url.pathname === "/api/visitor") return publicVisitor(request);
      if (request.method === "GET" && url.pathname === "/api/weather") return publicWeather(request);
      if (request.method === "GET" && url.pathname.startsWith("/media/")) return serveMedia(request, env, url.pathname);

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
        return json({ error: "接口不存在" }, { status: 404 });
      }

      if (url.pathname.startsWith("/api/")) return json({ error: "接口不存在" }, { status: 404 });
      return env.ASSETS.fetch(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "未知错误";
      console.error(JSON.stringify({ message: "request failed", method: request.method, path: url.pathname, error: message }));
      return json({ error: message }, { status: 400 });
    }
  },
} satisfies ExportedHandler<Env>;
