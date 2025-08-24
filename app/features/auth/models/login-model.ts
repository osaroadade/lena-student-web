/**
 * Login Model - Handles only login-related business logic
 * Single Responsibility: User authentication via email/password
 */

import { 
    login as apiLogin,
    getFieldErrors,
    isUnauthorized,
    isNetworkError 
} from "~/lib/api"
import { 
    validateWithSchema, 
    LoginInputSchema,
    type ProfileView 
} from "~/lib/types"

import type { 
    LoginFormData, 
    LoginResponse
} from "./types"

// ============================================================================
// Login Model Class
// ============================================================================

export class LoginModel {
    
    /**
     * Validate login credentials
     */
    static validateLoginData(data: LoginFormData) {
        return validateWithSchema(LoginInputSchema, {
            email: data.email,
            password: data.password
        })
    }
    
    /**
     * Attempt to login user with email and password
     */
    static async loginUser(data: LoginFormData): Promise<LoginResponse> {
        try {
            // Validate input
            const validation = this.validateLoginData(data)
            if (!validation.success) {
                return {
                    success: false,
                    errors: validation.errors
                }
            }
            
            // Make API call
            const profile = await apiLogin(validation.data)
            
            // Success - return profile for cookie setting
            return {
                success: true,
                profile,
                redirectTo: "/dashboard"
            }
            
        } catch (error) {
            console.error("Login error:", error)
            return this.handleLoginError(error)
        }
    }
    
    /**
     * Handle login errors with specific messaging
     */
    private static handleLoginError(error: unknown): LoginResponse {
        const fieldErrors = getFieldErrors(error)
        
        // If we have field-specific errors from API, use those
        if (fieldErrors && Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                errors: fieldErrors
            }
        }
        
        // Handle common error cases
        if (isUnauthorized(error)) {
            return {
                success: false,
                errors: {
                    password: "The password you entered is incorrect. Please try again."
                }
            }
        }
        
        if (isNetworkError(error)) {
            return {
                success: false,
                errors: {
                    password: "We couldn't sign you in right now. Please check your connection and try again."
                }
            }
        }
        
        // Generic error
        return {
            success: false,
            errors: {
                password: "Sign in failed. Please try again."
            }
        }
    }
}
