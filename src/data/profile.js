import defaultProfile from "./default-profile.json";

export { defaultProfile };

export async function fetchProfile(signal) {
  const response = await fetch("/api/profile", {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) throw new Error(`读取简介配置失败：${response.status}`);
  const data = await response.json();
  if (!data.profile || typeof data.profile !== "object") throw new Error("简介配置格式不正确");
  return data;
}
