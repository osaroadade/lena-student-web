/**
 * Auth Feature Exports
 * Central export point for all auth-related functionality
 */

// Controllers
export { AuthController } from './controllers/auth-controller'

// Guards
export {
    requireAuth,
    requireGuest,
    createAuthLoader,
    createGuestLoader,
    createTeacherLoader,
    authGuard,
    guestGuard
} from './controllers/auth-guards'

// Models (focused, single-responsibility)
export { LoginModel } from './models/login-model'
export { EmailCheckModel } from './models/email-check-model'
export { SessionModel } from './models/session-model'
export { ValidationModel } from './models/validation-model'

// Views
export { LoginForm } from './views/LoginForm'
export { EmailCheckForm } from './views/EmailCheckForm'

// Types
export type {
    AuthState,
    LoginFormData,
    EmailCheckFormData,
    LoginResponse,
    EmailCheckResponse,
    LogoutResponse,
    TempSession,
    AuthSession,
    FormField,
    LoginFormState,
    EmailCheckFormState,
    AuthError,
    AuthErrorCode
} from './models/types'

export { authQueryKeys, AuthErrorCodes } from './models/types'
