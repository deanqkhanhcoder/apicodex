async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}
  const previous = document.activeElement
  const field = document.createElement('textarea')
  field.value = text
  field.style.cssText = 'position:fixed;left:-9999px;top:0'
  try {
    document.body.appendChild(field)
    field.focus()
    field.select()
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
    previous?.focus({ preventScroll: true })
  }
}

const header = document.querySelector('.site-header')
const menuButton = document.querySelector('.menu-button')
if (header && menuButton) {
  const closeMenu = (restore = false) => {
    header.classList.remove('menu-open')
    menuButton.setAttribute('aria-expanded', 'false')
    menuButton.setAttribute('aria-label', 'Mở trình đơn')
    if (restore) menuButton.focus()
  }
  menuButton.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open')
    menuButton.setAttribute('aria-expanded', String(open))
    menuButton.setAttribute('aria-label', open ? 'Đóng trình đơn' : 'Mở trình đơn')
    if (open) header.querySelector('nav a')?.focus()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) closeMenu(true)
  })
  document.addEventListener('click', (event) => {
    if (!header.contains(event.target)) closeMenu()
    else if (event.target.closest('nav a')) closeMenu(true)
  })
  header.addEventListener('focusout', (event) => {
    if (!header.contains(event.relatedTarget)) closeMenu()
  })
  matchMedia('(max-width: 992px)').addEventListener('change', () => {
    closeMenu(header.querySelector('nav')?.contains(document.activeElement))
  })
}

document.querySelectorAll('[role="tablist"]').forEach((list) => {
  const tabs = [...list.querySelectorAll('[role="tab"]')]
  const activate = (tab) => {
    tabs.forEach((item) => {
      const selected = item === tab
      item.classList.toggle('active', selected)
      item.setAttribute('aria-selected', String(selected))
      item.tabIndex = selected ? 0 : -1
      const panel = document.getElementById(item.getAttribute('aria-controls'))
      if (panel) {
        panel.hidden = !selected
        panel.classList.toggle('active', selected)
        panel.tabIndex = 0
      }
    })
  }
  activate(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0])
  list.addEventListener('click', (event) => {
    const tab = event.target.closest('[role="tab"]')
    if (tabs.includes(tab)) activate(tab)
  })
  list.addEventListener('keydown', (event) => {
    const index = tabs.indexOf(event.target)
    if (index < 0) return
    const targets = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }
    if (!(event.key in targets)) return
    event.preventDefault()
    const tab = tabs[targets[event.key]]
    activate(tab)
    tab.focus()
  })
})

const toast = document.createElement('div')
toast.className = 'copy-toast'
toast.setAttribute('role', 'status')
toast.setAttribute('aria-live', 'polite')
toast.setAttribute('aria-atomic', 'true')
document.body.appendChild(toast)
let copySequence = 0
let toastTimer
const copyStates = new WeakMap()
document.addEventListener('click', async (event) => {
  const button = event.target.closest('.copy-value, .copy-snippet, #copy-toml-btn')
  if (!button) return
  const label = button.querySelector('span') || button
  let state = copyStates.get(button)
  if (!state) {
    state = { original: label.textContent, sequence: 0 }
    copyStates.set(button, state)
  }
  clearTimeout(state.timer)
  const sequence = ++copySequence
  state.sequence = sequence
  const text = button.dataset.copy ?? button.dataset.code ?? document.getElementById('toml-code-content')?.textContent
  const success = typeof text === 'string' && text.length > 0 && await copyText(text)
  if (state.sequence !== sequence) return
  label.textContent = success ? 'Đã chép' : 'Chép thất bại'
  state.timer = setTimeout(() => { label.textContent = state.original }, 1800)
  if (sequence !== copySequence) return
  clearTimeout(toastTimer)
  toast.textContent = success ? `Đã sao chép vào bộ nhớ tạm. Lần ${sequence}.` : `Không thể sao chép. Hãy chọn nội dung và chép thủ công. Lần ${sequence}.`
  toast.classList.add('visible')
  toastTimer = setTimeout(() => {
    toast.classList.remove('visible')
    toast.textContent = ''
  }, 4500)
})

document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
  const frame = image.closest('.figure-frame, .dash-panel')
  if (!frame) return
  const status = document.createElement('span')
  status.className = 'image-status'
  frame.appendChild(status)
  const update = () => {
    const loading = !image.complete
    const failed = image.complete && image.naturalWidth === 0
    frame.setAttribute('aria-busy', String(loading))
    status.textContent = loading ? 'Đang tải ảnh…' : failed ? 'Không tải được ảnh. Thử tải lại trang.' : ''
    status.hidden = !loading && !failed
  }
  image.addEventListener('load', update)
  image.addEventListener('error', update)
  update()
})
