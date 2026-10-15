// Service worker do Sobra (D46): só recebe as notificações de lembrete.
// Ele roda mesmo com o app fechado: a nuvem manda a mensagem (cifrada), o
// iPhone acorda este arquivo, e ele mostra a notificação.
// Não guarda nada em cache: o app continua carregando sempre a versão mais nova.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (evento) => evento.waitUntil(self.clients.claim()));

self.addEventListener('push', (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch {
    dados = { corpo: evento.data ? evento.data.text() : '' };
  }
  evento.waitUntil(self.registration.showNotification(dados.titulo || 'Sobra', {
    body: dados.corpo || '',
    icon: 'icones/icone-192.png',
    badge: 'icones/icone-192.png',
    tag: dados.tag, // a mesma conta no mesmo dia substitui em vez de duplicar
    data: { url: dados.url || './' },
  }));
});

// Tocar na notificação: volta para o app aberto ou abre um novo
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close();
  const url = evento.notification.data && evento.notification.data.url;
  evento.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (abertas.length) return abertas[0].focus();
    return self.clients.openWindow(url || './');
  })());
});
