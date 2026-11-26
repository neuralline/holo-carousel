// scripts/cyre-global.ts
// The demo pages' Cyre as a global (vite build --mode cyre-global -> public/js/cyre.js): the UMD Holo reads
// window.Cyre. Not part of the package - an app installs cyre from npm next to holo-carousel.
import * as core from 'cyre'
import {useMetrics} from 'cyre/metrics'

const Cyre = {...core, useMetrics}
;(window as any).Cyre = Cyre
export default Cyre
