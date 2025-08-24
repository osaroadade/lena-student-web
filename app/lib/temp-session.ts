/**
 * Temporary session storage for email verification flow
 * Uses server-side cookies to securely pass email between get-started and login/register pages
 */

import { createCookie } from "react-router"

// Configuration from environment variables
const TEMP_EMAIL_COOKIE_NAME = import.meta.env.VITE_TEMP_EMAIL_COOKIE_NAME || "temp-email"
const TEMP_EMAIL_MAX_AGE = parseInt(import.meta.env.VITE_TEMP_EMAIL_MAX_AGE || "300") // Default: 5 minutes
const SESSION_SECRET = import.meta.env.VITE_SESSION_SECRET

// Create a temporary cookie for email verification flow
const tempEmailCookie = createCookie(TEMP_EMAIL_COOKIE_NAME, {
	httpOnly: true,
	    secure: import.meta.env.PROD,
	sameSite: "lax",
	maxAge: TEMP_EMAIL_MAX_AGE,
	path: "/",
	// Add secret for signing cookies if provided
	...(SESSION_SECRET ? { secrets: [SESSION_SECRET] } : {})
})

/**
 * Set temporary email in cookie for verification flow
 */
export async function setTempEmail(email: string): Promise<string> {
	return await tempEmailCookie.serialize(email)
}

/**
 * Get temporary email from cookie
 */
export async function getTempEmail(request: Request): Promise<string | null> {
	const cookieHeader = request.headers.get("Cookie")
	return await tempEmailCookie.parse(cookieHeader)
}

/**
 * Clear temporary email cookie
 */
export async function clearTempEmail(): Promise<string> {
	return await tempEmailCookie.serialize("", { maxAge: 0 })
}
