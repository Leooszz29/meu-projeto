/* =========================================
   FITZONE - SERVICE WORKER
========================================= */

const CACHE_NAME = 'fitzone-v1';

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

self.addEventListener('install', () => {
    console.info('FitZone: service worker instalado.');
});

self.addEventListener('activate', () => {
    console.info('FitZone: service worker ativado.');
});
