/**
 * TypeScript interfaces and Zod schemas for Lena API
 * Based on OpenAPI specification from project-docs/Lena API.yaml
 */

import { z } from "zod"

// ============================================================================
// Core Authentication Types
// ============================================================================

export interface LoginInput {
    email: string
    password: string
}

export const LoginInputSchema = z.object({
    email: z.string().email("Please enter a valid email address").max(255),
    password: z.string().min(1, "Password is required").max(200)
})

export interface ProfileView {
    id: string
    fullname: string
    phone: string
    gender: string | null
    email: string
    username: string
    is_teacher: boolean
    title: string | null
    token: string
    image: string | null
}

export const ProfileViewSchema = z.object({
    id: z.string(),
    fullname: z.string(),
    phone: z.string(),
    gender: z.string().nullable(),
    email: z.string().email(),
    username: z.string(),
    is_teacher: z.boolean(),
    title: z.string().nullable(),
    token: z.string(),
    image: z.string().nullable()
})

// ============================================================================
// Registration Types  
// ============================================================================

export interface RegisterUser {
    image?: string
    fullname: string
    gender: string
    phone: string
    email: string
    password: string
    title?: string
}

export const RegisterUserSchema = z.object({
    image: z.string().url().optional(),
    fullname: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone number is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    title: z.string().optional()
})

// Registration form with password confirmation
export interface RegisterFormInput extends Omit<RegisterUser, "image"> {
    confirmPassword: string
    image?: File | null
}

export const RegisterFormSchema = RegisterUserSchema.omit({ image: true }).extend({
    confirmPassword: z.string().min(8, "Password confirmation is required"),
    image: z.instanceof(File).optional().nullable()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
})

// ============================================================================
// OTP Types
// ============================================================================

export interface OtpRequest {
    target: string
}

export const OtpRequestSchema = z.object({
    target: z.string().email("Please enter a valid email address")
})

export interface ValidateOtp {
    value: string
    target: string
}

export const ValidateOtpSchema = z.object({
    value: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
    target: z.string().email("Please enter a valid email address")
})

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
    status: number
}

export interface ApiResponse<T = unknown> {
    success: boolean
    data?: T
    error?: ApiError
}

// Success response for OTP requests
export interface OtpResponse {
    message: string
}

export const OtpResponseSchema = z.object({
    message: z.string()
})

// ============================================================================
// Email Check Types
// ============================================================================

export interface EmailCheckInput {
    email: string
}

export const EmailCheckInputSchema = z.object({
    email: z.string().email("Please enter a valid email address")
})

export interface EmailCheckResponse {
    exist: boolean
}

export const EmailCheckResponseSchema = z.object({
    exist: z.boolean()
})

// ============================================================================
// Utility Types
// ============================================================================

export type AuthMode = "login" | "register" | "reset"

export interface SessionData {
    profile: ProfileView
    token: string
    expiresAt: number
}

// ============================================================================
// Type Guards
// ============================================================================

export function isProfileView(data: unknown): data is ProfileView {
    return ProfileViewSchema.safeParse(data).success
}

export function isApiError(error: unknown): error is ApiError {
    return (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        "status" in error
    )
}

// ============================================================================
// Form Validation Helpers
// ============================================================================

export type ValidationResult<T> = {
    success: true
    data: T
} | {
    success: false
    errors: Record<string, string>
}

export function validateWithSchema<T>(
	schema: z.ZodSchema<T>, 
	data: unknown
): ValidationResult<T> {
	try {
		const result = schema.safeParse(data)
		
		if (result.success) {
			return { success: true, data: result.data }
		}
		
		const errors: Record<string, string> = {}
		
		// Properly handle Zod errors with correct typing
		if (result.error && result.error.issues) {
			result.error.issues.forEach((issue: z.ZodIssue) => {
				// Safely handle path and message with proper typing
				const path = issue.path && issue.path.length > 0 
					? issue.path.join(".")
					: "unknown"
				const message = issue.message || "Invalid value"
				
				errors[path] = message
			})
		}
		
		// If no errors were extracted, provide a generic error
		if (Object.keys(errors).length === 0) {
			errors.unknown = "Validation failed"
		}
		
		return { success: false, errors }
		
	} catch (error) {
		// Fallback for any unexpected errors
		console.error("Validation error:", error)
		return { 
			success: false, 
			errors: { unknown: "Validation failed" } 
		}
	}
}
