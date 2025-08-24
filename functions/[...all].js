// Cloudflare Pages Function for React Router v7 SSR
import { createRequestHandler } from "react-router";

// Import the server build - this path should match your build output
import * as build from "../build/server/index.js";

const handleRequest = createRequestHandler(build, process.env.NODE_ENV || "production");

export async function onRequest(context) {
  try {
    return await handleRequest(context.request, {
      // Pass environment variables and Cloudflare context
      ...context.env,
      CF_CONTEXT: context
    });
  } catch (error) {
    console.error("React Router SSR Function error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
