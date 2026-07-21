const CACHE = 'gastosIA-v4.6.4';
// Cache separado (sem versão) para o payload do Web Share Target — não é
// apagado no activate para sobreviver ao redirect que entrega a foto ao app.
const SHARE_CACHE = 'gastosIA-share';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/manifest.json', '/icon.svg'])));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== SHARE_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Web Share Target: recebe o POST do "Compartilhar" do sistema, guarda a
  // foto/texto no cache e redireciona para a home, que consome o payload.
  if (e.request.method === 'POST' && url.pathname === '/share-target') {
    e.respondWith((async () => {
      try {
        const form = await e.request.formData();
        const file = form.get('image');
        const text = (form.get('text') || form.get('title') || form.get('url') || '').toString();
        const cache = await caches.open(SHARE_CACHE);
        if (file && file.size) {
          await cache.put('shared-image', new Response(file, { headers: { 'Content-Type': file.type || 'image/jpeg' } }));
        } else {
          await cache.delete('shared-image');
        }
        if (text) {
          await cache.put('shared-text', new Response(text));
        } else {
          await cache.delete('shared-text');
        }
      } catch (err) { /* ignora: app abre normal sem payload */ }
      return Response.redirect('/?shared=1', 303);
    })());
    return;
  }
  const isNav = e.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html';
  if (isNav) {
    // Rede primeiro para a página: garante versão nova; cache só quando offline
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
