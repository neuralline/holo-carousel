import i from "cyre";
class Y {
  /*
  
       H.O.L.O -  C.L.I
       constrictor and default values
  
       */
  constructor() {
    this.id = 0, this.virtual = {
      id: this.id || 0,
      carousel: {},
      container: {},
      io: {},
      title: null,
      description: null,
      duration: 600,
      transitionTiming: "cubic- bezier(0.215, 0.61, 0.355, 1)",
      transformX: 0,
      transformY: 0,
      transformZ: 0,
      numberOfSlots: 0,
      endOfSlide: 0,
      item: {
        max: 8
      }
    }, this.shadow = {
      carousel: {},
      container: {}
    }, this.virtual.io = {
      id: this.id || 0,
      enabled: 1,
      wheel: 0,
      controller: 0,
      drag: 1,
      swipe: 1,
      snap: 3,
      focus: 1,
      animate: 1,
      animateDirection: 1,
      duration: 0,
      loop: 200,
      orientation: 0,
      active: !0,
      onClick: !0,
      onDoubleClick: !0
    }, this.style = {};
  }
}
class H extends Y {
  /*
  
       H.O.L.O - A.U.R.E`
       aka holo-create-carousel
  
       */
  constructor(e, n = {}) {
    super(), e || console.error("@Holo: Oh putain` no slide"), this.id = e.id || "OhPutain" + performance.now(), this.shadow.carousel = e, this.shadow.container = this.shadow.carousel.getElementsByClassName("holo-container")[0] || 0, this.shadow.container ? this.initializeHolo() : console.error("@Holo : Oh Putain` holo-container not found : ", this.id);
  }
  initializeHolo() {
    if (this.shadow.carousel.width = this.shadow.carousel.clientWidth || 0, !this.shadow.container.children.length)
      return this.virtual.noOfChildren = 0, console.error("@Holo: Oh Putain`  holo-container is empty  : ", this.id);
    this.virtual.id = this.id, this.virtual.noOfChildren = this.shadow.container.children.length, this.virtual.carousel.width = this.shadow.container.clientWidth, this.virtual.carousel.height = this.shadow.container.clientHeight, this.virtual.startNumber = 0, this.virtual.endOfSlidePosition = 0, this.virtual.item.min = 1;
  }
  get getVirtual() {
    return { ...this.virtual };
  }
  get getShadow() {
    return this.shadow;
  }
  get getState() {
    return { virtual: this.getVirtual, shadow: this.getShadow };
  }
  get getDimensions() {
    return {
      car: {
        w: this.shadow.carousel.width,
        h: this.shadow.carousel.height
      },
      con: {
        w: this.shadow.container.width,
        h: this.shadow.container.height,
        x: this.shadow.transformX,
        y: this.shadow.transformY,
        z: this.shadow.transformZ
      }
    };
  }
  //update _state object
  set setState(e) {
    if (!e)
      return !1;
    this.virtual = { ...this.virtual, ...e }, this.shadow.container.style.transform = `translate3d(${this.virtual.transformX}px, ${this.virtual.transformY}px, ${this.virtual.transformZ}px)`;
  }
  //update _state object
  set setDimension(e) {
    if (!e)
      return !1;
    this.virtual = { ...this.virtual, ...e, ...e.io }, this.virtual.io.orientation || (this.shadow.carousel.style.width = this.virtual.carousel.width + "px"), this.virtual.io.orientation && (this.shadow.carousel.style.height = this.virtual.carousel.height + "px");
  }
  /**
   *
   * @param {number} on 1 = add style 0 = remove style
   */
  set updateStyle(e = 0) {
    e ? (this.shadow.container.style.transitionDuration = this.virtual.duration + "ms", this.shadow.container.style.transitionTimingFunction = this.virtual.transitionTiming) : (this.shadow.container.style.transitionDuration = "0ms", this.shadow.container.style.transitionTimingFunction = "linear");
  }
}
const a = {}, m = (t, e) => Math.round(t / e) * e, _ = (t) => t < 250 ? 1 : 0, P = (t, e) => t / e, A = (t) => {
  if (!t)
    return 0;
  const e = {};
  e.width = t.offsetWidth, e.height = t.offsetHeight;
  const n = window.getComputedStyle(t, null);
  return e.width += parseInt(n.marginLeft) + parseInt(n.marginRight), e.height += parseInt(n.marginTop) + parseInt(n.marginBottom), e;
}, b = ([t, e]) => {
  e.transformX = -Math.abs(t.offsetLeft), i.call("SNAP" + e.id, e), t.classList.add("active");
}, C = (t) => {
  if (t.endOfSlide !== 1)
    return t.transformX += t.carousel.width || 0, t.transformY += t.carousel.height || 0, i.call("SNAP" + t.id, t);
}, D = (t) => {
  if (t.endOfSlide !== -1)
    return t.transformX -= t.carousel.width || 0, t.transformY -= t.carousel.height || 0, i.call("SNAP" + t.id, t);
}, E = (t) => (t.transformX = 0, t.transformY = 0, t.endOfSlide = 1, i.call("SNAP" + t.id, t)), L = (t) => (t.transformX = t.endOfSlidePosition, t.transformY = t.endOfSlidePosition, t.endOfSlide = -1, i.call("SNAP" + t.id, t)), T = (t) => (console.log("animating", t), t.endOfSlide === -1 ? i.call("firstSlide" + t.id, t) : i.call("nxtSlide" + t.id, t)), x = (t) => t.endOfSlide === 1 ? i.call("lastSlide" + t.id, t) : i.call("prvSlide" + t.id, t), u = (t, e) => {
  t.preventDefault();
  const n = a[e].getVirtual;
  t.deltaY < 0 ? i.call("prvSlide" + n.id, n) : t.deltaY > 0 && i.call("nxtSlide" + n.id, n);
}, k = (t) => (t.transformX = t.io.snap ? m(t.transformX, t.item.width) : t.transformX, t.transformY = 0, t.transformX >= 0 ? (t.transformX = 0, t.endOfSlide = 1) : t.transformX <= t.endOfSlidePosition ? (t.transformX = t.endOfSlidePosition, t.endOfSlide = -1) : t.endOfSlide = 0, t), N = (t) => (t.transformY = 0, t.transformX >= 0 ? t.transformX = 0 : t.transformX <= t.endOfSlidePosition && (t.transformX = t.endOfSlidePosition), t), p = (t) => (t.transformY = t.io.snap ? m(t.transformY, t.item.height) : t.transformY, t.transformX = 0, t.transformY >= 0 ? (t.transformY = 0, t.endOfSlide = 1) : t.transformY <= t.endOfSlidePosition ? (t.transformY = t.endOfSlidePosition, t.endOfSlide = -1) : t.endOfSlide = 0, t);
class W {
  /*
  
       H.O.L.O TOUCH EVENTS HANDLER
  
      */
  constructor() {
    this.positionX = 0, this.positionY = 0, this.pressed = 0, this.virtual = {}, this.multiplier = 1.482, this.touch = {
      start: "mousedown",
      move: "mousemove",
      end: "mouseup",
      enter: "mouseenter"
    }, this.targetHoloComponent = 0;
  }
  //register if touch/click has occurred
  _touchStart(e = window.event, n = 0) {
    return !n || this.pressed ? console.error("Holo touch : not my business") : (this.TouchStartTimeStamp = performance.now(), this.virtual = a[n].getVirtual, this.pressed = 1, this.positionX = e.clientX || e.touches[0].clientX, this.positionY = e.clientY || e.touches[0].clientY, this.id = this.virtual.id, this.currentX = e.clientX || e.touches[0].clientX, this.currentY = e.clientY || e.touches[0].clientY, this.snapShotWidth = this.virtual.transformX || 0, this.snapShotHeight = this.virtual.transformY || 0, this.virtual.io.orientation ? (this._dragScrollVertical(e), e.preventDefault()) : (this._dragScrollHorizontal(e), e.preventDefault()), a[this.id].updateStyle = 0);
  }
  /*
         @dragScroll : handles horizontal drag touch moves
  */
  _dragScrollHorizontal(e) {
    if (!this.pressed)
      return { ok: !1, data: "not active" };
    this.distance = this.positionX - this.currentX, this.virtual.transformX = this.snapShotWidth - this.distance * this.multiplier || 0, a[this.id].setState = N(this.virtual), requestAnimationFrame(this._dragScrollHorizontal.bind(this));
  }
  //@dragScroll : handles vertical drag touch moves
  _dragScrollVertical(e) {
    if (!this.pressed)
      return { ok: !1, data: "not active" };
    this.distance = this.positionY - this.currentY, this.virtual.transformY = this.snapShotHeight - this.distance * this.multiplier || 0, a[this.id].setState = { ...p(this.virtual) }, requestAnimationFrame(this._dragScrollVertical.bind(this));
  }
  //Register event/mouse position when touch/drag ends
  _touchEnd(e) {
    if (!this.pressed)
      return { ok: !1, data: "not active" };
    const n = performance.now();
    e.preventDefault(), this.pressed = 0;
    const l = n - this.TouchStartTimeStamp, c = P(this.distance, l);
    if (c > 1.2)
      i.call("nxtSlide" + this.id, this.virtual);
    else if (c < -1.2)
      i.call("prvSlide" + this.id, this.virtual);
    else if (_(l))
      this.focus(e);
    else
      return i.call("SNAP" + this.id, this.virtual);
  }
  //highlight active/ selected slide
  focus(e) {
    return e.target.closest("li.holo") ? (this.targetHoloComponent && this.targetHoloComponent.classList.remove("active"), this.targetHoloComponent = e.target.closest("li.holo"), i.call("activate" + this.id, [this.targetHoloComponent, this.virtual])) : !1;
  }
}
const d = new W(), I = (t, e) => {
  if (!t)
    return console.error("@Holo : Major malfunctions");
  i.action([
    {
      id: "Animate" + t.id,
      type: t.io.animateDirection > 0 ? "AnimateForward" : "AnimateBackward",
      payload: t,
      interval: t.io.duration,
      repeat: t.io.loop,
      log: !0
    },
    {
      id: "SNAP" + t.id,
      type: "SNAP",
      payload: t
    },
    {
      id: "prvSlide" + t.id,
      type: "prvSlide",
      payload: t
    },
    {
      id: "nxtSlide" + t.id,
      type: "nxtSlide",
      payload: t
    },
    {
      id: "lastSlide" + t.id,
      type: "lastSlide",
      payload: t
    },
    {
      id: "firstSlide" + t.id,
      type: "firstSlide",
      payload: t
    },
    {
      id: "activate" + t.id,
      type: "activate",
      payload: t
    }
  ]), t.io.enabled && (t.io.drag && e.container.addEventListener("mousedown", (n) => {
    n.preventDefault(), d._touchStart(n, t.id);
  }), t.io.drag && e.container.addEventListener("touchstart", (n) => {
    n.preventDefault(), d._touchStart(n, t.id);
  }), t.io.wheel && e.carousel.addEventListener("wheel", (n) => {
    u(n, t.id);
  }), t.io.animate && i.call("Animate" + t.id, t), e.container.addEventListener(
    //when window resizes do something
    "resize",
    () => {
      i.call("refresh carousel", { virtual: t, shadow: e });
    },
    !1
  )), i.call("refresh carousel", { virtual: t, shadow: e });
}, S = (t, e) => {
  a[t.id] = new H(t, e), I(a[t.id].getVirtual, a[t.id].getShadow);
}, z = (t) => {
  console.log("@holo holo auto activated :", t);
  const e = document.getElementsByClassName(t);
  if (e.length)
    for (let n of e)
      S(n, {});
  else
    return console.log("@Holo : carousel structure not found");
}, M = () => (document.addEventListener("mousemove", (t) => {
  d.pressed && (d.currentX = t.clientX, d.currentY = t.clientY);
}), document.addEventListener("mouseup", (t) => {
  t.preventDefault(), d.pressed && d._touchEnd(t);
}), document.addEventListener("touchmove", (t) => {
  d.pressed && (d.currentX = t.touches[0].clientX, d.currentY = t.touches[0].clientY);
}), document.addEventListener("touchend", (t) => {
  d.pressed && d._touchEnd(t);
}), i.on("AnimateForward", T), i.on("AnimateBackward", x), i.on("nxtSlide", D), i.on("prvSlide", C), i.on("firstSlide", E), i.on("lastSlide", L), i.on("bringToFocus", d.focus), i.on("wheeler", u), i.on("activate", b), !0), V = (() => {
  i.on("refresh carousel", (s) => {
    const { virtual: o, shadow: r } = s;
    if (!o.id)
      return console.error("Holo carousel refresh error ", o.id);
    r.container.setAttribute("style", "");
    const { height: h, width: g } = A(r.container.children[0]);
    o.item.height = h, o.item.width = g, o.numberOfSlots = n(r.carousel.parentNode.clientWidth, o.item.width, o.item.max) || 1;
    const w = o.numberOfSlots * o.item.width, O = r.carousel.clientWidth, X = r.container.children.length * o.item.width, y = r.container.clientWidth || X;
    return o.carousel.width = w || O, o.carousel.height = o.item.height || r.carousel.clientHeight, o.container.width = o.io.orientation ? r.carousel.width : y, o.container.height = r.container.clientHeight || o.item.height || 0, o.endOfSlidePosition = o.io.orientation ? -Math.abs(o.container.height - o.carousel.height) : -Math.abs(o.container.width - o.carousel.width), a[o.id].setDimension = { ...o }, i.call("snap to position", o);
  }), i.on("SNAP", (s) => s.id ? (a[s.id].updateStyle = 1, s = s.io.orientation ? p(s) : k(s), a[s.id].setState = { ...s }) : console.error("Holo snap error"));
  const t = (s, o = {}) => {
    const r = a[s].virtual;
    for (const h in o)
      r.io[h] && (r.io[h] = o[h]);
    return { ok: !0, data: r.io };
  }, e = (s) => a[s].getDimensions, n = (s, o, r) => {
    let h = Math.floor(s / o);
    return r && h > r ? r || 1 : h || 1;
  }, l = (s) => {
    console.log("shaking");
  }, c = (s = "holo-carousel") => {
    console.log("%c HOLO - Initiating holo v2.3.4 ", "background: #022d5f; color: white; display: block;"), M(), i.action([
      { id: "refresh screen", log: !0 },
      //adjust width
      { id: "refresh carousel" },
      { id: "snap to position", type: "SNAP" }
    ]), i.on("SHAKE", l), i.on("refresh screen", f);
  };
  document.addEventListener("DOMContentLoaded", () => {
  }, !1);
  const f = () => {
    for (let s in a)
      console.log("@holo refreshing : ", s), i.call("refresh carousel", a[s].getState);
  };
  return window.addEventListener(
    "resize",
    () => {
      i.call("refresh screen");
    },
    !1
  ), window.onload = () => {
  }, {
    TOUCH: d,
    INIT: c,
    BUILD: S,
    AUTO: z,
    carousel: t,
    refresh: f,
    dimensions: e
  };
})();
export {
  V as default
};
