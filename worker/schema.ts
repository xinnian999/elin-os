export const MAX_PROJECTS = 24;
export const MAX_CONTACTS = 16;
export const MAX_MUSIC_TRACKS = 20;
const MAX_DETAILS = 6;

const CONTACT_PRESETS = {
  github: { name: "GitHub", type: "link", icon: "github", color: "#F0F6FC", aliases: ["github"] },
  gitee: { name: "Gitee", type: "link", icon: "gitee", color: "#C71D23", aliases: ["gitee", "码云"] },
  wechat: { name: "微信", type: "qrcode", icon: "wechat", color: "#07C160", aliases: ["微信", "wechat"] },
  qq: { name: "QQ", type: "qrcode", icon: "qq", color: "#1EBAFC", aliases: ["qq"] },
  xiaohongshu: { name: "小红书", type: "link", icon: "xiaohongshu", color: "#FF2442", aliases: ["小红书", "xiaohongshu", "rednote"] },
  "wechat-official": { name: "公众号", type: "qrcode", icon: "wechat-official", color: "#07C160", aliases: ["公众号", "微信公众号", "official account"] },
  bilibili: { name: "B站", type: "link", icon: "bilibili", color: "#00A1D6", aliases: ["b站", "哔哩哔哩", "bilibili"] },
  zhihu: { name: "知乎", type: "link", icon: "zhihu", color: "#0084FF", aliases: ["知乎", "zhihu"] },
  weibo: { name: "微博", type: "link", icon: "weibo", color: "#E6162D", aliases: ["微博", "weibo", "sina weibo"] },
  douyin: { name: "抖音", type: "link", icon: "douyin", color: "#FE2C55", aliases: ["抖音", "douyin", "tiktok"] },
  email: { name: "邮箱", type: "email", icon: "mail", color: "#00D4FF", aliases: ["邮箱", "email", "mail"] },
  website: { name: "个人网站", type: "link", icon: "website", color: "#A46CFF", aliases: ["个人网站", "网站", "website"] },
  phone: { name: "手机", type: "link", icon: "phone", color: "#34C759", aliases: ["手机", "电话", "phone", "mobile"] },
} as const;

type ContactPresetId = keyof typeof CONTACT_PRESETS;

export type Contact = {
  id: string;
  name: string;
  type: "link" | "qrcode" | "email";
  value: string;
  icon: string;
  color: string;
};

type Project = {
  id: string;
  name: string;
  eyebrow: string;
  description: string;
  longDescription: string;
  image: string;
  stack: string[];
  stars: number | null;
  featured: boolean;
  visible: boolean;
  previewUrl: string;
  githubUrl: string;
  installCommand: string;
  details: [string, string][];
};

export type Profile = {
  name: string;
  role: string;
  intro: string;
  location: string;
  githubUrl: string;
  email: string;
  footer: string;
  contacts: Contact[];
};

export type MusicTrack = {
  id: string;
  name: string;
  artist: string;
  album: string;
  url: string;
  coverUrl: string;
  artistAvatarUrl: string;
  lyricUrl: string;
  durationMs: number;
  sourceType: "manual" | "xiaolin";
  sourceId: string;
  enabled: boolean;
};

export type HomeConfig = {
  site: {
    avatar: string;
    startDate: string;
    typewriterLines: string[];
    countdownName: string;
    countdownDate: string;
  };
  announcement: {
    enabled: boolean;
    text: string;
    speed: number;
    backgroundColor: string;
    textColor: string;
  };
  footer: {
    filingText: string;
    filingUrl: string;
    copyrightText: string;
    uiCreditText: string;
    uiCreditUrl: string;
  };
  music: {
    playlist: MusicTrack[];
  };
};

const DEFAULT_FOOTER: HomeConfig["footer"] = {
  filingText: "冀ICP备2025100393号-1",
  filingUrl: "https://beian.miit.gov.cn/",
  copyrightText: "Copyright © {year} Elin",
  uiCreditText: "UI based on Perfect Home",
  uiCreditUrl: "https://github.com/327261086/perfect-home",
};

