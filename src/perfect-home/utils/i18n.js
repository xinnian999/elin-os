// i18n 国际化配置
import { ref, computed } from 'vue'

export const messages = {
  zh: {
    // 导航和通用
    home: '主页',
    settings: '设置',
    about: '关于',
    language: '语言',

    // 站点信息
    siteInfo: '站点信息',
    identity: '身份',
    interests: '兴趣',
    startDate: '建站日期',

    // 组件标题
    clock: '时钟',
    weather: '天气',
    visitor: '访客',
    hitokoto: '一言',
    pomodoro: '番茄钟',
    notes: '便签',
    links: '项目',
    countdown: '倒计时',
    github: 'GitHub',
    todo: '待办',
    quickNotes: '快捷便签',
    announcement: '公告',

    // 操作按钮
    add: '添加',
    delete: '删除',
    edit: '编辑',
    save: '保存',
    cancel: '取消',
    close: '关闭',
    confirm: '确认',

    // 时间相关
    today: '今天',
    yesterday: '昨天',
    thisWeek: '本周',
    thisMonth: '本月',
    thisYear: '今年',

    // 天气
    temperature: '温度',
    humidity: '湿度',
    windSpeed: '风速',

    // 番茄钟
    focus: '专注',
    breakTime: '休息',
    start: '开始',
    stop: '停止',
    reset: '重置',

    // 配置编辑器
    configEditor: '配置编辑器',
    password: '密码',
    unlock: '解锁',
    changePassword: '修改密码',

    // 消息
    saved: '已保存',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    noData: '暂无数据'
  },

  en: {
    // Navigation and common
    home: 'Home',
    settings: 'Settings',
    about: 'About',
    language: 'Language',

    // Site info
    siteInfo: 'Site Info',
    identity: 'Identity',
    interests: 'Interests',
    startDate: 'Start Date',

    // Component titles
    clock: 'Clock',
    weather: 'Weather',
    visitor: 'Visitor',
    hitokoto: 'Hitokoto',
    pomodoro: 'Pomodoro',
    notes: 'Notes',
    links: 'Links',
    countdown: 'Countdown',
    github: 'GitHub',
    todo: 'Todo',
    quickNotes: 'Quick Notes',
    announcement: 'Announcement',

    // Action buttons
    add: 'Add',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',

    // Time related
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    thisYear: 'This Year',

    // Weather
    temperature: 'Temperature',
    humidity: 'Humidity',
    windSpeed: 'Wind Speed',

    // Pomodoro
    focus: 'Focus',
    breakTime: 'Break',
    start: 'Start',
    stop: 'Stop',
    reset: 'Reset',

    // Config editor
    configEditor: 'Config Editor',
    password: 'Password',
    unlock: 'Unlock',
    changePassword: 'Change Password',

    // Messages
    saved: 'Saved',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    noData: 'No Data'
  }
}

// 语言状态
const locale = ref(localStorage.getItem('language') || 'zh')

// 获取当前语言
export const getLocale = () => locale.value

// 设置语言
export const setLocale = (lang) => {
  if (messages[lang]) {
    locale.value = lang
    localStorage.setItem('language', lang)
  }
}

// 翻译函数
export const t = (key) => {
  const keys = key.split('.')
  let value = messages[locale.value]
  for (const k of keys) {
    value = value?.[k]
  }
  return value || key
}

// 计算属性版本（用于响应式）
export const useI18n = () => {
  const localeComputed = computed(() => locale.value)

  const tComputed = (key) => {
    const keys = key.split('.')
    let value = messages[locale.value]
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  return {
    locale: localeComputed,
    t: tComputed,
    setLocale
  }
}
