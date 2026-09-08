const header = document.querySelector('.site-header')
const menuButton = document.querySelector('.menu-button')

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

// Copy guest password
const copyValBtn = document.querySelector('.copy-value')
if (copyValBtn) {
  copyValBtn.addEventListener('click', async (event) => {
    const button = event.currentTarget
    const label = button.querySelector('span')

    try {
      await navigator.clipboard.writeText(button.dataset.copy)
      label.textContent = 'Đã chép'
      window.setTimeout(() => { label.textContent = 'Chép' }, 1800)
    } catch {
      label.textContent = '0899759653'
    }
  })
}

// OS Tabs in Setup Guide Step 2
const osTabs = document.querySelectorAll('.os-tab')
const osPanels = document.querySelectorAll('.os-panel')

osTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const targetId = tab.getAttribute('aria-controls')

    osTabs.forEach((t) => {
      t.classList.remove('active')
      t.setAttribute('aria-selected', 'false')
    })
    osPanels.forEach((p) => {
      p.classList.remove('active')
      p.hidden = true
    })

    tab.classList.add('active')
    tab.setAttribute('aria-selected', 'true')

    const targetPanel = document.getElementById(targetId)
    if (targetPanel) {
      targetPanel.hidden = false
      targetPanel.classList.add('active')
    }
  })
})

// Copy individual snippet
document.querySelectorAll('.copy-snippet').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.dataset.code
    const originalText = btn.textContent

    try {
      await navigator.clipboard.writeText(code)
      btn.textContent = 'Đã chép'
      btn.style.color = 'var(--mint)'
      window.setTimeout(() => {
        btn.textContent = originalText
        btn.style.color = ''
      }, 1600)
    } catch {
      btn.textContent = 'Lỗi'
      window.setTimeout(() => { btn.textContent = originalText }, 1600)
    }
  })
})

// Copy full config.toml
const copyTomlBtn = document.getElementById('copy-toml-btn')
if (copyTomlBtn) {
  copyTomlBtn.addEventListener('click', async () => {
    const codeEl = document.getElementById('toml-code-content')
    const text = codeEl ? codeEl.textContent : ''

    try {
      await navigator.clipboard.writeText(text)
      const orig = copyTomlBtn.textContent
      copyTomlBtn.textContent = '✓ Đã sao chép config.toml'
      copyTomlBtn.style.background = 'var(--mint)'
      copyTomlBtn.style.color = '#fff'
      window.setTimeout(() => {
        copyTomlBtn.textContent = orig
        copyTomlBtn.style.background = ''
        copyTomlBtn.style.color = ''
      }, 2000)
    } catch {
      copyTomlBtn.textContent = 'Không sao chép được'
    }
  })
}
