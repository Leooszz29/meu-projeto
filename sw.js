/* =========================================
   FITZONE - SERVICE WORKER
========================================= */

const CACHE_NAME = 'fitzone-v2';

// Arquivos essenciais para funcionamento offline
const APP_SHELL = [
    './',
    './index.html',
    './login.html',
    './cadastro.html',
    './perfil.html',
    './treinos.html',
    './calendario.html',
    './desempenho.html',
    './biblioteca.html',
    './manifest.json',

    './css/style.css',
    './css/login.css',
    './css/cadastro.css',
    './css/perfil.css',
    './css/treinos.css',
    './css/calendario.css',
    './css/desempenho.css',
    './css/biblioteca.css',

    './js/script.js',
    './js/login.js',
    './js/cadastro.js',
    './js/perfil.js',
    './js/treinos.js',
    './js/calendario.js',
    './js/desempenho.js',
    './js/biblioteca.js',

    './img/icons/fitzone-192.png',
    './img/icons/fitzone-512.png',
    './img/atleta-masculino.webp',
    './img/atleta-feminino.webp'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
    );

    console.info('FitZone: arquivos essenciais preparados para uso offline.');
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) =>
                        name.startsWith('fitzone-') &&
                        name !== CACHE_NAME
                    )
                    .map((name) => caches.delete(name))
            );
        })
    );

    console.info('FitZone: service worker ativado.');
});

// Prioriza a rede e utiliza o cache quando necessário
self.addEventListener('fetch', (event) => {
    const request = event.request;

    if (request.method !== 'GET') {
        return;
    }

    if (new URL(request.url).origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request).catch(async () => {
            const cachedResponse = await caches.match(request);

            if (cachedResponse) {
                return cachedResponse;
            }

            return Response.error();
        })
    );
});
