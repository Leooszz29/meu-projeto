/* =========================================
   FITZONE - CONFIGURACAO DO SUPABASE
========================================= */

const FITZONE_SUPABASE_URL =
    'https://dfpsqrcdlhmuikcrmclz.supabase.co';

// Substituir pela Publishable key do seu projeto.
const FITZONE_SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_9viROz4cpNBRds8aW5isQA_hYUpRdfH';

/* =========================================
   FITZONE - DESATIVAR SESSOES TRADICIONAIS
========================================= */

try {
    localStorage.removeItem('fitzoneSessao');
} catch (erro) {
    console.warn(
        'Não foi possível limpar a sessão tradicional:',
        erro
    );
}

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

/* =========================================
   FITZONE - CRIAR PERFIL SUPABASE
========================================= */

async function criarPerfilSupabaseFitZone(nome) {
    const cliente = inicializarSupabaseFitZone();
    const identidade = await obterIdentidadeSupabaseFitZone();

    if (!cliente || !identidade) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    const { data: perfilExistente, error: erroConsulta } =
        await cliente
            .from('fitzone_perfis')
            .select('id')
            .eq('id', identidade.id)
            .maybeSingle();

    if (erroConsulta) {
        throw erroConsulta;
    }

    if (perfilExistente) {
        return {
            criado: false,
            motivo: 'Perfil já cadastrado.'
        };
    }

    const { error } = await cliente
        .from('fitzone_perfis')
        .insert({
            id: identidade.id,
            nome: nome.trim()
        });

    if (error) {
        throw error;
    }

    return {
        criado: true,
        motivo: 'Perfil criado com sucesso.'
    };
}

/* =========================================
   FITZONE - CONSULTAR PERFIL SUPABASE
========================================= */

async function consultarPerfilSupabaseFitZone() {
    const cliente = inicializarSupabaseFitZone();
    const identidade = await obterIdentidadeSupabaseFitZone();

    if (!cliente || !identidade) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .select('*')
        .eq('id', identidade.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

/* =========================================
   FITZONE - SALVAR PERFIL SUPABASE
========================================= */

async function salvarPerfilSupabaseFitZone(perfil) {
    const cliente = inicializarSupabaseFitZone();
    const identidade = await obterIdentidadeSupabaseFitZone();

    if (!cliente || !identidade) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    if (!perfil || !String(perfil.nome || '').trim()) {
        throw new Error(
            'O nome do perfil é obrigatório.'
        );
    }

    const dados = {
        id: identidade.id,
        nome: String(perfil.nome).trim(),
        idade: perfil.idade,
        tipo_sanguineo: perfil.tipoSanguineo,
        peso: perfil.peso,
        altura: perfil.altura,
        treinador: perfil.treinador,
        info_pessoais: perfil.infoPessoais
    };

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .upsert(dados, {
            onConflict: 'id'
        })
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data;
}

/* =========================================
   FITZONE - ALTERAR APENAS GENERO SUPABASE
========================================= */


async function atualizarGeneroSupabaseFitZone(genero) {
    if (!['masculino', 'feminino'].includes(genero)) {
        throw new Error('Gênero inválido.');
    }

    const cliente = inicializarSupabaseFitZone();
    const usuario = await consultarUsuarioSupabaseFitZone();

    if (!cliente || !usuario?.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .update({
            genero: genero
        })
        .eq('id', usuario.id)
        .select('genero')
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (data) {
        return data.genero;
    }

    /* =========================================
       PRIMEIRO ACESSO - CRIAR PERFIL MINIMO
    ========================================= */

    const nome = String(
        usuario.user_metadata?.nome || ''
    ).trim();

    if (!nome) {
        throw new Error(
            'Nome do cadastro indisponível. ' +
            'Salve o perfil antes de alterar o gênero.'
        );
    }

    const { data: novoPerfil, error: erroCriacao } =
        await cliente
            .from('fitzone_perfis')
            .upsert(
                {
                    id: usuario.id,
                    nome: nome,
                    genero: genero
                },
                {
                    onConflict: 'id',
                    ignoreDuplicates: true
                }
            )
            .select('genero')
            .maybeSingle();

    if (erroCriacao) {
        throw erroCriacao;
    }

    if (novoPerfil) {
        return novoPerfil.genero;
    }

    /* Se outra operação criou o perfil,
       atualizar somente o gênero. */

    const { data: perfilAtualizado, error: erroAtualizacao } =
        await cliente
            .from('fitzone_perfis')
            .update({
                genero: genero
            })
            .eq('id', usuario.id)
            .select('genero')
            .single();

    if (erroAtualizacao) {
        throw erroAtualizacao;
    }

    return perfilAtualizado.genero;
}

/* =========================================
   FITZONE - SINCRONIZAR TEMA SUPABASE
========================================= */

async function sincronizarTemaSupabaseFitZone(identidadeRecebida = null) {
    const identidade = identidadeRecebida ||
        await obterIdentidadeSupabaseFitZone();

    if (!identidade?.id || !identidade?.email) {
        return null;
    }

    const chave =
        `generoFitZone:${identidade.email.trim().toLowerCase()}`;

    const generoValido = valor =>
        valor === 'masculino' || valor === 'feminino';

    let genero = null;
    let consultaConcluida = false;

    try {
        const cliente = inicializarSupabaseFitZone();

        if (!cliente) {
            throw new Error('Supabase indisponível.');
        }

        const { data, error } = await cliente
            .from('fitzone_perfis')
            .select('genero')
            .eq('id', identidade.id)
            .maybeSingle();

        if (error) {
            throw error;
        }

        consultaConcluida = true;

        if (generoValido(data?.genero)) {
            genero = data.genero;

            try {
                localStorage.setItem(chave, genero);
            } catch (erroCache) {
                console.warn(
                    'Não foi possível atualizar o cache do tema:',
                    erroCache
                );
            }
        }

    } catch (erro) {
        console.warn(
            'Não foi possível consultar o tema no Supabase:',
            erro
        );
    }

    if (!consultaConcluida) {
        try {
            const generoLocal = localStorage.getItem(chave);

            if (generoValido(generoLocal)) {
                genero = generoLocal;
            }
        } catch (erroCache) {
            console.warn(
                'Não foi possível consultar o tema local:',
                erroCache
            );
        }
    }

    document.body.classList.remove(
        'theme-masculino',
        'theme-feminino'
    );

    if (generoValido(genero)) {
        document.body.classList.add(`theme-${genero}`);
    }

    return genero;
}

/* =========================================
   FITZONE - CHAVE DO USUARIO SUPABASE
========================================= */

async function obterChaveUsuarioSupabaseFitZone() {
    const identidade =
        await obterIdentidadeSupabaseFitZone();

    if (!identidade) {
        return null;
    }

    return 'supabase:' + identidade.id;
}

/* =========================================
   FITZONE - CHAVE DE ARMAZENAMENTO SUPABASE
========================================= */

async function obterChaveArmazenamentoSupabaseFitZone(tipo) {
    if (
        typeof tipo !== 'string' ||
        !/^[a-z0-9_-]+$/.test(tipo)
    ) {
        throw new Error(
            'Tipo de armazenamento inválido.'
        );
    }

    const chaveUsuario =
        await obterChaveUsuarioSupabaseFitZone();

    if (!chaveUsuario) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    return 'fitzone:' + tipo + ':' + chaveUsuario;
}
