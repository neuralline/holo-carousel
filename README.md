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
| `effect` | `'slide'` | `slide`, `center`, `fade`, `ring`, `coverflow`, `album`, `shuffle`, `flip`, `cube`, `zoom`, `cover`, `reveal`, `wipe`, `iris`, `kenburns` |
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
c.loading(true, count?)   // skeletons while you fetch; set(items) puts the items back
c.fullscreen()            // present (Space / Enter go on)
c.options({...})          // in place, keeps subscribers and position
c.create(el, opts)        // a nested carousel: a sub-branch
c.children() / refresh() / destroy()

// instance
holo.create / scan / get(idOrPath) / all()
holo.link(main, thumbs, 'follow' | 'sync')
holo.refresh() / destroy()
```

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
