/* =========================================
   FITZONE - CONFIGURACAO DO SUPABASE
========================================= */

const FITZONE_SUPABASE_URL =
    'https://dfpsqrcdlhmuikcrmclz.supabase.co';

// Substituir pela Publishable key do seu projeto.
const FITZONE_SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_9viROz4cpNBRds8aW5isQA_hYUpRdfH';

/* =========================================
   FITZONE - INICIALIZAR CLIENTE SUPABASE
========================================= */

let fitzoneSupabase = null;

function inicializarSupabaseFitZone() {
    if (
        typeof window.supabase === 'undefined' ||
        typeof window.supabase.createClient !== 'function'
    ) {
        console.warn(
            'Biblioteca Supabase ainda não foi carregada.'
        );
        return null;
    }

    if (!fitzoneSupabase) {
        fitzoneSupabase = window.supabase.createClient(
            FITZONE_SUPABASE_URL,
            FITZONE_SUPABASE_PUBLISHABLE_KEY
        );
    }

    return fitzoneSupabase;
}

/* =========================================
   FITZONE - CONSULTAR USUARIO SUPABASE
========================================= */

async function consultarUsuarioSupabaseFitZone() {
    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível inicializar o Supabase.'
        );
    }

    const { data, error } = await cliente.auth.getUser();

    if (error) {
        if (
            error.name === 'AuthSessionMissingError' ||
            error.message === 'Auth session missing!'
        ) {
            return null;
        }

        throw error;
    }

    return data.user || null;
}

/* =========================================
   FITZONE - CONSULTAR ORIGEM DA SESSAO
========================================= */

async function consultarOrigemSessaoFitZone() {
    let sessaoLocal = null;

    try {
        const dados = localStorage.getItem('fitzoneSessao');

        sessaoLocal = dados ? JSON.parse(dados) : null;
    } catch (erro) {
        console.warn(
            'Não foi possível consultar a sessão local:',
            erro
        );
    }

    if (
        sessaoLocal &&
        sessaoLocal.autenticado === true &&
        typeof sessaoLocal.email === 'string' &&
        sessaoLocal.email.trim()
    ) {
        return {
            origem: 'local',
            autenticado: true
        };
    }

    const usuarioSupabase =
        await consultarUsuarioSupabaseFitZone();

    if (usuarioSupabase) {
        return {
            origem: 'supabase',
            autenticado: true
        };
    }

    return {
        origem: 'nenhuma',
        autenticado: false
    };
}

/* =========================================
   FITZONE - IDENTIDADE SUPABASE VALIDADA
========================================= */

async function obterIdentidadeSupabaseFitZone() {
    const usuario = await consultarUsuarioSupabaseFitZone();

    if (!usuario) {
        return null;
    }

    if (!usuario.id || !usuario.email) {
        throw new Error(
            'Identidade Supabase incompleta.'
        );
    }

    return {
        origem: 'supabase',
        id: usuario.id,
        email: usuario.email.trim().toLowerCase()
    };
}
