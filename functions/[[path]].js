// Cloudflare Pages Function for React Router v7 SSR
// Serve in SPA mode - let Cloudflare Pages handle static files
export const onRequest = async (context) => {
  try {
    console.log('🚀 Function called for:', context.request.url);
    
    const url = new URL(context.request.url);
    
    // Let static assets pass through to Cloudflare Pages static serving
    if (url.pathname.startsWith('/assets/') || 
        url.pathname === '/favicon.ico' ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.svg')) {
      return context.next();
    }
    
    // For all other requests, serve the index.html (SPA mode)
    console.log('📄 Serving SPA fallback for:', url.pathname);
    
    // Fetch the index.html from the static files
    const indexUrl = new URL('/index.html', context.request.url);
    const indexResponse = await fetch(indexUrl.toString());
    
    if (indexResponse.ok) {
      const html = await indexResponse.text();
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache'
        }
      });
    }
    
    return new Response('Index file not found', { status: 404 });
    
  } catch (error) {
    console.error('❌ Function error:', error);
    console.error('Stack:', error.stack);
    return new Response(`Function Error: ${error.message}`, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};
