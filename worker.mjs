// The handbook itself is one self-contained HTML file. This endpoint enables
// offline revisits to the public URL without installing an app.
export const serviceWorker = `
const CACHE='nz-handbook-offline-v1';
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  const response=await fetch('/',{cache:'reload'});
  if(!response.ok)throw new Error('Offline download failed');
  await cache.put('/',response);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const u=new URL(event.request.url);
  if(event.request.mode!=='navigate'||u.origin!==self.location.origin||!['/','/index.html'].includes(u.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const fresh=await fetch(event.request,{cache:'no-cache'});
      if(!fresh.ok)throw new Error('Offline fallback');
      await cache.put('/',fresh.clone());
      return fresh;
    }catch(error){const saved=await cache.match('/');if(saved)return saved;throw error;}
  })());
});
`;
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname === '/sw.js') {
      return new Response(serviceWorker, {headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Service-Worker-Allowed': '/',
      }});
    }
    return env.ASSETS.fetch(request);
  },
};
