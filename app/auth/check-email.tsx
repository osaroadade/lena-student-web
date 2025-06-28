import { Form, useActionData, useNavigation } from "react-router"
import { redirect, type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router"
// import { type Route } from "./+types/check-email"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { createAuthSession } from "@/auth/utils/sessionManager"
interface CheckEmailActionData {
    error?: string
    email?: string
}

interface AuthenticationStatus {
    isAuthenticated: boolean
}

interface CheckEmailResponse {
    exist: boolean
}

// Configuration for API calls
const API_CONFIG = {
    baseUrl: process.env.API_BASE_URL || "https://test.lena.africa",
    timeout: 10000, // 10 second timeout
    retries: 2
}

// Simulated authentication check - replace with your actual auth service
async function checkUserAuthenticationStatus(): Promise<AuthenticationStatus> {
    // This would typically check cookies, session storage, or call your auth API
    // For now, we'll simulate an unauthenticated user
    return {
        isAuthenticated: false
    }
}

// API call to check if email exists
async function checkEmailExists(email: string): Promise<boolean> {
    const url = `${API_CONFIG.baseUrl}/v1/user/check_email`

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email }),
        // Add timeout signal to prevent hanging requests
        signal: AbortSignal.timeout(API_CONFIG.timeout)
    })

    // Check if the response is successful
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
    }

    // Parse and validate the response
    const data: CheckEmailResponse = await response.json()

    // Validate that the response has the expected structure
    if (typeof data.exist !== "boolean") {
        throw new Error("Invalid response format from email check API")
    }

    return data.exist
}

// Email validation helper function
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export async function loader({ request }: LoaderFunctionArgs) {
    // Check if user is already authenticated before showing email form
    const authStatus = await checkUserAuthenticationStatus()

    if (authStatus.isAuthenticated) {
        throw redirect("/")
    }

    // User is not authenticated, allow them to proceed with email checking
    return null
}

// Helper function for API calls with retry logic
async function makeApiCallWithRetry<T>(
    apiCall: () => Promise<T>,
    retries: number = API_CONFIG.retries
): Promise<T> {
    let lastError: Error = new Error("Unknown error occurred")

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
        try {
            return await apiCall()
        } catch (error) {
            lastError = error as Error

            // Don't retry on the last attempt
            if (attempt === retries + 1) {
                break
            }

            // Only retry on network errors, not on validation errors
            if (error instanceof TypeError && error.message.includes("fetch")) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
                continue
            }

            // For non-network errors, don't retry
            break
        }
    }

    throw lastError
}

// This action runs when the user submits the email form
// It checks if the email exists and redirects to login or registration
export async function action({ request }: ActionFunctionArgs): Promise<CheckEmailActionData | Response> {
    // Extract form data from the request
    const formData = await request.formData()
    const email = formData.get('email')

    // Validate that email was provided and is a string
    if (!email || typeof email !== "string") {
        return {
            error: "Please enter an email address",
            email: ""
        }
    }

    // Validate email format before proceeding
    if (!isValidEmail(email)) {
        return {
            error: "Please enter a valid email address",
            email: email
        }
    }

    let emailExists: boolean

    try {
        // Make API call with retry logic
        emailExists = await makeApiCallWithRetry(() => checkEmailExists(email))
    } catch (error) {

        // Provide user-friendly error messages based on error type
        if (error instanceof TypeError && error.message.includes("fetch")) {
            return {
                error: "Unable to connect to our servers. Please check your internet connection and try again.",
                email: email
            }
        }

        if (error instanceof Error && error.message.includes("timeout")) {
            return {
                error: "The request took too long. Please try again.",
                email: email
            }
        }

        if (error instanceof Error && error.message.includes("status")) {
            return {
                error: "Our servers are experiencing issues. Please try again in a few moments.",
                email: email
            }
        }

        // Generic fallback error message
        return {
            error: "Unable to check email. Please try again.",
            email: email
        }
    }

    if (emailExists) {
        // Email exists, redirect to login with email pre-filled
        throw redirect("/auth/login")
    } else {
        // Email doesn't exist, redirect to registration with email pre-filled
        throw await createAuthSession(
            { email: email },
            "/auth/verify-otp"
        )
    }
}

export default function CheckEmail() {
    // Get any error data returned from the action
    const actionData = useActionData<CheckEmailActionData>()

    // Get navigation state to show loading indicators
    const navigation = useNavigation()
    const isSubmitting = navigation.state === "submitting"

    return (
        <div className="w-full max-w-md">
            <h1 className="text-xl font-semibold tracking-tight">
                Enter your email address to continue
            </h1>
            <p className="sm:text-base text-sm text-muted-foreground mt-2">
                We suggest using the email address provided by your school.
            </p>

            <Form method="post" className="mt-6 text-left">
                <div className="mb-6 flex flex-col gap-2">
                    <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                    <Input
                        type="email"
                        id="email"
                        name="email"
                        className="focus-visible:ring-2"
                        placeholder="your.name@school.edu"
                        required
                        disabled={isSubmitting}
                        defaultValue={actionData?.email || ""}
                    />
                    {/* Display any error messages from the action */}
                    {/* I would like this to be removed when the user interacts with the input field */}
                    {actionData?.error && (
                        <p className="text-sm text-red-600 mt-1">
                            {actionData.error}
                        </p>
                    )}
                </div>

                <Button
                    size="sm"
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Checking..." : "Continue"}
                </Button>
            </Form>

            <div className="mt-6 sm:text-sm text-xs">
                <p className="text-muted-foreground font-normal">By continuing, you agree to our <a href="https://lena.africa/terms-and-condition" target="_blank" className="text-primary underline-offset-4 hover:underline">Terms of Service</a> and <a href="https://lena.africa/privacy-policy" target="_blank" className="text-primary underline-offset-4 hover:underline">Privacy Policy</a>.</p>
            </div>
        </div>
    )
}