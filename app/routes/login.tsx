import { useActionData, useLoaderData } from "react-router"
import type { Route } from "./+types/login"
import { AuthController, LoginForm } from "~/features/auth"

// ============================================================================
// Loader - Delegate to Controller
// ============================================================================

export async function loader({ request }: Route.LoaderArgs) {
    return AuthController.handleLoginLoader(request)
}

// ============================================================================
// Action - Delegate to Controller
// ============================================================================

export async function action({ request }: Route.ActionArgs) {
    return AuthController.handleLogin(request)
}

// ============================================================================
// Component - Pure View Delegation
// ============================================================================

export default function Login() {
    const actionData = useActionData<typeof action>()
    const loaderData = useLoaderData<typeof loader>()

    return (
        <LoginForm
            email={loaderData?.email || ""}
            errors={actionData?.errors}
        />
    )
}