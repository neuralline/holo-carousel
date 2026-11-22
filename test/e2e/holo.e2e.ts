// test/e2e/holo.e2e.ts

/*
    Neural Line
    Reactive carousel - browser tests
    H.O.L.O - C.A.R.O.U.S.E.L
    Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
*/

// What the unit tests can't reach: real layout, real frames, real input.
// Runs the built public/js/holo.js in Chrome against test/e2e/fixture.html
// (fixed sizes, no images) and public/site.html.
//
//   pnpm test:e2e            (builds the UMD bundle first)
//   HOLO_CHROME=/path/to/chrome node --experimental-strip-types --test test/e2e/holo.e2e.ts
//
// Uses the Chrome you have installed (playwright-core downloads nothing).

import {after, before, describe, it} from 'node:test'
import assert from 'node:assert/strict'
import {createServer, type Server} from 'node:http'
import {readFile} from 'node:fs/promises'
import {extname, join, normalize} from 'node:path'
import {fileURLToPath} from 'node:url'
import {chromium, type Browser, type BrowserContext, type Page} from 'playwright-core'

const ROOT = fileURLToPath(new URL('../../', import.meta.url))
const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
}

let server: Server
let browser: Browser
let base = ''

/** serve the repo root: /public/... and /test/e2e/fixture.html */
const serve = (): Promise<string> =>
  new Promise(resolve => {
    server = createServer(async (request, response) => {
      const path = normalize(decodeURIComponent((request.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
      try {
        const body = await readFile(join(ROOT, path))
        response.writeHead(200, {'content-type': TYPES[extname(path)] || 'application/octet-stream'})
        response.end(body)
      } catch {
        response.writeHead(404)
        response.end()
      }
    })
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      resolve(`http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`)
    })
  })

/** a page that fails the test on any script error */
const open = async (url: string, context?: BrowserContext): Promise<Page & {errors: string[]}> => {
  const page = (await (context || browser).newPage({viewport: {width: 1280, height: 900}})) as Page & {errors: string[]}
  page.errors = []
  page.on('pageerror', error => page.errors.push(String(error)))
  await page.goto(base + url)
  await page.waitForTimeout(600)
  return page
}

const fixture = async (): Promise<Page & {errors: string[]}> => {
  const page = await open('/test/e2e/fixture.html')
  await page.evaluate(() => document.getElementById('strip')!.scrollIntoView({block: 'center'}))
  await page.waitForTimeout(200)
  return page
}

const stateOf = (page: Page, id: string) =>
  page.evaluate(name => (window as any).h[name].state(), id) as Promise<{index: number; count: number}>

/** fling the strip and record where it is drawn every frame */
const fling = async (page: Page, options: Record<string, unknown>) => {
  await page.evaluate(() => ((window as any).stop = (window as any).record('strip')))
  await page.evaluate(opts => (window as any).trackpad('strip', opts), options)
  await page.waitForTimeout(1600)
  return (await page.evaluate(() => (window as any).stop())) as Array<[number, number]>
}

/** items per ms between frames */
const speeds = (log: Array<[number, number]>): number[] =>
  log.slice(1).map(([t, x], i) => (x - log[i][1]) / Math.max(1, t - log[i][0]))

/** a mouse drag from (x, y) by (dx, dy) over `ms` */
const mouseDrag = async (page: Page, x: number, y: number, dx: number, dy: number, ms: number) => {
  await page.mouse.move(x, y)
  await page.mouse.down()
  const steps = Math.max(4, Math.round(ms / 16))
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x + (dx * i) / steps, y + (dy * i) / steps)
    await page.waitForTimeout(ms / steps)
  }
  await page.mouse.up()
}

const centreOf = (page: Page, selector: string) =>
  page.evaluate(sel => {
    const box = document.querySelector(sel)!.getBoundingClientRect()
    return {x: box.left + box.width / 2, y: box.top + box.height / 2}
  }, selector)

before(async () => {
  base = await serve()
  const executablePath = process.env.HOLO_CHROME
  browser = await chromium.launch(executablePath ? {executablePath} : {channel: 'chrome'})
})

after(async () => {
  await browser?.close()
  server?.close()
})

