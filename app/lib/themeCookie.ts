import { createCookie } from "react-router"

// Create a cookie for theme preference (persist 1 year)
export const themeCookie = createCookie("theme", {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
})