// Cloudflare Pages Function for React Router v7 SSR
import { createPagesFunctionHandler } from "@react-router/cloudflare";

export const onRequest = async (context) => {
  try {
    console.log('🚀 Function called for:', context.request.url);
    
    const handler = createPagesFunctionHandler({
      build: () => {
        console.log('📦 Loading server build...');
        return import("../build/server/index.js");
      },
      getLoadContext(context) {
        console.log('🔧 Creating load context...');
        return {
          // Make Cloudflare context available to loaders/actions
          cloudflare: {
            env: context.env,
          },
        };
      },
    });
    
    console.log('✅ Handler created, processing request...');
    const response = await handler(context);
    console.log('🎉 Response ready:', response.status);
    return response;
    
  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('Stack:', error.stack);
    return new Response(`Function Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
