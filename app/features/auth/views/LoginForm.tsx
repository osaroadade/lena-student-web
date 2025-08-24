/**
 * LoginForm View Component
 * This is the "V" in MVC - Pure UI component for login
 */

import { Form, Link, useNavigation } from "react-router"
import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { ValidationModel } from "../models/validation-model"

// ============================================================================
// Props Interface
// ============================================================================

interface LoginFormProps {
    email: string
    errors?: Record<string, string>
    defaultValues?: {
        password?: string
    }
}

// ============================================================================
// LoginForm Component
// ============================================================================

export function LoginForm({ email, errors = {}, defaultValues = {} }: LoginFormProps) {
    const navigation = useNavigation()
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState(defaultValues.password || "")
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({})

    const isSubmitting = navigation.state === "submitting"

    // Client-side validation using ValidationModel
    const validateForm = () => {
        const validationErrors = ValidationModel.validateLoginForm({
            email,
            password
        })
        
        setClientErrors(validationErrors)
        return !ValidationModel.hasErrors(validationErrors)
    }

    // Handle password change
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value)
        
        // Clear client errors when user types
        if (clientErrors.password) {
            setClientErrors(prev => ({ ...prev, password: "" }))
        }
    }

    // Handle form submit
    const handleSubmit = (e: React.FormEvent) => {
        if (!validateForm()) {
            e.preventDefault()
            return
        }
        
        // Clear client errors before submitting
        setClientErrors({})
    }

    // Clear client errors when server responds
    useEffect(() => {
        if (errors && Object.keys(errors).length > 0) {
            setClientErrors({})
        }
    }, [errors])

    // Determine which errors to show (client or server)
    const displayErrors = Object.keys(clientErrors).length > 0 ? clientErrors : errors

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mb-4">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Lena
                        </h1>
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        {email ? `Continue signing in as ${email}` : "Please sign in to continue"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Form method="post" className="space-y-4" onSubmit={handleSubmit}>
                        {/* Email Field (disabled, prefilled) */}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                disabled={true}
                                className="bg-gray-50 dark:bg-gray-800"
                            />
                            {displayErrors.email && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {displayErrors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link 
                                    to="/reset-password" 
                                    className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    required
                                    disabled={isSubmitting}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    className="pr-12"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={isSubmitting}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {displayErrors.password && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {displayErrors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button 
                            type="submit" 
                            className="w-full" 
                            size="lg" 
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </Form>

                    {/* Back to Get Started */}
                    <div className="text-center pt-4">
                        <Link 
                            to="/get-started" 
                            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:underline"
                        >
                            ← Use a different email address
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
