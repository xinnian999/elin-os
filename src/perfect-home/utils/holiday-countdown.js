const DAY_MS = 24 * 60 * 60 * 1000
const CHINA_TIME_ZONE = 'Asia/Shanghai'
const CHINA_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: CHINA_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})
const CHINA_YEAR_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: CHINA_TIME_ZONE,
  year: 'numeric',
})

// 国办发明电〔2025〕7号：2026 年部分节假日放假安排。
const OFFICIAL_2026_HOLIDAYS = [
  { name: '元旦', date: '2026-01-01', endDate: '2026-01-03' },
  { name: '春节', date: '2026-02-15', endDate: '2026-02-23' },
  { name: '清明节', date: '2026-04-04', endDate: '2026-04-06' },
  { name: '劳动节', date: '2026-05-01', endDate: '2026-05-05' },
  { name: '端午节', date: '2026-06-19', endDate: '2026-06-21' },
  { name: '中秋节', date: '2026-09-25', endDate: '2026-09-27' },
  { name: '国庆节', date: '2026-10-01', endDate: '2026-10-07' },
].map(holiday => ({ ...holiday, official: true }))

// 2027 调休方案尚未公布；这里只使用已经确定的法定节日日期，不推测连休区间。
const KNOWN_2027_HOLIDAYS = [
  { name: '元旦', date: '2027-01-01' },
  { name: '春节', date: '2027-02-06' },
  { name: '清明节', date: '2027-04-05' },
  { name: '劳动节', date: '2027-05-01' },
  { name: '端午节', date: '2027-06-09' },
  { name: '中秋节', date: '2027-09-15' },
  { name: '国庆节', date: '2027-10-01' },
].map(holiday => ({ ...holiday, endDate: holiday.date, official: false }))

const pad = value => String(value).padStart(2, '0')

export const formatChinaDateKey = (date) => {
  const parts = CHINA_DATE_FORMATTER.formatToParts(date)
  const value = type => parts.find(part => part.type === type)?.value
  return `${value('year')}-${value('month')}-${value('day')}`
}

export const parseChinaDate = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || '')
  if (!match) return null
  const date = new Date(`${dateKey}T00:00:00+08:00`)
  return Number.isNaN(date.getTime()) || formatChinaDateKey(date) !== dateKey ? null : date
}

export const formatChineseDate = (dateKey) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey || '')
  if (!match || !parseChinaDate(dateKey)) return ''
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`
}

const getHolidaysForYear = year => {
  if (year === 2026) return OFFICIAL_2026_HOLIDAYS
  if (year === 2027) return KNOWN_2027_HOLIDAYS
  const newYear = `${year}-01-01`
  return [{ name: '元旦', date: newYear, endDate: newYear, official: false }]
}

const endOfChinaDay = (dateKey) => {
  const date = parseChinaDate(dateKey)
  if (!date) return Number.NEGATIVE_INFINITY
  return date.getTime() + DAY_MS - 1
}

export function getNextLegalHoliday(nowValue = Date.now()) {
  const now = nowValue instanceof Date ? nowValue : new Date(nowValue)
  const year = Number(CHINA_YEAR_FORMATTER.format(now))
  const holidays = [year, year + 1]
    .flatMap(getHolidaysForYear)
    .sort((a, b) => a.date.localeCompare(b.date))

  const holiday = holidays.find(item => endOfChinaDay(item.endDate) >= now.getTime())
  if (!holiday) return null

  const startsAt = parseChinaDate(holiday.date)?.getTime() ?? Number.POSITIVE_INFINITY
  return {
    ...holiday,
    active: now.getTime() >= startsAt,
  }
}

export function createCountdownData(targetDate, nowValue = Date.now(), { endOfDay = false } = {}) {
  const target = parseChinaDate(targetDate)
  if (!target) return null
  const targetTime = target.getTime() + (endOfDay ? DAY_MS - 1 : 0)

  const now = nowValue instanceof Date ? nowValue.getTime() : nowValue
  const diff = Math.max(0, targetTime - now)
  return {
    days: Math.floor(diff / DAY_MS),
    hours: Math.floor((diff % DAY_MS) / (60 * 60 * 1000)),
    mins: Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000)),
    secs: Math.floor((diff % (60 * 1000)) / 1000),
    reached: diff === 0,
    formatted: formatChineseDate(targetDate),
  }
}
