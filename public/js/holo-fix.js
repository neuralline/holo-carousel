/**
 * Holo Carousel Compatibility Fix
 * This script fixes interaction issues with the Holo Carousel
 */
;(function () {
  // Wait for Holo to be initialized
  const checkHoloInterval = setInterval(() => {
    if (window.Holo) {
      clearInterval(checkHoloInterval)
      initFixes()
    }
  }, 100)

  function initFixes() {
    console.log('Applying Holo Carousel fixes...')

    // Fix 0: Force explicit dimensions for vertical carousels
    document.querySelectorAll('.vertical-carousel .holo').forEach(slide => {
      // Ensure vertical slides have explicit height
      if (!slide.style.height || slide.style.height === '') {
        slide.style.height = slide.offsetHeight
          ? `${slide.offsetHeight}px`
          : '200px'
        console.log(
          `Set explicit height for vertical slide: ${slide.style.height}`
        )
      }
    })

    // Fix 1: Ensure all carousel items have proper event listeners
    document.querySelectorAll('.holo-carousel').forEach(carousel => {
      const id = carousel.id
      if (!id) return

      // Check if this is a vertical carousel
      const isVertical = carousel.classList.contains('vertical-carousel')
      console.log(`Processing carousel: ${id}, isVertical: ${isVertical}`)

      // Fix click handlers on all slides
      const slides = carousel.querySelectorAll('.holo')
      slides.forEach((slide, index) => {
        slide.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()

          console.log(`Item clicked: ${index} in carousel: ${id}`)

          // Try to call activate directly
          if (window.Holo && typeof window.Holo.goTo === 'function') {
            window.Holo.goTo(id, index)
          }
        })
      })

      // Fix navigation buttons if present
      const prevButton = carousel.querySelector('.holo-prev')
      const nextButton = carousel.querySelector('.holo-next')

      if (prevButton) {
        prevButton.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()

          console.log(`Prev button clicked in carousel: ${id}`)

          if (window.Holo && typeof window.Holo.prev === 'function') {
            window.Holo.prev(id)
          }
        })
      }

      if (nextButton) {
        nextButton.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()

          console.log(`Next button clicked in carousel: ${id}`)

          if (window.Holo && typeof window.Holo.next === 'function') {
            window.Holo.next(id)
          }
        })
      }

      // Fix touch/drag handlers on container
      const container = carousel.querySelector('.holo-container')
      if (container) {
        let isDragging = false
        let startX = 0
        let startY = 0
        let startTime = 0

        container.addEventListener('mousedown', startDrag)
        container.addEventListener('touchstart', startDrag)

        function startDrag(e) {
          isDragging = true
          startTime = Date.now()

          if (e.type === 'touchstart') {
            startX = e.touches[0].clientX
            startY = e.touches[0].clientY
          } else {
            startX = e.clientX
            startY = e.clientY
          }

          document.addEventListener('mousemove', moveDrag)
          document.addEventListener('touchmove', moveDrag)
          document.addEventListener('mouseup', endDrag)
          document.addEventListener('touchend', endDrag)
        }

        function moveDrag(e) {
          if (!isDragging) return

          let currentX, currentY

          if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX
            currentY = e.touches[0].clientY
          } else {
            currentX = e.clientX
            currentY = e.clientY
          }

          const deltaX = startX - currentX
          const deltaY = startY - currentY

          // Only prevent default if dragging horizontally
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault()
          }
        }

        function endDrag(e) {
          if (!isDragging) return

          isDragging = false
          const endTime = Date.now()
          const duration = endTime - startTime

          let endX, endY

          if (e.type === 'touchend') {
            // Use the last known position for touchend
            endX = e.changedTouches[0].clientX
            endY = e.changedTouches[0].clientY
          } else {
            endX = e.clientX
            endY = e.clientY
          }

          const deltaX = startX - endX
          const deltaY = startY - endY

          // Calculate velocity (pixels per millisecond)
          const velocityX = Math.abs(deltaX) / Math.max(duration, 1)
          const velocityY = Math.abs(deltaY) / Math.max(duration, 1)

          // Determine if it was a swipe (fast movement)
          const isSwipe = velocityX > 0.5 || velocityY > 0.5

          // Determine if it was a tap/click (short duration, small movement)
          const isTap =
            duration < 300 && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10

          // Handle horizontal swipes
          if (isSwipe && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > 0) {
              // Swiped left, go to next slide
              if (window.Holo && typeof window.Holo.next === 'function') {
                window.Holo.next(id)
              }
            } else {
              // Swiped right, go to previous slide
              if (window.Holo && typeof window.Holo.prev === 'function') {
                window.Holo.prev(id)
              }
            }
          }

          document.removeEventListener('mousemove', moveDrag)
          document.removeEventListener('touchmove', moveDrag)
          document.removeEventListener('mouseup', endDrag)
          document.removeEventListener('touchend', endDrag)
        }
      }
    })

    // Fix 2: Enable debug mode if needed
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.has('debug')) {
      window.holoDebug = window.holoDebug || {}
      window.holoDebug.enabled = true

      // Create debug panel
      const debugPanel = document.createElement('div')
      debugPanel.className = 'holo-debug-panel'
      debugPanel.innerHTML = `
          <h3>Holo Debug Panel</h3>
          <div class="holo-debug-controls">
            <button id="holo-debug-refresh">Refresh All</button>
            <button id="holo-debug-next">Next Slide</button>
            <button id="holo-debug-prev">Prev Slide</button>
          </div>
          <div class="holo-debug-state"></div>
        `

      // Style the debug panel
      debugPanel.style.cssText = `
          position: fixed;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          padding: 10px;
          border-radius: 5px;
          z-index: 9999;
          font-family: monospace;
          font-size: 12px;
          max-width: 300px;
          max-height: 400px;
          overflow: auto;
        `

      document.body.appendChild(debugPanel)

      // Add event listeners to debug controls
      document
        .getElementById('holo-debug-refresh')
        .addEventListener('click', function () {
          if (window.Holo && typeof window.Holo.refresh === 'function') {
            window.Holo.refresh()
          }
        })

      document
        .getElementById('holo-debug-next')
        .addEventListener('click', function () {
          const carousels = document.querySelectorAll('.holo-carousel')
          if (
            carousels.length > 0 &&
            window.Holo &&
            typeof window.Holo.next === 'function'
          ) {
            window.Holo.next(carousels[0].id)
          }
        })

      document
        .getElementById('holo-debug-prev')
        .addEventListener('click', function () {
          const carousels = document.querySelectorAll('.holo-carousel')
          if (
            carousels.length > 0 &&
            window.Holo &&
            typeof window.Holo.prev === 'function'
          ) {
            window.Holo.prev(carousels[0].id)
          }
        })

      // Update debug state periodically
      setInterval(function () {
        const stateEl = document.querySelector('.holo-debug-state')
        if (!stateEl) return

        const carousels = document.querySelectorAll('.holo-carousel')
        let stateHtml = ''

        carousels.forEach(carousel => {
          const id = carousel.id
          if (!id) return

          if (window.Holo && typeof window.Holo.getState === 'function') {
            const state = window.Holo.getState(id)
            if (state) {
              stateHtml += `<div><strong>${id}</strong>: pos(${Math.round(
                state.transformX
              )}, ${Math.round(state.transformY)})</div>`
            }
          }
        })

        stateEl.innerHTML = stateHtml
      }, 500)
    }

    console.log('Holo Carousel fixes applied successfully!')

    // Force initial dimension calculation for all carousels
    setTimeout(() => {
      console.log('Forcing initial refresh of all carousels')

      if (window.Holo && typeof window.Holo.refresh === 'function') {
        window.Holo.refresh()
      }

      // Apply explicit dimension refreshes for vertical carousels
      document.querySelectorAll('.vertical-carousel').forEach(carousel => {
        const id = carousel.id

        // Set explicit height and width for vertical carousel
        const carouselHeight = carousel.clientHeight || 200
        carousel.style.height = `${carouselHeight}px`

        // Set explicit height for each slide
        const slides = carousel.querySelectorAll('.holo')
        slides.forEach(slide => {
          const slideEl = slide
          const slideHeight =
            slideEl.offsetHeight || carouselHeight / slides.length
          slideEl.style.height = `${slideHeight}px`
          console.log(`Set vertical slide height: ${slideHeight}px`)
        })

        // Force a container update
        const container = carousel.querySelector('.holo-container')
        if (container) {
          container.style.flexDirection = 'column'
          console.log('Set flex-direction: column for vertical carousel')
        }
      })

      // Force another refresh after explicit dimensions are set
      setTimeout(() => {
        if (window.Holo && typeof window.Holo.refresh === 'function') {
          window.Holo.refresh()
        }
      }, 100)
    }, 500)
  }
})()
