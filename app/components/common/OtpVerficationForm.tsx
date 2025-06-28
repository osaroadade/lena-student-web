import { Form, Link, useActionData, useLoaderData, useNavigation, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "react-router"
import { Button } from "@components/ui/button"
import { Label } from "@components/ui/label"
import {
    getAuthSession,
    updateAuthSession,
    clearAuthSession,
    canSendOtp
} from "@/auth/utils/sessionManager"

import {
    InputOTP,
    InputOTPGroup,
    InputOTPSeparator,
    InputOTPSlot,

} from "@components/ui/input-otp"

import { useEffect, useState } from "react"

// Types for this route's data flows
interface VerifyOtpLoaderData {
    email: string
    otpSent: boolean
    error?: string
}

interface VerifyOtpActionData {
    error?: string
    email?: string
}

// API response types
interface SendOtpResponse {
    message: string
}

interface ValidateOtpResponse {
    message: string
}

// Configuration for API calls
const API_CONFIG = {
    baseUrl: process.env.API_BASE_URL || "https://test.lena.africa",
    timeout: 10000,
    retries: 2
}

async function sendOtp(email: string, target: string = "signup"): Promise<boolean> {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/v1/request_otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                target: email,
                name: target
            }),
            signal: AbortSignal.timeout(API_CONFIG.timeout)
        })

        if (!response.ok) {
            throw new Error(`Send OTP failed with status ${response.status}`)
        }

        const data: SendOtpResponse = await response.json()

        // Check if OTP was sent successfully
        return data.message === "otp sent"
    } catch (error) {
        console.error("Send OTP error:", error)
        return false
    }
}

// Function to validate OTP code
async function validateOtp(email: string, otpCode: string): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${API_CONFIG.baseUrl}/v1/validate_otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                value: otpCode,
                target: email
            }),
            signal: AbortSignal.timeout(API_CONFIG.timeout)
        })

        if (!response.ok) {
            throw new Error(`Validate OTP failed with status ${response.status}`)
        }

        const data: ValidateOtpResponse = await response.json()

        return {
            success: data.message === "otp correct",
            message: data.message
        }
    } catch (error) {
        console.error("Validate OTP error:", error)
        return {
            success: false,
            message: "Network error occurred"
        }
    }
}

// Email validation helper
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

// Loader runs when user arrives at verify-otp page
// It retrieves email from session and automatically sends OTP
export async function loader({ request }: LoaderFunctionArgs): Promise<VerifyOtpLoaderData | Response> {
    // Get the email from secure session storage
    const sessionData = await getAuthSession(request)

    // If no email in session, redirect back to email check
    if (!sessionData.email) {
        throw redirect("/auth/check-email")
    }

    // Validate the email format (defensive programming)
    if (!isValidEmail(sessionData.email)) {
        throw redirect("/auth/check-email")
    }

    // Check if we can send OTP (rate limiting)
    if (!canSendOtp(sessionData.lastOtpSent, 1)) {
        // User tried to send OTP too recently, but we can still show the form
        return {
            email: sessionData.email,
            otpSent: true,
            error: "Please wait before requesting another code"
        }
    }

    // Attempt to send OTP automatically when user arrives
    const otpSent = await sendOtp(sessionData.email, "signup")

    if (otpSent) {
        // Update session with timestamp of successful OTP send
        await updateAuthSession(request, {
            lastOtpSent: Date.now()
        })

        return {
            email: sessionData.email,
            otpSent: true
        }
    } else {
        // OTP send failed - show error state
        return {
            email: sessionData.email,
            otpSent: false,
            error: "Unable to send verification code. Please try again."
        }
    }
}

