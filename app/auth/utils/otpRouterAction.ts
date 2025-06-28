// React Router actions for OTP verification operations
import { type ActionFunctionArgs, json, redirect } from "react-router"
import {
    getOtpSession,
    updateOtpSession,
    clearOtpSession,
    validateOtpSession,
    getSessionErrorMessage
} from "@/auth/utils/sessionManager"
import { sendOtpToEmail, validateOtpCode } from "@/auth/utils/otpApiIntegration"

// Action result interfaces for type safety and clear contracts
interface OtpActionResult {
    success: boolean
    message: string
    error?: string
    canRetry?: boolean
    nextResendTime?: number
    sessionState?: {
        canVerify: boolean
        canResend: boolean
        attemptsRemaining: number
        resendsRemaining: number
    }
}

/**
 * Main OTP verification action that handles both validation and resend operations
 * This action demonstrates the coordination pattern between UI, business logic, and API calls
 */
export async function otpVerificationAction({ request }: ActionFunctionArgs): Promise<Response> {
    // Extract form data to determine what operation the user wants to perform
    const formData = await request.formData()
    const intent = formData.get("intent") as string

    // Get current session state to understand user's verification context
    const sessionData = await getOtpSession(request)
    const sessionValidation = validateOtpSession(sessionData)

    // If session is invalid, redirect user back to start the process over
    if (!sessionValidation.isValid) {
        const errorMessage = getSessionErrorMessage(sessionData)
        throw redirect(`/auth/check-email?error=${encodeURIComponent(errorMessage || "Session expired")}`)
    }

    // Route to appropriate handler based on user's intent
    switch (intent) {
        case "validate":
            return await handleOtpValidation(request, formData, sessionData)
        case "resend":
            return await handleOtpResend(request, sessionData)
        default:
            return json<OtpActionResult>({
                success: false,
                message: "Invalid operation",
                error: "Unknown intent provided",
                canRetry: false
            }, { status: 400 })
    }
}

/**
 * Handles OTP code validation with comprehensive error handling and session management
 * This function demonstrates how to coordinate between user input, API calls, and state updates
 */
async function handleOtpValidation(
    request: Request,
    formData: FormData,
    sessionData: any
): Promise<Response> {
    const otpCode = formData.get("otp") as string

    // Validate that OTP code was provided
    if (!otpCode || typeof otpCode !== "string") {
        return json<OtpActionResult>({
            success: false,
            message: "Please enter the verification code",
            error: "No OTP code provided",
            canRetry: true,
            sessionState: buildSessionState(sessionData)
        })
    }

    // Check if user has verification attempts remaining
    const sessionValidation = validateOtpSession(sessionData)
    if (!sessionValidation.canVerify) {
        return json<OtpActionResult>({
            success: false,
            message: "Too many incorrect attempts. Please request a new verification code.",
            error: "Verification attempts exceeded",
            canRetry: false,
            sessionState: buildSessionState(sessionData)
        })
    }

    // Attempt to validate the OTP code with the backend
    const validationResult = await validateOtpCode(sessionData.email, otpCode, request)

    if (validationResult.success) {
        // OTP validation succeeded! Clear session and redirect to next step
        const clearCookie = await clearOtpSession(request, true)

        // Redirect to profile creation with success state
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/auth/create-profile?verified=true",
                "Set-Cookie": clearCookie
            }
        })
    } else {
        // OTP validation failed - return error with updated session state
        const updatedSessionData = await getOtpSession(request)

        return json<OtpActionResult>({
            success: false,
            message: validationResult.message,
            error: validationResult.error,
            canRetry: validationResult.shouldRetry,
            sessionState: buildSessionState(updatedSessionData)
        })
    }
}

/**
 * Handles OTP resend requests with rate limiting and attempt tracking
 * This function shows how to implement user-friendly rate limiting with clear feedback
 */
