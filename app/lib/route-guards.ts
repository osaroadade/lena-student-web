/**
 * Generic Route Guard Utilities
 * These are generic utilities that can be used by any feature
 */

import { redirect } from "react-router"
import { getToken, isValidToken } from "./session"

// ============================================================================
// Generic Utility Functions
// ============================================================================

/**
 * Get the redirect URL from query parameters
 * Used after successful login to redirect to intended destination
 */
export function getRedirectUrl(request: Request, fallback: string = "/dashboard"): string {
	const url = new URL(request.url)
	const redirectTo = url.searchParams.get("redirectTo")
	
	// Validate redirect URL to prevent open redirects
	if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")) {
		return redirectTo
	}
	
	return fallback
}

/**
 * Create a redirect response with the intended destination stored
 */
export function createRedirectWithDestination(
	request: Request,
	redirectTo: string = "/login"
): Response {
	const url = new URL(request.url)
	const searchParams = new URLSearchParams()
	searchParams.set("redirectTo", url.pathname + url.search)
	
	return redirect(`${redirectTo}?${searchParams}`)
}

/**
 * Check if current request is from an authenticated user
 * Generic utility - can be used by any feature
 */
export async function isAuthenticatedRequest(request: Request): Promise<boolean> {
	const token = await getToken(request)
	return !!(token && isValidToken(token))
}
