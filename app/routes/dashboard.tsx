import type { Route } from "./+types/dashboard"
import { authGuard } from "~/features/auth"
import { useUser, useLogout } from "~/lib/auth-context"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"

// ============================================================================
// Loader - Require Authentication
// ============================================================================

export const loader = authGuard

// ============================================================================
// Component
// ============================================================================

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Dashboard - Lena" },
		{ name: "description", content: "Your student dashboard" },
	]
}

export default function Dashboard() {
	const user = useUser()
	const logout = useLogout()
	
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900">
			{/* Header */}
			<header className="bg-white dark:bg-gray-800 shadow-sm border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center">
							<h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
								Lena
							</h1>
						</div>
						
						<div className="flex items-center space-x-4">
							<div className="text-sm">
								<p className="font-medium text-gray-900 dark:text-gray-100">
									{user?.fullname || "Student"}
								</p>
								<p className="text-gray-500 dark:text-gray-400">
									{user?.email}
								</p>
							</div>
							
							<Button variant="outline" onClick={logout}>
								Sign Out
							</Button>
						</div>
					</div>
				</div>
			</header>
			
			{/* Main Content */}
			<main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{/* Welcome Card */}
						<Card className="md:col-span-2 lg:col-span-3">
							<CardHeader>
								<CardTitle className="text-2xl">
									Welcome back, {user?.fullname?.split(" ")[0] || "Student"}! 👋
								</CardTitle>
								<CardDescription>
									Here&apos;s what&apos;s happening with your studies today.
								</CardDescription>
							</CardHeader>
						</Card>
						
						{/* Course Overview */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">My Courses</CardTitle>
								<CardDescription>Active enrollments</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
									0
								</div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									No courses enrolled yet
								</p>
							</CardContent>
						</Card>
						
						{/* Assignments */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Assignments</CardTitle>
								<CardDescription>Pending submissions</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
									0
								</div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									No pending assignments
								</p>
							</CardContent>
						</Card>
						
						{/* Grades */}
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Recent Grades</CardTitle>
								<CardDescription>Latest evaluations</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold text-green-600 dark:text-green-400">
									--
								</div>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									No grades available
								</p>
							</CardContent>
						</Card>
					</div>
					
					{/* Quick Actions */}
					<div className="mt-8">
						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>
									Get started with your learning journey
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-wrap gap-3">
									<Button>
										Browse Courses
									</Button>
									<Button variant="outline">
										View Schedule
									</Button>
									<Button variant="outline">
										Check Grades
									</Button>
									<Button variant="outline">
										Messages
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
					
					{/* Debug Info (Development Only) */}
					{process.env.NODE_ENV === "development" && (
						<div className="mt-8">
							<Card>
								<CardHeader>
									<CardTitle className="text-sm">Debug Info</CardTitle>
								</CardHeader>
								<CardContent>
									<pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
										{JSON.stringify(user, null, 2)}
									</pre>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</main>
		</div>
	)
}
