const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const read = (name) => fs.readFileSync(path.join(__dirname, name), 'utf8')
const script = read('script.js')

async function main() {
  for (const name of ['index.html', 'huong-dan.html', '404.html']) {
    const html = read(name)
    assert.match(html, /aria-controls="primary-nav"/)
    assert.match(html, /class="skip-link"/)
    assert.match(html, /styles\.css\?v=20260913-gsap1/)
    assert.match(html, /script\.js\?v=20260913-gsap1/)
    assert.match(html, /assets\/gsap\.min\.js/)
    assert.match(html, /assets\/ScrollTrigger\.min\.js/)
    assert.match(html, /class="header-action button button-primary"/)
    assert.doesNotMatch(html, /không mã hóa đường truyền|giám sát hạ tầng/)
    const nav = html.match(/<nav\b[^>]*>([\s\S]*?)<\/nav>/)[1]
    assert.doesNotMatch(nav, /class="[^"]*button/)
    for (const [, href] of html.matchAll(/href="([^":]+)"/g)) {
      const [file, id] = href.split('#')
      if (file && !file.endsWith('.html')) continue
      const target = read(file || name)
      if (id) assert.ok(target.includes(`id="${id}"`), `${name}: broken link ${href}`)
    }
    assert.doesNotMatch(html, /Hệ thống vận hành 24\/7|Trực tuyến 24\/7|Mở dashboard thời gian thực/)
    assert.doesNotMatch(html, /:2455\/dashboard|:2455\/apis|Guest password|0899759653\s*<span>Chép<\/span>/)
    assert.match(html, /http:\/\/apicodex\.cloud-ip\.cc:2456\//)
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1])
    assert.equal(new Set(ids).size, ids.length, `${name}: duplicate IDs`)
    for (const match of html.matchAll(/aria-controls="([^"]+)"/g)) assert.ok(ids.includes(match[1]))
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /loading="lazy"/)
      assert.match(tag, /decoding="async"/)
      const source = tag.match(/src="([^"?]+)/)[1]
      const png = fs.readFileSync(path.join(__dirname, source))
      assert.equal(Number(tag.match(/width="(\d+)"/)[1]), png.readUInt32BE(16), source)
      assert.equal(Number(tag.match(/height="(\d+)"/)[1]), png.readUInt32BE(20), source)
    }
  }
  const css = read('styles.css')
  assert.match(css, /--body: system-ui/)
  assert.match(css, /--text-base: 1rem/)
  assert.doesNotMatch(css, /font-size:\s*(?:9|10|11|12|13)px/)
  assert.doesNotMatch(css, /,\s*serif\b/i)
  assert.doesNotMatch(css, /"Merriweather"|"Comfortaa"|"Georgia"/i)
  const tokens = new Set([...css.matchAll(/(--[\w-]+):/g)].map((match) => match[1]))
  for (const [, token] of css.matchAll(/var\((--[\w-]+)\)/g)) assert.ok(tokens.has(token), `Undefined CSS token ${token}`)
  assert.match(read('huong-dan.html'), /<h1>Hướng dẫn setup Codex config cho người mới<\/h1>/)
  assert.match(read('index.html'), /Client → API Gateway → Provider/)
  assert.equal([...read('index.html').matchAll(/<details>/g)].length, 6)

  const indexHtml = read('index.html')
  assert.doesNotMatch(indexHtml, /20 triệu token/)
  assert.match(indexHtml, /10\.000đ \/ 15 triệu token/)
  assert.match(indexHtml, /aria-label="Gói được khuyến nghị: 525 triệu token"/)
  assert.match(indexHtml, /Hiệu suất 1,544x Plus/)

  const tbody = indexHtml.match(/<tbody>(.*?)<\/tbody>/s)[1]
  const tableRows = [...tbody.matchAll(/<tr\b/g)]
  assert.equal(tableRows.length, 7, 'Price table must have exactly 7 package rows')

  const expectedTable = [
    ['20.000đ', '30 triệu', '15 triệu', '—', '0,088x', '46.059đ'],
    ['50.000đ', '75 triệu', '37,5 triệu', '—', '0,221x', '115.147đ'],
    ['100.000đ', '150 triệu', '75 triệu', '—', '0,441x', '230.294đ'],
    ['200.000đ', '300 triệu', '150 triệu', '75 triệu', '0,882x', '460.588đ'],
    ['300.000đ', '525 triệu', '262,5 triệu', '150 triệu', '1,544x', '806.029đ'],
    ['500.000đ', '900 triệu', '375 triệu', '225 triệu', '2,647x', '1.381.765đ'],
    ['1.000.000đ', '1,875 tỷ', '600 triệu', '300 triệu', '5,515x', '2.878.676đ']
  ]

  expectedTable.forEach(([price, total, week, day, plus, equiv]) => {
    assert.ok(indexHtml.includes(total), `Missing total ${total}`)
    assert.ok(indexHtml.includes(week), `Missing week ${week}`)
    if (day !== '—') assert.ok(indexHtml.includes(day), `Missing day ${day}`)
    assert.ok(indexHtml.includes(plus), `Missing plus ratio ${plus}`)
    assert.ok(indexHtml.includes(equiv), `Missing equivalent price ${equiv}`)
  })
  const listeners = {}
  const timers = new Map()
  let timerId = 0
  const context = {
    navigator: {},
    document: {
      activeElement: { focus() { context.restored = true } },
      createElement() { return { style: {}, focus() {}, select() {}, remove() { context.removed = true }, setAttribute() {}, classList: {} } },
      body: { appendChild() {} },
      querySelector() { return null },
      querySelectorAll() { return [] },
      addEventListener(type, callback) { listeners[type] = callback },
      execCommand() { return true }
    },
    setTimeout(callback) { timers.set(++timerId, callback); return timerId },
    clearTimeout(id) { timers.delete(id) }
  }
  vm.createContext(context)
  vm.runInContext(script, context)
  let copied
  context.navigator.clipboard = { async writeText(text) { copied = text } }
  assert.equal(await context.copyText('test'), true)
  assert.equal(copied, 'test')
  context.navigator.clipboard.writeText = async () => { throw Error('denied') }
  assert.equal(await context.copyText('fallback'), true)
  assert.ok(context.removed && context.restored)
  context.removed = context.restored = false
  context.document.execCommand = () => { throw Error('blocked') }
  assert.equal(await context.copyText('failure'), false)
  assert.ok(context.removed && context.restored)
  vm.runInContext('toast.classList = { add() {}, remove() {} }', context)
  const button = { textContent: 'Chép', dataset: { code: 'example' }, querySelector() { return null } }
  const event = { target: { closest() { return button } } }
  context.navigator.clipboard.writeText = async () => {}
  await listeners.click(event)
  await listeners.click(event)
  assert.equal(button.textContent, 'Đã chép')
  assert.match(vm.runInContext('toast.textContent', context), /Lần 2/)
  for (const callback of [...timers.values()]) callback()
  timers.clear()
  assert.equal(button.textContent, 'Chép')
  const pending = []
  context.navigator.clipboard.writeText = () => new Promise((resolve) => pending.push(resolve))
  const first = listeners.click(event)
  const second = listeners.click(event)
  pending[1]()
  await second
  pending[0]()
  await first
  assert.match(vm.runInContext('toast.textContent', context), /Lần 4/)
  context.navigator.clipboard.writeText = async () => { throw Error('denied') }
  await listeners.click(event)
  assert.match(vm.runInContext('toast.textContent', context), /Không thể sao chép/)
  assert.equal(button.textContent, 'Chép thất bại')
  for (const callback of [...timers.values()]) callback()
  assert.equal(button.textContent, 'Chép')
  console.log('PASS: three pages, image dimensions, ARIA targets, truthful status, FAQ, clipboard cleanup, repeated clicks and async races')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
