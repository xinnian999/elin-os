export const MAX_PROJECTS = 24;
const MAX_DETAILS = 6;

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