function stringValue(value: unknown, field: string, maxLength: number, required = false): string {
  if (typeof value !== "string") throw new Error(`${field} 必须是文本`);
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${field} 不能为空`);
  if (normalized.length > maxLength) throw new Error(`${field} 不能超过 ${maxLength} 个字符`);
  return normalized;
}

function safeUrl(value: unknown, field: string, allowLocal = false): string {
  const normalized = stringValue(value ?? "", field, 500);
  if (!normalized) return "";
  if (allowLocal && (normalized.startsWith("/assets/") || normalized.startsWith("/media/"))) return normalized;
  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${field} 不是有效链接`);
  }
  if (parsed.protocol !== "https:") throw new Error(`${field} 必须使用 HTTPS`);
  return parsed.toString();
}

function normalizeFooter(value: unknown): HomeConfig["footer"] {
  const footer = value === undefined ? {} : value;
  if (!footer || typeof footer !== "object" || Array.isArray(footer)) throw new Error("页脚配置格式错误");
  const config = footer as Record<string, unknown>;
  return {
    filingText: stringValue(config.filingText ?? DEFAULT_FOOTER.filingText, "备案信息", 120),
    filingUrl: safeUrl(config.filingUrl ?? DEFAULT_FOOTER.filingUrl, "备案链接"),
    copyrightText: stringValue(config.copyrightText ?? DEFAULT_FOOTER.copyrightText, "版权信息", 160),
    uiCreditText: stringValue(config.uiCreditText ?? DEFAULT_FOOTER.uiCreditText, "UI 署名", 120),
    uiCreditUrl: safeUrl(config.uiCreditUrl ?? DEFAULT_FOOTER.uiCreditUrl, "UI 署名链接"),
  };
}

function musicMediaPath(value: unknown, field: string, required = false): string {
  const normalized = stringValue(value ?? "", field, 500, required);
  if (!normalized) return "";
  let pathname = normalized;
  if (!normalized.startsWith("/")) {
    let parsed: URL;
    try { parsed = new URL(normalized); }
    catch { throw new Error(`${field} 不是有效链接`); }
    if (parsed.protocol !== "https:") throw new Error(`${field} 必须使用 HTTPS`);
    if (!new Set(["elin521.cn", "www.elin521.cn"]).has(parsed.hostname)) {
      throw new Error(`${field} 必须使用在线编辑上传到 R2`);
    }
    pathname = parsed.pathname;
  }
  if (!/^\/media\/music\/\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/.test(pathname)) {
    throw new Error(`${field} 必须使用在线编辑上传到 R2`);
  }
  return pathname;
}

function musicAudioUrl(value: unknown, field: string): string {
  const pathname = musicMediaPath(value, field, true);
  if (!/\.(mp3|m4a|aac|ogg|wav|webm|flac)$/.test(pathname)) throw new Error(`${field} 不是支持的音频格式`);
  return pathname;
}

function musicImageUrl(value: unknown, field: string): string {
  const pathname = musicMediaPath(value, field);
  if (pathname && !/\.(png|jpg|webp|gif)$/.test(pathname)) throw new Error(`${field} 不是支持的图片格式`);
  return pathname;
}

function musicLyricUrl(value: unknown, field: string): string {
  const pathname = musicMediaPath(value, field);
  if (pathname && !/\.(lrc|txt|json)$/.test(pathname)) throw new Error(`${field} 不是支持的歌词格式`);
  return pathname;
}

function durationValue(value: unknown, field: string): number {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 24 * 60 * 60 * 1_000) {
    throw new Error(`${field} 必须是有效的毫秒数`);
  }
  return value;
}

