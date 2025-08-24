/**
 * Session management utilities for authentication
 * Handles token storage in cookies (SSR) and sessionStorage (client)
 */

import { createCookie } from "react-router"
import type { ProfileView, SessionData } from "./types"

// ============================================================================
// Configuration
// ============================================================================

// Configuration from environment variables
const SESSION_STORAGE_KEY = "lena_session"
const SESSION_COOKIE_NAME = import.meta.env.VITE_SESSION_COOKIE_NAME || "lena_token"
const SESSION_MAX_AGE = parseInt(import.meta.env.VITE_SESSION_MAX_AGE || "604800") // Default: 7 days
const SESSION_SECRET = import.meta.env.VITE_SESSION_SECRET

// Create a session cookie
const sessionCookie = createCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    // Add secret for signing cookies if provided
    ...(SESSION_SECRET ? { secrets: [SESSION_SECRET] } : {})
})


// ============================================================================
// JWT Token Utilities
// ============================================================================

/**
 * Decode JWT token payload (without verification)
 * Used to check expiration time
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
	try {
		const parts = token.split(".")
		if (parts.length !== 3) return null
		
		const payload = parts[1]
		const decoded = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
		return JSON.parse(decoded)
	} catch {
		return null
	}
}

/**
 * Check if JWT token is expired
 */
function isTokenExpired(token: string): boolean {
	const payload = decodeJwtPayload(token)
	if (!payload || typeof payload.exp !== "number") {
		return true // Assume expired if we can't decode
	}
	
	const now = Math.floor(Date.now() / 1000)
	return payload.exp < now
}

/**
 * Get token expiration timestamp
 */
function getTokenExpiration(token: string): number | null {
	const payload = decodeJwtPayload(token)
	if (!payload || typeof payload.exp !== "number") {
		return null
	}
	
	return payload.exp * 1000 // Convert to milliseconds
}

// ============================================================================
// Server-Side Session Management (Cookies)
// ============================================================================

/**
 * Get token from request cookies (server-side)
 */
export async function getTokenFromRequest(request: Request): Promise<string | null> {
	const cookieHeader = request.headers.get("Cookie")
	return await sessionCookie.parse(cookieHeader)
}

/**
 * Set session cookie in response (server-side)
 */
export async function setSessionCookie(profile: ProfileView): Promise<string> {
	return await sessionCookie.serialize(profile.token)
}

/**
 * Clear session cookie (server-side)
 */
export async function clearSessionCookie(): Promise<string> {
	return await sessionCookie.serialize("", {
		maxAge: 0
	})
}

// ============================================================================
// Client-Side Session Management
// ============================================================================

/**
 * Get session data from browser storage (client-side)
 */
export function getSessionFromStorage(): SessionData | null {
	if (typeof window === "undefined") return null
	
	try {
		const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
		if (!stored) return null
		
		const session: SessionData = JSON.parse(stored)
		
		// Check if token is expired
		if (isTokenExpired(session.token)) {
			clearSessionFromStorage()
			return null
		}
		
		return session
	} catch {
		clearSessionFromStorage()
		return null
	}
}

/**
 * Set session data in browser storage (client-side)
 */
export function setSessionInStorage(profile: ProfileView): void {
	if (typeof window === "undefined") return
	
	const expiresAt = getTokenExpiration(profile.token)
	if (!expiresAt) {
		console.warn("Cannot determine token expiration, using 7 days")
		// Fallback to 7 days from now
		const sevenDays = 7 * 24 * 60 * 60 * 1000
		const fallbackExpiry = Date.now() + sevenDays
		
		const session: SessionData = {
			profile,
			token: profile.token,
			expiresAt: fallbackExpiry
		}
		
		sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
		return
	}
	
	const session: SessionData = {
		profile,
		token: profile.token,
		expiresAt
	}
	
	sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
}

/**
 * Clear session data from browser storage (client-side)
 */
export function clearSessionFromStorage(): void {
	if (typeof window === "undefined") return
	
	sessionStorage.removeItem(SESSION_STORAGE_KEY)
}

/**
 * Get current token from storage (client-side)
 */
export function getCurrentToken(): string | null {
	const session = getSessionFromStorage()
	return session?.token || null
}

/**
 * Get current profile from storage (client-side)
 */
export function getCurrentProfile(): ProfileView | null {
	const session = getSessionFromStorage()
	return session?.profile || null
}

// ============================================================================
// Universal Session Management
// ============================================================================

/**
 * Get token from either request (server) or storage (client)
 */
export async function getToken(request?: Request): Promise<string | null> {
	// Server-side: get from request cookies
	if (request) {
		const token = await getTokenFromRequest(request)
		if (token && !isTokenExpired(token)) {
			return token
		}
		return null
	}
	
	// Client-side: get from sessionStorage
	return getCurrentToken()
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(request?: Request): Promise<boolean> {
	return (await getToken(request)) !== null
}

/**
 * Clear all session data (both cookie and storage)
 */
export function logout(): void {
	// Clear client-side storage
	clearSessionFromStorage()
	
	// The server-side cookie should be cleared by a dedicated logout action
}

// ============================================================================
// Session Validation
// ============================================================================

/**
 * Check if a token is valid (not expired)
 */
export function isValidToken(token: string): boolean {
	if (!token) return false
	return !isTokenExpired(token)
}

/**
 * Get session expiration time in milliseconds
 */
export async function getSessionExpiration(request?: Request): Promise<number | null> {
	const token = await getToken(request)
	if (!token) return null
	
	return getTokenExpiration(token)
}

/**
 * Check if session will expire soon (within next hour)
 */
export async function shouldRefreshSession(request?: Request): Promise<boolean> {
	const expiresAt = await getSessionExpiration(request)
	if (!expiresAt) return false
	
	const oneHour = 60 * 60 * 1000
	return expiresAt - Date.now() < oneHour
}
