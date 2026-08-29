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
      { version: "v2.3.3", desc: "修复部分歌曲无法导入的问题" },
      { version: "v2.3.2", desc: "统一操作提示，完善编辑体验" },
      { version: "v2.3.1", desc: "简化编辑提示，优化音乐添加体验" },
      { version: "v2.3.0", desc: "万万静听支持搜索歌曲与同步歌词" },
      { version: "v2.2.1", desc: "整理页面内容，提升访问体验" },
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
