/* =========================================
   FITZONE - SERVICE WORKER
========================================= */

const CACHE_NAME = 'fitzone-v8';
const IMAGE_CACHE_NAME = 'fitzone-images-v1';

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
                        name !== CACHE_NAME &&
                        name !== IMAGE_CACHE_NAME
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

    const urlRequisicao = new URL(request.url);

    const imagensPerfil = [
        'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
        'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
    ];

    if (imagensPerfil.includes(urlRequisicao.href)) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.ok || response.type === 'opaque') {
                        event.waitUntil(
                            caches.open(IMAGE_CACHE_NAME).then((cache) => {
                                return cache.put(request, response.clone());
                            })
                        );
                    }

                    return response;
                })
                .catch(async () => {
                    const imagemSalva = await caches.match(request);
                    return imagemSalva || Response.error();
                })
        );

        return;
    }

    if (urlRequisicao.origin !== self.location.origin) {
        return;
    }

    event.respondWith(
        fetch(request)
            .then(async (response) => {
                const url = new URL(request.url);
                const pastaExercicios = new URL(
                    './img/exercicios/',
                    self.registration.scope
                );

                if (
                    response.ok &&
                    url.pathname.startsWith(pastaExercicios.pathname) &&
                    url.pathname.endsWith('.webp')
                ) {
                    const cache = await caches.open(IMAGE_CACHE_NAME);
                    await cache.put(request, response.clone());
                } else if (
                    response.ok &&
                    APP_SHELL.some((arquivo) => {
                        return new URL(
                            arquivo,
                            self.registration.scope
                        ).href === url.href;
                    })
                ) {
                    const cache = await caches.open(CACHE_NAME);
                    await cache.put(request, response.clone());
                }

                return response;
            })
            .catch(async () => {
                const cachedResponse = await caches.match(request);

                if (cachedResponse) {
                    return cachedResponse;
                }

                return Response.error();
            })
    );
});

// Ativacao controlada de uma nova versao
self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
