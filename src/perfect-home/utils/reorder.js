export function moveArrayItem(items, fromIndex, toIndex) {
  if (!Array.isArray(items) || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return false
  if (fromIndex < 0 || fromIndex >= items.length || toIndex < 0 || toIndex >= items.length || fromIndex === toIndex) return false

  const [item] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, item)
  return true
}
