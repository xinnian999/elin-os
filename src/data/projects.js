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
