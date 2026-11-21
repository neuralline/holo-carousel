//src/components/holo-touch-manager.ts

import Touch from './holo-touch'

/**
 * @deprecated Superseded by Touch.setupGlobalTouchListeners() (see
 * holo-touch.ts), which app.ts already wires up on init. This wrapper is
 * kept only for anyone importing TouchManager directly from older code -
 * it used to reference Touch.pressed/currentX/currentY, properties that
 * don't exist on the current Touch API (touch state now lives in
 * core/state.ts's holoStore, per-instance), so calling it would have
 * thrown immediately. It now just delegates to the real implementation.
 */
const TouchManager = (): (() => void) => Touch.setupGlobalTouchListeners()

export {TouchManager}
