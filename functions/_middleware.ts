/**
 * Cloudflare Pages Functions Middleware
 * 
 * Handles static asset serving and other middleware concerns
 * for the Pages deployment
 */

export const onRequest: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);

  // Let Pages handle static assets directly (they're in the build/client directory)
  // This middleware will only run for non-static requests
  
  // Add security headers
  const response = await context.next();
  
  // Add common security headers
  const headers = new Headers(response.headers);
  
  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Cache headers for HTML (short cache for dynamic content)
  if (response.headers.get("Content-Type")?.includes("text/html")) {
    headers.set("Cache-Control", "public, max-age=60, s-maxage=300");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

// Define the Pages Function interface for TypeScript
interface PagesFunction<Env = unknown> {
  (context: {
    request: Request;
    env: Env;
    params: Record<string, string>;
    data: Record<string, unknown>;
    next: (input?: Request | string) => Promise<Response>;
    waitUntil: (promise: Promise<unknown>) => void;
  }): Response | Promise<Response>;
}
