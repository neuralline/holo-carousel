//src/components/holo-relationships.ts

import {CyreLog} from 'cyre'

/**
 * Interface for tracking parent-child relationships between carousels
 */
export interface HoloRelationship {
  id: string
  parentId?: string
  childIds: string[]
  level: number // Nesting level (0 = root)
}

/**
 * Global registry of carousel relationships
 */
export const _holoRelationships: Record<string, HoloRelationship> = {}

/**
 * Register a carousel as a child of another
 */
export const registerNestedCarousel = (
  childId: string,
  parentId: string
): void => {
  // Check if we already have this relationship
  if (_holoRelationships[childId]?.parentId === parentId) {
    return
  }

  // Calculate nesting level
  const parentLevel = _holoRelationships[parentId]?.level || 0
  const childLevel = parentLevel + 1

  // Create or update child relationship
  _holoRelationships[childId] = {
    id: childId,
    parentId,
    childIds: _holoRelationships[childId]?.childIds || [],
    level: childLevel
  }

  // Update parent's children list
  if (!_holoRelationships[parentId]) {
    _holoRelationships[parentId] = {
      id: parentId,
      childIds: [childId],
      level: parentLevel
    }
  } else {
    if (!_holoRelationships[parentId].childIds.includes(childId)) {
      _holoRelationships[parentId].childIds.push(childId)
    }
  }

  CyreLog.info(
    `Registered carousel ${childId} as child of ${parentId} (level ${childLevel})`
  )
}

/**
 * Check if a carousel is a child of another
 */
export const isChildOf = (childId: string, parentId: string): boolean => {
  return _holoRelationships[childId]?.parentId === parentId
}

/**
 * Check if a carousel is a parent
 */
export const isParent = (id: string): boolean => {
  return (_holoRelationships[id]?.childIds.length || 0) > 0
}

/**
 * Get all ancestors of a carousel
 * Returns an array of ancestor IDs, from immediate parent to root
 */
export const getAncestors = (id: string): string[] => {
  const ancestors: string[] = []
  let currentId = id

  while (_holoRelationships[currentId]?.parentId) {
    const parentId = _holoRelationships[currentId].parentId
    if (parentId) {
      ancestors.push(parentId)
      currentId = parentId
    } else {
      break
    }
  }

  return ancestors
}

/**
 * Get all descendants of a carousel
 * Returns an array of descendant IDs
 */
export const getDescendants = (id: string): string[] => {
  const result: string[] = []
  const stack = [...(_holoRelationships[id]?.childIds || [])]

  while (stack.length > 0) {
    const current = stack.pop()
    if (current) {
      result.push(current)

      const children = _holoRelationships[current]?.childIds || []
      stack.push(...children)
    }
  }

  return result
}

/**
 * Get direct children of a carousel
 */
export const getChildren = (id: string): string[] => {
  return _holoRelationships[id]?.childIds || []
}

/**
 * Get parent of a carousel
 */
export const getParent = (id: string): string | undefined => {
  return _holoRelationships[id]?.parentId
}

/**
 * Temporarily pause all parent carousels
 * Useful when interacting with a nested carousel
 */
export const pauseParentCarousels = (id: string): void => {
  const ancestors = getAncestors(id)

  ancestors.forEach(ancestorId => {
    // Signal to IO that this ancestor should temporarily disable interactions
    document
      .getElementById(ancestorId)
      ?.setAttribute('data-child-active', 'true')
  })
}

/**
 * Resume all parent carousels
 */
export const resumeParentCarousels = (id: string): void => {
  const ancestors = getAncestors(id)

  ancestors.forEach(ancestorId => {
    document.getElementById(ancestorId)?.removeAttribute('data-child-active')
  })
}

/**
 * Unregister a carousel and all its relationships
 */
export const unregisterCarousel = (id: string): void => {
  // Remove from parent's children list
  const parentId = _holoRelationships[id]?.parentId
  if (parentId && _holoRelationships[parentId]) {
    _holoRelationships[parentId].childIds = _holoRelationships[
      parentId
    ].childIds.filter(childId => childId !== id)
  }

  // Get all children
  const childIds = [...(_holoRelationships[id]?.childIds || [])]

  // Remove this carousel
  delete _holoRelationships[id]

  // Update children (they no longer have a parent)
  childIds.forEach(childId => {
    if (_holoRelationships[childId]) {
      _holoRelationships[childId].parentId = undefined
      _holoRelationships[childId].level = 0
    }
  })

  CyreLog.info(`Unregistered carousel ${id} and its relationships`)
}
