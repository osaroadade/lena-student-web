import { useActionData } from "react-router"
import type { Route } from "./+types/get-started"
import { AuthController, EmailCheckForm } from "~/features/auth"

// ============================================================================
// Loader - Delegate to Controller
// ============================================================================

export async function loader({ request }: Route.LoaderArgs) {
    return AuthController.handleGetStartedLoader(request)
}

// ============================================================================
// Action - Delegate to Controller
// ============================================================================

export async function action({ request }: Route.ActionArgs) {
    return AuthController.handleEmailCheck(request)
}

// ============================================================================
// Component
// ============================================================================

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Get Started - Lena" },
        { name: "description", content: "Start your learning journey with Lena" },
    ]
}

export default function GetStarted() {
    const actionData = useActionData<typeof action>()
    
    return (
        <EmailCheckForm 
            errors={actionData?.errors}
        />
    )
}