describe('trackpad', () => {
  it('a faster swipe goes further', async () => {
    const page = await fixture()
    const landed: number[] = []
    for (const peak of [5, 22, 45]) {
      await page.evaluate(() => (window as any).h.strip.goTo(0, false))
      await page.waitForTimeout(100)
      await fling(page, {peak})
      landed.push((await stateOf(page, 'strip')).index)
    }
    assert.ok(landed[0] <= 1, `slow swipe moved ${landed[0]}`)
    assert.ok(landed[1] > landed[0] && landed[2] > landed[1], `landed ${landed}`)
    assert.ok(landed[2] >= 4, `fast swipe moved only ${landed[2]}`)
    assert.deepEqual(page.errors, [])
    await page.close()
  })

  it('a fling glides to rest - no jump, slowing down', async () => {
    const page = await fixture()
    const log = await fling(page, {peak: 30})
    const moving = speeds(log).filter(speed => Math.abs(speed) > 1e-5)
    assert.ok(moving.length > 20, `only ${moving.length} frames moved`)
    // no frame moves more than half an item (a jump)
    assert.ok(Math.max(...moving.map(Math.abs)) * 16 < 0.5, 'jumped')
    // the last third is slower than the first third
    const third = Math.floor(moving.length / 3)
    const mean = (list: number[]) => list.reduce((a, b) => a + Math.abs(b), 0) / list.length
    assert.ok(mean(moving.slice(-third)) < mean(moving.slice(0, third)) / 2, 'did not slow down')
    // it ends on an item
    const end = log[log.length - 1][1]
    assert.ok(Math.abs(end - Math.round(end)) < 0.01, `rests between items at ${end}`)
    await page.close()
  })

  it('a re-measure mid-glide does not cut it short', async () => {
    const page = await fixture()
    await page.evaluate(() => ((window as any).stop = (window as any).record('strip')))
    // refresh (what an image load does) the moment the glide starts: the
    // refresh is debounced, so the re-measure lands mid-glide
    await page.evaluate(() => {
      const w = window as any
      let refreshed = false
      return w.trackpad('strip', {
        peak: 45,
        then: () => {
          const gliding = !document.querySelector('#strip.holo-dragging') && w.position('strip') > 0.2
          if (gliding && !refreshed) {
            refreshed = true
            w.h.strip.refresh()
          }
        }
      })
    })
    await page.waitForTimeout(1600)
    const log = (await page.evaluate(() => (window as any).stop())) as Array<[number, number]>
    const steps = speeds(log).map(speed => Math.abs(speed) * 16)
    assert.ok(Math.max(...steps) < 0.5, `jumped ${Math.max(...steps).toFixed(2)} items in a frame`)
    await page.close()
  })

  it('a new swipe during a glide takes over', async () => {
    const page = await fixture()
    // fling forward, then mid-glide swipe back (events growing again)
    const back = Array.from({length: 24}, (_, i) => -Math.min(30, 2 + i * 3))
    // the same fling left alone, for comparison
    await fling(page, {peak: 30})
    const alone = (await stateOf(page, 'strip')).index
    await page.evaluate(() => (window as any).h.strip.goTo(0, false))
    await page.waitForTimeout(100)
    await fling(page, {peak: 30, cut: 20, extra: back})
    const regripped = (await stateOf(page, 'strip')).index
    assert.ok(regripped < alone, `regrip ${regripped} vs left alone ${alone}`)
    await page.close()
  })

  it('a swipe across the carousel is the page’s', async () => {
    const page = await fixture()
    const before = await page.evaluate(() => scrollY)
    const {x, y} = await centreOf(page, '#strip')
    await page.mouse.move(x, y)
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 40)
    await page.waitForTimeout(400)
    assert.ok((await page.evaluate(() => scrollY)) > before, 'page did not scroll')
    assert.equal((await stateOf(page, 'strip')).index, 0)
    await page.close()
  })
})

describe('pointer', () => {
  it('a drag across the carousel reports swipe {moved: false} and leaves it', async () => {
    const page = await fixture()
    const {x, y} = await centreOf(page, '#strip')
    await mouseDrag(page, x, y - 40, 6, 120, 200)
    await page.waitForTimeout(300)
    const swipes = await page.evaluate(() =>
      (window as any).events.filter((e: any) => e.from === 'strip' && e.type === 'swipe')
    )
    assert.equal(swipes.length, 1)
    assert.equal(swipes[0].payload.moved, false)
    assert.equal(swipes[0].payload.direction, 'down')
    assert.equal((await stateOf(page, 'strip')).index, 0)
    await page.close()
  })

  it('a slow drag settles at once, slowing down', async () => {
    const page = await fixture()
    const {x, y} = await centreOf(page, '#strip')
    await page.evaluate(() => ((window as any).stop = (window as any).record('strip')))
    await mouseDrag(page, x + 100, y, -200, 0, 500) // 2/3 of an item, then let go
    const released = await page.evaluate(() => performance.now())
    await page.waitForTimeout(700)
    const log = (await page.evaluate(() => (window as any).stop())) as Array<[number, number]>
    const end = log[log.length - 1][1]
    assert.ok(Math.abs(end - 1) < 0.01, `rests at ${end}`)
    // it starts settling at once and is there within ~450ms
    const after = log.filter(([t]) => t >= released)
    const firstMove = after.find(([, x], i) => i > 0 && Math.abs(x - after[i - 1][1]) > 1e-4)
    const lastMove = [...after].reverse().find(([, x]) => Math.abs(x - end) > 0.002)
    assert.ok(firstMove && firstMove[0] - released < 60, 'waited before settling')
    assert.ok(!lastMove || lastMove[0] - released < 450, `took ${lastMove && Math.round(lastMove[0] - released)}ms`)
    await page.close()
  })

  it('an inner carousel at its end hands the drag to its parent', async () => {
    const page = await fixture()
    await page.evaluate(() => document.getElementById('outer')!.scrollIntoView({block: 'center'}))
    await page.evaluate(() => (window as any).h.inner.last()) // inner shows three of a-e: at its end
    await page.waitForTimeout(200)
    const {x, y} = await centreOf(page, '#inner')
    await mouseDrag(page, x + 150, y, -420, 0, 300)
    await page.waitForTimeout(700)
    assert.equal((await stateOf(page, 'outer')).index, 1)
    await page.close()
  })
})

