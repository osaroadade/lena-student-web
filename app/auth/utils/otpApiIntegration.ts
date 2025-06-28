// Comprehensive OTP API integration with error handling and retry logic
import { updateOtpSession, type OtpSessionData } from "@/auth/utils/sessionManager"

// API Configuration
const API_CONFIG = {
    baseUrl: process.env.API_BASE_URL || "https://test.lena.africa",
    timeout: 15000, // 15 second timeout for OTP operations
    retries: 2
}

// TypeScript interfaces for API responses
interface SendOtpApiResponse {
    message: string
}

interface ValidateOtpApiResponse {
    message: string
}

// Result interfaces for our abstracted functions
interface SendOtpResult {
    success: boolean
    message: string
    error?: string
    retryable?: boolean
}

interface ValidateOtpResult {
    success: boolean
    message: string
    error?: string
    shouldRetry?: boolean
}

/**
 * Enhanced network request function with retry logic and timeout handling
 * This provides robust networking that can handle temporary failures gracefully
 */
async function makeApiRequest<T>(
    url: string,
    options: RequestInit,
    retries: number = API_CONFIG.retries
): Promise<T> {
    let lastError: Error = new Error("Unknown network error")

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                signal: AbortSignal.timeout(API_CONFIG.timeout)
            })

            // Check if response indicates success
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}: ${response.statusText}`)
            }

            // Parse and return the JSON response
            return await response.json() as T
        } catch (error) {
            lastError = error as Error

            // Don't retry on the last attempt
            if (attempt === retries + 1) {
                break
            }

            // Only retry on network errors, not on client errors (4xx) or parsing errors
            if (error instanceof TypeError && error.message.includes("fetch")) {
                // Network error - retry with exponential backoff
                const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
                await new Promise(resolve => setTimeout(resolve, backoffMs))
                continue
            }

            // For non-network errors (like 4xx responses), don't retry
            break
        }
    }

    throw lastError
}

/**
 * Sends OTP to the specified email address
 * Integrates with session management to track sending attempts and timing
 */
export async function sendOtpToEmail(
    email: string,
    request: Request,
    purpose: string = "signup"
): Promise<SendOtpResult> {
    try {
        // Validate email format before making API call
        if (!isValidEmail(email)) {
            return {
                success: false,
                message: "Invalid email format",
                error: "Please provide a valid email address",
                retryable: false
            }
        }

        // Make the API call to send OTP
        const apiResponse = await makeApiRequest<SendOtpApiResponse>(
            `${API_CONFIG.baseUrl}/v1/request_otp`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    target: email,
                    name: purpose
                })
            }
        )

        // Check if the API indicates success
        const success = apiResponse.message === "otp sent"

        if (success) {
            // Update session with successful OTP send timestamp
            await updateOtpSession(request, {
                lastOtpSent: Date.now(),
                resendCount: await getCurrentResendCount(request) + 1
            })

            return {
                success: true,
                message: "Verification code sent successfully"
            }
        } else {
            return {
                success: false,
                message: "Failed to send verification code",
                error: `Server response: ${apiResponse.message}`,
                retryable: true
            }
        }

    } catch (error) {
        console.error("Send OTP error:", error)

        // Determine if this error is retryable based on error type
        const isNetworkError = error instanceof TypeError && error.message.includes("fetch")
        const isTimeoutError = error instanceof Error && error.message.includes("timeout")
        const retryable = isNetworkError || isTimeoutError

        // Provide user-friendly error messages based on error type
        let userMessage = "Unable to send verification code"
        if (isTimeoutError) {
            userMessage = "Request timed out. Please check your connection and try again"
        } else if (isNetworkError) {
            userMessage = "Network error. Please check your internet connection"
        } else if (error instanceof Error && error.message.includes("status 5")) {
            userMessage = "Our servers are experiencing issues. Please try again in a moment"
        }

        return {
            success: false,
            message: userMessage,
            error: error instanceof Error ? error.message : "Unknown error",
            retryable
        }
    }
}

/**
 * Validates OTP code with the backend API
 * Handles all error cases and provides detailed feedback for different failure types
 */
export async function validateOtpCode(
    email: string,
    otpCode: string,
    request: Request
): Promise<ValidateOtpResult> {
    try {
        // Validate input parameters
        if (!email || !isValidEmail(email)) {
            return {
                success: false,
                message: "Invalid email address",
                error: "Email validation failed",
                shouldRetry: false
            }
        }

        // Clean and validate OTP code format
        const cleanedOtp = otpCode.trim().replace(/\s/g, "")
        if (!/^\d{6}$/.test(cleanedOtp)) {
            return {
                success: false,
                message: "Please enter a valid 6-digit verification code",
                error: "Invalid OTP format",
                shouldRetry: true
            }
        }

        // Make the API call to validate OTP
        const apiResponse = await makeApiRequest<ValidateOtpApiResponse>(
            `${API_CONFIG.baseUrl}/v1/validate_otp`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    value: cleanedOtp,
                    target: email
                })
            }
        )

        // Parse API response and determine success
        const success = apiResponse.message === "otp correct"

        if (success) {
            // Update session to mark email as verified
            await updateOtpSession(request, {
                isEmailVerified: true,
                verificationAttempts: 0 // Reset attempts on success
            })

            return {
                success: true,
                message: "Email verified successfully"
            }
        } else {
            // Handle incorrect OTP
            const currentAttempts = await getCurrentVerificationAttempts(request)
            await updateOtpSession(request, {
                verificationAttempts: currentAttempts + 1
            })

            // Provide user-friendly message for incorrect OTP
            const remainingAttempts = 5 - (currentAttempts + 1)
            let message = "Incorrect verification code"
            if (remainingAttempts > 0) {
                message += `. ${remainingAttempts} attempts remaining`
            } else {
                message = "Too many incorrect attempts. Please request a new code"
            }

            return {
                success: false,
                message,
                error: `API response: ${apiResponse.message}`,
                shouldRetry: remainingAttempts > 0
            }
        }

    } catch (error) {
        console.error("Validate OTP error:", error)

        // Handle different types of validation errors
        const isNetworkError = error instanceof TypeError && error.message.includes("fetch")
        const isTimeoutError = error instanceof Error && error.message.includes("timeout")

        let userMessage = "Unable to verify code"
        let shouldRetry = true

        if (isTimeoutError) {
            userMessage = "Verification timed out. Please try again"
        } else if (isNetworkError) {
            userMessage = "Network error during verification. Please try again"
        } else if (error instanceof Error && error.message.includes("status 4")) {
            userMessage = "Invalid verification request. Please try again"
            shouldRetry = true
        } else if (error instanceof Error && error.message.includes("status 5")) {
            userMessage = "Server error during verification. Please try again"
            shouldRetry = true
        }

        return {
            success: false,
            message: userMessage,
            error: error instanceof Error ? error.message : "Unknown error",
            shouldRetry
        }
    }
}

/**
 * Helper function to validate email format
 * Uses comprehensive regex that handles most valid email formats
 */
function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    return emailRegex.test(email.trim())
}

/**
 * Helper function to get current resend count from session
 * Safely handles missing or corrupted session data
 */
async function getCurrentResendCount(request: Request): Promise<number> {
    try {
        const { getOtpSession } = await import("@/auth/utils/sessionManager")
        const sessionData = await getOtpSession(request)
        return sessionData.resendCount || 0
    } catch (error) {
        console.error("Error getting resend count:", error)
        return 0
    }
}

/**
 * Helper function to get current verification attempts from session
 * Provides safe fallback for error cases
 */
async function getCurrentVerificationAttempts(request: Request): Promise<number> {
    try {
        const { getOtpSession } = await import("@/auth/utils/sessionManager")
        const sessionData = await getOtpSession(request)
        return sessionData.verificationAttempts || 0
    } catch (error) {
        console.error("Error getting verification attempts:", error)
        return 0
    }
}

/**
 * Utility function to determine if an OTP operation should be retried
 * Considers both technical factors (network errors) and business logic (attempt limits)
 */
export function shouldRetryOtpOperation(
    error: string,
    operationType: "send" | "validate",
    sessionData?: Partial<OtpSessionData>
): boolean {
    // Network and timeout errors are generally retryable
    if (error.includes("network") || error.includes("timeout") || error.includes("fetch")) {
        return true
    }

    // Server errors (5xx) are often temporary and retryable
    if (error.includes("status 5")) {
        return true
    }

    // For validation operations, check if user has attempts remaining
    if (operationType === "validate" && sessionData) {
        const attempts = sessionData.verificationAttempts || 0
        return attempts < 5
    }

    // For send operations, check if user has resend attempts remaining
    if (operationType === "send" && sessionData) {
        const resends = sessionData.resendCount || 0
        return resends < 8
    }

    // Client errors (4xx) and validation errors are generally not retryable
    return false
}