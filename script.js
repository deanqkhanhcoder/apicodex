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
        if (selected && typeof gsap !== 'undefined') {
          gsap.fromTo(panel, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: 'power2.out' })
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
        }
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
    if (!loading && typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh()
  }
  image.addEventListener('load', update)
  image.addEventListener('error', update)
  update()
})

if (typeof gsap !== 'undefined') {
  if (typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
  }
  gsap.defaults({ ease: 'power3.out', duration: 0.8 })

  const mm = gsap.matchMedia()

  mm.add({
    isDesktop: '(min-width: 993px)',
    isMobile: '(max-width: 992px)',
    reduceMotion: '(prefers-reduced-motion: reduce)'
  }, (context) => {
    const { isDesktop, reduceMotion } = context.conditions

    if (reduceMotion) {
      gsap.set('.hero, .hero-meter, .section-intro, .price-table-wrap, .service-list article, .dashboard-visual, .architecture, .arch-node, .arch-connector, .faq details, .signup > div, .step-card, .doc-hero-inner > *', {
        autoAlpha: 1,
        y: 0,
        x: 0,
        scale: 1,
        clearProps: 'all'
      })
      return
    }

    if (document.querySelector('.hero')) {
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .fromTo('.site-header', { y: -16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65 })
        .fromTo('.hero .availability', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 }, '-=0.35')
        .fromTo('.hero h1', { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75 }, '-=0.35')
        .fromTo('.hero .hero-lead', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.65 }, '-=0.45')
        .fromTo('.hero .hero-actions .button', { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.55 }, '-=0.4')
        .fromTo('.hero .comparison', { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45 }, '-=0.3')
        .fromTo('.hero-meter', { y: 35, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.85, ease: 'power3.out' }, '-=0.65')
        .fromTo('.meter-track span', { width: '0%' }, { width: '72%', duration: 1.1, ease: 'power2.out' }, '-=0.35')
        .fromTo('.meter-data div', { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.07, duration: 0.45 }, '-=0.55')

      if (isDesktop) {
        gsap.to('.hero-meter', {
          y: 36,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1
          }
        })
      }
    }

    document.querySelectorAll('.section-intro').forEach((intro) => {
      gsap.fromTo(intro.children, { y: 24, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        stagger: 0.1,
        duration: 0.75,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: intro,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    })

    if (document.querySelector('.price-table-wrap')) {
      gsap.fromTo('.price-table-wrap', { y: 28, scale: 0.98, autoAlpha: 0 }, {
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.price-table-wrap',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    }

    if (document.querySelector('.service-list')) {
      gsap.fromTo('.service-list article', { x: -20, autoAlpha: 0 }, {
        x: 0,
        autoAlpha: 1,
        stagger: 0.12,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.service-list',
          start: 'top 82%',
          toggleActions: 'play none none none'
        }
      })
    }

    if (document.querySelector('.dashboard')) {
      const dashTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.dashboard',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })
      dashTl
        .fromTo('.dashboard-copy', { y: 28, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.75 })
        .fromTo('.dashboard-visual', { y: 35, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.85, ease: 'power3.out' }, '-=0.45')

      if (isDesktop) {
        gsap.to('.dashboard-visual', {
          y: 28,
          ease: 'none',
          scrollTrigger: {
            trigger: '.dashboard',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1.2
          }
        })
      }
    }

    if (document.querySelector('.guide-teaser')) {
      const guideTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.guide-teaser',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })
      guideTl
        .fromTo('.guide-teaser-copy > *', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.65 })
        .fromTo('.guide-teaser-visual', { y: 30, scale: 0.97, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.75 }, '-=0.35')
    }

    if (document.querySelector('.architecture')) {
      const archTl = gsap.timeline({
        scrollTrigger: {
          trigger: '.architecture',
          start: 'top 80%',
          toggleActions: 'play none none none'
        }
      })
      archTl
        .fromTo('.arch-header', { y: 16, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5 })
        .fromTo('.arch-node[data-node="client"]', { y: 22, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55 }, '-=0.2')
        .fromTo('.arch-connector:nth-child(2)', { scaleY: 0, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, transformOrigin: 'top center', duration: 0.35 }, '-=0.15')
        .fromTo('.arch-node[data-node="gateway"]', { y: 22, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55 }, '-=0.15')
        .fromTo('.arch-connector:nth-child(4)', { scaleY: 0, autoAlpha: 0 }, { scaleY: 1, autoAlpha: 1, transformOrigin: 'top center', duration: 0.35 }, '-=0.15')
        .fromTo('.arch-node[data-node="provider"]', { y: 22, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.55 }, '-=0.15')
    }

    if (document.querySelector('.faq details')) {
      gsap.fromTo('.faq details', { y: 14, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        stagger: 0.06,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.faq',
          start: 'top 82%',
          toggleActions: 'play none none none'
        }
      })
    }

    if (document.querySelector('.signup')) {
      gsap.fromTo('.signup > div', { y: 24, autoAlpha: 0 }, {
        y: 0,
        autoAlpha: 1,
        duration: 0.7,
        scrollTrigger: {
          trigger: '.signup',
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    }

    if (document.querySelector('.doc-hero')) {
      gsap.fromTo('.doc-hero-inner > *', { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6 })
    }
    document.querySelectorAll('.step-card').forEach((card) => {
      gsap.fromTo(card, { y: 26, scale: 0.98, autoAlpha: 0 }, {
        y: 0,
        scale: 1,
        autoAlpha: 1,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    })

    if (document.querySelector('.error-container')) {
      gsap.fromTo('.error-container > *', { y: 20, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, duration: 0.6 })
    }
  })

  document.querySelectorAll('.button').forEach((btn) => {
    btn.addEventListener('mouseenter', () => {
      gsap.to(btn, { scale: 1.02, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
    })
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { scale: 1, duration: 0.2, ease: 'power2.out', overwrite: 'auto' })
    })
    btn.addEventListener('mousedown', () => {
      gsap.to(btn, { scale: 0.97, duration: 0.1, ease: 'power2.out', overwrite: 'auto' })
    })
    btn.addEventListener('mouseup', () => {
      gsap.to(btn, { scale: 1.02, duration: 0.15, ease: 'power2.out', overwrite: 'auto' })
    })
  })

  document.querySelectorAll('.arch-node').forEach((node) => {
    const icon = node.querySelector('.node-icon-box')
    node.addEventListener('mouseenter', () => {
      gsap.to(node, { y: -3, scale: 1.012, boxShadow: '0 14px 32px -8px rgba(23, 54, 93, 0.12)', duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
      if (icon) gsap.to(icon, { scale: 1.08, rotate: 2, duration: 0.25, ease: 'back.out(1.4)', overwrite: 'auto' })
    })
    node.addEventListener('mouseleave', () => {
      gsap.to(node, { y: 0, scale: 1, boxShadow: '0 4px 16px -4px rgba(23, 54, 93, 0.04)', duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
      if (icon) gsap.to(icon, { scale: 1, rotate: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' })
    })
  })
}
