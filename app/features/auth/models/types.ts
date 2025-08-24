/**
 * Auth feature types and interfaces
 * Extends the global types with auth-specific models
 */

import type { 
    LoginInput, 
    EmailCheckInput,
    ProfileView,
    ValidationResult
} from "~/lib/types"

// ============================================================================
// Auth State Types
// ============================================================================

export interface AuthState {
    profile: ProfileView | null
    isLoading: boolean
    error: string | null
}

export interface LoginFormData {
    email: string
    password: string
    rememberMe?: boolean
}

export interface EmailCheckFormData {
    email: string
}

// ============================================================================
// Auth Response Types
// ============================================================================

export interface LoginResponse {
    success: boolean
    profile?: ProfileView
    redirectTo?: string
    errors?: Record<string, string>
}

export interface EmailCheckResponse {
    success: boolean
    exists: boolean
    redirectTo?: string
    errors?: Record<string, string>
}

export interface LogoutResponse {
    success: boolean
    redirectTo?: string
}

// ============================================================================
// Session Management Types
// ============================================================================

export interface TempSession {
    email: string
    createdAt: number
    expiresAt: number
}

export interface AuthSession {
    profile: ProfileView
    token: string
    expiresAt: number
}

// ============================================================================
// Form Validation Types
// ============================================================================

export interface FormField<T> {
    value: T
    error: string | null
    touched: boolean
}

export interface LoginFormState {
    email: FormField<string>
    password: FormField<string>
    isSubmitting: boolean
}

export interface EmailCheckFormState {
    email: FormField<string>
    isSubmitting: boolean
}

// ============================================================================
// Query Keys for TanStack Query
// ============================================================================

export const authQueryKeys = {
    all: ['auth'] as const,
    login: () => [...authQueryKeys.all, 'login'] as const,
    emailCheck: (email: string) => [...authQueryKeys.all, 'emailCheck', email] as const,
    profile: () => [...authQueryKeys.all, 'profile'] as const,
} as const

// ============================================================================
// Error Types
// ============================================================================

export interface AuthError {
    code: string
    message: string
    field?: string
}

export const AuthErrorCodes = {
    INVALID_CREDENTIALS: 'invalid_credentials',
    EMAIL_NOT_FOUND: 'email_not_found',
    NETWORK_ERROR: 'network_error',
    VALIDATION_ERROR: 'validation_error',
    SESSION_EXPIRED: 'session_expired',
} as const

export type AuthErrorCode = typeof AuthErrorCodes[keyof typeof AuthErrorCodes]
