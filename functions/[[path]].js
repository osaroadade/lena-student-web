// Cloudflare Pages Function for React Router v7 SSR
// Temporarily disable SSR and serve static files only
export const onRequest = async (context) => {
  try {
    console.log('🚀 Function called for:', context.request.url);
    
    // For now, let's just serve the client-side app
    const url = new URL(context.request.url);
    
    // If it's a static asset request, let it pass through
    if (url.pathname.startsWith('/assets/')) {
      return context.next();
    }
    
    // For all other requests, serve the index.html (SPA mode)
    console.log('📄 Serving SPA fallback for:', url.pathname);
    const indexResponse = await context.env.ASSETS.fetch(new URL('/index.html', url.origin));
    
    if (indexResponse.ok) {
      return new Response(indexResponse.body, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    return new Response('Page not found', { status: 404 });
    
  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('Stack:', error.stack);
    return new Response(`Function Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
