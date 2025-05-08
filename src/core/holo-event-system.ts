// src/core/holo-event-system.ts

import {cyre} from 'cyre'
import {EVENTS, createEventIds} from '../config/holo-config'
import type {HoloVirtual} from '../types/interface'
import {
  prvSlide,
  nxtSlide,
  firstSlide,
  lastSlide,
  activate,
  animateSlideForward,
  animateSlideBackward
} from '../libs/holo-essentials'

/**
 * Register global events that are shared across all carousel instances
 * This should be called once during initialization
 */
export const registerGlobalEvents = (): void => {
  // Register global event handlers
  const eventHandlers = [
    {id: EVENTS.ANIMATE_FORWARD, fn: animateSlideForward},
    {id: EVENTS.ANIMATE_BACKWARD, fn: animateSlideBackward},
    {id: EVENTS.NEXT_SLIDE, fn: nxtSlide},
    {id: EVENTS.PREV_SLIDE, fn: prvSlide},
    {id: EVENTS.FIRST_SLIDE, fn: firstSlide},
    {id: EVENTS.LAST_SLIDE, fn: lastSlide},
    {id: EVENTS.ACTIVATE, fn: activate}
  ]

  // Register all event handlers
  cyre.on(eventHandlers)

  // Register corresponding actions for each handler
  const actionConfigs = eventHandlers.map(({id}) => ({id}))
  cyre.action(actionConfigs)
}

/**
 * Register instance-specific events for a carousel
 * This ensures that events like "animate_carousel1" have handlers
 */
export const registerInstanceEvents = (virtual: HoloVirtual): HoloVirtual => {
  // Create consistent event IDs
  const eventIds = createEventIds(virtual.id)

  // Store the event IDs in the virtual state for reference
  const updatedVirtual = {
    ...virtual,
    eventIds
  }

  // Register instance-specific event handlers
  const eventHandlers = [
    {
      id: eventIds.animate,
      fn:
        updatedVirtual.io.animateDirection > 0
          ? animateSlideForward
          : animateSlideBackward
    },
    {
      id: eventIds.snap,
      fn: (payload: HoloVirtual) => cyre.call(EVENTS.SNAP, payload)
    },
    {
      id: eventIds.prevSlide,
      fn: prvSlide
    },
    {
      id: eventIds.nextSlide,
      fn: nxtSlide
    },
    {
      id: eventIds.lastSlide,
      fn: lastSlide
    },
    {
      id: eventIds.firstSlide,
      fn: firstSlide
    },
    {
      id: eventIds.activate,
      fn: activate
    }
  ]

  // Register all event handlers
  cyre.on(eventHandlers)

  // Register action configurations
  cyre.action([
    {
      id: eventIds.animate,
      interval: updatedVirtual.io.duration,
      repeat: updatedVirtual.io.loop,
      log: false
    },
    {id: eventIds.snap, throttle: 50},
    {id: eventIds.prevSlide},
    {id: eventIds.nextSlide},
    {id: eventIds.lastSlide},
    {id: eventIds.firstSlide},
    {id: eventIds.activate}
  ])

  return updatedVirtual
}

/**
 * Safe event caller that handles errors gracefully
 * This prevents "No subscriber found" errors
 */
export const safeEventCall = (
  eventId: string,
  fallbackId: string,
  payload: unknown
): void => {
  try {
    cyre.call(eventId, payload)
  } catch (error) {
    console.warn(`Event ${eventId} failed, falling back to ${fallbackId}`)
    try {
      cyre.call(fallbackId, payload)
    } catch (secondError) {
      console.error(`Both ${eventId} and ${fallbackId} failed:`, secondError)
    }
  }
}

/**
 * Unregister all events for a specific carousel instance
 * This prevents memory leaks when carousels are removed
 */
export const unregisterInstanceEvents = (id: string): void => {
  const eventIds = createEventIds(id)

  // Forget all instance-specific events
  Object.values(eventIds).forEach(eventId => {
    cyre.forget(eventId)
  })
}