function normalizeMusic(value: unknown): HomeConfig["music"] {
  if (value === undefined) return { playlist: [] };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("音乐配置格式错误");
  const music = value as Record<string, unknown>;
  const playlist = music.playlist === undefined ? [] : music.playlist;
  if (!Array.isArray(playlist)) throw new Error("音乐列表必须是数组");
  if (playlist.length > MAX_MUSIC_TRACKS) throw new Error(`歌曲不能超过 ${MAX_MUSIC_TRACKS} 首`);

  const tracks = playlist.map((item, index): MusicTrack => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`第 ${index + 1} 首歌曲格式错误`);
    const track = item as Record<string, unknown>;
    const id = stringValue(track.id ?? `track-${index + 1}`, `第 ${index + 1} 首歌曲 ID`, 80, true);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`歌曲 ID“${id}”只能包含小写字母、数字和连字符`);
    const sourceType = track.sourceType === undefined ? "manual" : stringValue(track.sourceType, `第 ${index + 1} 首歌曲来源`, 20, true);
    if (!new Set(["manual", "xiaolin"]).has(sourceType)) throw new Error(`第 ${index + 1} 首歌曲来源无效`);
    const sourceId = sourceType === "xiaolin"
      ? stringValue(track.sourceId ?? "", `第 ${index + 1} 首歌曲来源 ID`, 24, true)
      : "";
    if (sourceType === "xiaolin" && !/^\d+$/.test(sourceId)) throw new Error(`第 ${index + 1} 首歌曲来源 ID 无效`);
    const url = musicAudioUrl(track.url ?? "", `第 ${index + 1} 首歌曲地址`);
    return {
      id,
      name: stringValue(track.name, `第 ${index + 1} 首歌曲名称`, 200, true),
      artist: stringValue(track.artist ?? "", `第 ${index + 1} 首歌曲歌手`, 300),
      album: stringValue(track.album ?? "", `第 ${index + 1} 首歌曲专辑`, 200),
      url,
      coverUrl: musicImageUrl(track.coverUrl ?? "", `第 ${index + 1} 首歌曲封面`),
      artistAvatarUrl: musicImageUrl(track.artistAvatarUrl ?? "", `第 ${index + 1} 首歌曲歌手头像`),
      lyricUrl: musicLyricUrl(track.lyricUrl ?? "", `第 ${index + 1} 首歌曲歌词`),
      durationMs: durationValue(track.durationMs, `第 ${index + 1} 首歌曲时长`),
      sourceType: sourceType as MusicTrack["sourceType"],
      sourceId,
      enabled: track.enabled !== false,
    };
  });

  if (new Set(tracks.map((track) => track.id)).size !== tracks.length) throw new Error("歌曲 ID 不能重复");
  const sourceIds = tracks.filter((track) => track.sourceType === "xiaolin").map((track) => track.sourceId);
  if (new Set(sourceIds).size !== sourceIds.length) throw new Error("不能重复添加同一首小琳音乐站歌曲");
  return { playlist: tracks };
}

