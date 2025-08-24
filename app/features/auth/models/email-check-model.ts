/**
 * Email Check Model - Handles only email verification business logic
 * Single Responsibility: Check if email exists in system
 */

import { checkEmail as apiCheckEmail } from "~/lib/api"
import { 
    validateWithSchema, 
    EmailCheckInputSchema
} from "~/lib/types"

import type { 
    EmailCheckFormData, 
    EmailCheckResponse
} from "./types"

// ============================================================================
// Email Check Model Class
// ============================================================================

export class EmailCheckModel {
    
    /**
     * Validate email check data
     */
    static validateEmailCheckData(data: EmailCheckFormData) {
        return validateWithSchema(EmailCheckInputSchema, {
            email: data.email
        })
    }
    
    /**
     * Check if email exists and determine next step
     */
    static async checkEmailExists(data: EmailCheckFormData): Promise<EmailCheckResponse> {
        try {
            // Validate input
            const validation = this.validateEmailCheckData(data)
            if (!validation.success) {
                return {
                    success: false,
                    exists: false,
                    errors: validation.errors
                }
            }
            
            // Make API call
            const result = await apiCheckEmail(validation.data.email)
            
            // Return result with redirect path
            return {
                success: true,
                exists: result.exist,
                redirectTo: result.exist ? "/login" : "/register"
            }
            
        } catch (error) {
            console.error("Email check error:", error)
            
            // Network or API error
            return {
                success: false,
                exists: false,
                errors: {
                    email: "We couldn't verify this email address. Please check your connection and try again."
                }
            }
        }
    }
    
    /**
     * Check if email format is valid (client-side validation)
     */
    static isValidEmailFormat(email: string): boolean {
        const validation = validateWithSchema(EmailCheckInputSchema, { email })
        return validation.success
    }
}
