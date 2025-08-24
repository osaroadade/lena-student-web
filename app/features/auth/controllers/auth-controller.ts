/**
 * Auth Controllers - Handle React Router actions
 * This is the "C" in MVC - coordinates between Model and View
 */

import { redirect } from "react-router"
import { LoginModel } from "../models/login-model"
import { EmailCheckModel } from "../models/email-check-model"
import { SessionModel } from "../models/session-model"
import { getRedirectUrl } from "~/lib/route-guards"
import type { LoginResponse, EmailCheckResponse } from "../models/types"

// ============================================================================
// Auth Controllers Class
// ============================================================================

export class AuthController {
    
    // ========================================================================
    // Login Controller
    // ========================================================================
    
    /**
     * Handle login form submission (React Router action)
     */
    static async handleLogin(request: Request): Promise<Response | LoginResponse> {
        try {
            const formData = await request.formData()
            
            // Get email from temp session (set by get-started flow)
            const tempEmail = await SessionModel.getTempEmail(request)
            if (!tempEmail) {
                return {
                    success: false,
                    errors: {
                        email: "Your session has expired. Please go back and start again."
                    }
                }
            }
            
            // Get form data
            const password = String(formData.get("password") || "")
            
            // Call model to handle login logic
            const result = await LoginModel.loginUser({
                email: tempEmail,
                password
            })
            
            // If successful, create session and redirect
            if (result.success && result.profile) {
                const redirectTo = getRedirectUrl(request, "/dashboard")
                const response = redirect(redirectTo)
                
                // Set session cookie
                const sessionCookie = await SessionModel.createSession(result.profile)
                response.headers.set("Set-Cookie", sessionCookie)
                
                return response
            }
            
            // Return errors for display
            return result
            
        } catch (error) {
            console.error("Login controller error:", error)
            return {
                success: false,
                errors: {
                    password: "An unexpected error occurred. Please try again."
                }
            }
        }
    }
    
    /**
     * Handle login page loader (ensure user has temp email)
     */
    static async handleLoginLoader(request: Request): Promise<Response | { email: string }> {
        // Check if already authenticated
        const hasValidSession = await SessionModel.hasValidSession(request)
        if (hasValidSession) {
            const redirectTo = getRedirectUrl(request, "/dashboard")
            return redirect(redirectTo)
        }
        
        // Get temp email from secure cookie
        const tempEmail = await SessionModel.getTempEmail(request)
        
        // If no temp email, redirect to get-started
        if (!tempEmail) {
            return redirect("/get-started")
        }
        
        return { email: tempEmail }
    }
    
    // ========================================================================
    // Email Check Controller (Get Started)
    // ========================================================================
    
    /**
     * Handle email check form submission (React Router action)
     */
    static async handleEmailCheck(request: Request): Promise<Response | EmailCheckResponse> {
        try {
            const formData = await request.formData()
            const email = String(formData.get("email") || "")
            
            // Call model to check email and get result
            const result = await EmailCheckModel.checkEmailExists({ email })
            
            // If successful, store temp email and redirect
            if (result.success) {
                const tempEmailCookie = await SessionModel.storeTempEmail(email)
                const response = redirect(result.redirectTo || "/login")
                response.headers.set("Set-Cookie", tempEmailCookie)
                return response
            }
            
            // Return errors for display
            return result
            
        } catch (error) {
            console.error("Email check controller error:", error)
            return {
                success: false,
                exists: false,
                errors: {
                    email: "An unexpected error occurred. Please try again."
                }
            }
        }
    }
    
    /**
     * Handle get-started page loader (ensure user is guest)
     */
    static async handleGetStartedLoader(request: Request): Promise<Response | null> {
        // Check if already authenticated
        const hasValidSession = await SessionModel.hasValidSession(request)
        if (hasValidSession) {
            const redirectTo = getRedirectUrl(request, "/dashboard")
            return redirect(redirectTo)
        }
        
        // Guest user - allow access
        return null
    }
    
    // ========================================================================
    // Logout Controller
    // ========================================================================
    
    /**
     * Handle logout action
     */
    static async handleLogout(): Promise<Response> {
        // Get the headers to clear the cookies
        const clearSessionHeader = await SessionModel.clearSession()
        const clearTempHeader = await SessionModel.clearTempEmail()

        // Redirect to home and append both Set-Cookie headers
        const response = redirect("/")
        response.headers.append("Set-Cookie", clearSessionHeader)
        response.headers.append("Set-Cookie", clearTempHeader)

        return response
    }
    
    // ========================================================================
    // Session Validation
    // ========================================================================
    
    /**
     * Require authentication for protected routes
     */
    static async requireAuth(request: Request, fallbackPath: string = "/get-started"): Promise<Response | null> {
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
    static async requireGuest(request: Request, fallbackPath: string = "/dashboard"): Promise<Response | null> {
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
}
