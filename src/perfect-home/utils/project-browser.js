export const SHOWCASE_PROJECT_LIMIT = 7

export function getShowcaseProjects(projects, limit = SHOWCASE_PROJECT_LIMIT) {
  if (!Array.isArray(projects)) return []
  return projects.slice(0, Math.max(0, limit))
}

export function filterProjects(projects, query) {
  if (!Array.isArray(projects)) return []
  const normalizedQuery = String(query || '').trim().toLocaleLowerCase('zh-CN')
  if (!normalizedQuery) return projects

  return projects.filter((project) => {
    const searchableText = [
      project?.name,
      project?.eyebrow,
      project?.description,
      project?.longDescription,
      ...(Array.isArray(project?.stack) ? project.stack : []),
      ...(Array.isArray(project?.details) ? project.details.flatMap((detail) => Array.isArray(detail) ? detail : [detail]) : []),
    ].filter(Boolean).join(' ').toLocaleLowerCase('zh-CN')

    return searchableText.includes(normalizedQuery)
  })
}
