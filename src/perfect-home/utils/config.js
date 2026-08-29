import defaultProfile from "../../data/default-profile.json";
import defaultWorks from "../../data/default-projects.json";
import defaultHome from "../../data/default-home.json";

const projectColors = ["#00d4ff", "#7b2ff7", "#ff0089", "#26de81", "#ffa502", "#54a0ff"];

function githubUser(url = "") {
  try { return new URL(url).pathname.split("/").filter(Boolean)[0] || "xinnian999"; }
  catch { return "xinnian999"; }
}

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
        showStartDate: true,
      },
      typewriterLines: home.site.typewriterLines,
      countdownName: home.site.countdownName,
      countdownDate: home.site.countdownDate,
      github: githubUser(profile.githubUrl),
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
      encryptData: true,
      rightClickMessage: "为了浏览体验 本站禁止右键。",
    },
    changelog: [
      { version: "v2.0.0", desc: "采用 Perfect Home 数字桌面，接入 Elin 主页数据" },
      { version: "v1.2.0", desc: "简介与作品由 Cloudflare KV 驱动" },
      { version: "v1.0.0", desc: "极光作品集初版" },
    ],
    background: { type: "default", customUrl: "", opacity: 1, blur: 0 },
    music: { enabled: playlist.some((track) => track.enabled !== false && track.url), autoPlay: false, volume: 0.5, playlist },
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

export function getDefaultConfig() {
  return makeConfig(defaultProfile, defaultWorks.projects);
}

export function encryptData(data) { return btoa(JSON.stringify(data)); }
export function decryptData(encrypted) {
  try { return JSON.parse(atob(encrypted)); }
  catch { return null; }
}
