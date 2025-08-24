// Cloudflare Pages Function for React Router v7 SSR
import { createRequestHandler } from "react-router";

// Import the server build - this path should match your build output
import * as build from "../build/server/index.js";

const handleRequest = createRequestHandler(build, "production");

export async function onRequest(context) {
  return handleRequest(context.request, context.env);
}
