/**
 * Auth Guards - Feature-specific route protection
 * These are auth-specific implementations of route guards
 */

import { redirect } from "react-router"
import type { LoaderFunctionArgs } from "react-router"
import { SessionModel } from "../models/session-model"
import { getRedirectUrl } from "~/lib/route-guards"

// ============================================================================
// Auth-Specific Guards
// ============================================================================

/**
 * Require authentication for a route
 * Redirects to get-started if user is not authenticated
 */
export async function requireAuth(request: Request, fallbackPath: string = "/get-started"): Promise<Response | null> {
    const hasValidSession = await SessionModel.hasValidSession(request)
    
    if (!hasValidSession) {
        const url = new URL(request.url)
        const searchParams = new URLSearchParams()
        searchParams.set("redirectTo", url.pathname + url.search)
        
        return redirect(`${fallbackPath}?${searchParams}`)
    }
    
    return null
}

/**
 * Require guest access (redirect if already authenticated)
 */
export async function requireGuest(request: Request, fallbackPath: string = "/dashboard"): Promise<Response | null> {
    const hasValidSession = await SessionModel.hasValidSession(request)
    
    if (hasValidSession) {
        // Check for redirectTo query parameter
        const url = new URL(request.url)
        const intendedDestination = url.searchParams.get("redirectTo")
        
        if (intendedDestination && intendedDestination.startsWith("/")) {
            return redirect(intendedDestination)
        }
        
        return redirect(fallbackPath)
    }
    
    return null
}

// ============================================================================
// Higher-Order Functions for React Router Loaders
// ============================================================================

/**
 * Create a loader that requires authentication
 */
export function createAuthLoader(
    loaderFn?: (args: LoaderFunctionArgs) => Promise<any> | any,
    fallbackPath: string = "/get-started"
) {
    return async (args: LoaderFunctionArgs) => {
        // Check auth first
        const authResult = await requireAuth(args.request, fallbackPath)
        if (authResult) return authResult
        
        // If loader provided, call it
        if (loaderFn) {
            return await loaderFn(args)
        }
        
        return null
    }
}

/**
 * Create a loader that requires guest access
 */
export function createGuestLoader(
    loaderFn?: (args: LoaderFunctionArgs) => Promise<any> | any,
    fallbackPath: string = "/dashboard"
) {
    return async (args: LoaderFunctionArgs) => {
        // Check guest access first
        const guestResult = await requireGuest(args.request, fallbackPath)
        if (guestResult) return guestResult
        
        // If loader provided, call it
        if (loaderFn) {
            return await loaderFn(args)
        }
        
        return null
    }
}

// ============================================================================
// Common Guard Patterns
// ============================================================================

/**
 * Standard auth guard for protected routes
 */
export const authGuard = createAuthLoader()

/**
 * Standard guest guard for auth pages
 */
export const guestGuard = createGuestLoader()

/**
 * Role-based guard for teacher routes
 */
export function createTeacherLoader(
    loaderFn?: (args: LoaderFunctionArgs) => Promise<any> | any
) {
    return createAuthLoader(async (args) => {
        // TODO: Check if user is teacher from token/profile
        // For now, redirect all to unauthorized
        return redirect("/unauthorized")
        
        // If teacher check passes and loader provided, call it
        // if (loaderFn) {
        //     return await loaderFn(args)
        // }
        // return null
    })
}
