
self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open('gym-cache-v1').then(c=>c.addAll(['./','./sw.js'])));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>{ if(k!=='gym-cache-v1') return caches.delete(k); }))));
});
self.addEventListener('fetch', (e)=>{
  const req = e.request;
  if(req.method!=='GET'){ return; }
  e.respondWith(
    caches.match(req).then(res=> res || fetch(req).then(resp=>{
      const copy = resp.clone();
      caches.open('gym-cache-v1').then(c=>c.put(req, copy));
      return resp;
    }).catch(()=>caches.match('./')))
  );
});
