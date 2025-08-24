/**
 * React authentication context for global auth state management
 * Provides authentication state and methods to all components
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSubmit } from "react-router"
import type { ProfileView } from "./types"
import { 
	getCurrentProfile, 
	setSessionInStorage, 
	logout as clearSession,
	getCurrentToken 
} from "./session"

// ============================================================================
// Context Types
// ============================================================================

interface AuthContextValue {
	profile: ProfileView | null
	isLoading: boolean
	login: (profile: ProfileView) => void
	logout: () => void
	updateProfile: (profile: ProfileView) => void
}

// ============================================================================
// Context Creation
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null)

// ============================================================================
// Provider Component
// ============================================================================

interface AuthProviderProps {
	children: ReactNode
	initialProfile?: ProfileView | null
}

export function AuthProvider({ children, initialProfile = null }: AuthProviderProps) {
	const [profile, setProfile] = useState<ProfileView | null>(initialProfile)
	const [isLoading, setIsLoading] = useState(!initialProfile)
	const submit = useSubmit()
	
	// Hydrate from storage on mount (client-side only)
	useEffect(() => {
		if (typeof window === "undefined") return
		
		// If we have an initial profile from SSR, use it
		if (initialProfile) {
			setProfile(initialProfile)
			setIsLoading(false)
			return
		}
		
		// Otherwise, try to get from storage
		const storedProfile = getCurrentProfile()
		setProfile(storedProfile)
		setIsLoading(false)
	}, [initialProfile])
	
	// Login function - stores profile and token
	const login = (newProfile: ProfileView) => {
		setProfile(newProfile)
		setSessionInStorage(newProfile)
		
		// Set cookie for SSR (will be handled by server action)
		// This is just for client-side cookie setting
		if (typeof window !== "undefined") {
			// The cookie will be set by the server action response
			// We just need to update the client state
		}
	}
	
	// Logout function - clears all session data
	const logout = () => {
		setProfile(null)
		clearSession()
		submit(null, { method: "post", action: "/logout" })
	}
	
	// Update profile function - for profile changes
	const updateProfile = (updatedProfile: ProfileView) => {
		setProfile(updatedProfile)
		setSessionInStorage(updatedProfile)
	}
	
	const value: AuthContextValue = {
		profile,
		isLoading,
		login,
		logout,
		updateProfile
	}
	
	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

// ============================================================================
// Hook for Using Context
// ============================================================================

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	
	return context
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get current user profile
 */
export function useUser(): ProfileView | null {
	const { profile } = useAuth()
	return profile
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
	const { profile } = useAuth()
	return profile !== null
}

/**
 * Hook to get authentication loading state
 */
export function useAuthLoading(): boolean {
	const { isLoading } = useAuth()
	return isLoading
}

/**
 * Hook for logout functionality
 */
export function useLogout(): () => void {
	const { logout } = useAuth()
	return logout
}

// ============================================================================
// Higher-Order Component for Auth Requirements
// ============================================================================

interface RequireAuthProps {
	children: ReactNode
	fallback?: ReactNode
}

/**
 * Component that only renders children if user is authenticated
 */
export function RequireAuth({ children, fallback = null }: RequireAuthProps) {
	const { profile, isLoading } = useAuth()
	
	if (isLoading) {
		return <div>Loading...</div> // Or your loading component
	}
	
	if (!profile) {
		return <>{fallback}</>
	}
	
	return <>{children}</>
}

/**
 * Component that only renders children if user is NOT authenticated
 */
export function RequireGuest({ children, fallback = null }: RequireAuthProps) {
	const { profile, isLoading } = useAuth()
	
	if (isLoading) {
		return <div>Loading...</div> // Or your loading component
	}
	
	if (profile) {
		return <>{fallback}</>
	}
	
	return <>{children}</>
}
