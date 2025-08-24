// Cloudflare Pages Function for React Router v7 SSR
import { createPagesFunctionHandler } from "@react-router/cloudflare";

export const onRequest = createPagesFunctionHandler({
  build: () => import("../build/server/index.js"),
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
