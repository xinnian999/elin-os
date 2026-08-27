// 安全防护模块
export function initSecurityFeatures(config) {
  // 禁止右键菜单 + 显示提醒
  if (config.security?.disableRightClick) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      showRightClickMessage(config.security?.rightClickMessage || '为了浏览体验，本站禁止右键。')
      return false
    })
  }

  // 禁止F12/开发者工具
  if (config.security?.disableDevTools) {
    // 禁止 F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      // 禁止 Ctrl+Shift+I (开发者工具)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault()
        return false
      }
      // 禁止 Ctrl+Shift+C (元素检查)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault()
        return false
      }
      // 禁止 Ctrl+Shift+J (控制台)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault()
        return false
      }
    })
  }

  // 禁止查看源代码
  if (config.security?.disableSourceView) {
    document.addEventListener('keydown', (e) => {
      // 禁止 Ctrl+U (查看源代码)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault()
        return false
      }
    })
  }

  // 禁止拖拽
  document.addEventListener('dragstart', (e) => {
    e.preventDefault()
    return false
  })

  // 禁止选中文本复制
  document.addEventListener('selectstart', (e) => {
    e.preventDefault()
    return false
  })

  // 禁止复制
  document.addEventListener('copy', (e) => {
    e.preventDefault()
    return false
  })

  // 禁止粘贴
  document.addEventListener('paste', (e) => {
    e.preventDefault()
    return false
  })

  // 禁止剪切
  document.addEventListener('cut', (e) => {
    e.preventDefault()
    return false
  })

  // 检测开发者工具打开
  let devToolsOpen = false
  const threshold = 160

  setInterval(() => {
    if (window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold) {
      if (!devToolsOpen) {
        devToolsOpen = true
        console.clear()
        console.log('%c⚠️ 禁止使用开发者工具！', 'color: red; font-size: 20px; font-weight: bold;')
      }
    } else {
      devToolsOpen = false
    }
  }, 200)

  // 防止控制台输出
  const noop = () => {}
  if (config.security?.disableDevTools) {
    console.log = noop
    console.warn = noop
    console.error = noop
    console.debug = noop
  }
}

// 显示右键提醒消息
function showRightClickMessage(message) {
  // 移除旧的提醒
  const oldAlert = document.getElementById('right-click-alert')
  if (oldAlert) {
    oldAlert.remove()
  }

  // 创建提醒元素
  const alert = document.createElement('div')
  alert.id = 'right-click-alert'
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 212, 255, 0.2);
    border: 1px solid rgba(0, 212, 255, 0.5);
    color: #00d4ff;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 9999;
    animation: slideDown 0.3s ease-out;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.2);
  `
  alert.textContent = message

  // 添加动画样式
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
    }
    @keyframes slideUp {
      from {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
      }
      to {
        opacity: 0;
        transform: translateX(-50%) translateY(-20px);
      }
    }
  `
  document.head.appendChild(style)

  document.body.appendChild(alert)

  // 2秒后自动消失
  setTimeout(() => {
    alert.style.animation = 'slideUp 0.3s ease-out'
    setTimeout(() => {
      alert.remove()
    }, 300)
  }, 2000)
}

// 防止数据被篡改 - 定期检查配置完整性
export function initDataIntegrity(config) {
  const originalConfig = JSON.stringify(config)

  setInterval(() => {
    const currentConfig = localStorage.getItem('appConfig')
    if (currentConfig && currentConfig !== originalConfig) {
      console.warn('检测到配置被篡改，已恢复原始配置')
      localStorage.setItem('appConfig', originalConfig)
    }
  }, 5000)
}
