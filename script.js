// Universal clipboard helper with textarea fallback
async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.left = '-9999px'
    ta.style.top = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

// Mobile Menu Toggle
const header = document.querySelector('.site-header')
const menuButton = document.querySelector('.menu-button')

if (menuButton && header) {
  menuButton.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open')
    menuButton.setAttribute('aria-expanded', String(open))
    menuButton.setAttribute('aria-label', open ? 'Đóng trình đơn' : 'Mở trình đơn')
  })

  document.querySelectorAll('.site-header nav a').forEach((link) => {
    link.addEventListener('click', () => {
      header.classList.remove('menu-open')
      menuButton.setAttribute('aria-expanded', 'false')
    })
  })
}

// Event Delegation for All Tabs & Copy Buttons
document.addEventListener('click', async (event) => {
  // 1. Dashboard Tabs (.dash-tab)
  const dashTab = event.target.closest('.dash-tab')
  if (dashTab) {
    const targetId = dashTab.getAttribute('aria-controls')
    document.querySelectorAll('.dash-tab').forEach((t) => {
      t.classList.remove('active')
      t.setAttribute('aria-selected', 'false')
    })
    document.querySelectorAll('.dash-panel').forEach((p) => {
      p.classList.remove('active')
      p.hidden = true
    })
    dashTab.classList.add('active')
    dashTab.setAttribute('aria-selected', 'true')
    const targetPanel = document.getElementById(targetId)
    if (targetPanel) {
      targetPanel.hidden = false
      targetPanel.classList.add('active')
    }
    return
  }

  // 2. Setup OS Tabs (.os-tab)
  const osTab = event.target.closest('.os-tab')
  if (osTab) {
    const targetId = osTab.getAttribute('aria-controls')
    document.querySelectorAll('.os-tab').forEach((t) => {
      t.classList.remove('active')
      t.setAttribute('aria-selected', 'false')
    })
    document.querySelectorAll('.os-panel').forEach((p) => {
      p.classList.remove('active')
      p.hidden = true
    })
    osTab.classList.add('active')
    osTab.setAttribute('aria-selected', 'true')
    const targetPanel = document.getElementById(targetId)
    if (targetPanel) {
      targetPanel.hidden = false
      targetPanel.classList.add('active')
    }
    return
  }

  // 3. Guest Password Copy (.copy-value)
  const copyVal = event.target.closest('.copy-value')
  if (copyVal) {
    const label = copyVal.querySelector('span')
    const text = copyVal.dataset.copy || '0899759653'
    const success = await copyText(text)
    if (label) {
      label.textContent = success ? 'Đã chép' : '0899759653'
      window.setTimeout(() => { label.textContent = 'Chép' }, 1800)
    }
    return
  }

  // 4. Code Snippet Copy (.copy-snippet)
  const snippetBtn = event.target.closest('.copy-snippet')
  if (snippetBtn) {
    const code = snippetBtn.dataset.code || ''
    const orig = snippetBtn.textContent
    const success = await copyText(code)
    snippetBtn.textContent = success ? 'Đã chép' : 'Lỗi'
    if (success) snippetBtn.style.color = 'var(--mint)'
    window.setTimeout(() => {
      snippetBtn.textContent = orig
      snippetBtn.style.color = ''
    }, 1600)
    return
  }

  // 5. Copy Full config.toml (#copy-toml-btn)
  const tomlBtn = event.target.closest('#copy-toml-btn')
  if (tomlBtn) {
    const codeEl = document.getElementById('toml-code-content')
    const text = codeEl ? codeEl.textContent : ''
    const orig = tomlBtn.textContent
    const success = await copyText(text)
    tomlBtn.textContent = success ? '✓ Đã sao chép config.toml' : 'Không sao chép được'
    if (success) {
      tomlBtn.style.background = 'var(--mint)'
      tomlBtn.style.color = '#fff'
    }
    window.setTimeout(() => {
      tomlBtn.textContent = orig
      tomlBtn.style.background = ''
      tomlBtn.style.color = ''
    }, 2000)
    return
  }
})
