const t={insert:(t,e)=>{const i={};for(const s in t)i[s]=!!e[s]&&e[s](t[s]),i[s].ok||console.error(i[s].message),i[s]=i[s].data;return{ok:!0,data:i}},update:(t,e)=>{const i={};for(const s in t)i[s]=!!e[s]&&e[s](t[s]),i[s].ok||console.error(i[s].message),i[s]=i[s].data;return{ok:!0,data:i}}},e={id:(t=0)=>"string"!=typeof t?{ok:!1,data:null,message:`@Cyre : '${t}' action.id is mandatory and must be a string`}:{ok:!0,data:t},type:(t=null)=>"string"==typeof t?{ok:!0,data:t}:{ok:!1,data:null,message:`@Cyre : '${t}' action.type is mandatory and must be a string`},payload:(t=null)=>({ok:!0,data:t}),interval:(t=0)=>Number.isInteger(t)?{ok:!0,data:t}:{ok:!1,attribute:0,message:`@Cyre : '${t}' invalid action.interval value`},repeat:(t=0)=>Number.isInteger(t)?{ok:!0,data:t}:{ok:!1,attribute:0,message:`@Cyre : '${t}' invalid action.repeat value`},group:(t=null)=>"string"==typeof t?{ok:!0,data:t}:{ok:!1,data:null,message:`@Cyre : '${t}' invalid action.group value`},callback:(t=null)=>"string"==typeof t?{ok:!0,data:t}:{ok:!1,data:null,message:`@Cyre : '${t}' invalid action.callback value`},log:(t=!1)=>"boolean"==typeof t?{ok:!0,data:t}:{ok:!1,attribute:!1,message:`@Cyre : '${t}' invalid action.log value`},middleware:(t=null)=>"string"==typeof t?{ok:!0,data:t}:{ok:!1,data:null,message:`@Cyre : '${t}' invalid action.middleware value`},at:t=>({ok:!1,data:t,message:`@Cyre : '${t}'  action.at is in experimental state`})};const i=new class{constructor(t="",e=0){this.id=t,this.interval=e||16,this.events={},this.timestamp=0,this.timeline=new Set,this.waitingList=new Set,this.group=[],this.party={},this.precision=17,this.recuperating=0,this.error=0,console.log("%c Q0.0U0.0A0.0N0.0T0.0U0.0M0 - I0.0N0.0C0.0E0.0P0.0T0.0I0.0O0.0N0.0S0-- ","background: purple; color: white; display: block;"),this._quartz()}_log(t="",e=0){return e?console.log(t):console.log("!log into something else ",t)}_wait(t=null){for(let t of this.waitingList)this.events[this.party[t].type]?(this.waitingList.delete(t),this._initiate(t)):console.log("@wait list nop")}_emit(t,e,i,s=0){for(const s of this.events[t])s(e,i)}_recuperator(t={},e=0){return t.data=t.ok?t.data.sort((t,e)=>e-t).reverse():[e],t.data=t.data[0]||t.data[1]||0,t}_quartz(){if(performance.now()-this.timestamp>=this.interval){this.timestamp=performance.now();const t=this.timeline.size?this._processingUnit(this.timeline,this.interval):{ok:!1,data:[]};this.interval=this._recuperator(t,this.interval).data}this.recuperating=requestAnimationFrame(this._quartz.bind(this))}_processingUnit(t,e){return new Promise(i=>{let s={ok:!0,data:[],id:[]};for(const a of t)this.party[a].timeout-=e,s.data.push(this.party[a].timeout),s.id.push(a),e>=this.party[a].timeout&&this._action(a),i(s)})}_addToTimeline(t){return{ok:!0,data:this.timeline.add(t)}}_taskComplete(t){return{ok:!0,done:this.timeline.delete(t)}}_repeatAction(t){return this.party[t].timeout=this.party[t].interval,{ok:!0,done:!1,data:--this.party[t].repeat}}_action(t){return this._emit(this.party[t].type,this.party[t].payload,this.party[t].repeat>0?this._repeatAction(t):this._taskComplete(t),this.party[t].group)}_initiate(t){return 0===this.party[t].timeout?this._action(t):this._addToTimeline(t)}_dispatch(t,e){this.events[e]?this._initiate(t):this.waitingList.add(t)}_createChannel(e,i){const s=t[this.party[e.id]?"update":"insert"](e,i);return s.ok?this.party[e.id]=s.data:console.log("@createAction : major malfunctions ",e.id),this.party[e.id].timeout=this.party[e.id].interval||0,{ok:!0,data:e}}off(t){for(let e in this.events)return this.events[e].has(t)?{ok:!0,data:this.events[e].delete(t)}:{ok:!1,data:"Nothing to kick"}}list(){for(let t in this.events)for(let e of this.events[t])this._log(e.name,1)}clr(){return this.timeline.clear()}pause(t){return!!this.timeline.has(t)&&this.timeline.delete(t)}on(t,e,i=[]){return new Promise((i,s)=>{"function"==typeof e?i({ok:!0,data:this.events[t]?this.events[t].add([e]):(this.events[t]=new Set([e]),this._wait(t))}):s({ok:!1,data:"invalid function",message:console.log(t,e)})})}type(t,e,i=[]){this.on(t,e,i)}channel(t={}){return this.party[t.id]?console.error("@cyre.action: action already exist",t.id):this._createChannel(t,e)}action(t={}){return this.party[t.id]?console.error("@cyre.action: action already exist",t.id):this._createChannel(t,e)}emit(t=null,e=null){this.party[t]?(this.party[t].payload=e,this._dispatch(t,this.party[t].type)):console.error("@cyre.call : channel not found",t)}call(t=null,e=null){this.emit(t,e)}dispatch(t={}){return t.id=t.id?t.id:null,!t.type&&console.error("@cyre.dispatch : action type required for - ",t.id),this._createChannel(t,e).ok?{ok:!0,data:this._dispatch(t.id,t.type)}:{ok:!0,data:t.id}}respond(t=null,i=null,s=null,a=0,o=0){const n={id:t,type:i,payload:s,interval:a,repeat:o};return this._createChannel(n,e),this._dispatch(n.id,n.type),{ok:!0,data:n.id}}}("quantum-inceptions"),s={},a=(t,e=0,i=0,a=0)=>{s[t]._state.elm.container.style.transform=`translate3d(${e}px, ${i}px, ${a}px)`},o=(t,e)=>Math.round(t/e)*e,n=t=>250>t?1:0,r=(t,e)=>t/e;const l=new class{constructor(){this.positionX=0,this.positionY=0,this.pressed=0,this.touch={start:"mousedown",move:"mousemove",end:"mouseup",enter:"mouseenter"},this.targetHoloComponent=0}_touchStart(t=window.event,e=0){return!e||this.pressed?console.error("Holo touch : not my business"):(this.TouchStartTimeStamp=performance.now(),t.preventDefault(),this._e=s[e].getState,this.pressed=1,this.positionX=t.clientX||t.touches[0].clientX,this.positionY=t.clientY||t.touches[0].clientY,this.id=this._e.id,this.currentX=t.clientX||t.touches[0].clientX,this.currentY=t.clientY||t.touches[0].clientY,this.snapWidth=this._e.transformX||0,this.snapHeight=this._e.transformY||0,!0===this._e.io.orientation?this._dragScrollVertical(t):this._dragScroll(t),s[this._e.id]._style(0))}_dragScroll(t){if(!this.pressed)return{ok:!1,data:"not active"};this.distance=this.positionX-this.currentX,this._e.transformX=this.snapWidth-1.482*this.distance||0,100>this._e.transformX?this._e.transformX+100>this._e.endNumber?this._e.sliderEnd=0:(this._e.transformX=this._e.endNumber-100,this._e.sliderEnd=-1):(this._e.transformX=100,this._e.sliderEnd=1),a(this.id,this._e.transformX,0,0),requestAnimationFrame(this._dragScroll.bind(this))}_dragScrollVertical(t){if(!this.pressed)return 0;this.distance=this.positionY-this.currentY,this._e.transformY=this.snapHeight-1.482*this.distance||0,a(this._e.id,0,this._e.transformY,0),requestAnimationFrame(this._dragScrollVertical.bind(this))}_touchEnd(t){const e=performance.now();if(t.preventDefault(),t.stopPropagation(),!this.pressed)return 0;this.pressed=0;const s=e-this.TouchStartTimeStamp,a=r(this.distance,s);a>1.2?i.emit("nxtSlide"+this._e.id,this._e):-1.2>a?i.emit("prvSlide"+this._e.id,this._e):n(s)?this.focus(this.targetHoloComponent,t):i.emit("SNAP"+this._e.id,this._e)}focus(t,e){if(!e.target.closest("li.holo"))return!1;this.targetHoloComponent&&this.targetHoloComponent.classList.remove("active"),this.targetHoloComponent=e.target.closest("li.holo");try{PROTVJS.PLAY_THIS(this.targetHoloComponent.id),console.log("@playthis found : ",this.targetHoloComponent.id)}catch(t){}return i.emit("activate"+this._e.id,[this.targetHoloComponent,this._e])}activate([t,e]){e.transformX=-Math.abs(t.offsetLeft),i.emit("SNAP"+e.id,e),t.classList.add("active")}prvSlide(t){if(1!==t.sliderEnd)return t.transformX+=t.carousel.width||0,t.transformY+=t.carousel.height||0,i.emit("SNAP"+t.id,t)}nxtSlide(t){if(-1!==t.sliderEnd)return t.transformX-=t.carousel.width||0,t.transformY-=t.carousel.height||0,i.emit("SNAP"+t.id,t)}firstSlide(t){return t.transformX=0,t.transformY=0,t.sliderEnd=1,i.emit("SNAP"+t.id,t)}lastSlide(t){return t.transformX=t.endNumber,t.transformY=t.endNumber,t.sliderEnd=-1,i.emit("SNAP"+t.id,t)}animateSlideForward(t){return i.emit(-1===t.sliderEnd?"firstSlide"+t.id:"nxtSlide"+t.id,t)}animateSlideBackward(t){return i.emit(1===t.sliderEnd?"lastSlide"+t.id:"prvSlide"+t.id,t)}wheeler(t,e){t.preventDefault();const a=s[e].getState;0>t.deltaY?i.emit("prvSlide"+a.id,a):t.deltaY>0&&i.emit("nxtSlide"+a.id,a)}};class d{constructor(){this.id=0,this._state={id:0,carousel:{},duration:600,container:{},transformX:0,transformY:0,numberOfSlots:0,sliderEnd:0,item:{max:8}},this._state.io={id:null,title:null,description:null,enabled:1,wheel:1,controller:0,drag:1,swipe:0,snap:0,focus:0,animate:1,animateDirection:0,duration:0,loop:0,orientation:0,active:!0,onClick:!0,onDoubleClick:!0},this._state.elm={container:1,carousel:0},this.style={}}}class h extends d{constructor(t,e={}){if(super(),!t)return console.error("@Holo: Oh putain` problame with the given slider ");t.id||(console.error("@Holo: oh putain` carousel has no ID "),side.id="OhPutain"+performance.now()),this._state.elm.carousel=t,this.id=t.id,this._setup()}_setup(){return this._state.elm.container=this._state.elm.carousel.getElementsByClassName("holo-container")[0]||0,this._state.elm.container?this._define():console.error("@Holo : holo-container empty")}_define(){if(this._state.carousel.width=this._state.elm.carousel.clientWidth||0,!this._state.elm.container.children.length)return console.error("@Holo: no holo element found");this._state.id=this.id,this._state.childLength=this._state.elm.container.children.length,this._state.startNumber=0,this._state.endNumber=0,this._state.item.min=1,this._state.item.max=this._state.elm.carousel.dataset.max||0,this._state.io.wheel=!!this._state.elm.carousel.dataset.wheel,this._state.io.orientation=!!this._state.elm.carousel.dataset.orientation,this._state.io.snap=0,this._state.io.animate=+this._state.elm.carousel.dataset.animate||0,this._state.io.duration=+this._state.elm.carousel.dataset.duration||0,this._state.io.loop=+this._state.elm.carousel.dataset.loop||0,this._state.io.focus=this._state.elm.carousel.dataset.focus||0}get getState(){return this._state}get getAure(){return{car:{w:this._state.carousel.width,h:this._state.carousel.height},con:{w:this._state.container.width,h:this._state.container.height,x:this._state.transformX,y:this._state.transformY,s:{}}}}setState(t){this._state=t,!this._state.io.orientation&&(this._state.elm.carousel.style.width=t.carousel.width+"px"),this._state.io.orientation&&(this._state.elm.carousel.style.height=t.carousel.height+"px")}_style(t=0){t?(this._state.elm.container.style.transitionDuration=this._state.duration+"ms",this._state.elm.container.style.transitionTimingFunction="cubic-bezier(0.215, 0.61, 0.355, 1)"):(this._state.elm.container.style.transitionDuration="0ms",this._state.elm.container.style.transitionTimingFunction="linear")}}const c=(t,e={})=>{console.log("holo carousel @init : found ---  ",t.id),s[t.id]=new h(t,e),((t,e={})=>{if(t)return console.error("@Holo : Major malfunctions");t.io.enabled&&(t.elm.container.addEventListener("mousedown",e=>{e.preventDefault(),l._touchStart(e,t.id)}),t.elm.container.addEventListener("touchstart",e=>{e.preventDefault(),l._touchStart(e,t.id)}),t.io.wheel&&t.elm.carousel.addEventListener("wheel",e=>{l.wheeler(e,t.id)},!1),t.io.animate&&i.respond("Animate"+t.id,t.io.animate>0?"AnimateForward":"AnimateBackward",t,t.io.duration,t.io.loop)),i.action({id:"SNAP"+t.id,type:"SNAP",payload:t}),i.action({id:"prvSlide"+t.id,type:"prvSlide",payload:t}),i.action({id:"nxtSlide"+t.id,type:"nxtSlide",payload:t}),i.action({id:"lastSlide"+t.id,type:"lastSlide",payload:t}),i.action({id:"firstSlide"+t.id,type:"firstSlide",payload:t}),i.action({id:"activate"+t.id,type:"activate",payload:t})})(s[t.id].getState,e)},u=t=>{const e=document.getElementsByClassName(t);if(!e.length)return console.log("@Holo : Holo carousel structure not found");for(let t of e)c(t)};export default(()=>{const t=t=>{if(!t.id)return console.error("Holo width error");t.elm.container.setAttribute("style","");const{height:i,width:a}=d(t.elm.container.children[0]);t.item.height=i,t.item.width=a,t.numberOfSlots=n(t.elm.carousel.parentNode.clientWidth,t.item.width,t.item.max)||1;const o=t.elm.container.clientWidth||t.elm.container.children.length*t.item.width;return t.carousel.width=t.numberOfSlots*t.item.width||t.elm.carousel.clientWidth,t.carousel.height=t.item.height||t.elm.carousel.clientHeight,t.container.width=t.io.orientation?t.carousel.width:o,t.container.height=t.elm.container.clientHeight||t.item.height||0,t.endNumber=t.io.orientation?-Math.abs(t.container.height-t.carousel.height):-Math.abs(t.container.width-t.carousel.width),s[t.id].setState(t),e(t)},e=t=>(s[t.id]._style(1),t.id?(t=t.io.orientation?(t=>(t.transformY=t.io.snap&&o(t.transformY,t.item.height)||t.transformY,t.transformX=0,0>t.transformY?t.transformY>t.endNumber?t.sliderEnd=0:(t.transformY=t.endNumber,t.sliderEnd=-1):(t.transformY=0,t.sliderEnd=1),t))(t):(t=>(t.transformX=t.io.snap&&o(t.transformX,t.item.width)||t.transformX,t.transformY=0,0>t.transformX?t.transformX>t.endNumber?t.sliderEnd=0:(t.transformX=t.endNumber,t.sliderEnd=-1):(t.transformX=0,t.sliderEnd=1),t))(t),s[t.id].setState(t),a(t.id,t.transformX,t.transformY)):console.error("Holo snap error")),n=(t,e,i)=>{let s=Math.floor(t/e);return i&&s>i&&(s=i),s||1},r=t=>{t.elm.container.classList.add("shake-off");let e=setTimeout(()=>(e=0,t.elm.container.classList.remove("shake-off"),0),1e3)},d=t=>{if(!t)return 0;let e={};e.width=t.offsetWidth,e.height=t.offsetHeight;const i=window.getComputedStyle(t,null);return e.width+=parseInt(i.marginLeft)+parseInt(i.marginRight),e.height+=parseInt(i.marginTop)+parseInt(i.marginBottom),e};document.addEventListener("DOMContentLoaded",()=>{},!1);const h=()=>{for(let t in s)i.dispatch({id:"width"+t,type:"WIDTH",payload:s[t].getState,interval:250})};return window.addEventListener("resize",()=>{i.emit("when screen resize")},!1),window.onload=(()=>{i.dispatch({id:"app loaded",type:"LOADED"})}),{TOUCH:l,INIT:(s="holo-carousel")=>{console.log("%c HOLO - Initiating holo v2.2 ","background: #022d5f; color: white; display: block;"),(t=>{document.addEventListener("mousemove",t=>{l.pressed&&(l.currentX=t.clientX,l.currentY=t.clientY)}),document.addEventListener("mouseup",t=>{t.preventDefault(),l.pressed&&l._touchEnd(t)}),document.addEventListener("touchmove",t=>{l.pressed&&(l.currentX=t.touches[0].clientX,l.currentY=t.touches[0].clientY)}),document.addEventListener("touchend",t=>{l.pressed&&l._touchEnd(t)}),i.on("AnimateForward",l.animateSlideForward),i.on("AnimateBackward",l.animateSlideBackward),i.on("nxtSlide",l.nxtSlide),i.on("prvSlide",l.prvSlide),i.on("firstSlide",l.firstSlide),i.on("lastSlide",l.lastSlide),i.on("bringToFocus",l.focus),i.on("wheeler",l.wheeler),i.on("activate",l.activate)})(),i.action({id:"when screen resize",type:"SCREEN",interval:250}),i.emit("when screen resize"),i.on("SNAP",e),i.on("WIDTH",t),i.on("SHAKE",r),i.on("SCREEN",h)},HOLO:t=>s[t].getAure,BUILD:c,AUTO:u,carousel:(t,e={})=>{console.log("Holo.id : ",s[t]._state.io),console.log("io.id : ",e);for(const i in e)console.log(i),s[t]._state.io[i]?s[t]._state.io[i]=e[i]:console.error("Unknown Holo carousel parameter",i);return s[t]._state.io}}})();