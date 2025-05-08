// src/libs/cyre-intralink.ts
import {cyre} from 'cyre'

/* 
    Neural Line
    C.Y.R.E. - Advanced Features Example
    Demonstrates:
    - Intralink chains
    - Conditional intralink chains
    - Debounce
    - Change detection
    - Action management (forget/pause/resume)
    - Quantum breathing responses
    use this example to improve holo-carousel integration with cyre
*/

// ===================================================
// Utility to simulate API calls with varying response times
// ===================================================
const simulateApi = async <T>(
  data: T,
  delay: number = 500,
  shouldFail: boolean = false
): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, delay))

  if (shouldFail) {
    throw new Error('API call failed')
  }

  return data
}

// Step 6: Error handling
cyre.action({
  id: 'handle-error',

  payload: null,
  priority: {level: 'high'} // High priority for error handling
})

// ===================================================
// Setup notifiers with different protection settings
// ===================================================

// UI Update Notifier - This one gets debounced to avoid UI flicker
cyre.action({
  id: 'update-ui',
  payload: {status: 'idle'},
  debounce: 100 // Debounce UI updates to avoid flickering
})

// Admin Notification - This one has change detection
cyre.action({
  id: 'notify-admin',
  payload: null,
  detectChanges: true // Only notify admin when payload actually changes
})

// Self-cleaning background task that will auto-cancel
cyre.action({
  id: 'clean-session',
  type: 'background',
  payload: null,
  repeat: 5, // Repeat 5 times
  interval: 1000 // Every second
})

// ===================================================
// Set up subscription handlers
// ===================================================

// 1. Register User Handler - START OF CHAIN
cyre.on('register-user', userData => {
  log('register-user', 'Processing new user registration', userData)

  // Return intralink to next step in chain
  return {
    id: 'validate-user',
    payload: userData
  }
})

// 2. Validate User Handler - CONDITIONAL CHAIN
cyre.on('validate-user', async (userData: any) => {
  log('validate-user', 'Validating user data', userData)

  try {
    // Simulate validation
    const isValid = userData.email && userData.email.includes('@')

    if (!isValid) {
      throw new Error('Invalid user data')
    }

    // Enhance user data
    const enhancedData = {
      ...userData,
      validated: true,
      timestamp: Date.now()
    }

    // CONDITIONAL INTRALINK: Continue chain if valid
    return {
      id: 'save-user',
      payload: enhancedData
    }
  } catch (error) {
    // CONDITIONAL INTRALINK: Divert to error handler if invalid
    log('validate-user', 'Validation failed, routing to error handler')

    return {
      id: 'handle-error',
      payload: {
        source: 'validate-user',
        error: error instanceof Error ? error.message : 'Unknown error',
        userData
      }
    }
  }
})

// 3. Save User Handler - CONTINUES CHAIN
cyre.on('save-user', async (userData: any) => {
  log('save-user', 'Saving user to database', userData)

  try {
    // Simulate database operation
    const savedUser = await simulateApi(
      {...userData, id: crypto.randomUUID()},
      800 // 800ms delay
    )

    log('save-user', 'User saved successfully', savedUser)

    // Fire off analytics (will be debounced) - NO AWAIT NEEDED
    cyre.call('log-analytics', {
      action: 'user_created',
      userId: savedUser.id,
      timestamp: Date.now()
    })

    // Continue chain
    return {
      id: 'send-welcome-email',
      payload: savedUser
    }
  } catch (error) {
    // Handle error and break chain
    return {
      id: 'handle-error',
      payload: {
        source: 'save-user',
        error: error instanceof Error ? error.message : 'Unknown error',
        userData
      }
    }
  }
})

// 4. Send Welcome Email Handler - END OF NORMAL CHAIN
cyre.on('send-welcome-email', async (userData: any) => {
  log('send-welcome-email', 'Sending welcome email', userData)

  try {
    // Simulate email sending
    await simulateApi({sent: true, to: userData.email}, 500)

    log('send-welcome-email', `Welcome email sent to ${userData.email}`)

    // Update UI at end of chain
    cyre.call('update-ui', {
      status: 'success',
      message: `User ${userData.name} registered successfully`,
      timestamp: Date.now()
    })

    // Also notify admin - USES CHANGE DETECTION
    cyre.call('notify-admin', {
      event: 'new_user',
      user: userData,
      timestamp: Date.now()
    })

    // End of chain - no intralink returned
  } catch (error) {
    return {
      id: 'handle-error',
      payload: {
        source: 'send-welcome-email',
        error: error instanceof Error ? error.message : 'Unknown error',
        userData
      }
    }
  }
})
