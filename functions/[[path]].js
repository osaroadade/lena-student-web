// Cloudflare Pages Function for React Router v7 SSR
import { createPagesFunctionHandler } from "@react-router/cloudflare";

// Import the server build - this path should match your build output
import * as build from "../build/server/index.js";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext(context) {
    return {
      // Make Cloudflare context available to loaders/actions
      cloudflare: {
        cf: context.request.cf,
        ctx: context,
        caches,
        env: context.env,
      },
    };
  },
});