function contactValue(value: unknown, type: Contact["type"], field: string): string {
  if (type === "qrcode") return safeUrl(value, field, true);
  const normalized = stringValue(value, field, 500, true);
  if (type === "email") {
    const email = normalized.replace(/^mailto:/i, "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`${field} 不是有效邮箱地址`);
    return email;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error(`${field} 不是有效链接`);
  }
  if (!new Set(["https:", "tel:"]).has(parsed.protocol)) {
    throw new Error(`${field} 仅支持 HTTPS 或电话链接`);
  }
  return parsed.toString();
}

function phoneValue(value: unknown, field: string): string {
  const normalized = stringValue(value, field, 40, true).replace(/^tel:/i, "");
  const compact = normalized.replace(/[\s()-]/g, "");
  if (!/^\+?\d{6,20}$/.test(compact)) throw new Error(`${field} 不是有效电话号码`);
  return `tel:${compact}`;
}

function fallbackContacts(profile: Record<string, unknown>): Contact[] {
  const githubUrl = typeof profile.githubUrl === "string" ? profile.githubUrl.trim() : "";
  const email = typeof profile.email === "string" ? profile.email.trim() : "";
  const contacts: Contact[] = [];
  if (githubUrl) contacts.push({ id: "github", name: "GitHub", type: "link", value: githubUrl, icon: "github", color: "#F0F6FC" });
  if (email) contacts.push({ id: "email", name: "邮箱", type: "email", value: email, icon: "mail", color: "#00D4FF" });
  return contacts;
}

function findContactPreset(contact: Record<string, unknown>): [ContactPresetId, (typeof CONTACT_PRESETS)[ContactPresetId]] | null {
  const id = typeof contact.id === "string" ? contact.id.trim().toLowerCase() : "";
  if (id in CONTACT_PRESETS) {
    const presetId = id as ContactPresetId;
    return [presetId, CONTACT_PRESETS[presetId]];
  }
  const name = typeof contact.name === "string" ? contact.name.trim().toLowerCase() : "";
  const entry = Object.entries(CONTACT_PRESETS).find(([, preset]) => preset.aliases.some((alias) => alias.toLowerCase() === name));
  return entry ? entry as [ContactPresetId, (typeof CONTACT_PRESETS)[ContactPresetId]] : null;
}

function normalizeContacts(value: unknown, profile: Record<string, unknown>): Contact[] {
  if (value === undefined) return fallbackContacts(profile);
  if (!Array.isArray(value)) throw new Error("联系方式必须是数组");
  if (value.length > MAX_CONTACTS) throw new Error(`联系方式不能超过 ${MAX_CONTACTS} 个`);

  const contacts: Contact[] = [];
  const seen = new Set<ContactPresetId>();
  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`第 ${index + 1} 个联系方式格式错误`);
    const contact = item as Record<string, unknown>;
    const matched = findContactPreset(contact);
    if (!matched || seen.has(matched[0])) return;
    const [id, preset] = matched;
    const type = preset.type as Contact["type"];
    seen.add(id);
    contacts.push({
      id,
      name: preset.name,
      type,
      value: id === "phone"
        ? phoneValue(contact.value, `${preset.name}的内容`)
        : contactValue(contact.value, type, `${preset.name}的内容`),
      icon: preset.icon,
      color: preset.color,
    });
  });
  return contacts;
}

export function normalizeProfile(value: unknown): Profile {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("简介配置格式错误");
  const profile = value as Record<string, unknown>;
  const email = stringValue(profile.email ?? "", "邮箱", 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("邮箱格式不正确");
  return {
    name: stringValue(profile.name, "名称", 40, true),
    role: stringValue(profile.role, "身份描述", 100, true),
    intro: stringValue(profile.intro, "个人简介", 300, true),
    location: stringValue(profile.location ?? "", "所在地", 80),
    githubUrl: safeUrl(profile.githubUrl ?? "", "GitHub 链接"),
    email,
    footer: stringValue(profile.footer ?? "", "页脚文案", 100),
    contacts: normalizeContacts(profile.contacts, profile),
  };
}

export function normalizeHome(value: unknown): HomeConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("主页配置格式错误");
  const root = value as Record<string, unknown>;
  if (!root.site || typeof root.site !== "object" || Array.isArray(root.site)) throw new Error("主页信息格式错误");
  if (!root.announcement || typeof root.announcement !== "object" || Array.isArray(root.announcement)) throw new Error("公告配置格式错误");
  const site = root.site as Record<string, unknown>;
  const announcement = root.announcement as Record<string, unknown>;
  const typewriterLines = Array.isArray(site.typewriterLines) ? site.typewriterLines : [];
  if (!typewriterLines.length || typewriterLines.length > 8) throw new Error("打字机标语需保留 1 至 8 行");
  const speed = Number(announcement.speed);
  if (!Number.isFinite(speed) || speed < 10 || speed > 200) throw new Error("公告速度需在 10 至 200 之间");
  return {
    site: {
      avatar: stringValue(site.avatar, "头像", 300, true),
      startDate: stringValue(site.startDate, "建站日期", 10, true),
      typewriterLines: typewriterLines.map((line, index) => stringValue(line, `第 ${index + 1} 行标语`, 100, true)),
      countdownName: stringValue(site.countdownName, "倒计时名称", 40, true),
      countdownDate: stringValue(site.countdownDate, "倒计时日期", 10, true),
    },
    announcement: {
      enabled: announcement.enabled !== false,
      text: stringValue(announcement.text, "公告内容", 240, true),
      speed: Math.round(speed),
      backgroundColor: stringValue(announcement.backgroundColor, "公告背景色", 80, true),
      textColor: stringValue(announcement.textColor, "公告文字色", 40, true),
    },
    footer: normalizeFooter(root.footer),
    music: normalizeMusic(root.music),
  };
}