describe('touch', () => {
  // Chrome locks a touch to its first direction by itself (touch-action),
  // so here this guards the CSS; Holo's own lock (lockScroll) is for
  // browsers that re-decide mid-gesture - check those on a device.
  it('a sideways drag that drifts does not scroll the page; a vertical swipe does', async () => {
    // wide enough that the fixed-size fixture is not zoomed out
    const context = await browser.newContext({viewport: {width: 720, height: 900}, hasTouch: true, isMobile: true})
    const page = await context.newPage()
    await page.goto(base + '/test/e2e/fixture.html')
    await page.waitForTimeout(600)
    await page.evaluate(() => document.getElementById('strip')!.scrollIntoView({block: 'center'}))
    await page.waitForTimeout(300)
    const cdp = await context.newCDPSession(page)
    const touch = async (x: number, y: number, dx: number, dy: number) => {
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]})
      for (let i = 1; i <= 14; i++) {
        await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x: x + (dx * i) / 14, y: y + (dy * i) / 14}]})
        await page.waitForTimeout(16)
      }
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []})
      await page.waitForTimeout(800)
    }
    const {y} = await centreOf(page, '#strip')
    const before = await page.evaluate(() => scrollY)
    await touch(300, y, -220, 70)
    assert.equal(await page.evaluate(() => scrollY), before, 'page scrolled during a sideways drag')
    assert.ok((await page.evaluate(() => (window as any).position('strip'))) > 0.5, 'carousel did not move')
    await touch(200, y + 30, 6, -260)
    assert.ok((await page.evaluate(() => scrollY)) > before + 100, 'vertical swipe did not scroll')
    await context.close()
  })
})

describe('site.html', () => {
  it('opens a deep link to an item still loading', async () => {
    const page = await open('/public/site.html#/work/fjord')
    await page.waitForTimeout(1200)
    assert.equal(await page.evaluate(() => location.hash), '#/work/fjord')
    assert.equal(await page.textContent('[data-bind="route"]'), '/work/fjord')
    assert.deepEqual(page.errors, [])
    await page.close()
  })

  it('routes nav links and back', async () => {
    const page = await open('/public/site.html')
    await page.waitForTimeout(800)
    await page.click('a[data-link][href$="about"]')
    await page.waitForTimeout(1200)
    assert.equal(await page.evaluate(() => location.hash), '#/about')
    assert.match(await page.title(), /About/)
    await page.goBack()
    await page.waitForTimeout(1200)
    assert.notEqual(await page.evaluate(() => location.hash), '#/about')
    await page.close()
  })

  it('binds likes and the filter to channels', async () => {
    const page = await open('/public/site.html#/work')
    await page.waitForTimeout(1500)
    await page.click('#gallery .like >> nth=0')
    assert.equal(await page.textContent('[data-bind="likeCount"]'), '1')
    await page.fill('#filter', 'film')
    await page.waitForTimeout(400)
    assert.equal(await page.textContent('[data-bind="shownCount"]'), '3')
    assert.deepEqual(page.errors, [])
    await page.close()
  })

  it('tabs move with the arrow keys', async () => {
    const page = await open('/public/site.html#/about')
    await page.waitForTimeout(1200)
    await page.focus('#about [role=tab] >> nth=0')
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(400)
    const selected = await page.$$eval('#about [role=tab]', tabs => tabs.map(t => t.getAttribute('aria-selected')))
    assert.deepEqual(selected, ['false', 'true', 'false'])
    await page.close()
  })

  it('the stepper validates, reviews and completes', async () => {
    const page = await open('/public/site.html#/contact')
    await page.waitForTimeout(1200)
    const next = '#contact .holo-step-actions button:last-child'
    await page.click(next)
    await page.waitForTimeout(300)
    assert.equal(await page.textContent('#contact .holo-step-error'), 'Your name, please.')
    await page.fill('#name', 'Darik')
    await page.fill('#email', 'darik@neuralline.com')
    await page.click(next)
    await page.waitForTimeout(500)
    await page.fill('#message', 'A carousel framework')
    await page.click(next)
    await page.waitForTimeout(500)
    await page.click(next)
    await page.waitForTimeout(400)
    assert.match((await page.textContent('.toast')) || '', /Thanks, Darik/)
    assert.deepEqual(page.errors, [])
    await page.close()
  })
})
