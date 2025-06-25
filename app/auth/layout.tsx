import { Outlet } from "react-router"
import { Button } from "@components/ui/button"
import { MessageSquare } from "lucide-react"
import { Logo } from "@components/Logo"

export default function () {
    return (
        <div className="flex flex-col min-h-svh">
            <header className="flex justify-between items-center p-4">
                <Logo />
                <Button variant="outline">
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Feedback
                </Button>
            </header>
            <main className="flex-grow flex justify-center p-4 sm:py-40 py-20">
                <Outlet />
            </main >
        </div>
    )
}