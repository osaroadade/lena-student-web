/**
 * Typed API client for Lena backend
 * Provides SSR-compatible fetch wrapper with authentication
 */

import type {
    LoginInput,
    ProfileView,
    RegisterUser,
    OtpRequest,
    ValidateOtp,
    OtpResponse,
    ApiError,
    EmailCheckResponse
} from "./types"

// ============================================================================
// Configuration
// ============================================================================

// Configuration from environment variables
const API_BASE_URL = import.meta.env.VITE_LENA_API_URL || "https://test.lena.africa"
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "10000") // Default: 10 seconds

// ============================================================================
// Core Fetch Wrapper
// ============================================================================

export class LenaApiError extends Error {
    constructor(
        public status: number,
        public apiError: ApiError,
        public response: Response
    ) {
        super(apiError.message)
        this.name = "LenaApiError"
    }
}

interface FetchOptions extends RequestInit {
    token?: string
    timeout?: number
}

export async function lenaFetch<T = unknown>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { token, timeout = API_TIMEOUT, ...fetchOptions } = options

    // Create AbortController for timeout (SSR compatible)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
        // Build headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json"
        }

        // Safely merge additional headers
        if (fetchOptions.headers) {
            const additionalHeaders = fetchOptions.headers as Record<string, string>
            Object.assign(headers, additionalHeaders)
        }

        // Add authorization header if token provided
        if (token) {
            headers["Authorization"] = `Bearer ${token}`
        }

        // Make request
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...fetchOptions,
            headers,
            signal: controller.signal
        })

        // Clear timeout
        clearTimeout(timeoutId)

        // Handle non-JSON responses (like 204 No Content)
        if (response.status === 204) {
            return undefined as T
        }

        // Try to parse JSON response
        let data: unknown
        try {
            data = await response.json()
        } catch {
            // If JSON parsing fails, create a generic error
            data = {
                message: `HTTP ${response.status}: ${response.statusText}`,
                status: response.status
            }
        }

        // Handle HTTP errors
        if (!response.ok) {
            const apiError: ApiError = {
                message: typeof data === "object" && data && "message" in data
                    ? String(data.message)
                    : `HTTP ${response.status}: ${response.statusText}`,
                status: response.status,
                errors: typeof data === "object" && data && "errors" in data
                    ? data.errors as Record<string, string[]>
                    : undefined
            }

            throw new LenaApiError(response.status, apiError, response)
        }

        return data as T

    } catch (error) {
        clearTimeout(timeoutId)

        // Handle AbortError (timeout)
        if (error instanceof Error && error.name === "AbortError") {
            const timeoutError: ApiError = {
                message: "Request timeout - please try again",
                status: 408
            }
            throw new LenaApiError(408, timeoutError, new Response())
        }

        // Re-throw LenaApiError
        if (error instanceof LenaApiError) {
            throw error
        }

        // Handle network errors
        const networkError: ApiError = {
            message: error instanceof Error ? error.message : "Network error occurred",
            status: 0
        }
        throw new LenaApiError(0, networkError, new Response())
    }
}

// ============================================================================
// Authentication API Endpoints
// ============================================================================

/**
 * Log in with email and password
 * POST /v1/login
 */
export async function login(input: LoginInput): Promise<ProfileView> {
    return lenaFetch<ProfileView>("/v1/login", {
        method: "POST",
        body: JSON.stringify(input)
    })
}

/**
 * Request OTP via email
 * POST /v1/request_otp
 */
export async function requestOtp(input: OtpRequest): Promise<OtpResponse> {
    return lenaFetch<OtpResponse>("/v1/request_otp", {
        method: "POST",
        body: JSON.stringify(input)
    })
}

/**
 * Validate OTP code
 * POST /v1/validate_otp
 */
export async function validateOtp(input: ValidateOtp): Promise<OtpResponse> {
    return lenaFetch<OtpResponse>("/v1/validate_otp", {
        method: "POST",
        body: JSON.stringify(input)
    })
}

/**
 * Register a new user (student)
 * Note: Based on API, this might need to be called after OTP validation
 */
export async function registerUser(input: RegisterUser): Promise<ProfileView> {
    // Note: The API spec doesn't show a clear registration endpoint
    // This is a placeholder - we may need to adjust based on actual API
    return lenaFetch<ProfileView>("/v1/register", {
        method: "POST",
        body: JSON.stringify(input)
    })
}

/**
 * Check if email belongs to a verified user
 * POST /v1/user/check_email
 */
export async function checkEmail(email: string): Promise<{ exist: boolean }> {
    return lenaFetch<{ exist: boolean }>("/v1/user/check_email", {
        method: "POST",
        body: JSON.stringify({ email })
    })
}

/**
 * Get current user profile (for token validation)
 * This endpoint may not exist - we'll use it for session verification
 */
export async function getCurrentProfile(token: string): Promise<ProfileView> {
    return lenaFetch<ProfileView>("/v1/profile", {
        token
    })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract error message from API error
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof LenaApiError) {
        return error.apiError.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return "An unexpected error occurred"
}

/**
 * Extract field errors from API error
 */
export function getFieldErrors(error: unknown): Record<string, string> {
    if (error instanceof LenaApiError && error.apiError?.errors) {
        const fieldErrors: Record<string, string> = {}

        Object.entries(error.apiError.errors).forEach(([field, messages]) => {
            // Safely handle cases where messages might be undefined or empty
            if (Array.isArray(messages) && messages.length > 0) {
                fieldErrors[field] = messages[0] // Take first error message
            } else if (typeof messages === "string") {
                fieldErrors[field] = messages
            }
        })

        return fieldErrors
    }

    return {}
}

/**
 * Check if error is a specific HTTP status
 */
export function isHttpError(error: unknown, status: number): boolean {
    return error instanceof LenaApiError && error.status === status
}

/**
 * Check if error indicates unauthorized access
 */
export function isUnauthorized(error: unknown): boolean {
    return isHttpError(error, 401)
}

/**
 * Check if error indicates network/connectivity issues
 */
export function isNetworkError(error: unknown): boolean {
    return error instanceof LenaApiError && error.status === 0
}
