// Enhanced session management utilities for secure OTP verification
import { createCookieSessionStorage } from "react-router"

// Create session storage configuration with enhanced security
const sessionStorage = createCookieSessionStorage({
    cookie: {
        name: "lena_auth_session",
        secure: process.env.NODE_ENV === "production",
        secrets: [process.env.SESSION_SECRET || "dev-secret-key"],
        sameSite: "lax",
        maxAge: 60 * 60 * 2, // 2 hours for OTP verification process
        httpOnly: true
    }
})

// Interface for comprehensive OTP session data
export interface OtpSessionData {
    email?: string
    verificationAttempts?: number
    resendCount?: number
    lastOtpSent?: number
    sessionStarted?: number
    isEmailVerified?: boolean
}

// Configuration for OTP timing and limits
const OTP_CONFIG = {
    initialCooldownSeconds: 20, // First resend cooldown
    cooldownIncrementSeconds: 10, // Additional seconds for each subsequent resend
    maxVerificationAttempts: 5, // Maximum incorrect OTP attempts
    maxResendAttempts: 8, // Maximum resend attempts per session
    sessionTimeoutMinutes: 30 // Maximum time for entire OTP verification process
}

/**
 * Retrieves current OTP session data from the request
 * This function safely handles corrupted or missing session data
 */
export async function getOtpSession(request: Request): Promise<OtpSessionData> {
    try {
        const session = await sessionStorage.getSession(request.headers.get("Cookie"))
        return {
            email: session.get("email"),
            verificationAttempts: session.get("verificationAttempts") || 0,
            resendCount: session.get("resendCount") || 0,
            lastOtpSent: session.get("lastOtpSent"),
            sessionStarted: session.get("sessionStarted") || Date.now(),
            isEmailVerified: session.get("isEmailVerified") || false
        }
    } catch (error) {
        console.error("Error reading OTP session:", error)
        return {
            verificationAttempts: 0,
            resendCount: 0,
            sessionStarted: Date.now(),
            isEmailVerified: false
        }
    }
}

/**
 * Creates a new OTP session when starting email verification process
 * This establishes the secure foundation for the entire OTP flow
 */
export async function createOtpSession(
    email: string,
    redirectTo: string
): Promise<Response> {
    const session = await sessionStorage.getSession()

    // Initialize session with email and starting timestamp
    session.set("email", email)
    session.set("verificationAttempts", 0)
    session.set("resendCount", 0)
    session.set("sessionStarted", Date.now())
    session.set("isEmailVerified", false)

    return new Response(null, {
        status: 302,
        headers: {
            Location: redirectTo,
            "Set-Cookie": await sessionStorage.commitSession(session)
        }
    })
}

/**
 * Updates OTP session data with new information
 * Returns updated session cookie for the response
 */
export async function updateOtpSession(
    request: Request,
    updates: Partial<OtpSessionData>
): Promise<string> {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"))

    // Apply all updates to the session
    Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
            session.set(key, value)
        }
    })

    return await sessionStorage.commitSession(session)
}

/**
 * Clears OTP session data after successful verification
 * Optionally preserves verified email for next step in authentication flow
 */
export async function clearOtpSession(
    request: Request,
    preserveVerifiedEmail: boolean = false
): Promise<string> {
    const session = await sessionStorage.getSession(request.headers.get("Cookie"))

    if (preserveVerifiedEmail) {
        const email = session.get("email")
        session.unset("verificationAttempts")
        session.unset("resendCount")
        session.unset("lastOtpSent")
        session.unset("sessionStarted")
        session.set("isEmailVerified", true)
        session.set("verifiedEmail", email)
    } else {
        // Complete session destruction
        return await sessionStorage.destroySession(session)
    }

    return await sessionStorage.commitSession(session)
}

/**
 * Calculates dynamic cooldown period based on resend count
 * Implements incremental backoff to prevent spam while remaining user-friendly
 */
export function calculateCooldownSeconds(resendCount: number): number {
    return OTP_CONFIG.initialCooldownSeconds + (resendCount * OTP_CONFIG.cooldownIncrementSeconds)
}

/**
 * Determines if enough time has passed to allow OTP resend
 * Enforces server-side timing that users cannot manipulate
 */
export function canResendOtp(lastOtpSent?: number, resendCount: number = 0): boolean {
    if (!lastOtpSent) {
        return true // First OTP send is always allowed
    }

    const cooldownMs = calculateCooldownSeconds(resendCount) * 1000
    const timeSinceLastSend = Date.now() - lastOtpSent

    return timeSinceLastSend >= cooldownMs
}

/**
 * Calculates when the next OTP resend will be allowed
 * Provides precise timing information for user feedback
 */
export function getNextResendTime(lastOtpSent?: number, resendCount: number = 0): number | undefined {
    if (!lastOtpSent || canResendOtp(lastOtpSent, resendCount)) {
        return undefined // Resend is already allowed
    }

    const cooldownMs = calculateCooldownSeconds(resendCount) * 1000
    return lastOtpSent + cooldownMs
}

/**
 * Validates current session state and determines if OTP verification can proceed
 * Performs comprehensive checks for session validity and rate limiting
 */
export function validateOtpSession(sessionData: OtpSessionData): {
    isValid: boolean
    error?: string
    canVerify: boolean
    canResend: boolean
    nextResendTime?: number
} {
    // Check if session has required email
    if (!sessionData.email) {
        return {
            isValid: false,
            error: "No email found in session",
            canVerify: false,
            canResend: false
        }
    }

    // Check if email is already verified
    if (sessionData.isEmailVerified) {
        return {
            isValid: false,
            error: "Email already verified",
            canVerify: false,
            canResend: false
        }
    }

    // Check session timeout
    const sessionAge = Date.now() - (sessionData.sessionStarted || 0)
    const sessionTimeoutMs = OTP_CONFIG.sessionTimeoutMinutes * 60 * 1000
    if (sessionAge > sessionTimeoutMs) {
        return {
            isValid: false,
            error: "Session expired",
            canVerify: false,
            canResend: false
        }
    }

    // Check verification attempts
    const canVerify = (sessionData.verificationAttempts || 0) < OTP_CONFIG.maxVerificationAttempts

    // Check resend attempts
    const resendCount = sessionData.resendCount || 0
    const canResendCount = resendCount < OTP_CONFIG.maxResendAttempts
    const canResendTiming = canResendOtp(sessionData.lastOtpSent, resendCount)
    const canResend = canResendCount && canResendTiming

    // Calculate next resend time for user feedback
    const nextResendTime = getNextResendTime(sessionData.lastOtpSent, resendCount)

    return {
        isValid: true,
        canVerify,
        canResend,
        nextResendTime
    }
}

/**
 * Helper function to get user-friendly error messages
 * Translates technical session states into clear user communication
 */
export function getSessionErrorMessage(sessionData: OtpSessionData): string | null {
    const validation = validateOtpSession(sessionData)

    if (!validation.isValid) {
        switch (validation.error) {
            case "No email found in session":
                return "Your session has expired. Please start the verification process again."
            case "Email already verified":
                return "This email has already been verified."
            case "Session expired":
                return "Your verification session has expired. Please start again."
            default:
                return "There was a problem with your verification session."
        }
    }

    if (!validation.canVerify) {
        return `Too many incorrect attempts. Please request a new verification code.`
    }

    return null
}