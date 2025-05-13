//src/core/holo-performance.ts

import {cyre, CyreLog} from 'cyre'
import {_holo} from '../libs/holo-essentials'
import {EVENTS, PERFORMANCE} from '../config/holo-config'

// Track performance metrics over time
const performanceHistory: Array<{
  timestamp: number
  stress: number
  totalProcessingTime: number
  frameRate?: number
  carouselCount: number
}> = []

/**
 * Initialize performance monitoring system
 */
export const initializePerformanceMonitoring = (): void => {
  CyreLog.info('Initializing performance monitoring')

  registerPerformanceEvents()
  startPerformanceMonitoring()
}

/**
 * Get current performance metrics
 */
export const getPerformanceMetrics = () => {
  // Get Cyre's built-in metrics
  const cyreMetrics = cyre.getPerformanceState()

  return {
    ...cyreMetrics,
    history: performanceHistory.slice(-PERFORMANCE.STRESS_HISTORY_SIZE)
  }
}

/**
 * Register performance-related events
 */
function registerPerformanceEvents(): void {
  // Global performance monitoring
  cyre.on('global_performance_check', () => {
    // Get current Cyre performance metrics
    const metrics = cyre.getPerformanceState()

    // Create a snapshot
    const snapshot = {
      timestamp: Date.now(),
      stress: metrics.stress,
      totalProcessingTime: metrics.totalProcessingTime,
      // Estimate frame rate based on stress level (just a rough approximation)
      frameRate:
        metrics.stress > 0.5 ? 30 - Math.floor(metrics.stress * 20) : 60,
      carouselCount: Object.keys(_holo).length
    }

    // Add to history
    performanceHistory.push(snapshot)

    // Trim history if needed
    if (performanceHistory.length > PERFORMANCE.STRESS_HISTORY_SIZE * 2) {
      performanceHistory.splice(
        0,
        performanceHistory.length - PERFORMANCE.STRESS_HISTORY_SIZE
      )
    }

    // Check if any carousels need optimization
    const carousels = Object.keys(_holo)

    if (metrics.stress > PERFORMANCE.STRESS_THRESHOLD_HIGH) {
      // Apply aggressive optimizations to all carousels
      carousels.forEach(id => {
        cyre.call(EVENTS.PERFORMANCE_OPTIMIZE, {
          id,
          stress: metrics.stress,
          level: 'high'
        })
      })
    } else if (metrics.stress > PERFORMANCE.STRESS_THRESHOLD_MEDIUM) {
      // Apply moderate optimizations to all carousels
      carousels.forEach(id => {
        cyre.call(EVENTS.PERFORMANCE_OPTIMIZE, {
          id,
          stress: metrics.stress,
          level: 'medium'
        })
      })
    }
  })

  // Apply optimizations to a specific carousel
  cyre.on(EVENTS.PERFORMANCE_OPTIMIZE, payload => {
    const {id, level} = payload

    if (!id || !_holo[id]) return

    const virtual = _holo[id].getVirtual

    // Apply optimizations based on level
    switch (level) {
      case 'high':
        // Disable animations, increase throttling
        _holo[id].setState = {
          ...virtual,
          io: {
            ...virtual.io,
            animate: 0,
            wheel: 0,
            duration: Math.max(400, virtual.io.duration || 0)
          }
        }
        CyreLog.info(`Applied high-level optimizations to carousel ${id}`)
        break
      case 'medium':
        // Slow down animations
        _holo[id].setState = {
          ...virtual,
          io: {
            ...virtual.io,
            duration: Math.max(300, virtual.io.duration || 0)
          }
        }
        CyreLog.info(`Applied medium-level optimizations to carousel ${id}`)
        break
    }
  })

  // Configure actions
  cyre.action([
    {
      id: 'global_performance_check',
      interval: 5000, // Check every 5 seconds
      repeat: true, // Run continuously
      log: false
    },
    {
      id: EVENTS.PERFORMANCE_OPTIMIZE,
      throttle: 1000 // Apply optimizations at most once per second
    }
  ])
}

/**
 * Start the performance monitoring system
 */
function startPerformanceMonitoring(): void {
  // Start monitoring
  cyre.call('global_performance_check')
}

/**
 * Apply optimizations to a carousel based on its specific needs
 * Can be called directly
 */
export const optimizeCarousel = (
  id: string,
  level: 'light' | 'medium' | 'aggressive'
): void => {
  if (!id || !_holo[id]) {
    CyreLog.warn(`Cannot optimize carousel ${id}: not found`)
    return
  }

  const virtual = _holo[id].getVirtual

  // Apply optimizations based on level
  switch (level) {
    case 'aggressive':
      // Disable animations, input handling, increase throttling
      _holo[id].setState = {
        ...virtual,
        io: {
          ...virtual.io,
          animate: 0,
          wheel: 0,
          drag: 0,
          swipe: 0,
          duration: Math.max(500, virtual.io.duration || 0)
        }
      }
      CyreLog.info(`Applied aggressive optimizations to carousel ${id}`)
      break
    case 'medium':
      // Disable animations, slower transitions
      _holo[id].setState = {
        ...virtual,
        io: {
          ...virtual.io,
          animate: 0,
          wheel: 0,
          duration: Math.max(400, virtual.io.duration || 0)
        }
      }
      CyreLog.info(`Applied medium optimizations to carousel ${id}`)
      break
    case 'light':
      // Just slow down animations
      _holo[id].setState = {
        ...virtual,
        io: {
          ...virtual.io,
          duration: Math.max(300, virtual.io.duration || 0)
        }
      }
      CyreLog.info(`Applied light optimizations to carousel ${id}`)
      break
  }
}

/**
 * Get performance history
 */
export const getPerformanceHistory = () => {
  return performanceHistory.slice(-PERFORMANCE.STRESS_HISTORY_SIZE)
}