async function handleOtpResend(
    request: Request,
    sessionData: any
): Promise<Response> {
    // Validate session state for resend operation
    const sessionValidation = validateOtpSession(sessionData)

    if (!sessionValidation.canResend) {
        // Determine why resend is not allowed and provide specific feedback
        let message = "Cannot send verification code at this time"
        let canRetry = false

        if (sessionValidation.nextResendTime) {
            const waitSeconds = Math.ceil((sessionValidation.nextResendTime - Date.now()) / 1000)
            message = `Please wait ${waitSeconds} seconds before requesting another code`
            canRetry = true
        } else if ((sessionData.resendCount || 0) >= 8) {
            message = "Maximum resend attempts reached. Please start the verification process again"
            canRetry = false
        }

        return json<OtpActionResult>({
            success: false,
            message,
            error: "Resend rate limited",
            canRetry,
            nextResendTime: sessionValidation.nextResendTime || undefined,
            sessionState: buildSessionState(sessionData)
        })
    }

    // Attempt to send new OTP code
    const sendResult = await sendOtpToEmail(sessionData.email, request, "signup")

    if (sendResult.success) {
        // OTP sent successfully - get updated session state for response
        const updatedSessionData = await getOtpSession(request)
        const updatedValidation = validateOtpSession(updatedSessionData)

        return json<OtpActionResult>({
            success: true,
            message: sendResult.message,
            canRetry: true,
            nextResendTime: updatedValidation.nextResendTime || undefined,
            sessionState: buildSessionState(updatedSessionData)
        })
    } else {
        // OTP send failed - return error with current session state
        return json<OtpActionResult>({
            success: false,
            message: sendResult.message,
            error: sendResult.error,
            canRetry: sendResult.retryable || false,
            sessionState: buildSessionState(sessionData)
        })
    }
}

/**
 * Builds standardized session state object for client-side use
 * This creates a clean interface between server-side session data and client-side UI needs
 */
function buildSessionState(sessionData: any): {
    canVerify: boolean
    canResend: boolean
    attemptsRemaining: number
    resendsRemaining: number
} {
    const validation = validateOtpSession(sessionData)
    const attemptsUsed = sessionData.verificationAttempts || 0
    const resendsUsed = sessionData.resendCount || 0

    return {
        canVerify: validation.canVerify,
        canResend: validation.canResend,
        attemptsRemaining: Math.max(0, 5 - attemptsUsed),
        resendsRemaining: Math.max(0, 8 - resendsUsed)
    }
}

/**
 * Loader function for the OTP verification page
 * This automatically sends initial OTP when user arrives and provides session context
 */
export async function otpVerificationLoader({ request }: ActionFunctionArgs): Promise<Response> {
    // Get current session state
    const sessionData = await getOtpSession(request)
    const sessionValidation = validateOtpSession(sessionData)

    // If session is invalid, redirect to start verification process
    if (!sessionValidation.isValid) {
        const errorMessage = getSessionErrorMessage(sessionData)
        throw redirect(`/auth/check-email?error=${encodeURIComponent(errorMessage || "Please start the verification process")}`)
    }

    // If email is already verified, redirect to next step
    if (sessionData.isEmailVerified) {
        throw redirect("/auth/create-profile?verified=true")
    }

    // Check if we should automatically send OTP on page load
    const shouldSendInitialOtp = !sessionData.lastOtpSent || sessionValidation.canResend

    let otpSendResult = null
    if (shouldSendInitialOtp) {
        // Ensure email is defined before sending OTP
        if (!sessionData.email || typeof sessionData.email !== "string") {
            throw redirect("/auth/check-email?error=missing_email")
        }
        // Automatically send OTP when user arrives at verification page
        otpSendResult = await sendOtpToEmail(sessionData.email, request, "signup")

        // If automatic send failed, user can still try to resend manually
        if (!otpSendResult.success) {
            console.warn("Failed to automatically send OTP on page load:", otpSendResult.error)
        }
    }

    // Get updated session data after potential OTP send
    const updatedSessionData = await getOtpSession(request)
    const updatedValidation = validateOtpSession(updatedSessionData)

    // Return loader data for the component
    return json({
        email: sessionData.email,
        otpSent: shouldSendInitialOtp && otpSendResult?.success,
        autoSendError: shouldSendInitialOtp && !otpSendResult?.success ? otpSendResult?.message : null,
        sessionState: buildSessionState(updatedSessionData),
        nextResendTime: updatedValidation.nextResendTime
    })
}

/**
 * Helper action for the check-email route to create OTP sessions
 * This bridges between email checking and OTP verification
 */
export async function createOtpVerificationSession(email: string): Promise<Response> {
    // Import session utilities dynamically to avoid circular dependencies
    const { createOtpSession } = await import("@/auth/utils/sessionManager")

    // Create new OTP session and redirect to verification page
    return await createOtpSession(email, "/auth/verify-otp")
}

/**
 * Error boundary action for handling unexpected errors in OTP flow
 * This provides graceful degradation when things go wrong
 */
export async function otpErrorAction({ request }: ActionFunctionArgs): Promise<Response> {
    const formData = await request.formData()
    const errorType = formData.get("errorType") as string

    // Log error for debugging while providing user-friendly response
    console.error("OTP verification error:", errorType)

    // Clear potentially corrupted session and redirect to start
    try {
        const clearCookie = await clearOtpSession(request, false)
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/auth/check-email?error=verification_error",
                "Set-Cookie": clearCookie
            }
        })
    } catch (error) {
        // If even clearing the session fails, do a simple redirect
        throw redirect("/auth/check-email?error=session_error")
    }
}