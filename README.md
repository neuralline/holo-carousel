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

```sh
npm i holo-carousel
yarn add holo-carousel
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
has `control`. A plain `<script src="js/holo.js">` page gets `window.useHolo`
and the v2 `window.Holo` (`Holo.INIT()` scans, as before).

### Options

Pass to `holo.create(element, options)` or `carousel.options(...)`, or as
`data-*` attributes.

| option | default | |
|---|---|---|
| `items`, `render`, `key`, `unrender` | | data mode; `render(item, index, slot)` fills a slot; `items` may be a promise |
| `effect` | `'slide'` | `slide`, `center`, `fade`, `ring`, `coverflow`, `album`, `shuffle`, `flip`, `cube`, `zoom`, `cover`, `reveal`, `wipe`, `iris`, `kenburns` (the last eleven come with the full build; see [Size](#size)) |
| `route` | off | the position is part of the page path (`#/work/fjord`); `true` uses each slot's `data-route` or its index, a function `(item, index) => slug` names data items |
| `placeholder` | `'shimmer'` | while images or async items load: `shimmer`, `pulse`, `blur` (blur-up), `none` |
| `placeholders` | fit | skeleton slots while items load |
| `progress` | off | a bar counting down to the next auto-play move |
| `builds` | off | `[data-build]` content in the current slide comes in step by step (`data-build="left|right|zoom|fade"`) |
| `loop` | `false` | `'rewind'` jumps back at the ends, `'infinite'` wraps seamlessly |
| `animate` / `duration` | off / 5000 | auto-play (pauses on hover, focus, drag, hidden tab, off screen) |
| `controller` | off | prev / next buttons, dots (`3 / 18` when they don't fit), pause |
| `step` / `slots` | page / fit | items per next / prev; items visible |
| `breakpoints` | | `{0: {slots: 1}, 768: {slots: 3, controller: 1}}`, by carousel width |
| `virtual` / `buffer` | off / 2 | only the visible items (plus buffer) in the DOM |
| `lazy` | 1 | load `data-src` images this many pages ahead |
| `hash` | | keep the position in the URL: `#<hash>=<index>` |
| `defer` | off | set up only once near the screen |
| `momentum` | on | a released drag glides on by its speed and lands on an item; off: it stops where it was let go |
| `wheel` | off | a notched mouse wheel steps (trackpad swipes work with `swipe`) |
| `drag`, `swipe`, `keyboard`, `snap`, `focus` | on | input; `snap: false` glides freely |
| `orientation` | horizontal | `'vertical'` |
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
one tick become one render. A markup carousel watches its container and
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

The browser tests build `public/js/holo.js` and run it against
`test/e2e/fixture.html` (fixed sizes, no images) and `public/site.html`,
in the Chrome you have installed (`HOLO_CHROME=/path/to/chrome` for
another).

## Demo site

`public/site.html` is a small studio site built only from holos: a routed
pager for the pages, a Ken Burns backdrop nested in the first, a gallery
of mixed card widths loaded from a Cyre channel with a route per project,
likes and a filter bound to channels, tabs and a validated stepper.

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

Common ones: `deceleration` (0.0035 px/ms², lower glides further),
`wheelFling` (8 px per event), `wheelDecay` (3 shrinking events mean the
fingers lifted), `wheelIdle` (110 ms), `flick` (0.35 px/ms), `axisLock`
(35°), `longPress` (500 ms). The full list is `GESTURE` in
`src/config/holo-config.ts`. `refreshDebounce` and `wheelThrottle` are read
when a carousel is created, so set those first. `holo.tune` and
`Holo.tune` are the same function.

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
