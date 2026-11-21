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

Holo 3 runs on [Cyre](https://github.com/neuralline/cyre) v5. Cyre belongs to
your app: start it once at your entry and keep `control`; Holo only adds a
`holo` branch (each carousel gets `holo/<id>`).

```js
import {Cyre} from 'cyre'
import Holo from 'holo-carousel'

const {cyre, control} = Cyre.init()

Holo.INIT() // builds every .holo-carousel on the page
// or: Holo.INIT({className: 'my-carousel', cyre: cyre.branch('ui')})
```

A plain `<script src="js/holo.js">` page needs nothing else: that bundle
carries its own Cyre and starts it.

```html
<carousel class="holo-carousel" data-animate="1" data-duration="4000" data-controller="1">
  <ul class="holo-container">
    <li class="holo"><img src="img/1.jpg" alt="" /></li>
    ...
  </ul>
</carousel>
```

### Options

Pass to `Holo.BUILD(element, options)` / `Holo.carousel(id, options)`, or as
`data-*` attributes.

| option | default | |
|---|---|---|
| `animate` | 0 | auto-play (pauses on hover, focus, drag, hidden tab, off screen) |
| `duration` | 5000 | auto-play interval, ms |
| `controller` | 0 | prev / next buttons, dots (a `3 / 18` counter when they don't fit), pause button |
| `loop` | 0 | next on the last item goes to the first, and back |
| `step` | 0 | items per next / prev (0 = a page) |
| `slots` | 0 | items visible at once (0 = as many as fit) |
| `wheel` | 0 | mouse wheel / trackpad, one step per gesture |
| `drag` / `swipe` | 1 | mouse drag / touch and pen swipe |
| `snap` | 1 | land on whole items (0 = free glide) |
| `keyboard` | 1 | arrows, Home, End, PageUp / PageDown when focused |
| `orientation` | 0 | 1 = vertical |
| `transition` | 600 | slide transition, ms (0 with reduced motion) |

### API

```js
Holo.next(id) / prev / first / last
Holo.goTo(id, index)
Holo.state(id)            // {index, page, pages, count, slots, atStart, atEnd}
Holo.pause(id) / play(id)
Holo.on(id, Holo.EVENTS.CHANGE, state => ...)
Holo.refresh()            // re-measure every carousel
Holo.remove(id) / cleanup()
```

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
