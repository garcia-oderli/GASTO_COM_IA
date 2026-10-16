const CACHE = 'gastosAuto-v1.0.2';
// Cache separado (sem versão) para o payload do Web Share Target — não é
// apagado no activate para sobreviver ao redirect que entrega a foto ao app.
const SHARE_CACHE = 'gastosAuto-share';
// Tudo relativo ao escopo do SW: o app funciona tanto na raiz de um domínio
// próprio quanto dentro de uma subpasta, sem colidir com o SW do GastosIA.
const BASE = new URL(self.registration.scope).pathname;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'])));
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
  // Só intercepta o que é da própria origem. Chamada ao Supabase, à API da IA e a
  // CDN seguem direto para a rede: não há nada ali para cachear.
  if (url.origin !== self.location.origin) return;
  // Web Share Target: recebe o POST do "Compartilhar" do sistema, guarda a foto
  // no cache e redireciona para o app, que abre o abastecimento e lê a nota.
  if (e.request.method === 'POST' && url.pathname === BASE + 'share-target') {
    e.respondWith((async () => {
      try {
        const form = await e.request.formData();
        const file = form.get('image');
        const cache = await caches.open(SHARE_CACHE);
        if (file && file.size) {
          await cache.put('shared-image', new Response(file, { headers: { 'Content-Type': file.type || 'image/jpeg' } }));
        } else {
          await cache.delete('shared-image');
        }
      } catch (err) { /* ignora: app abre normal sem payload */ }
      return Response.redirect(BASE + '?shared=1', 303);
    })());
    return;
  }
  const isNav = e.request.mode === 'navigate' || url.pathname === BASE || url.pathname === BASE + 'index.html';
  if (isNav) {
    // Rede primeiro para a página: garante versão nova; cache só quando offline
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request).then(r => r || caches.match(BASE)))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
