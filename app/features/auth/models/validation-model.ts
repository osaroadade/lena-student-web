/**
 * Validation Model - Handles only validation business logic
 * Single Responsibility: Client-side and server-side validation helpers
 */

import { 
    validateWithSchema, 
    EmailCheckInputSchema,
    LoginInputSchema 
} from "~/lib/types"

import type { 
    AuthError,
    AuthErrorCode,
    LoginFormData,
    EmailCheckFormData
} from "./types"

// ============================================================================
// Validation Model Class
// ============================================================================

export class ValidationModel {
    
    // ========================================================================
    // Email Validation
    // ========================================================================
    
    /**
     * Check if email format is valid
     */
    static isValidEmail(email: string): boolean {
        const validation = validateWithSchema(EmailCheckInputSchema, { email })
        return validation.success
    }
    
    /**
     * Validate email with detailed error message
     */
    static validateEmail(email: string): string | null {
        const trimmedEmail = email.trim()

        if (!trimmedEmail) {
            return "Email address is required"
        }
        
        if (!this.isValidEmail(trimmedEmail)) {
            return "Please enter a valid email address"
        }
        
        return null
    }
    
    // ========================================================================
    // Password Validation
    // ========================================================================
    
    /**
     * Check if password meets requirements
     */
    static isValidPassword(password: string): boolean {
        return password.length >= 1 // Basic requirement for now
    }
    
    /**
     * Validate password with detailed error message
     */
    static validatePassword(password: string): string | null {
        if (!password.trim()) {
            return "Password is required"
        }
        
        if (!this.isValidPassword(password)) {
            return "Password must be at least 1 character" // Update when requirements change
        }
        
        return null
    }
    
    // ========================================================================
    // Form Validation
    // ========================================================================
    
    /**
     * Validate login form data
     */
    static validateLoginForm(data: LoginFormData): Record<string, string> {
        const errors: Record<string, string> = {}
        
        const emailError = this.validateEmail(data.email)
        if (emailError) errors.email = emailError
        
        const passwordError = this.validatePassword(data.password)
        if (passwordError) errors.password = passwordError
        
        return errors
    }
    
    /**
     * Validate email check form data
     */
    static validateEmailCheckForm(data: EmailCheckFormData): Record<string, string> {
        const errors: Record<string, string> = {}
        
        const emailError = this.validateEmail(data.email)
        if (emailError) errors.email = emailError
        
        return errors
    }
    
    // ========================================================================
    // Error Helpers
    // ========================================================================
    
    /**
     * Create auth error object
     */
    static createAuthError(code: AuthErrorCode, message: string, field?: string): AuthError {
        return { code, message, field }
    }
    
    /**
     * Check if form has any validation errors
     */
    static hasErrors(errors: Record<string, string>): boolean {
        return Object.keys(errors).length > 0
    }
}