function projectValue(value: unknown, index: number): Project {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`第 ${index + 1} 个作品格式错误`);
  const project = value as Record<string, unknown>;
  const stack = Array.isArray(project.stack) ? project.stack : [];
  const details = Array.isArray(project.details) ? project.details : [];
  if (stack.length > 8) throw new Error(`${project.name || `第 ${index + 1} 个作品`}的技术标签不能超过 8 个`);
  if (details.length > MAX_DETAILS) throw new Error(`${project.name || `第 ${index + 1} 个作品`}的详情段落不能超过 ${MAX_DETAILS} 个`);

  const id = stringValue(project.id, "项目 ID", 80, true);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error(`项目 ID“${id}”只能包含小写字母、数字和连字符`);

  return {
    id,
    name: stringValue(project.name, "项目名称", 80, true),
    eyebrow: stringValue(project.eyebrow ?? "", "项目类型", 40),
    description: stringValue(project.description ?? "", "卡片简介", 180, true),
    longDescription: stringValue(project.longDescription ?? "", "详情导语", 500),
    image: safeUrl(project.image ?? "", "项目图片", true),
    stack: stack.map((item, stackIndex) => stringValue(item, `第 ${stackIndex + 1} 个技术标签`, 30, true)),
    stars: typeof project.stars === "number" && Number.isFinite(project.stars) ? Math.max(0, Math.round(project.stars)) : null,
    featured: Boolean(project.featured),
    visible: project.visible !== false,
    previewUrl: safeUrl(project.previewUrl ?? "", "在线体验链接"),
    githubUrl: safeUrl(project.githubUrl ?? "", "GitHub 源码链接"),
    installCommand: stringValue(project.installCommand ?? "", "安装命令", 180),
    details: details.map((detail, detailIndex) => {
      if (!Array.isArray(detail) || detail.length !== 2) throw new Error(`第 ${detailIndex + 1} 个详情段落格式错误`);
      return [
        stringValue(detail[0], `第 ${detailIndex + 1} 个详情标题`, 40, true),
        stringValue(detail[1], `第 ${detailIndex + 1} 个详情内容`, 600, true),
      ];
    }),
  };
}

export function normalizeProjects(value: unknown): Project[] {
  if (!Array.isArray(value)) throw new Error("projects 必须是数组");
  if (!value.length) throw new Error("至少保留一个作品");
  if (value.length > MAX_PROJECTS) throw new Error(`作品数量不能超过 ${MAX_PROJECTS} 个`);
  const projects = value.map(projectValue);
  const ids = new Set(projects.map((project) => project.id));
  if (ids.size !== projects.length) throw new Error("项目 ID 不能重复");
  if (projects.filter((project) => project.visible && project.featured).length > 1) throw new Error("只能设置一个对外展示的主项目");
  return projects;
}

export function parseGithubRepository(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com") return null;
    const [owner, repository] = url.pathname.split("/").filter(Boolean);
    if (!owner || !repository) return null;
    return `${owner}/${repository.replace(/\.git$/, "")}`;
  } catch {
    return null;
  }
}
