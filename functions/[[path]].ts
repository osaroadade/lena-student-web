/**
 * Cloudflare Pages Function for React Router v7 SSR
 * 
 * This is an alternative to the Workers setup in workers/app.ts
 * Used for testing Pages deployment vs Workers deployment
 * 
 * Deploy with: npx wrangler pages deploy build/client --config wrangler.toml
 */

import { createRequestHandler } from "@react-router/cloudflare";

interface Env {
  VITE_LENA_API_URL: string;
  NODE_ENV: string;
}

// Create the React Router request handler
// Note: Pages Functions use different import path than Workers
const requestHandler = createRequestHandler(
  // @ts-expect-error - Dynamic import for server build
  () => import("../build/server/index.js"),
  import.meta.env.MODE
);

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    // Pages Functions provide environment via context.env
    return await requestHandler(context.request, {
      cloudflare: {
        env: context.env,
        ctx: context
      }
    });
  } catch (error) {
    console.error("Pages Function Error:", error);
    
    // Return basic error response
    return new Response("Internal Server Error", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  }
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
