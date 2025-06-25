import {
    type RouteConfig,
    index,
    layout,
    prefix,
    route
} from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),

    ...prefix("auth", [
        layout("auth/layout.tsx", [
            index("auth/check-email.tsx"),
            route("login", "auth/login.tsx"),
            route("register", "auth/register.tsx"),
            route("verify-otp", "auth/verify-otp.tsx")
        ]),
    ]),
] satisfies RouteConfig;
