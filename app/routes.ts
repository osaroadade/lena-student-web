import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
	index("routes/home.tsx"),
	route("/get-started", "routes/get-started.tsx"),
	route("/login", "routes/login.tsx"),
	route("/dashboard", "routes/dashboard.tsx"),
	route("/logout", "routes/logout.tsx"),
] satisfies RouteConfig
