//src/utils/debug.ts

import {CyreLog} from 'cyre'
import {_holo} from '../libs/holo-essentials'

/**
 * Debug mode flag
 */
let DEBUG_MODE = false

/**
 * Enable or disable debug mode
 */
export const setDebugMode = (enabled: boolean): void => {
  DEBUG_MODE = enabled
  CyreLog.info(`Debug mode ${enabled ? 'enabled' : 'disabled'}`)
}

/**
 * Toggle debug mode
 */
export const toggleDebugMode = (): boolean => {
  DEBUG_MODE = !DEBUG_MODE
  CyreLog.info(`Debug mode ${DEBUG_MODE ? 'enabled' : 'disabled'}`)
  return DEBUG_MODE
}

/**
 * Log only in debug mode
 */
export const debugLog = (message: string, ...args: any[]): void => {
  if (DEBUG_MODE) {
    CyreLog.debug(message, ...args)
  }
}

/**
 * Add visual debug overlays to carousels
 */
export const addDebugOverlays = (): void => {
  if (!DEBUG_MODE) return

  Object.keys(_holo).forEach(id => {
    const carousel = document.getElementById(id)
    if (!carousel) return

    // Add debug class
    carousel.classList.add('holo-debug')

    // Create debug overlay if not exists
    let debugOverlay = carousel.querySelector('.holo-debug-overlay')
    if (!debugOverlay) {
      debugOverlay = document.createElement('div')
      debugOverlay.className = 'holo-debug-overlay'
      carousel.appendChild(debugOverlay)
    }

    // Update debug info
    const virtual = _holo[id].getVirtual
    ;(debugOverlay as HTMLElement).innerHTML = `
      <div class="holo-debug-info">
        <div>ID: ${id}</div>
        <div>X: ${Math.round(virtual.transformX)}</div>
        <div>Y: ${Math.round(virtual.transformY)}</div>
        <div>End of Slide: ${virtual.endOfSlide}</div>
        <div>Orientation: ${
          virtual.io.orientation ? 'Vertical' : 'Horizontal'
        }</div>
      </div>
    `
  })
}

/**
 * Remove debug overlays
 */
export const removeDebugOverlays = (): void => {
  document.querySelectorAll('.holo-debug-overlay').forEach(overlay => {
    overlay.remove()
  })
  document.querySelectorAll('.holo-debug').forEach(element => {
    element.classList.remove('holo-debug')
  })
}

/**
 * Add debug CSS to the document
 */
export const injectDebugStyles = (): void => {
  if (!DEBUG_MODE) return

  const styleId = 'holo-debug-styles'
  if (document.getElementById(styleId)) return

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    .holo-debug {
      position: relative;
    }
    
    .holo-debug-overlay {
      position: absolute;
      top: 0;
      left: 0;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      padding: 5px;
      border-radius: 3px;
      font-size: 10px;
      z-index: 9999;
      pointer-events: none;
    }
    
    .holo-debug .holo-container {
      outline: 1px solid rgba(255, 0, 0, 0.5);
    }
    
    .holo-debug .holo {
      outline: 1px dashed rgba(0, 255, 0, 0.5);
    }
  `
  document.head.appendChild(style)
}

/**
 * Monitor carousel performance and state changes
 */
export const enableStateMonitoring = (): (() => void) => {
  if (!DEBUG_MODE) return () => {}

  const intervalId = setInterval(() => {
    addDebugOverlays()
  }, 500)

  return () => clearInterval(intervalId)
}

/**
 * Initialize debugging tools
 */
export const initializeDebugTools = (enabled: boolean = false): void => {
  setDebugMode(enabled)

  if (enabled) {
    injectDebugStyles()
    const stopMonitoring = enableStateMonitoring()

    // Add to window for console access
    ;(window as any).holoDebug = {
      toggleDebugMode,
      addDebugOverlays,
      removeDebugOverlays,
      getDatabaseState: () => ({..._holo}),
      stopMonitoring
    }
  }
}
