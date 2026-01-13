const CACHE_NAME = 'medusa-mesa-cache-v1';

// ATENÇÃO: Verifique os caminhos reais dos seus arquivos
const urlsToCache = [
  '/',  // Página principal
  '/index.html',
  '/manifest.json',
  // Verifique se o ícone existe neste caminho:
  '/icon-192.png',  // ou './icon-192.png'
  // Remova temporariamente fontes externas para testar:
  // 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto. Tentando adicionar arquivos...');
        
        // Método 1: Adiciona um por um com tratamento de erro
        const cachePromises = urlsToCache.map(url => {
          return cache.add(url).catch(error => {
            console.error(`❌ Erro ao cachear ${url}:`, error);
            // Não rejeita a promise principal, só loga o erro
            return Promise.resolve();
          });
        });
        
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('✅ Todos os arquivos processados (alguns podem ter falhado)');
        return self.skipWaiting(); // Ativa o SW imediatamente
      })
      .catch(error => {
        console.error('❌ Erro crítico na instalação:', error);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Limpa caches antigos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Assume controle imediato de todas as páginas
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Ignora requisições POST ou de outras origens
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Tenta buscar na rede primeiro (Stale-While-Revalidate)
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Atualiza cache com nova resposta
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, responseToCache));
            }
            return networkResponse;
          })
          .catch(error => {
            console.log('🌐 Offline ou erro de rede:', error);
            
            // Se temos cache, retorna do cache
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Para navegação, retorna página offline
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Para outros casos, retorna erro 503
            return new Response('Conteúdo offline não disponível', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        
        // Retorna cache imediatamente se disponível
        return cachedResponse || fetchPromise;
      })
  );
});
