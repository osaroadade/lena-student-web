/**
 * Session Model - Handles only session management business logic  
 * Single Responsibility: Manage user session cookies and validation
 */

import { 
    setSessionCookie, 
    clearSessionCookie,
    getToken,
    isValidToken 
} from "~/lib/session"
import { 
    setTempEmail, 
    getTempEmail, 
    clearTempEmail 
} from "~/lib/temp-session"
import type { ProfileView } from "~/lib/types"

// ============================================================================
// Session Model Class
// ============================================================================

export class SessionModel {
    
    // ========================================================================
    // Permanent Session Management
    // ========================================================================
    
    /**
     * Create session after successful login
     */
    static async createSession(profile: ProfileView): Promise<string> {
        return await setSessionCookie(profile)
    }
    
    /**
     * Clear user session (logout)
     */
    static async clearSession(): Promise<string> {
        return await clearSessionCookie()
    }
    
    /**
     * Check if user has valid session
     */
    static async hasValidSession(request: Request): Promise<boolean> {
        try {
            const token = await getToken(request)
            return !!(token && isValidToken(token))
        } catch {
            return false
        }
    }
    
    // ========================================================================
    // Temporary Email Session (for multi-step flow)
    // ========================================================================
    
    /**
     * Store email temporarily for login flow
     */
    static async storeTempEmail(email: string): Promise<string> {
        return await setTempEmail(email)
    }
    
    /**
     * Get stored temporary email
     */
    static async getTempEmail(request: Request): Promise<string | null> {
        return await getTempEmail(request)
    }
    
    /**
     * Clear temporary email
     */
    static async clearTempEmail(): Promise<string> {
        return await clearTempEmail()
    }
    
    // ========================================================================
    // Session Validation Helpers
    // ========================================================================
    
    /**
     * Check if request has valid authentication token
     */
    static async isAuthenticated(request: Request): Promise<boolean> {
        return await this.hasValidSession(request)
    }
    
    /**
     * Get user token from request
     */
    static async getUserToken(request: Request): Promise<string | null> {
        try {
            return await getToken(request)
        } catch {
            return null
        }
    }
}
