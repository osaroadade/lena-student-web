/**
 * EmailCheckForm View Component
 * This is the "V" in MVC - Pure UI component for email checking (get-started)
 */

import { Form, Link, useNavigation } from "react-router"
import { useState, useEffect } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { ValidationModel } from "../models/validation-model"

// ============================================================================
// Props Interface
// ============================================================================

interface EmailCheckFormProps {
    errors?: Record<string, string>
    defaultValues?: {
        email?: string
    }
}

// ============================================================================
// EmailCheckForm Component
// ============================================================================

export function EmailCheckForm({ errors = {}, defaultValues = {} }: EmailCheckFormProps) {
    const navigation = useNavigation()
    const [email, setEmail] = useState(defaultValues.email || "")
    const [clientError, setClientError] = useState<string | null>(null)
    const [isEmailValid, setIsEmailValid] = useState(false)

    const isSubmitting = navigation.state === "submitting"

    // Client-side email validation using ValidationModel
    const validateEmail = (value: string) => {
        return ValidationModel.validateEmail(value)
    }

    // Validate email on mount and whenever email changes
    useEffect(() => {
        const error = validateEmail(email)
        setIsEmailValid(error === null)
    }, [email])

    // Handle email input changes
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setEmail(value)
        
        // Clear previous errors when user starts typing
        if (clientError) {
            setClientError(null)
        }
    }
    
    // Handle email validation on blur
    const handleEmailBlur = () => {
        // Always validate on blur, even for empty fields
        const error = validateEmail(email)
        setClientError(error)
    }

    // Clear client errors when server responds
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setClientError(null)
        }
    }, [errors])

    // Determine which errors to show (client or server)
    const displayError = clientError || errors.email

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Lena
                        </h1>
                    </div>
                    <CardTitle className="text-2xl font-bold">Get Started</CardTitle>
                    <CardDescription>
                        Enter your email to sign in or create an account
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Form method="post" className="space-y-4">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="Enter your email address"
                                required
                                disabled={isSubmitting}
                                autoComplete="email"
                                value={email}
                                onChange={handleEmailChange}
                                onBlur={handleEmailBlur}
                                autoFocus
                            />
                            {displayError && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {displayError}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            size="lg"
                            disabled={isSubmitting || !isEmailValid}
                        >
                            {isSubmitting ? "Checking..." : "Continue"}
                        </Button>
                    </Form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                How it works
                            </span>
                        </div>
                    </div>

                    {/* How It Works */}
                    <div className="text-center space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <p>
                            We&apos;ll check if you already have an account with this email.
                        </p>
                        <ul className="space-y-1 text-xs">
                            <li>• If you have an account, we&apos;ll take you to sign in</li>
                            <li>• If you&apos;re new, we&apos;ll help you create an account</li>
                        </ul>
                    </div>

                    {/* Back Link */}
                    <div className="text-center">
                        <Link
                            to="/"
                            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
