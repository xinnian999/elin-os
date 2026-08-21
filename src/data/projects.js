import defaultConfig from "./default-projects.json";

export const defaultProjects = defaultConfig.projects;

export async function fetchProjects(signal) {
  const response = await fetch("/api/works", {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) throw new Error(`读取作品配置失败：${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data.projects)) throw new Error("作品配置格式不正确");
  return data;
}

export async function fetchGithubStarCount(githubUrl, signal) {
  if (!githubUrl) return null;
  const url = new URL(githubUrl);
  if (url.hostname !== "github.com") return null;
  const [owner, repository] = url.pathname.split("/").filter(Boolean);
  if (!owner || !repository) return null;
  const response = await fetch(`https://api.github.com/repos/${owner}/${repository.replace(/\.git$/, "")}`, {
    headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    signal,
  });
  if (!response.ok) throw new Error(`GitHub Star 读取失败：${response.status}`);
  const data = await response.json();
  return typeof data.stargazers_count === "number" ? data.stargazers_count : null;
}
