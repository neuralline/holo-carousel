<!-- @format -->

# HOLO

```sh
  Neural Line
  Lightweight carousel for javascript and react apps
  H.O.L.O - C.A.R.O.U.S.E.L

```

> One manager for intricate of carousels

[![NPM Version][npm-image]][npm-url]
[![NPM Version][npm-download]][npm-url]
[![NPM Version][npm-size]][npm-url]

## Installation

Holo runs on [Cyre](https://www.npmjs.com/package/cyre), which is a peer
dependency: install both, and your app and Holo share one Cyre. Holo never
bundles it.

```sh
npm i cyre holo-carousel
pnpm add cyre holo-carousel
```

Types ship with the package (`holo-carousel`, `holo-carousel/lite`,
`holo-carousel/effects`).

Without a bundler, load Cyre's browser build first (it sets `window.Cyre`),
then Holo's UMD:

```html
<script src="cyre.js"></script>               <!-- window.Cyre -->
<script src="holo-carousel/dist/umd/holo.js"></script>
```

## Usage

Holo runs on [Cyre](https://github.com/neuralline/cyre) v5. Cyre belongs to
your app: start it once and keep `control`. `useHolo` adds a branch to your
Cyre tree and builds nothing until you ask.

```js
import {Cyre} from 'cyre'
import {useHolo} from 'holo-carousel'

const {cyre, control} = Cyre.init()
const holo = useHolo(cyre.branch('ui'))        // ui/holo

// from data: Holo builds the container and a slot per item
const films = holo.create(document.getElementById('films'), {
  items: movies,
  key: movie => movie.id,                       // updates reuse slots
  render: (movie, index, slot) => {
    slot.innerHTML = `<img src="${movie.poster}" alt="${movie.title}">`
  },
  effect: 'center', loop: 'infinite', controller: true
})

films.on('change', ({index, page, pages}) => {})
films.set(await fetchMovies())                  // keyed update
cyre.call('ui/holo/films/items', list)          // or from anywhere, by path

// from markup (opt-in)
holo.scan()                                      // every .holo-carousel
holo.scan(sidebar, {selector: '[data-holo]'})
```

`useHolo()` with no node starts Cyre itself if no app did, and its handle
has `control`. A plain `<script src="js/holo.js">` page (after the page's
`window.Cyre`) gets `window.useHolo`
and the v2 `window.Holo` (`Holo.INIT()` scans, as before).

### Options

Pass to `holo.create(element, options)` or `carousel.options(...)`, or as
`data-*` attributes.

| option | default | |
|---|---|---|
| `items`, `render`, `key`, `unrender` | | data mode; `render(item, index, slot)` fills a slot; `items` may be a promise |
| `effect` | `'slide'` | `slide`, `center`, `fade`, `ring`, `grid`, `list`, `coverflow`, `album`, `shuffle`, `flip`, `cube`, `zoom`, `cover`, `reveal`, `wipe`, `iris`, `kenburns` (the last eleven come with the full build; see [Size](#size)) |
| `route` | off | the position is part of the page path (`#/work/fjord`); `true` uses each slot's `data-route` or its index, a function `(item, index) => slug` names data items |
| `placeholder` | `'shimmer'` | while images or async items load: `shimmer`, `pulse`, `blur` (blur-up), `none` |
| `placeholders` | fit | skeleton slots while items load |
| `progress` | off | a bar counting down to the next auto-play move |
| `builds` | off | `[data-build]` content in the current slide comes in step by step (`data-build="left|right|zoom|fade"`) |
| `loop` | `false` | `'rewind'` jumps back at the ends, `'infinite'` wraps seamlessly (items of mixed widths too, when the strip is longer than the room plus its widest item) |
| `animate` / `duration` | off / 5000 | auto-play (pauses on hover, focus, drag, hidden tab, off screen) |
| `controller` | off | prev / next buttons, dots (`3 / 18` when they don't fit), pause |
| `step` / `slots` | page / fit | items per next / prev; items visible |
| `breakpoints` | | `{0: {slots: 1}, 768: {slots: 3, controller: 1}}`, by carousel width |
| `virtual` / `buffer` | off / 2 | only the visible items (plus buffer) in the DOM |
| `lazy` | 1 | load `data-src` images this many pages ahead |
| `hash` | | keep the position in the URL: `#<hash>=<index>` |
| `defer` | off | set up only once near the screen |
| `momentum` | on | a released drag glides on by its speed and lands on an item; off: it stops where it was let go |
| `flick` | 0.5 px/ms | release speed at the strip that counts as a flick (momentum + “at least one slide”) |
| `glide` | 10 items | cap on how many slides one fling may cross |
| `brake` | 0.005 px/ms² | deceleration after release; higher = shorter flings (`tune({deceleration})` is the same) |
| `wheel` | off | a notched mouse wheel steps (trackpad swipes work with `swipe`) |
| `drag`, `swipe`, `keyboard`, `snap`, `focus` | on | input; `snap: false` glides freely |
| `orientation` | horizontal | `'vertical'` |
| `direction` | `'auto'` | `'rtl'` runs a horizontal carousel right to left: drag, wheel, arrow keys, the prev / next buttons and the effects mirror. `'auto'` follows the page (`dir="rtl"`) |
| `autoHeight` | off | the carousel is as tall as its tallest visible item and eases between heights |
| `pinchZoom` | off | pinch, ctrl + wheel (a trackpad pinch) or double-tap zooms the current item (its `[data-zoom]` element, else its first image); one finger or the wheel pans while zoomed; moving on resets it. `true` = up to 3x, a number = that max |
| `transition` | 600 | ms (0 with reduced motion) |

### Handles

```js
// carousel
c.next() / prev() / first() / last() / goTo(i)
c.state()                 // {index, page, pages, count, slots, atStart, atEnd, path}
c.pause() / play()
c.on('change', fn)        // any of its channels; returns unsubscribe
c.set(items) / append(items) / remove(keyOrIndex) / items()
c.insert(index, items) / move(keyOrIndex, to) / update(keyOrIndex, item | fn)
c.patch(list => list.filter(...))   // any change; keyed slots are reused
c.loading(true, count?)   // skeletons while you fetch; set(items) puts the items back
c.fullscreen()            // present (Space / Enter go on)
c.options({...})          // in place, keeps subscribers and position
c.create(el, opts)        // a nested carousel: a sub-branch
c.children() / refresh() / destroy()
c.groups() / group(key)   // a grouped carousel's lanes (see Groups)

// instance
holo.create / scan / get(idOrPath) / all()
holo.link(main, thumbs, 'follow' | 'sync')
holo.tabs / stepper / pager(el, opts)     // presets, below
holo.state / bind / list / bindInput / bindAll
holo.on(id, fn) / call(id, payload)      // channels on the holo branch
holo.router(opts) / navigate(route) / route()
holo.refresh() / destroy()
```

`key` is a property name (`key: 'id'`) or a function.

### Sizes

A `slide` carousel whose items have different widths (or heights, when
vertical) measures each one: the strip moves by the real offsets, a drag
lands on the nearest item start, and the last page stops flush with the
end. Mixed sizes are for `slide` only, and such a carousel does not wrap.

Data carousels draw at most once a frame: several `set` / `patch` calls in
one tick become one render, and a slot is filled again only when its item
changed. A carousel re-measures when the element it takes its room from
resizes - also when it was made out of the page or moved to another
parent later. A markup carousel watches its container and
refreshes when slides are added or removed.

## Presets

Tabs, steppers and full-page pagers are carousels with other defaults
and their own controls and ARIA.

```js
// a wrapper holding a .holo-carousel of panels; tab labels come from each
// panel's data-title or heading (or label(item, index) in data mode)
const about = holo.tabs(document.getElementById('about'))
// role=tablist / tab / tabpanel, roving tabindex, arrow keys, Home / End

const form = holo.stepper(document.getElementById('contact'), {
  // true to go on, or a message to show (may be async)
  validate: (index, panel) => index !== 0 || name.get() ? true : 'Your name, please.',
  onComplete: () => send()
})
form.on('invalid', ({index, message}) => {})

const site = holo.pager(document.getElementById('site'), {route: true})   // one page per screen, wheel / keys
const backdrop = site.create(document.getElementById('hero'), {effect: 'kenburns', animate: 1})   // nested
```

## Bindings

State lives in Cyre channels on the holo's branch. Elements bind to a
channel and follow it; set the value anywhere and every element showing
it changes. Ids are relative to the holo (`likes` is `ui/holo/likes`); a
leading `/` means a channel of the root Cyre.

```js
const likes = holo.state('likes', 0)       // {get, set, update, on, path}
likes.update(n => n + 1)

holo.bind('#count', 'likes')                       // text
holo.bind('#badge', 'likes', (n, el) => { el.hidden = !n })   // or do it yourself
holo.list('#tags', 'tags', {key: 'id', render: (tag, i, el) => { el.textContent = tag.name }, empty: 'None yet'})
holo.bindInput('#filter', 'query')                 // two way; checkbox and select too
holo.on('query', q => gallery.set(projects.filter(p => p.name.includes(q))))

// or in markup: <span data-bind="likes"></span> <input data-bind-input="form.name">
holo.bindAll()
```

## Routing

```js
holo.router({mode: 'hash', titles: true})   // or mode: 'history', base: '/app/'
```

A routed carousel puts its position in the path, and a routed carousel
nested in a routed slot adds a segment: `#/work/fjord` is the `work` page
of the site pager and the `fjord` item of the gallery inside it. Opening
that address moves both; back and forward move them again; links with
`data-link` navigate without reloading. A deep link to an item that is
still loading waits for it. `holo.navigate('/about')` from code.

## Size

```js
import {useHolo} from 'holo-carousel'              // everything, effects registered
import {useHolo} from 'holo-carousel/lite'         // slide, center, fade, ring
import {registerEffect, coverflow, album} from 'holo-carousel/effects'
registerEffect(coverflow, album)                   // just the ones you use
```

Write your own with the same shape: `{name, style(distance, index, context)
=> {transform, opacity, zIndex, clipPath}, perspective?, margin?, wraps?}`.

Honest numbers (minified / gzip, Cyre not included): lite about 75 KB / 25 KB,
full about 79 KB / 26.5 KB. The effects are small; the core (gestures,
motion, virtual windows, routing, bindings) is the weight.

## Tests

```sh
pnpm test        # model, maths, headless carousels
pnpm test:e2e    # in Chrome: trackpad flings, drags, nested hand-off, touch, the demo site
```

The browser tests build `public/js/holo.js` (and the demo pages' own
`public/js/cyre.js`) and run it against
`test/e2e/fixture.html` (fixed sizes, no images) and `public/site.html`,
in the Chrome you have installed (`HOLO_CHROME=/path/to/chrome` for
another).

## Examples

`public/examples.html` has a live demo per feature, each with the exact
code that runs it and a Copy button: slide, infinite loop with auto-play,
mixed widths looping, every effect on one carousel, groups, right to left,
auto height, pinch to zoom and vertical. Build first (`pnpm build`), then
open it from `public/`.

## Demo site

`public/site.html` is a full-screen feature tour built only from holos: a
routed pager for each chapter, a Ken Burns backdrop on the intro, a data
gallery (async Cyre channel, deep links, filter and pinned likes), tabs that
explain motion and bindings, and a validated stepper with live review.

### Gestures

Mouse, touch, pen and trackpad all go through one recogniser. A move is
a drag only when it runs along the carousel (within 35° of its axis);
across it the page scrolls, or a parent carousel on that axis takes it.
A released drag glides on from where it was let go, slowing down
evenly - a faster flick goes further, and the move takes longer the
further it goes. A trackpad swipe moves the carousel with every event,
including the system's momentum after the fingers lift, and lands on
the nearest item when it stops (the next one, if it was heading there). Each gesture is a channel:

```js
c.on('swipe', ({direction, distance, velocity, moved}) => {})   // moved: false when the page had it
c.on('tap', ({index}) => {})
c.on('double-tap', ({index}) => {})
c.on('long-press', ({index}) => {})
```

### Motion

Every move is animated in one place, frame by frame. A released drag
or trackpad swipe lands on a curve that leaves at exactly the speed it
was let go and arrives at rest; buttons, keys and auto-play ease out.
Pressing a moving carousel catches it where it is. Changing `effect`
morphs each item from its old place to its new one (View Transitions;
a crossfade where they aren't available).

### Effects

`slide` and `center` move a strip; `fade` crossfades; `ring` turns a 3D
ring. `coverflow`, `album` (a pile of photos at slight angles), `shuffle`
(a deck: the top card swings out and back underneath), `flip`, `cube` and
`zoom` are stage effects: Holo animates the position frame by frame and
draws each item from its distance to it, so every card follows its own
path - and a drag scrubs through the same motion. `cover`, `reveal`,
`wipe`, `iris` and `kenburns` are presentation transitions; with
`progress`, `builds` and `fullscreen()` a carousel is a slide deck.

`grid` and `list` (3.5) are not strips: every item is shown, in wrapping
rows or stacked, laid out by the page - nothing moves, so drag, swipe,
wheel and keys are off. Size them with CSS custom properties on the
carousel: `--holo-grid-min` (column width, default `160px`) and
`--holo-gap` (default `12px`, `8px` in a list); `data-effect` on the
carousel names the layout for your own styles. Because they are effects,
one carousel can be a shelf, a grid and a list, and switching with
`c.options({effect: 'grid'})` morphs every item to its new place:

```js
const projects = holo.create(el, {items, key: 'id', render, effect: 'slide', loop: 'infinite'})
projects.options({effect: 'grid'})   // posters glide from the shelf into rows
projects.options({effect: 'list'})   // and on into a list
```

### Groups

A data carousel with a `group` option (3.6) sorts its items into groups -
acts, seasons, categories - and shows each as a lane: a heading over a
carousel of its own that drags, flicks and pages on its own. The look is
the parent's: every lane takes its `effect` (and `slots`, `loop`, ...), and
`c.options({effect})` changes them all in one morph - items fly between a
row per group, a grid per group and a list per group, and an item whose
group changed flies to its new lane.

```js
const scenes = holo.create(el, {
  items, key: 'id', render,
  group: scene => scene.act,                       // the group's key
  groupLabel: (act, list) => `${act} · ${list.length} scenes`,
  // or draw the heading yourself: renderGroup: (act, list, head) => { ... }
  groups: 8,                                       // the most groups it shows
  effect: 'slide'
})
scenes.group('Act 2').next()                       // one lane moves
scenes.on('change', c => c.group)                  // which lane moved
scenes.groups()                                    // [{key, handle}] in order
scenes.options({effect: 'grid'})                   // every lane, one morph
```

The lanes are nested carousels (`holo/<id>/<id>-<n>`), made with the
carousel: `groups` of them (default 8), so an app that locks Cyre after
boot can still regroup. Groups take lanes in the order they first appear;
a group keeps its lane - and where it is in it - while it stays; more
groups than lanes share the last lane (Holo warns). `render` and `key`
get each item's index within its lane. Markup: `li.holo-group` (hidden
while unused) holds `.holo-group-head` and the lane `.holo-lane`; space
the groups with `--holo-group-gap` (default `16px`).

### Which option turns on which input

| input | option | notes |
|---|---|---|
| mouse drag | `drag` | |
| touch / pen drag | `swipe` | |
| trackpad swipe, horizontal carousel | `swipe` or `wheel` | a vertical trackpad scroll over it stays the page's |
| trackpad swipe, vertical carousel | `wheel` | off by default: it would trap the page's own scrolling (the pager turns it on) |
| notched mouse wheel | `wheel` | one step per notch burst |
| arrow keys | `keyboard` | when the carousel or a slide has focus |

### Tuning

The gesture numbers are one set for the page, read on every gesture:

```js
import {tune} from 'holo-carousel'
tune({deceleration: 0.002})   // glides go further
tune({wheelFling: 6})         // gentler trackpad swipes count as flings
tune()                        // read them all
tune('reset')                 // back to the defaults
```

Per carousel, use the short names or the full `gesture` map:

```js
// stickier gallery: harder to fling, shorter travel
holo.create(el, { flick: 0.45, glide: 12, brake: 0.006 })

// page-wide, then markup: data-flick="0.45" data-glide="12"
tune({ flick: 0.4, maxGlide: 20, deceleration: 0.005 })

holo.create(el, { gesture: { slopTouch: 8, axisLock: 30 } })
```

Release speed is a **weighted regression** over recent touch samples (not
just first→last). Settling uses **smootherstep** / exponential ease, not
linear motion.

Common ones: `deceleration` (0.005 px/ms² default, lower glides further),
`wheelFling` (16 px per event the fingers must lift at for a fling; slower,
Holo follows the gesture to its end like a drag), `wheelDecay` (5 smoothly
shrinking events mean the fingers lifted), `wheelIdle` (110 ms), `flick` (0.45 px/ms, release
momentum only above this), `springBack` (560 ms elastic settle at an end:
a critically damped spring that keeps the release speed), `resistance` (0.3 rubber at the ends), `axisLock` (35°),
`axisBias` (1.15, decides diagonals sooner), `axisCross` (55°),
`longPress` (500 ms). The full list is `GESTURE` in
`src/config/holo-config.ts`. `refreshDebounce` and `wheelThrottle` are read
when a carousel is created, so set those first. `holo.tune` and
`Holo.tune` are the same function.

Turning `wheel` on for a **vertical** carousel captures trackpad and
wheel scrolling over it — use that for full-page pagers only, not for
ordinary vertical lists beside the page.

A carousel with `null` for its element is headless: the same model and
channels with no DOM, for tests and servers.

## Holo examples

[holo-carousel ES6](https://holo-carousel.firebaseapp.com/)

## Made with Holo git projects

[Holo carousel](https://github.com/neuralline/holo-carousel)

## Project pipeline

- 1.0.0 initial commit

  - adding functionality
  - useability
  - compatibility with varies mvc

- 1.2.0 optimization

  - increase performance
  - testability
  - reliability

## Meta

Distributed under the MIT license. See `LICENSE` for more information.

[https://github.com/NeuralLine](https://github.com/NeuralLine)

## Contributing

1. Fork it (<https://www.npmjs.com/package/holo-carousel/fork>)

```sh

Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0
Lightweight carousel for javascript and react apps 2019

```

<!-- Markdown link & img dfn's -->

[npm-image]: https://img.shields.io/npm/v/holo-carousel.svg?style=flat
[npm-url]: https://www.npmjs.com/package/holo-carousel
[npm-download]: https://img.shields.io/npm/dt/holo-carousel.svg?style=flat
[npm-size]: https://img.shields.io/bundlephobia/min/holo-carousel.svg?style=flat
