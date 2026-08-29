import defaultProfile from "../../data/default-profile.json";
import defaultWorks from "../../data/default-projects.json";
import defaultHome from "../../data/default-home.json";

const projectColors = ["#00d4ff", "#7b2ff7", "#ff0089", "#26de81", "#ffa502", "#54a0ff"];

export function makeConfig(profile, projects, home = defaultHome) {
  const visibleProjects = projects.filter((project) => project.visible !== false);
  const playlist = Array.isArray(home.music?.playlist) ? home.music.playlist : [];
  return {
    site: {
      title: profile.name || "Elin",
      domain: "",
      avatar: home.site.avatar,
      startDate: home.site.startDate,
      description: {
        identity: profile.role,
        interests: profile.intro,
        location: profile.location,
      },
      typewriterLines: home.site.typewriterLines,
      countdownName: home.site.countdownName,
      countdownDate: home.site.countdownDate,
    },
    profile,
    projects: visibleProjects,
    socials: (profile.contacts || [
      profile.githubUrl && { id: "github", name: "GitHub", type: "link", value: profile.githubUrl, icon: "github", color: "#d7e9ff" },
      profile.email && { id: "email", name: "Email", type: "email", value: profile.email, icon: "mail", color: "#00d4ff" },
    ].filter(Boolean)).map((contact) => ({ ...contact, url: contact.type === "email" ? `mailto:${contact.value}` : contact.value })),
    links: visibleProjects.map((project, index) => ({
      ...project,
      url: project.previewUrl || project.githubUrl,
      icon: project.id === "tuchong" ? "image" : project.id === "yl-code" ? "code" : "github",
      color: projectColors[index % projectColors.length],
    })),
    announcement: home.announcement,
    footer: { ...defaultHome.footer, ...(home.footer || {}) },
    security: {
      disableRightClick: true,
      disableDevTools: true,
      disableSourceView: true,
      rightClickMessage: "为了浏览体验 本站禁止右键。",
    },
    changelog: [
      { version: "v2.2.1", desc: "清理过时代码与资源，精简配置和构建" },
      { version: "v2.2.0", desc: "新增交互式桌面组件与 R2 万万静听" },
      { version: "v1.2.0", desc: "简介与作品由 Cloudflare KV 驱动" },
      { version: "v1.0.0", desc: "极光作品集初版" },
    ],
    music: { playlist },
  };
}

export function makeConfigFromSaveResults(profileResult, worksResult, homeResult) {
  return makeConfig(profileResult.profile, worksResult.projects, homeResult.home);
}

async function readJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
}

export async function loadConfig() {
  const [profileResult, worksResult, homeResult] = await Promise.allSettled([
    readJson("/api/profile"),
    readJson("/api/works"),
    readJson("/api/home"),
  ]);
  const profile = profileResult.status === "fulfilled" && profileResult.value.profile
    ? profileResult.value.profile
    : defaultProfile;
  const projects = worksResult.status === "fulfilled" && Array.isArray(worksResult.value.projects)
    ? worksResult.value.projects
    : defaultWorks.projects;
  const home = homeResult.status === "fulfilled" && homeResult.value.home
    ? homeResult.value.home
    : defaultHome;
  return makeConfig(profile, projects, home);
}
