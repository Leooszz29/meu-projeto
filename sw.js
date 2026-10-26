/* =========================================
   FITZONE - SERVICE WORKER
========================================= */

const CACHE_NAME = 'fitzone-v1';

self.addEventListener('install', () => {
    console.info('FitZone: service worker instalado.');
});

self.addEventListener('activate', () => {
    console.info('FitZone: service worker ativado.');
});
