// Cloudflare Workers entry point for React Router v7 SSR
import { createRequestHandler } from "@react-router/cloudflare";
import * as build from "../build/server/index.js";

const handler = createRequestHandler({
  build,
  getLoadContext(context) {
    return {
      cloudflare: {
        cf: context.request.cf,
        env: context.env,
        ctx: context.ctx,
      },
    };
  },
});

export default {
  async fetch(request, env, ctx) {
    try {
      console.log('🚀 Worker handling request:', request.url);
      
      const url = new URL(request.url);
      
      // Serve static assets from Workers assets
      if (url.pathname.startsWith('/assets/') || 
          url.pathname === '/favicon.ico' ||
          url.pathname.endsWith('.js') ||
          url.pathname.endsWith('.css') ||
          url.pathname.endsWith('.png') ||
          url.pathname.endsWith('.svg')) {
        
        console.log('📦 Serving static asset:', url.pathname);
        
        // Workers will automatically serve these from the assets directory
        return env.ASSETS.fetch(request);
      }
      
      // Handle all other requests with React Router SSR
      console.log('🌭 Processing SSR for:', url.pathname);
      
      return await handler(request, env, ctx);
      
    } catch (error) {
      console.error('❌ Worker error:', error);
      console.error('Stack:', error.stack);
      
      return new Response(`Worker Error: ${error.message}`, {
        status: 500,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
  }
};
