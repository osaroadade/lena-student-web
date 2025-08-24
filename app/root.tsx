import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router"

import type { Route } from "./+types/root"
import "./app.css"
import { AuthProvider } from "./lib/auth-context"
import { getToken, isValidToken } from "./lib/session"
import type { ProfileView } from "./lib/types"

export const links: Route.LinksFunction = () => [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
    },
    {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap",
    },
];

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

// Loader to check authentication state on app load
export async function loader({ request }: Route.LoaderArgs) {
	try {
		const token = await getToken(request)
		
		// If no token or token is invalid, return null (not authenticated)
		if (!token || !isValidToken(token)) {
			return { profile: null }
		}
		
		// For now, we'll just check token validity
		// In a real app, you might want to fetch fresh profile data
		// const profile = await getCurrentProfile(token)
		
		// Since we don't have a profile endpoint yet, return null
		// The client will hydrate from storage if token exists
		return { profile: null }
		
	} catch (error) {
		console.error("Auth loader error:", error)
		return { profile: null }
	}
}

export default function App({ loaderData }: Route.ComponentProps) {
	return (
		<AuthProvider initialProfile={loaderData?.profile}>
			<Outlet />
		</AuthProvider>
	)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    let message = "Oops!";
    let details = "An unexpected error occurred.";
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? "404" : "Error";
        details =
            error.status === 404
                ? "The requested page could not be found."
                : error.statusText || details;
    } else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
