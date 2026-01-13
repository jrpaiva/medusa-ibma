const CACHE_NAME = 'medusa-mesa-cache-v1';

// ATUALIZE os caminhos conforme a estrutura real do seu projeto
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  // Verifique se o caminho está correto - talvez seja './assets/icon-192.png'
  './icon-192.png',
  // Remova fontes externas se estiver dando problema, ou adicione tratamento de erro
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto. Adicionando arquivos principais.');
        // Use cache.add() em vez de cache.addAll() para melhor tratamento de erro
        return Promise.all(
          urlsToCache.map(url => {
            return cache.add(url).catch(error => {
              console.log(`Falha ao fazer cache de ${url}:`, error);
            });
          })
        );
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Clone a requisição porque ela só pode ser usada uma vez
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Verifica se recebemos uma resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone a resposta porque ela só pode ser usada uma vez
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch(error => {
          console.log('Fetch falhou:', error);
          // Pode retornar uma página offline customizada aqui
        });
      })
  );
});

// Limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
