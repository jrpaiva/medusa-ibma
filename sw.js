// Define um nome e versão para o nosso cache de arquivos
const CACHE_NAME = 'medusa-mesa-cache-v1';

// Lista de todos os arquivos que o seu app precisa para funcionar offline
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap'
];

// 1. Evento de Instalação: Salva os arquivos no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto. Adicionando arquivos principais.');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Evento de Fetch: Intercepta as requisições
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta encontrar a requisição no cache primeiro
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna o arquivo do cache
        if (response) {
          return response;
        }
        // Se não encontrar, busca na internet (requisição normal)
        return fetch(event.request);
      })
  );
});