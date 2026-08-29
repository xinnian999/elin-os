const pad = value => String(value).padStart(2, '0')

const toDateKey = date => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
)

export function createCalendarGrid(dateValue = new Date()) {
  const current = dateValue instanceof Date ? new Date(dateValue.getTime()) : new Date(dateValue)
  if (Number.isNaN(current.getTime())) return []

  const year = current.getFullYear()
  const month = current.getMonth()
  const firstDay = new Date(year, month, 1)
  const mondayOffset = (firstDay.getDay() + 6) % 7

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, 1 - mondayOffset + index)
    return {
      dateKey: toDateKey(date),
      day: date.getDate(),
      currentMonth: date.getMonth() === month && date.getFullYear() === year,
      today:
        date.getFullYear() === current.getFullYear()
        && date.getMonth() === current.getMonth()
        && date.getDate() === current.getDate(),
      weekend: index % 7 >= 5,
    }
  })
}