// Action runs when user submits OTP verification form
export async function action({ request }: ActionFunctionArgs): Promise<VerifyOtpActionData | Response> {
    // Get session data to retrieve the email
    const sessionData = await getAuthSession(request)

    // If no email in session, something went wrong
    if (!sessionData.email) {
        throw redirect("/auth/check-email")
    }

    // Extract form data
    const formData = await request.formData()
    const otpCode = formData.get("otp")

    // Validate OTP code input
    if (!otpCode || typeof otpCode !== "string") {
        return {
            error: "Please enter the verification code",
            email: sessionData.email
        }
    }

    // Remove spaces and validate OTP format (6 digits)
    const cleanedOtp = otpCode.trim().replace(/\s/g, "")
    if (!/^\d{6}$/.test(cleanedOtp)) {
        return {
            error: "Please enter a valid 6-digit verification code",
            email: sessionData.email
        }
    }

    // Track verification attempts to prevent abuse
    const attempts = sessionData.verificationAttempts || 0
    if (attempts >= 5) {
        return {
            error: "Too many failed attempts. Please request a new verification code.",
            email: sessionData.email
        }
    }

    // Validate OTP with backend
    const validation = await validateOtp(sessionData.email, cleanedOtp)

    if (validation.success) {
        // OTP is correct! Clear the auth session and redirect to profile creation
        const clearSessionCookie = await clearAuthSession(request)

        // Create a new session for the next step (profile creation) with verified email
        // This time we store that the email has been verified
        return new Response(null, {
            status: 302,
            headers: {
                Location: "/auth/create-profile",
                "Set-Cookie": clearSessionCookie
            }
        })
    } else {
        // OTP is incorrect, increment attempts and show error
        await updateAuthSession(request, {
            verificationAttempts: attempts + 1
        })

        return {
            error: validation.message === "otp incorrect"
                ? "Incorrect verification code. Please try again."
                : "Unable to verify code. Please try again.",
            email: sessionData.email
        }
    }
}

export function OtpVerificationForm() {
    const loaderData = useLoaderData<VerifyOtpLoaderData>()
    const actionData = useActionData<VerifyOtpActionData>()
    const navigation = useNavigation()

    const isSubmitting = navigation.state === "submitting"

    // Determine what to show based on loader and action data
    const email = loaderData.email
    const hasError = loaderData.error || actionData?.error
    const otpWasSent = loaderData.otpSent && !loaderData.error


    // Validate OTP stuff
    const [timer, setTimer] = useState(0)
    const [resendCount, setResendCount] = useState(0)



    return (
        <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold tracking-tight">
                We sent you an email
            </h1>
            <p className="sm:text-base text-sm text-muted-foreground mt-2">
                We've sent a 6-digit verification code to{" "}
                <span className="font-foreground">{email}</span>. Please enter it
                below. <Button asChild
                    type="button"
                    variant="link"
                    disabled={timer > 0}
                    className="text-sm p-0 justify-start h-auto sm:text-base"
                >
                    <Link
                        to={changeEmail}
                    >
                        Change Email
                    </Link>
                </Button>
            </p>

            <Form
                onSubmit={(e) => {
                    e.preventDefault()
                    handleVerify(otp)
                }}
                className="mt-6 text-left"
            >
                <div className="mb-5 flex flex-col gap-2">
                    <Label htmlFor="otp" className="text-muted-foreground">Your recovery code</Label>

                    <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        id="otp"
                        onComplete={handleVerify}
                        disabled={isProcessing}
                    >
                        <InputOTPGroup>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                            </InputOTPGroup>
                            <InputOTPSeparator />
                            <InputOTPGroup>
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>

                        </InputOTPGroup>
                    </InputOTP>
                    <Button
                        type="button"
                        size={"lg"}
                        variant="link"
                        className="text-sm p-0 justify-start h-auto pt-2"
                        onClick={() => handleResendCode}
                        disabled={timer > 0 || isProcessing}
                    >
                        {timer > 0
                            ? `Resend code in ${timer}s`
                            : "Didn't receive a code? Resend"}
                    </Button>
                </div>

                <Button size={"lg"} type="submit" className="w-full mt-3" disabled={isProcessing}>
                    {isProcessing ? "Verifying..." : "Verify Code"}
                </Button>
            </Form>

            <Button
                size={"lg"}
                type="submit"
                className="w-full mt-4"
                variant={"secondary"}
                asChild
            >
                <Link
                    to={"/auth/login"}
                >
                    Back to Login
                </Link>
            </Button>
        </div>
    )
}