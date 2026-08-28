import {
  siBilibili,
  siGitee,
  siGithub,
  siQq,
  siSinaweibo,
  siTiktok,
  siWechat,
  siXiaohongshu,
  siZhihu,
} from 'simple-icons'

const brandIcon = (icon) => ({ path: icon.path, mode: 'fill' })

export const CONTACT_ICON_MAP = {
  github: brandIcon(siGithub),
  gitee: brandIcon(siGitee),
  wechat: brandIcon(siWechat),
  qq: brandIcon(siQq),
  xiaohongshu: brandIcon(siXiaohongshu),
  'wechat-official': brandIcon(siWechat),
  bilibili: brandIcon(siBilibili),
  zhihu: brandIcon(siZhihu),
  weibo: brandIcon(siSinaweibo),
  douyin: brandIcon(siTiktok),
  mail: {
    mode: 'stroke',
    path: 'M3.5 6.5h17a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-17a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2Zm-1 1 8.08 6.2a2.3 2.3 0 0 0 2.84 0L21.5 7.5',
  },
  website: {
    mode: 'stroke',
    path: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0 0c2.3-2.74 3.5-6.07 3.5-10S14.3 4.74 12 2c-2.3 2.74-3.5 6.07-3.5 10s1.2 7.26 3.5 10ZM2.6 9h18.8M2.6 15h18.8',
  },
  phone: {
    mode: 'stroke',
    path: 'M8.2 3.2 10 7.3a1.5 1.5 0 0 1-.4 1.7l-1.4 1.1a15.8 15.8 0 0 0 5.7 5.7l1.1-1.4a1.5 1.5 0 0 1 1.7-.4l4.1 1.8a1.5 1.5 0 0 1 .9 1.5v2a2 2 0 0 1-2.1 2C10.1 20.7 3.3 13.9 2.7 4.4a2 2 0 0 1 2-2.1h2a1.5 1.5 0 0 1 1.5.9Z',
  },
}

export const CONTACT_PRESETS = Object.freeze([
  { id: 'github', name: 'GitHub', type: 'link', icon: 'github', color: '#F0F6FC', placeholder: 'https://github.com/你的用户名', aliases: ['github'] },
  { id: 'gitee', name: 'Gitee', type: 'link', icon: 'gitee', color: '#C71D23', placeholder: 'https://gitee.com/你的用户名', aliases: ['gitee', '码云'] },
  { id: 'wechat', name: '微信', type: 'qrcode', icon: 'wechat', color: '#07C160', aliases: ['微信', 'wechat'] },
  { id: 'qq', name: 'QQ', type: 'qrcode', icon: 'qq', color: '#1EBAFC', aliases: ['qq'] },
  { id: 'xiaohongshu', name: '小红书', type: 'link', icon: 'xiaohongshu', color: '#FF2442', placeholder: 'https://www.xiaohongshu.com/user/profile/…', aliases: ['小红书', 'xiaohongshu', 'rednote'] },
  { id: 'wechat-official', name: '公众号', type: 'qrcode', icon: 'wechat-official', color: '#07C160', aliases: ['公众号', '微信公众号', 'official account'] },
  { id: 'bilibili', name: 'B站', type: 'link', icon: 'bilibili', color: '#00A1D6', placeholder: 'https://space.bilibili.com/…', aliases: ['b站', '哔哩哔哩', 'bilibili'] },
  { id: 'zhihu', name: '知乎', type: 'link', icon: 'zhihu', color: '#0084FF', placeholder: 'https://www.zhihu.com/people/…', aliases: ['知乎', 'zhihu'] },
  { id: 'weibo', name: '微博', type: 'link', icon: 'weibo', color: '#E6162D', placeholder: 'https://weibo.com/…', aliases: ['微博', 'weibo', 'sina weibo'] },
  { id: 'douyin', name: '抖音', type: 'link', icon: 'douyin', color: '#FE2C55', placeholder: 'https://www.douyin.com/user/…', aliases: ['抖音', 'douyin', 'tiktok'] },
  { id: 'email', name: '邮箱', type: 'email', icon: 'mail', color: '#00D4FF', placeholder: 'name@example.com', aliases: ['邮箱', 'email', 'mail'] },
  { id: 'website', name: '个人网站', type: 'link', icon: 'website', color: '#A46CFF', placeholder: 'https://example.com', aliases: ['个人网站', '网站', 'website'] },
  { id: 'phone', name: '手机', type: 'link', icon: 'phone', color: '#34C759', placeholder: '请输入手机号', aliases: ['手机', '电话', 'phone', 'mobile'] },
])

const presetMatch = (contact, preset) => {
  if (contact?.id === preset.id) return true
  const name = String(contact?.name || '').trim().toLowerCase()
  return preset.aliases.some((alias) => alias.toLowerCase() === name)
}

export const normalizePresetContacts = (contacts = [], profile = {}) => {
  const source = Array.isArray(contacts) ? contacts : []
  const seen = new Set()
  const normalized = source.flatMap((existing) => {
    const preset = CONTACT_PRESETS.find((item) => presetMatch(existing, item))
    if (!preset || seen.has(preset.id)) return []
    seen.add(preset.id)
    return [{
      id: preset.id,
      name: preset.name,
      type: preset.type,
      value: existing?.value || '',
      icon: preset.icon,
      color: preset.color,
    }]
  })

  for (const presetId of ['github', 'email']) {
    if (seen.has(presetId)) continue
    const preset = CONTACT_PRESETS.find((item) => item.id === presetId)
    const fallback = presetId === 'github' ? profile.githubUrl : profile.email
    if (!preset || !fallback) continue
    normalized.push({ id: preset.id, name: preset.name, type: preset.type, value: fallback, icon: preset.icon, color: preset.color })
  }
  return normalized
}

export const syncContactInputValues = (contacts = [], inputs = []) => {
  const contactMap = new Map(contacts.map((contact) => [contact?.id, contact]))
  inputs.forEach((input) => {
    const contact = contactMap.get(input?.dataset?.contactId)
    if (contact && typeof input.value === 'string') contact.value = input.value
  })
}
