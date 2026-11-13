/* =========================================
   FITZONE - CONFIGURACAO DO SUPABASE
========================================= */

const FITZONE_SUPABASE_URL =
    'https://dfpsqrcdlhmuikcrmclz.supabase.co';

// Substituir pela Publishable key do seu projeto.
const FITZONE_SUPABASE_PUBLISHABLE_KEY =
    'sb_publishable_9viROz4cpNBRds8aW5isQA_hYUpRdfH';

/* =========================================
   FITZONE - DESATIVAR AUTENTICACAO TRADICIONAL
========================================= */

try {
    localStorage.removeItem('fitzoneSessao');

    const dadosUsuarios =
        localStorage.getItem('usuarios');

    if (dadosUsuarios !== null) {
        const usuarios = JSON.parse(dadosUsuarios);

        if (!Array.isArray(usuarios)) {
            throw new Error(
                'Formato inválido dos usuários tradicionais.'
            );
        }

        let credenciaisRemovidas = false;

        const usuariosSeguros = usuarios.map(
            (usuario) => {
                if (
                    !usuario ||
                    typeof usuario !== 'object' ||
                    Array.isArray(usuario)
                ) {
                    return usuario;
                }

                if (
                    !Object.prototype.hasOwnProperty.call(
                        usuario,
                        'senha'
                    )
                ) {
                    return usuario;
                }

                const usuarioSeguro = {
                    ...usuario
                };

                delete usuarioSeguro.senha;

                credenciaisRemovidas = true;

                return usuarioSeguro;
            }
        );

        if (credenciaisRemovidas) {
            localStorage.setItem(
                'usuarios',
                JSON.stringify(usuariosSeguros)
            );

            console.info(
                'FitZone: credenciais tradicionais removidas.'
            );
        }
    }

} catch (erro) {
    console.warn(
        'Não foi possível concluir a limpeza tradicional:',
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
   FITZONE - IDENTIDADE VINCULADA A OPERACAO
========================================= */

async function obterUsuarioVinculadoSupabaseFitZone(
    usuarioIdEsperado
) {
    if (
        typeof usuarioIdEsperado !== 'string' ||
        !usuarioIdEsperado.trim()
    ) {
        throw new Error('Identidade inicial inválida.');
    }

    const usuario =
        await consultarUsuarioSupabaseFitZone();

    if (!usuario || usuario.id !== usuarioIdEsperado) {
        window.location.replace('login.html');

        throw new Error(
            'A conta foi alterada durante a operação.'
        );
    }

    return usuario;
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

async function consultarPerfilSupabaseFitZone(usuarioIdEsperado) {
    const cliente = inicializarSupabaseFitZone();
    const identidade =
        await obterUsuarioVinculadoSupabaseFitZone(usuarioIdEsperado);

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

async function salvarPerfilSupabaseFitZone(perfil, usuarioIdEsperado) {
    const cliente = inicializarSupabaseFitZone();
    const identidade =
        await obterUsuarioVinculadoSupabaseFitZone(usuarioIdEsperado);

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

async function atualizarGeneroSupabaseFitZone(genero, usuarioIdEsperado) {
    if (!['masculino', 'feminino'].includes(genero)) {
        throw new Error('Gênero inválido.');
    }

    const cliente = inicializarSupabaseFitZone();
    const usuario =
        await obterUsuarioVinculadoSupabaseFitZone(usuarioIdEsperado);

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

    await obterUsuarioVinculadoSupabaseFitZone(usuarioIdEsperado);

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

    await obterUsuarioVinculadoSupabaseFitZone(usuarioIdEsperado);

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

/* =========================================
   FITZONE - PREFERENCIAS SUPABASE
========================================= */

const FITZONE_PREFERENCIAS_PADRAO = Object.freeze({
    paginaInicial: 'calendario.html',
    mensagensMotivacionais: true,
    metaMensal: 12
});

const FITZONE_PAGINAS_INICIAIS_PERMITIDAS =
    Object.freeze([
        'calendario.html',
        'treinos.html',
        'desempenho.html'
    ]);

const FITZONE_COLUNAS_PREFERENCIAS =
    'pagina_inicial, mensagens_motivacionais, meta_mensal';

/* =========================================
   FITZONE - VALIDAR PREFERENCIAS
========================================= */

function validarPaginaInicialFitZone(valor) {
    return FITZONE_PAGINAS_INICIAIS_PERMITIDAS
        .includes(valor);
}

function validarMetaMensalFitZone(valor) {
    return (
        Number.isInteger(valor) &&
        valor >= 1 &&
        valor <= 100
    );
}

/* =========================================
   FITZONE - LER PREFERENCIAS LOCAIS ANTIGAS
========================================= */

function lerPreferenciasLocaisFitZone(usuarioId) {
    if (
        typeof usuarioId !== 'string' ||
        !usuarioId.trim()
    ) {
        throw new Error('Identidade inválida.');
    }

    const preferencias = {};

    const chavePreferencias =
        `fitzonePreferencias:supabase:${usuarioId}`;

    const chaveMeta =
        `metaMensalFitZone:supabase:${usuarioId}`;

    try {
        const dados =
            localStorage.getItem(chavePreferencias);

        if (dados !== null) {
            const locais = JSON.parse(dados);

            if (
                locais &&
                typeof locais === 'object' &&
                !Array.isArray(locais)
            ) {
                if (
                    validarPaginaInicialFitZone(
                        locais.paginaInicial
                    )
                ) {
                    preferencias.paginaInicial =
                        locais.paginaInicial;
                }

                if (
                    typeof locais.mensagensMotivacionais
                        === 'boolean'
                ) {
                    preferencias.mensagensMotivacionais =
                        locais.mensagensMotivacionais;
                }
            }
        }

    } catch (erro) {
        console.warn(
            'Não foi possível consultar as preferências locais:',
            erro
        );
    }

    try {
        const metaLocal =
            localStorage.getItem(chaveMeta);

        if (
            metaLocal !== null &&
            metaLocal.trim() !== ''
        ) {
            const meta = Number(metaLocal);

            if (validarMetaMensalFitZone(meta)) {
                preferencias.metaMensal = meta;
            }
        }

    } catch (erro) {
        console.warn(
            'Não foi possível consultar a meta local:',
            erro
        );
    }

    return preferencias;
}

/* =========================================
   FITZONE - NORMALIZAR PREFERENCIAS
========================================= */

function normalizarPreferenciasSupabaseFitZone(dados) {
    return {
        paginaInicial:
            validarPaginaInicialFitZone(
                dados?.pagina_inicial
            )
                ? dados.pagina_inicial
                : FITZONE_PREFERENCIAS_PADRAO.paginaInicial,

        mensagensMotivacionais:
            typeof dados?.mensagens_motivacionais
                === 'boolean'
                ? dados.mensagens_motivacionais
                : FITZONE_PREFERENCIAS_PADRAO
                    .mensagensMotivacionais,

        metaMensal:
            validarMetaMensalFitZone(
                dados?.meta_mensal
            )
                ? dados.meta_mensal
                : FITZONE_PREFERENCIAS_PADRAO.metaMensal
    };
}

/* =========================================
   FITZONE - CONSULTAR PREFERENCIAS BRUTAS
========================================= */

async function consultarPreferenciasBrutasSupabaseFitZone(
    usuarioIdEsperado
) {
    const usuario =
        await obterUsuarioVinculadoSupabaseFitZone(
            usuarioIdEsperado
        );

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .select(FITZONE_COLUNAS_PREFERENCIAS)
        .eq('id', usuario.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    await obterUsuarioVinculadoSupabaseFitZone(
        usuarioIdEsperado
    );

    return data;
}

/* =========================================
   FITZONE - GARANTIR PERFIL PARA PREFERENCIAS
========================================= */

async function garantirPerfilPreferenciasSupabaseFitZone(
    usuarioIdEsperado
) {
    const usuario =
        await obterUsuarioVinculadoSupabaseFitZone(
            usuarioIdEsperado
        );

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const nome = String(
        usuario.user_metadata?.nome || ''
    ).trim();

    const dados = {
        id: usuario.id
    };

    if (nome) {
        dados.nome = nome;
    }

    const { error } = await cliente
        .from('fitzone_perfis')
        .upsert(
            dados,
            {
                onConflict: 'id',
                ignoreDuplicates: true
            }
        );

    if (error) {
        throw error;
    }

    await obterUsuarioVinculadoSupabaseFitZone(
        usuarioIdEsperado
    );

    return true;
}

/* =========================================
   FITZONE - MIGRAR PREFERENCIA INDIVIDUAL
========================================= */

async function migrarCampoPreferenciaSupabaseFitZone(
    usuarioIdEsperado,
    coluna,
    valor
) {
    const camposPermitidos = [
        'pagina_inicial',
        'mensagens_motivacionais',
        'meta_mensal'
    ];

    if (!camposPermitidos.includes(coluna)) {
        throw new Error(
            'Campo de preferência inválido.'
        );
    }

    if (
        coluna === 'pagina_inicial' &&
        !validarPaginaInicialFitZone(valor)
    ) {
        throw new Error('Página inicial inválida.');
    }

    if (
        coluna === 'mensagens_motivacionais' &&
        typeof valor !== 'boolean'
    ) {
        throw new Error(
            'Preferência motivacional inválida.'
        );
    }

    if (
        coluna === 'meta_mensal' &&
        !validarMetaMensalFitZone(valor)
    ) {
        throw new Error('Meta mensal inválida.');
    }

    const usuario =
        await obterUsuarioVinculadoSupabaseFitZone(
            usuarioIdEsperado
        );

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .update({
            [coluna]: valor
        })
        .eq('id', usuario.id)
        .is(coluna, null)
        .select(coluna);

    if (error) {
        throw error;
    }

    return (
        Array.isArray(data) &&
        data.length === 1
    );
}

/* =========================================
   FITZONE - MIGRAR PREFERENCIAS LOCAIS
========================================= */

async function migrarPreferenciasLocaisSupabaseFitZone(
    usuarioIdEsperado
) {
    await obterUsuarioVinculadoSupabaseFitZone(
        usuarioIdEsperado
    );

    const locais =
        lerPreferenciasLocaisFitZone(
            usuarioIdEsperado
        );

    let nuvem =
        await consultarPreferenciasBrutasSupabaseFitZone(
            usuarioIdEsperado
        );

    const campos = [
        {
            coluna: 'pagina_inicial',
            valor: locais.paginaInicial
        },
        {
            coluna: 'mensagens_motivacionais',
            valor: locais.mensagensMotivacionais
        },
        {
            coluna: 'meta_mensal',
            valor: locais.metaMensal
        }
    ];

    const pendentes = campos.filter(campo =>
        campo.valor !== undefined &&
        nuvem?.[campo.coluna] == null
    );

    if (pendentes.length === 0) {
        return nuvem;
    }

    if (!nuvem) {
        await garantirPerfilPreferenciasSupabaseFitZone(
            usuarioIdEsperado
        );
    }

    for (const campo of pendentes) {
        await migrarCampoPreferenciaSupabaseFitZone(
            usuarioIdEsperado,
            campo.coluna,
            campo.valor
        );
    }

    nuvem =
        await consultarPreferenciasBrutasSupabaseFitZone(
            usuarioIdEsperado
        );

    return nuvem;
}

/* =========================================
   FITZONE - CARREGAR PREFERENCIAS DA CONTA
========================================= */

async function carregarPreferenciasSupabaseFitZone(
    usuarioIdEsperado
) {
    const dados =
        await migrarPreferenciasLocaisSupabaseFitZone(
            usuarioIdEsperado
        );

    return normalizarPreferenciasSupabaseFitZone(
        dados
    );
}

/* =========================================
   FITZONE - PREFERENCIAS LOCAIS DE CONTINGENCIA
========================================= */

function obterPreferenciasContingenciaFitZone(
    usuarioIdEsperado
) {
    const locais =
        lerPreferenciasLocaisFitZone(
            usuarioIdEsperado
        );

    return {
        ...FITZONE_PREFERENCIAS_PADRAO,
        ...locais
    };
}

/* =========================================
   FITZONE - ATUALIZAR COPIA LOCAL CONFIRMADA
========================================= */

function atualizarCopiaLocalPreferenciasFitZone(
    usuarioIdEsperado,
    preferencias
) {
    const chavePreferencias =
        `fitzonePreferencias:supabase:${usuarioIdEsperado}`;

    const chaveMeta =
        `metaMensalFitZone:supabase:${usuarioIdEsperado}`;

    try {
        const dados =
            localStorage.getItem(chavePreferencias);

        let atuais = {};

        if (dados !== null) {
            try {
                const existentes = JSON.parse(dados);

                if (
                    existentes &&
                    typeof existentes === 'object' &&
                    !Array.isArray(existentes)
                ) {
                    atuais = existentes;
                }

            } catch (erro) {
                console.warn(
                    'Cópia local antiga inválida:',
                    erro
                );
            }
        }

        let preferenciasAlteradas = false;

        if (
            validarPaginaInicialFitZone(
                preferencias.paginaInicial
            )
        ) {
            atuais.paginaInicial =
                preferencias.paginaInicial;

            preferenciasAlteradas = true;
        }

        if (
            typeof preferencias.mensagensMotivacionais
                === 'boolean'
        ) {
            atuais.mensagensMotivacionais =
                preferencias.mensagensMotivacionais;

            preferenciasAlteradas = true;
        }

        if (preferenciasAlteradas) {
            localStorage.setItem(
                chavePreferencias,
                JSON.stringify(atuais)
            );
        }

        if (
            validarMetaMensalFitZone(
                preferencias.metaMensal
            )
        ) {
            localStorage.setItem(
                chaveMeta,
                String(preferencias.metaMensal)
            );
        }

    } catch (erro) {
        console.warn(
            'Não foi possível atualizar a cópia local:',
            erro
        );
    }
}

/* =========================================
   FITZONE - SALVAR PREFERENCIAS NA NUVEM
========================================= */

async function salvarPreferenciasSupabaseFitZone(
    usuarioIdEsperado,
    preferencias
) {
    if (
        !preferencias ||
        typeof preferencias !== 'object' ||
        Array.isArray(preferencias)
    ) {
        throw new Error('Preferências inválidas.');
    }

    const camposPermitidos = [
        'paginaInicial',
        'mensagensMotivacionais',
        'metaMensal'
    ];

    const chaves = Object.keys(preferencias);

    if (
        chaves.length === 0 ||
        chaves.some(chave =>
            !camposPermitidos.includes(chave)
        )
    ) {
        throw new Error(
            'Campos de preferência inválidos.'
        );
    }

    const dados = {};

    if (
        Object.prototype.hasOwnProperty.call(
            preferencias,
            'paginaInicial'
        )
    ) {
        if (
            !validarPaginaInicialFitZone(
                preferencias.paginaInicial
            )
        ) {
            throw new Error('Página inicial inválida.');
        }

        dados.pagina_inicial =
            preferencias.paginaInicial;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            preferencias,
            'mensagensMotivacionais'
        )
    ) {
        if (
            typeof preferencias.mensagensMotivacionais
                !== 'boolean'
        ) {
            throw new Error(
                'Preferência motivacional inválida.'
            );
        }

        dados.mensagens_motivacionais =
            preferencias.mensagensMotivacionais;
    }

    if (
        Object.prototype.hasOwnProperty.call(
            preferencias,
            'metaMensal'
        )
    ) {
        if (
            !validarMetaMensalFitZone(
                preferencias.metaMensal
            )
        ) {
            throw new Error('Meta mensal inválida.');
        }

        dados.meta_mensal =
            preferencias.metaMensal;
    }

    await garantirPerfilPreferenciasSupabaseFitZone(
        usuarioIdEsperado
    );

    const usuario =
        await obterUsuarioVinculadoSupabaseFitZone(
            usuarioIdEsperado
        );

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_perfis')
        .update(dados)
        .eq('id', usuario.id)
        .select(FITZONE_COLUNAS_PREFERENCIAS)
        .single();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error(
            'Não foi possível confirmar o salvamento.'
        );
    }

    await obterUsuarioVinculadoSupabaseFitZone(
        usuarioIdEsperado
    );

    atualizarCopiaLocalPreferenciasFitZone(
        usuarioIdEsperado,
        preferencias
    );

    return normalizarPreferenciasSupabaseFitZone(
        data
    );
}
