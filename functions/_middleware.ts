/**
 * functions/_middleware.ts
 * Simplified Cloudflare Pages Middleware
 */

// Use minimal typing to avoid conflicts
export async function onRequest(context: any) {
    const { request, next } = context;

    try {
        // Let the request continue
        const response = await next();

        // Clone and modify headers
        const headers = new Headers(response.headers);

        // Security headers
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("X-Frame-Options", "DENY");
        headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

        // Cache control for HTML
        const contentType = headers.get("Content-Type") || "";
        if (contentType.includes("text/html")) {
            headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
        }

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
        });
    } catch (error) {
        console.error("[Middleware] Error:", error);
        return context.next();
    }
}