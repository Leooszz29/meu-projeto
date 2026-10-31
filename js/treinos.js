
/* =========================================
   FITZONE - IDENTIFICAR CONTA SUPABASE
========================================= */

async function identificarAcessoSupabaseTreinos() {
    const identidade =
        await obterIdentidadeSupabaseFitZone();

    if (!identidade) {
        return {
            autenticado: false,
            id: null,
            email: null
        };
    }

    return {
        autenticado: true,
        id: identidade.id,
        email: identidade.email
    };
}

/* =========================================
   FITZONE - TREINO ATIVO NO SUPABASE
========================================= */

async function consultarTreinoAtivoSupabase() {
    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado || !acesso.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_treino_ativo')
        .select(
            'treino_id, treino_nome, progresso, iniciado_em'
        )
        .eq('usuario_id', acesso.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data || !data.treino_id) {
        return null;
    }

    return {
        id: data.treino_id,
        nome: data.treino_nome,
        progresso: data.progresso || {},
        iniciadoEm: data.iniciado_em
    };
}

/* =========================================
   FITZONE - SALVAR TREINO ATIVO SUPABASE
========================================= */

async function salvarTreinoAtivoSupabase(treino) {
    if (
        !treino ||
        typeof treino.id !== 'string' ||
        !treino.id.trim() ||
        typeof treino.nome !== 'string' ||
        !treino.nome.trim() ||
        !treino.progresso ||
        typeof treino.progresso !== 'object' ||
        Array.isArray(treino.progresso)
    ) {
        throw new Error('Treino ativo inválido.');
    }

    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado || !acesso.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { error } = await cliente
        .from('fitzone_treino_ativo')
        .upsert(
            {
                usuario_id: acesso.id,
                treino_id: treino.id,
                treino_nome: treino.nome,
                progresso: treino.progresso,
                iniciado_em:
                    treino.iniciadoEm || new Date().toISOString(),
                atualizado_em: new Date().toISOString()
            },
            {
                onConflict: 'usuario_id'
            }
        );

    if (error) {
        throw error;
    }

    return true;
}

/* =========================================
   FITZONE - LIMPAR TREINO ATIVO SUPABASE
========================================= */

async function limparTreinoAtivoSupabase() {
    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado || !acesso.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { error } = await cliente
        .from('fitzone_treino_ativo')
        .delete()
        .eq('usuario_id', acesso.id);

    if (error) {
        throw error;
    }

    return true;
}

/* =========================================
   FITZONE - HISTORICO NO SUPABASE
========================================= */

async function consultarHistoricoTreinosSupabase() {
    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado || !acesso.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_historico_treinos')
        .select(
            'treino_id, data_local, dados, concluido_em'
        )
        .eq('usuario_id', acesso.id)
        .order('concluido_em', {
            ascending: false
        });

    if (error) {
        throw error;
    }

    return (data || []).map(registro => ({
        ...registro.dados,
        workoutId: registro.treino_id,
        dataLocal: registro.data_local,
        data: registro.concluido_em
    }));
}

/* =========================================
   FITZONE - REGISTRAR TREINO CONCLUIDO
========================================= */

async function registrarHistoricoTreinoSupabase(
    registro,
    dataLocal
) {
    if (
        !registro ||
        typeof registro !== 'object' ||
        Array.isArray(registro) ||
        typeof registro.workoutId !== 'string' ||
        !registro.workoutId.trim() ||
        typeof dataLocal !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dataLocal)
    ) {
        throw new Error(
            'Dados inválidos para registrar o histórico.'
        );
    }

    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado || !acesso.id) {
        throw new Error('Sessão Supabase inválida.');
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente
        .from('fitzone_historico_treinos')
        .insert({
            usuario_id: acesso.id,
            treino_id: registro.workoutId,
            data_local: dataLocal,
            dados: registro,
            concluido_em: registro.data ||
                new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        if (error.code === '23505') {
            throw new Error(
                'Este treino já foi concluído hoje.'
            );
        }

        throw error;
    }

    return data.id;
}

/* =========================================
   FITZONE - CONSULTAR TREINOS NO SUPABASE
========================================= */

async function consultarTreinosBancoSupabase() {
    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível conectar ao Supabase.'
        );
    }

    const { data, error } = await cliente
        .from('fitzone_treinos')
        .select('treino_id, dados')
        .eq('usuario_id', acesso.id);

    if (error) {
        throw error;
    }

    return data.map(registro => ({
        ...registro.dados,
        id: registro.treino_id
    }));
}

/* =========================================
   FITZONE - CARREGAMENTO UNIFICADO DE TREINOS
========================================= */

async function carregarTreinosPorOrigem(acesso) {
    if (
        acesso &&
        acesso.autenticado === true &&
        acesso.origem === 'supabase'
    ) {
        return await consultarTreinosBancoSupabase();
    }

    if (
        acesso &&
        acesso.autenticado === true &&
        acesso.origem === 'local'
    ) {
        return loadWorkouts();
    }

    throw new Error(
        'Sessão inválida para carregar treinos.'
    );
}

/* =========================================
   FITZONE - SALVAMENTO UNIFICADO DE TREINOS
========================================= */

async function salvarTreinoPorOrigem(acesso, treino) {
    if (
        !acesso ||
        acesso.autenticado !== true
    ) {
        throw new Error(
            'Sessão inválida para salvar treino.'
        );
    }

    if (
        !treino ||
        typeof treino !== 'object' ||
        Array.isArray(treino) ||
        typeof treino.id !== 'string' ||
        !treino.id.trim() ||
        typeof treino.nome !== 'string' ||
        !treino.nome.trim() ||
        (
            treino.exercicios !== undefined &&
            !Array.isArray(treino.exercicios)
        )
    ) {
        throw new Error(
            'Dados do treino inválidos.'
        );
    }

    if (acesso.origem === 'supabase') {
        return await salvarTreinoBancoSupabase(treino);
    }

    if (acesso.origem === 'local') {
        const sessaoAtual = carregarSessao();

        if (
            !sessaoAtual ||
            sessaoAtual.email?.trim().toLowerCase() !==
                acesso.email?.trim().toLowerCase()
        ) {
            throw new Error(
                'A sessão tradicional foi alterada.'
            );
        }

        const treinos =
            await carregarTreinosPorOrigem(acesso);

        const indice = treinos.findIndex(
            item => item.id === treino.id
        );

        if (indice >= 0) {
            treinos[indice] = treino;
        } else {
            treinos.push(treino);
        }

        const salvo = saveWorkouts(treinos);

        if (!salvo) {
            throw new Error(
                'Falha ao salvar treino local.'
            );
        }

        return true;
    }

    throw new Error(
        'Origem da conta não reconhecida.'
    );
}

/* =========================================
   FITZONE - SALVAR TREINO NO BANCO SUPABASE
========================================= */

async function salvarTreinoBancoSupabase(treino) {
    if (
        !treino ||
        typeof treino !== 'object' ||
        Array.isArray(treino) ||
        typeof treino.id !== 'string' ||
        !treino.id.trim()
    ) {
        throw new Error(
            'Treino inválido para salvar no Supabase.'
        );
    }

    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível conectar ao Supabase.'
        );
    }

    const { error } = await cliente
        .from('fitzone_treinos')
        .upsert(
            {
                usuario_id: acesso.id,
                treino_id: treino.id,
                dados: treino,
                atualizado_em: new Date().toISOString()
            },
            {
                onConflict: 'usuario_id,treino_id'
            }
        );

    if (error) {
        throw error;
    }

    return true;
}

/* =========================================
   FITZONE - EXCLUIR TREINO NO BANCO SUPABASE
========================================= */

async function excluirTreinoBancoSupabase(treinoId) {
    if (
        typeof treinoId !== 'string' ||
        !treinoId.trim()
    ) {
        throw new Error(
            'Identificador do treino inválido.'
        );
    }

    const acesso =
        await identificarAcessoSupabaseTreinos();

    if (!acesso.autenticado) {
        throw new Error(
            'Usuário Supabase não autenticado.'
        );
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível conectar ao Supabase.'
        );
    }

    const { error } = await cliente
        .from('fitzone_treinos')
        .delete()
        .eq('usuario_id', acesso.id)
        .eq('treino_id', treinoId);

    if (error) {
        throw error;
    }

    return true;
}

// ==================== SESSÃO ====================
function carregarSessao() {

    try {

        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        if (!sessaoJSON) {
            return null;
        }

        const sessao = JSON.parse(sessaoJSON);

        if (
            !sessao ||
            typeof sessao !== 'object' ||
            Array.isArray(sessao) ||
            sessao.autenticado !== true ||
            typeof sessao.email !== 'string' ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                sessao.email.trim()
            )
        ) {
            console.warn(
                'Estrutura da sessão FitZone inválida.'
            );

            return null;
        }

        return {
            ...sessao,
            email: sessao.email.trim().toLowerCase()
        };

    } catch (error) {

        console.warn(
            'Não foi possível carregar a sessão:',
            error
        );

        return null;
    }
}

function obterChaveTreinoAtivo() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar o treino ativo.'
        );
    }

    return `treinoAtivo:${sessao.email.trim().toLowerCase()}`;
}

function carregarTreinoAtivo() {

    try {

        const treinoAtivoJSON =
            localStorage.getItem(
                obterChaveTreinoAtivo()
            );

        if (!treinoAtivoJSON) {
            return null;
        }

        const treinoAtivo = JSON.parse(
            treinoAtivoJSON
        );

        if (
            !treinoAtivo ||
            typeof treinoAtivo !== 'object' ||
            Array.isArray(treinoAtivo) ||
            typeof treinoAtivo.id !== 'string' ||
            !treinoAtivo.id.trim() ||
            typeof treinoAtivo.nome !== 'string' ||
            !treinoAtivo.nome.trim()
        ) {
            console.warn(
                'Estrutura do treino ativo inválida.'
            );

            return null;
        }

        const treinos = loadWorkouts();

        const treinoExiste = treinos.some(
            treino => treino.id === treinoAtivo.id
        );

        if (!treinoExiste) {
            console.warn(
                'O treino ativo não existe mais na lista de treinos.'
            );

            return null;
        }

        return treinoAtivo;

    } catch (error) {

        console.warn(
            'Não foi possível carregar o treino ativo:',
            error
        );

        return null;
    }
}

function obterChaveProgressoTreino() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar o progresso do treino.'
        );
    }

    return `progressoTreino:${sessao.email.trim().toLowerCase()}`;
}

function carregarProgressoTreino() {

    try {

        const progressoJSON =
            localStorage.getItem(
                obterChaveProgressoTreino()
            );

        return progressoJSON
            ? JSON.parse(progressoJSON)
            : {};

    } catch (error) {

        console.warn(
            'Não foi possível carregar o progresso do treino:',
            error
        );

        return {};
    }
}

function obterChaveHistoricoTreinos() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar o histórico.'
        );
    }

    return `historicoTreinos:${sessao.email.trim().toLowerCase()}`;
}

function carregarHistoricoTreinos() {

    try {

        const historicoJSON =
            localStorage.getItem(
                obterChaveHistoricoTreinos()
            );

        if (!historicoJSON) {
            return [];
        }

        const historico = JSON.parse(historicoJSON);

        if (!Array.isArray(historico)) {
            throw new Error(
                'Formato inválido do histórico de treinos.'
            );
        }

        return historico;

    } catch (error) {

        console.warn(
            'Não foi possível carregar o histórico de treinos:',
            error
        );

        return [];
    }
}

const STORAGE_KEY = 'fitzoneTreinos';

function obterChaveTreinos() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar os treinos.'
        );
    }

    return `${STORAGE_KEY}:${sessao.email.trim().toLowerCase()}`;
}

function loadWorkouts() {
    try {
        const dados = localStorage.getItem(
            obterChaveTreinos()
        );

        if (dados === null) {
            return [];
        }

        const treinos = JSON.parse(dados);

        if (!Array.isArray(treinos)) {
            console.warn(
                'Formato inválido da lista de treinos.'
            );

            return [];
        }

        // Verifica exercícios antigos sem alterar os dados
        const idsEncontrados = new Set();

        treinos.forEach((treino, indiceTreino) => {
            if (
                !treino ||
                typeof treino !== 'object' ||
                Array.isArray(treino) ||
                typeof treino.id !== 'string' ||
                !treino.id.trim() ||
                typeof treino.nome !== 'string' ||
                !treino.nome.trim() ||
                (
                    treino.exercicios !== undefined &&
                    !Array.isArray(treino.exercicios)
                )
            ) {
                console.warn(
                    'FitZone: treino antigo com estrutura inválida.',
                    { treino: indiceTreino + 1 }
                );
                return;
            }

            if (idsEncontrados.has(treino.id)) {
                console.warn(
                    'FitZone: treino antigo com ID duplicado.',
                    { treino: indiceTreino + 1 }
                );
            } else {
                idsEncontrados.add(treino.id);
            }

            if (!Array.isArray(treino.exercicios)) {
                return;
            }

            const idsExerciciosEncontrados = new Set();

            treino.exercicios.forEach((exercicio, indiceExercicio) => {
                if (
                    !exercicio ||
                    typeof exercicio !== 'object' ||
                    Array.isArray(exercicio)
                ) {
                    console.warn(
                        'FitZone: registro de exercício inválido.',
                        indiceTreino + 1,
                        indiceExercicio + 1
                    );
                    return;
                }

                if (
                    typeof exercicio.id !== 'string' ||
                    !exercicio.id.trim()
                ) {
                    console.warn(
                        'FitZone: exercício antigo sem ID válido.',
                        {
                            treino: indiceTreino + 1,
                            exercicio: indiceExercicio + 1
                        }
                    );
                } else if (idsExerciciosEncontrados.has(exercicio.id)) {
                    console.warn(
                        'FitZone: exercício antigo com ID duplicado.',
                        {
                            treino: indiceTreino + 1,
                            exercicio: indiceExercicio + 1
                        }
                    );
                } else {
                    idsExerciciosEncontrados.add(exercicio.id);
                }

                const dadosNumericosValidos =
                    Number.isInteger(exercicio.series) &&
                    exercicio.series >= 1 &&
                    Number.isInteger(exercicio.repeticoes) &&
                    exercicio.repeticoes >= 1 &&
                    Number.isInteger(exercicio.descanso) &&
                    exercicio.descanso >= 0;

                if (!dadosNumericosValidos) {
                    console.warn(
                        'FitZone: exercício antigo com valores inválidos.',
                        {
                            treino: indiceTreino + 1,
                            exercicio: indiceExercicio + 1
                        }
                    );
                }
            });
        });

        return treinos;

    } catch (erro) {
        console.error(
            'Erro ao carregar treinos:',
            erro
        );

        return [];
    }
}

function saveWorkouts(workouts) {
    try {
        if (!Array.isArray(workouts)) {
            throw new Error(
                'Os novos dados dos treinos devem ser uma lista.'
            );
        }

        const treinosValidos = workouts.every(treino =>
            treino !== null &&
            typeof treino === 'object' &&
            !Array.isArray(treino) &&
            typeof treino.id === 'string' &&
            !!treino.id.trim() &&
            typeof treino.nome === 'string' &&
            !!treino.nome.trim()
        );

        if (!treinosValidos) {
            throw new Error(
                'A lista contém treinos sem identificação ou nome válido.'
            );
        }

        const exerciciosValidos = workouts.every(
            treino =>
                treino.exercicios === undefined ||
                Array.isArray(treino.exercicios)
        );

        if (!exerciciosValidos) {
            throw new Error(
                'Um ou mais treinos possuem uma lista de exercícios inválida.'
            );
        }

        const registrosExerciciosValidos = workouts.every(
            treino =>
                treino.exercicios === undefined ||
                treino.exercicios.every(exercicio =>
                    exercicio !== null &&
                    typeof exercicio === 'object' &&
                    !Array.isArray(exercicio)
                )
        );

        if (!registrosExerciciosValidos) {
            throw new Error(
                'A lista contém registros de exercícios inválidos.'
            );
        }

        const idsTreinos = workouts.map(
            treino => treino.id
        );

        const idsUnicos = new Set(idsTreinos);

        if (idsUnicos.size !== idsTreinos.length) {
            throw new Error(
                'A lista contém treinos com IDs duplicados.'
            );
        }

        const chave = obterChaveTreinos();
        const dadosAtuais = localStorage.getItem(chave);

        if (dadosAtuais !== null) {
            const treinosExistentes = JSON.parse(dadosAtuais);

            if (!Array.isArray(treinosExistentes)) {
                throw new Error(
                    'Os dados dos treinos existentes são inválidos.'
                );
            }
        }

        localStorage.setItem(
            chave,
            JSON.stringify(workouts)
        );

        return true;

    } catch (erro) {
        console.error(
            'Não foi possível salvar os treinos:',
            erro
        );

        alert(
            'Não foi possível salvar seus treinos. Tente novamente.'
        );

        return false;
    }
}

function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

let editingWorkoutId = null;
let editingExerciseCtx = null; // { workoutId, exerciseId or null }
let treinoAtivoSupabaseVisualId = null;

/* =========================================
   FITZONE - CARTOES DE TREINOS SUPABASE
   Visual original em modo de leitura
========================================= */

function renderizarCartoesSupabase(treinos, lista) {
    if (
        !Array.isArray(treinos) ||
        !(lista instanceof HTMLElement)
    ) {
        throw new Error(
            'Dados inválidos para exibir os treinos.'
        );
    }

    lista.treinosSupabaseCompletos = treinos;

    const campoBusca = lista.parentElement?.querySelector(
        '#workoutSearchSupabase'
    );

    const normalizarBusca = texto =>
        String(texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .trim();

    const termo = normalizarBusca(
        campoBusca?.value
    );

    const treinosFiltrados = treinos.filter(treino =>
        normalizarBusca(treino.nome).includes(termo)
    );

    lista.replaceChildren();

    if (treinosFiltrados.length === 0) {
        const mensagemVazia =
            document.createElement('div');

        mensagemVazia.className = termo
            ? 'workout-search-empty'
            : 'empty-state';

        const tituloVazio =
            document.createElement('strong');

        tituloVazio.textContent = termo
            ? 'Nenhum treino encontrado'
            : 'Nenhum treino criado ainda';

        const descricao =
            document.createElement('p');

        descricao.textContent = termo
            ? 'Tente pesquisar outro nome ou limpe a busca.'
            : 'Crie seu primeiro treino para começar.';

        mensagemVazia.append(
            tituloVazio,
            descricao
        );

        if (!termo) {
            const botaoCriar =
                document.createElement('button');

            botaoCriar.type = 'button';
            botaoCriar.className = 'empty-state-action';
            botaoCriar.textContent = '+ Criar primeiro treino';

            botaoCriar.addEventListener(
                'click',
                () => {
                    const botaoNovo = document.querySelector(
                        '#btnNewWorkout'
                    );

                    if (botaoNovo) {
                        botaoNovo.click();
                    }
                }
            );

            mensagemVazia.appendChild(botaoCriar);
        }

        lista.appendChild(mensagemVazia);
        return;
    }

    treinosFiltrados.forEach(treino => {

        const card = document.createElement('div');
        card.className = 'workout-card';

        const cabecalho = document.createElement('div');
        cabecalho.className = 'workout-header';

        const titulo = document.createElement('div');
        titulo.className = 'workout-title';
        titulo.textContent =
            treino.nome || 'Treino sem nome';

        const acoes = document.createElement('div');
        acoes.className = 'workout-actions';

        const botaoEditarNome =
            document.createElement('button');

        botaoEditarNome.type = 'button';
        botaoEditarNome.className = 'icon-btn';
        botaoEditarNome.textContent = '✎';
        botaoEditarNome.title = 'Editar nome do treino';
        botaoEditarNome.setAttribute(
            'aria-label',
            'Editar nome do treino'
        );
        botaoEditarNome.dataset.editarTreinoSupabase =
            treino.id;

        const botaoDuplicar =
            document.createElement('button');

        botaoDuplicar.type = 'button';
        botaoDuplicar.className = 'icon-btn';
        botaoDuplicar.textContent = '⧉';
        botaoDuplicar.title = 'Duplicar treino';
        botaoDuplicar.setAttribute(
            'aria-label',
            'Duplicar treino'
        );
        botaoDuplicar.dataset.duplicarTreinoSupabase =
            treino.id;

        const botaoExcluirTreino =
            document.createElement('button');

        botaoExcluirTreino.type = 'button';
        botaoExcluirTreino.className = 'icon-btn';
        botaoExcluirTreino.textContent = '✕';
        botaoExcluirTreino.title = 'Excluir treino';
        botaoExcluirTreino.setAttribute(
            'aria-label',
            'Excluir treino'
        );
        botaoExcluirTreino.dataset.excluirTreinoSupabase =
            treino.id;

        acoes.append(
            botaoEditarNome,
            botaoDuplicar,
            botaoExcluirTreino
        );

        cabecalho.append(titulo, acoes);
        card.appendChild(cabecalho);

        const quantidade = Array.isArray(treino.exercicios)
            ? treino.exercicios.length
            : 0;

        const detalhes = document.createElement('div');
        detalhes.className = 'no-exercises';
        detalhes.textContent =
            quantidade === 0
                ? 'Nenhum exercício adicionado ainda.'
                : `${quantidade} exercício(s) cadastrados`;

        card.appendChild(detalhes);

        const adicionarExercicio =
            document.createElement('button');

        adicionarExercicio.type = 'button';
        adicionarExercicio.className = 'btn-add-exercise';
        adicionarExercicio.textContent = '+ Adicionar exercício';
        adicionarExercicio.dataset.adicionarExercicioSupabase =
            treino.id;

        card.appendChild(adicionarExercicio);

        /* =========================================
           EXIBIR EXERCICIOS DO TREINO SUPABASE
        ========================================= */

        if (quantidade > 0) {
            treino.exercicios.forEach(exercicio => {
                const linha = document.createElement('div');
                linha.className = 'exercise-row';

                const informacoes = document.createElement('div');
                informacoes.className = 'exercise-info';

                const nome = document.createElement('div');
                nome.className = 'exercise-name';
                nome.textContent =
                    exercicio.nome || 'Exercício sem nome';

                const detalhesExercicio =
                    document.createElement('div');

                detalhesExercicio.className = 'exercise-meta';

                const series = exercicio.series ?? '-';
                const repeticoes = exercicio.repeticoes ?? '-';
                const descanso = exercicio.descanso ?? '-';

                detalhesExercicio.textContent =
                    `${series}x${repeticoes} repetições · ` +
                    `${descanso}s descanso`;

                informacoes.appendChild(nome);
                informacoes.appendChild(detalhesExercicio);

                const editarExercicio =
                    document.createElement('button');

                editarExercicio.type = 'button';
                editarExercicio.className = 'icon-btn';
                editarExercicio.textContent = '✎';
                editarExercicio.title = 'Editar exercício';
                editarExercicio.setAttribute(
                    'aria-label',
                    'Editar exercício'
                );

                editarExercicio.dataset.editarExercicioSupabase =
                    exercicio.id;

                editarExercicio.dataset.treinoExercicioSupabase =
                    treino.id;

                const excluirExercicio =
                    document.createElement('button');

                excluirExercicio.type = 'button';
                excluirExercicio.className = 'icon-btn';
                excluirExercicio.textContent = '✕';
                excluirExercicio.title = 'Excluir exercício';

                excluirExercicio.setAttribute(
                    'aria-label',
                    'Excluir exercício'
                );

                excluirExercicio.dataset.excluirExercicioSupabase =
                    exercicio.id;

                excluirExercicio.dataset.treinoExercicioSupabase =
                    treino.id;

                linha.append(
                    informacoes,
                    editarExercicio,
                    excluirExercicio
                );

                card.appendChild(linha);

            });
        }

        const iniciarTreino =
            document.createElement('button');

        iniciarTreino.type = 'button';
        iniciarTreino.className = 'btn-start-workout';

        iniciarTreino.dataset.iniciarTreinoSupabase =
            treino.id;

        const selecionado =
            treinoAtivoSupabaseVisualId === treino.id;

        iniciarTreino.textContent = selecionado
            ? '✓ Treino selecionado'
            : '▶ Iniciar treino';

        if (selecionado) {
            card.classList.add('active-workout');
        }

        card.appendChild(iniciarTreino);
        lista.appendChild(card);
    });
}

// ==================== RENDER ====================
function renderWorkouts() {
    const workouts = loadWorkouts();
    const list = document.getElementById('workoutsList');
    const empty = document.getElementById('emptyState');
    list.innerHTML = '';

    if (workouts.length === 0) {
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';

    /* FILTRAR TREINOS PELO NOME */
    const campoBusca = document.getElementById(
        'workoutSearchInput'
    );

    const normalizarPesquisa = (texto) =>
        texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLocaleLowerCase('pt-BR')
            .trim();

    const termoBusca = normalizarPesquisa(
        campoBusca ? campoBusca.value : ''
    );

    const treinosFiltrados = workouts.filter(workout =>
        normalizarPesquisa(workout.nome || '').includes(termoBusca)
    );

    /* EXIBIR MENSAGEM QUANDO NAO HOUVER RESULTADOS */
    const mensagemSemResultados = document.getElementById(
        'workoutSearchEmpty'
    );

    if (mensagemSemResultados) {
        mensagemSemResultados.hidden =
            treinosFiltrados.length > 0 || !termoBusca;
    }

    treinosFiltrados.forEach(workout => {
        const card = document.createElement('div');

        card.className = 'workout-card';
        card.dataset.workoutId = workout.id;

        const headerEl = document.createElement('div');
        headerEl.className = 'workout-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'workout-title';
        titleEl.textContent = workout.nome;

        const actionsEl = document.createElement('div');
        actionsEl.className = 'workout-actions';

        const editBtn = document.createElement('button');

editBtn.type = 'button';
editBtn.className = 'icon-btn';
editBtn.title = 'Editar nome do treino';
editBtn.setAttribute(
    'aria-label',
    'Editar nome do treino'
);
editBtn.innerHTML = '✎';
        editBtn.addEventListener('click', () => openWorkoutModal(workout.id));

        /* BOTAO DUPLICAR TREINO */
        const duplicateBtn = document.createElement('button');

        duplicateBtn.type = 'button';
        duplicateBtn.className = 'icon-btn';
        duplicateBtn.title = 'Duplicar treino';
        duplicateBtn.setAttribute(
            'aria-label',
            'Duplicar treino'
        );
        duplicateBtn.textContent = '⧉';

        duplicateBtn.addEventListener('click', () => {
            duplicateWorkout(workout.id);
        });

        const delBtn = document.createElement('button');

delBtn.type = 'button';
delBtn.className = 'icon-btn danger';
delBtn.title = 'Excluir treino';
delBtn.setAttribute(
    'aria-label',
    'Excluir treino'
);
delBtn.innerHTML = '🗑';
        delBtn.addEventListener('click', () => deleteWorkout(workout.id));

        actionsEl.appendChild(editBtn);
        actionsEl.appendChild(duplicateBtn);
        actionsEl.appendChild(delBtn);
        headerEl.appendChild(titleEl);
        headerEl.appendChild(actionsEl);
        card.appendChild(headerEl);

        if (!workout.exercicios || workout.exercicios.length === 0) {
            const noEx = document.createElement('div');
            noEx.className = 'no-exercises';
            noEx.textContent = 'Nenhum exercício adicionado ainda.';
            card.appendChild(noEx);
        } else {
            const gruposRenderizados = new Set();
            workout.exercicios.forEach(ex => {
                const row = document.createElement('div');
                row.className = 'exercise-row';

                const info = document.createElement('div');
                info.className = 'exercise-info';

                const name = document.createElement('div');
                name.className = 'exercise-name';
                name.textContent = ex.nome;

                const meta = document.createElement('div');
                meta.className = 'exercise-meta';

                const seriesInfo = document.createElement('span');
                seriesInfo.textContent =
                    `${ex.series}x${ex.repeticoes}`;

                const descansoInfo = document.createElement('span');
                descansoInfo.textContent =
                    `${ex.descanso}s`;

                meta.appendChild(seriesInfo);
                meta.appendChild(
                    document.createTextNode(' repetições · ')
                );
                meta.appendChild(descansoInfo);
                meta.appendChild(
                    document.createTextNode(' descanso')
                );

                const typeBadge = document.createElement('span');

typeBadge.className =
    `exercise-type-badge ${ex.tipoExecucao || 'individual'}`;

const tiposExecucao = {
    individual: 'INDIVIDUAL',
    bisset: 'BI-SET',
    triset: 'TRI-SET'
};

typeBadge.textContent =
    tiposExecucao[ex.tipoExecucao] || 'INDIVIDUAL';

                info.appendChild(name);
info.appendChild(meta);
info.appendChild(typeBadge);

                const exActions = document.createElement('div');
                exActions.className = 'exercise-actions';

                const exEditBtn = document.createElement('button');

exEditBtn.type = 'button';
exEditBtn.className = 'icon-btn';
exEditBtn.title = 'Editar exercício';
exEditBtn.setAttribute(
    'aria-label',
    'Editar exercício'
);
exEditBtn.innerHTML = '✎';
                exEditBtn.addEventListener('click', () => openExerciseModal(workout.id, ex.id));

                const exDelBtn = document.createElement('button');

exDelBtn.type = 'button';
exDelBtn.className = 'icon-btn danger';
exDelBtn.title = 'Remover exercício';
exDelBtn.setAttribute(
    'aria-label',
    'Remover exercício'
);
exDelBtn.innerHTML = '🗑';
                exDelBtn.addEventListener('click', () => deleteExercise(workout.id, ex.id));

                exActions.appendChild(exEditBtn);
                exActions.appendChild(exDelBtn);

                row.appendChild(info);
                row.appendChild(exActions);
                // ========================================
// AGRUPAMENTO VISUAL BI-SET / TRI-SET
// ========================================

const tipoExecucao =
    ex.tipoExecucao || 'individual';

const grupoExecucao =
    ex.grupoExecucao || null;

// EXERCÍCIO INDIVIDUAL
if (
    tipoExecucao === 'individual' ||
    !grupoExecucao
) {

    card.appendChild(row);

} else {

    // PROCURA UM GRUPO QUE JÁ FOI CRIADO
    let groupContainer =
        card.querySelector(
            `[data-exercise-group="${grupoExecucao}"]`
        );

    // SE AINDA NÃO EXISTE, CRIA O GRUPO
    if (!groupContainer) {

        groupContainer =
            document.createElement('div');

        groupContainer.className =
            `exercise-group ${tipoExecucao}`;

        groupContainer.dataset.exerciseGroup =
            grupoExecucao;

        const groupHeader =
            document.createElement('div');

        groupHeader.className =
            'exercise-group-header';

        const gruposDoMesmoTipo =
            workout.exercicios
                .filter(item =>
                    (item.tipoExecucao || 'individual') ===
                        tipoExecucao &&
                    item.grupoExecucao
                )
                .map(item => item.grupoExecucao);

        const gruposUnicos =
            [...new Set(gruposDoMesmoTipo)];

        const numeroGrupo =
            gruposUnicos.indexOf(grupoExecucao) + 1;

       const quantidadeNoGrupo =
    workout.exercicios.filter(item =>
        item.grupoExecucao === grupoExecucao &&
        (item.tipoExecucao || 'individual') === tipoExecucao
    ).length;

const quantidadeEsperada =
    tipoExecucao === 'bisset'
        ? 2
        : 3;

const grupoCompleto =
    quantidadeNoGrupo === quantidadeEsperada;

groupHeader.textContent =
    tipoExecucao === 'bisset'
        ? `BI-SET ${numeroGrupo}`
        : `TRI-SET ${numeroGrupo}`;

const groupStatus =
    document.createElement('span');

groupStatus.className =
    grupoCompleto
        ? 'exercise-group-status complete'
        : 'exercise-group-status incomplete';

groupStatus.textContent =
    grupoCompleto
        ? `${quantidadeNoGrupo}/${quantidadeEsperada} ✓`
        : `${quantidadeNoGrupo}/${quantidadeEsperada} • INCOMPLETO`;

groupHeader.appendChild(groupStatus);

        groupContainer.appendChild(
            groupHeader
        );

        card.appendChild(
            groupContainer
        );

        gruposRenderizados.add(
            grupoExecucao
        );
    }

    groupContainer.appendChild(row);
}
            });
        }

        const addExBtn = document.createElement('button');

        addExBtn.type = 'button';

        addExBtn.className = 'btn-add-exercise';
        addExBtn.textContent = '+ Adicionar exercício';
        addExBtn.addEventListener('click', () => openExerciseModal(workout.id, null));
        card.appendChild(addExBtn);

        // BOTÃO INICIAR TREINO

const startBtn = document.createElement('button');

        startBtn.type = 'button';

startBtn.className = 'btn-start-workout';

startBtn.textContent = '▶ Iniciar treino';

// VERIFICA SE ESTE TREINO JÁ ESTÁ SELECIONADO

const treinoAtivo =
    carregarTreinoAtivo();

if (
    treinoAtivo &&
    treinoAtivo.id === workout.id
) {
    card.classList.add('active-workout');

    startBtn.textContent =
        '✓ Treino selecionado';

    renderActiveTraining(workout);
}

startBtn.addEventListener('click', () => {

    const historicoHoje = carregarHistoricoTreinos();

    const hoje = new Date();

    const dataHoje = calDateKey(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate()
    );

    const jaConcluidoHoje = historicoHoje.some(registro => {
        const data = new Date(registro.data);

        if (Number.isNaN(data.getTime())) {
            return false;
        }

        return (
            String(registro.workoutId) === String(workout.id) &&
            calDateKey(
                data.getFullYear(),
                data.getMonth(),
                data.getDate()
            ) === dataHoje
        );
    });

    if (jaConcluidoHoje) {
        alert(
            'Este treino já foi concluído hoje. Você poderá iniciá-lo novamente amanhã.'
        );

        return;
    }

    const treinoAtivoAtual =
        carregarTreinoAtivo();

    if (
        treinoAtivoAtual &&
        treinoAtivoAtual.id !== workout.id
    ) {
        askConfirm(
            'Você já possui um treino em andamento. Deseja iniciar outro treino? O progresso do treino anterior ficará armazenado, mas ele deixará de ser o treino ativo.',
            () => {
                try {
                    localStorage.setItem(
                        obterChaveTreinoAtivo(),
                        JSON.stringify({
                            id: workout.id,
                            nome: workout.nome
                        })
                    );
                } catch (erro) {
                    console.error(
                        'Erro ao trocar de treino:',
                        erro
                    );

                    alert(
                        'Não foi possível trocar de treino. Tente novamente.'
                    );

                    return;
                }

                renderWorkouts();
            },
            'Confirmar'
        );

        return;
    }

    // SALVA O TREINO SELECIONADO
    try {
        localStorage.setItem(
            obterChaveTreinoAtivo(),
            JSON.stringify({
                id: workout.id,
                nome: workout.nome
            })
        );
    } catch (erro) {
        console.error(
            'Erro ao iniciar treino:',
            erro
        );

        alert(
            'Não foi possível iniciar o treino. Tente novamente.'
        );

        return;
    }

    // REMOVE A SELEÇÃO VISUAL DOS OUTROS CARDS
    document
        .querySelectorAll('.workout-card')
        .forEach(cardItem => {

            cardItem.classList.remove(
                'active-workout'
            );

        });

    // VOLTA TODOS OS BOTÕES AO TEXTO ORIGINAL
    document
        .querySelectorAll('.btn-start-workout')
        .forEach(button => {

            button.textContent =
                '▶ Iniciar treino';

        });

    // MARCA SOMENTE O TREINO ATUAL
    card.classList.add(
        'active-workout'
    );

    startBtn.textContent =
        '✓ Treino selecionado';

    renderActiveTraining(workout);

});

card.appendChild(startBtn);

list.appendChild(card);
    });
}

// ========================================
// TREINO EM ANDAMENTO
// ========================================

function renderActiveTraining(workout) {

    const nameElement =
        document.getElementById('activeTrainingName');

    const statusElement =
        document.getElementById('activeTrainingStatus');

    const exercisesElement =
        document.getElementById('activeTrainingExercises');

    const finishButton =
    document.getElementById('btnFinishWorkout');

    if (
    !nameElement ||
    !statusElement ||
    !exercisesElement ||
    !finishButton
) {
    return;
}

finishButton.disabled = true;

    // CARREGA O PROGRESSO DAS SÉRIES

const progressoTreino =
    carregarProgressoTreino();

const progressoAtual =
    progressoTreino[workout.id] || {};

function atualizarBotaoFinalizar() {
    const progresso =
        carregarProgressoTreino();

    const progressoWorkout =
        progresso[workout.id] || {};

    const exercicios =
        workout.exercicios || [];

    const algumaSerieConcluida =
        exercicios.some(
            (exercicio, index) => {
                const exerciseKey =
                    exercicio.id ||
                    `exercise-${index}`;

                const seriesConcluidas =
                    progressoWorkout[
                        exerciseKey
                    ] || [];

                return (
                    Array.isArray(seriesConcluidas) &&
                    seriesConcluidas.length > 0
                );
            }
        );

    finishButton.disabled =
        !algumaSerieConcluida;
}

atualizarBotaoFinalizar();

    // FITZONE - INDICADOR GERAL DE PROGRESSO
const indicadorProgresso = document.createElement('div');
indicadorProgresso.className = 'fitzone-workout-progress';

const textoProgresso = document.createElement('p');
textoProgresso.className = 'fitzone-workout-progress-text';

const barraProgresso = document.createElement('progress');
barraProgresso.className = 'fitzone-workout-progress-bar';
barraProgresso.max = 100;
barraProgresso.value = 0;
barraProgresso.setAttribute(
    'aria-label',
    'Progresso geral do treino'
);

indicadorProgresso.append(
    textoProgresso,
    barraProgresso
);

function atualizarIndicadorProgresso() {
    const exercicios = Array.isArray(workout.exercicios)
        ? workout.exercicios
        : [];

    const progresso =
        carregarProgressoTreino()[workout.id] || {};

    const total = exercicios.length;

    const concluidos = exercicios.filter((exercicio, index) => {
        const chave = exercicio.id || `exercise-${index}`;
        const series = progresso[chave] || [];
        const quantidade = Number(exercicio.series) || 0;

        return quantidade > 0 &&
            Array.isArray(series) &&
            Array.from(
                { length: quantidade },
                (_, i) => i + 1
            ).every(numero => series.includes(numero));
    }).length;

    const percentual = total > 0
        ? Math.round((concluidos / total) * 100)
        : 0;

    textoProgresso.textContent =
        `${concluidos} de ${total} exercícios concluídos (${percentual}%)`;

    barraProgresso.value = percentual;
}

const indicadorAnterior = document.querySelector(
    '.fitzone-workout-progress'
);

if (indicadorAnterior) {
    indicadorAnterior.remove();
}

exercisesElement.before(indicadorProgresso);
atualizarIndicadorProgresso();

document.addEventListener(
    'progressoTreinoAtualizado',
    event => {
        if (
            event.detail.workoutId === workout.id &&
            indicadorProgresso.isConnected
        ) {
            atualizarIndicadorProgresso();
        }
    }
);

// NOME DO TREINO

    nameElement.textContent =
        workout.nome || 'Treino';

    // STATUS

    statusElement.textContent =
        'EM ANDAMENTO';

    // LIMPA A ÁREA

    exercisesElement.innerHTML = '';

    // VERIFICA SE EXISTEM EXERCÍCIOS

    const exercicios =
        workout.exercicios || [];

    if (exercicios.length === 0) {

        exercisesElement.innerHTML = `
            <div class="active-training-empty">

                <strong>
                    Nenhum exercício cadastrado
                </strong>

                <p>
                    Adicione exercícios a este treino
                    antes de iniciá-lo.
                </p>

            </div>
        `;

        return;
    }

    // CRIA OS EXERCÍCIOS

const gruposAtivosCriados = new Map();

exercicios.forEach((exercicio, index) => {

        const exerciseItem =
            document.createElement('div');

        exerciseItem.className =
            'active-exercise-item';

        const exerciseNumber =
            document.createElement('span');

        exerciseNumber.className =
            'active-exercise-number';

        exerciseNumber.textContent =
            String(index + 1).padStart(2, '0');

        const exerciseInfo =
            document.createElement('div');

        exerciseInfo.className =
            'active-exercise-info';

        const exerciseName =
            document.createElement('strong');

        exerciseName.className =
            'active-exercise-name';

        exerciseName.textContent =
            exercicio.nome || 'Exercício';

        const exerciseMeta =
            document.createElement('span');

        exerciseMeta.className =
            'active-exercise-meta';

        const series =
            exercicio.series || '—';

        const reps =
            exercicio.repeticoes || '—';

        const descanso =
            exercicio.descanso || '0';

        exerciseMeta.textContent =
            `${series} séries × ${reps} repetições • ${descanso}s descanso`;

        exerciseInfo.appendChild(
    exerciseName
);

exerciseInfo.appendChild(
    exerciseMeta
);
    const toggleIndividualBtn =
    document.createElement('button');

toggleIndividualBtn.type = 'button';

toggleIndividualBtn.className =
    'active-individual-toggle';

toggleIndividualBtn.textContent = '▲';

toggleIndividualBtn.setAttribute(
    'aria-label',
    'Ocultar detalhes do exercício'
);

toggleIndividualBtn.addEventListener(
    'click',
    () => {

        const isCollapsed =
            exerciseItem.classList.toggle(
                'collapsed-individual'
            );

        toggleIndividualBtn.textContent =
            isCollapsed ? '▼' : '▲';

        toggleIndividualBtn.setAttribute(
            'aria-label',
            isCollapsed
                ? 'Mostrar detalhes do exercício'
                : 'Ocultar detalhes do exercício'
        );
    }
);

exerciseInfo.appendChild(
    toggleIndividualBtn
);

// ========================================
// CONTROLE DAS SÉRIES
// ========================================

const seriesControls =
    document.createElement('div');

seriesControls.className =
    'active-series-controls';

const quantidadeSeries =
    parseInt(exercicio.series, 10) || 0;

const exerciseKey =
    exercicio.id || `exercise-${index}`;

const seriesConcluidas =
    progressoAtual[exerciseKey] || [];

for (
    let numeroSerie = 1;
    numeroSerie <= quantidadeSeries;
    numeroSerie++
) {

    const seriesButton =
        document.createElement('button');

    seriesButton.type = 'button';

    seriesButton.className =
        'active-series-btn';

    seriesButton.textContent =
        numeroSerie;

    if (
    seriesConcluidas.includes(numeroSerie)
) {
    seriesButton.classList.add('completed');
}

    seriesButton.setAttribute(
        'aria-label',
        `Marcar série ${numeroSerie} como concluída`
    );

  seriesButton.addEventListener(
    'click',
    () => {

        seriesButton.classList.toggle(
            'completed'
        );

        const concluida =
            seriesButton.classList.contains(
                'completed'
            );

        // BUSCA O PROGRESSO MAIS RECENTE

        const progressoSalvo =
    carregarProgressoTreino();

        if (!progressoSalvo[workout.id]) {
            progressoSalvo[workout.id] = {};
        }

        const seriesSalvas =
            progressoSalvo[workout.id][exerciseKey] || [];

        if (concluida) {

            if (!seriesSalvas.includes(numeroSerie)) {
                seriesSalvas.push(numeroSerie);
            }

        } else {

            const indiceSerie =
                seriesSalvas.indexOf(numeroSerie);

            if (indiceSerie !== -1) {
                seriesSalvas.splice(indiceSerie, 1);
            }

        }

        progressoSalvo[workout.id][exerciseKey] =
            seriesSalvas;

        try {
            localStorage.setItem(
                obterChaveProgressoTreino(),
                JSON.stringify(progressoSalvo)
            );

        } catch (erro) {
            console.error(
                'Não foi possível salvar o progresso:',
                erro
            );

            seriesButton.classList.toggle('completed');

            alert(
                'Não foi possível salvar o progresso. Tente novamente.'
            );

            return;
        }

const eventoProgresso =
    new CustomEvent(
        'progressoTreinoAtualizado',
        {
            detail: {
                workoutId: workout.id
            }
        }
    );

document.dispatchEvent(
    eventoProgresso
);

atualizarBotaoFinalizar();

seriesButton.setAttribute(
    'aria-label',
    concluida
        ? `Desmarcar série ${numeroSerie}`
        : `Marcar série ${numeroSerie} como concluída`
);

    }
);

    seriesControls.appendChild(
        seriesButton
    );

}

exerciseInfo.appendChild(
    seriesControls
);

exerciseItem.appendChild(
    exerciseNumber
);

exerciseItem.appendChild(
    exerciseInfo
);

const tipoExecucao =
    exercicio.tipoExecucao || 'individual';

const grupoExecucao =
    exercicio.grupoExecucao || null;

    // ========================================
// STATUS DO EXERCÍCIO INDIVIDUAL
// ========================================

if (
    tipoExecucao === 'individual' ||
    !grupoExecucao
) {

    const atualizarStatusIndividual = () => {

        const progressoAtual =
    carregarProgressoTreino();

        const seriesConcluidas =
            progressoAtual[workout.id]?.[exerciseKey] || [];

        const totalSeries =
            Number(exercicio.series) || 1;

        const concluido =
            seriesConcluidas.length >= totalSeries;

        exerciseItem.classList.toggle(
            'completed',
            concluido
        );
        if (
    concluido &&
    !exerciseItem.dataset.autoCollapsed
) {
    exerciseItem.classList.add(
        'collapsed-individual'
    );

    toggleIndividualBtn.textContent = '▼';

    toggleIndividualBtn.setAttribute(
        'aria-label',
        'Mostrar detalhes do exercício'
    );

    exerciseItem.dataset.autoCollapsed =
        'true';
}
        if (!concluido) {

    exerciseItem.classList.remove(
        'collapsed-individual'
    );

    toggleIndividualBtn.textContent = '▲';

    toggleIndividualBtn.setAttribute(
        'aria-label',
        'Ocultar detalhes do exercício'
    );

    delete exerciseItem.dataset.autoCollapsed;
}
        let statusIndividual =
    exerciseItem.querySelector(
        '.active-individual-status'
    );

if (!statusIndividual) {

    statusIndividual =
        document.createElement('span');

    statusIndividual.className =
        'active-individual-status';

    exerciseItem.appendChild(
        statusIndividual
    );
}

const possuiSeriesConcluidas =
    Array.isArray(seriesConcluidas) &&
    seriesConcluidas.length > 0;

statusIndividual.textContent = concluido
    ? 'CONCLUÍDO ✓'
    : possuiSeriesConcluidas
        ? 'EM ANDAMENTO'
        : 'PENDENTE';

statusIndividual.hidden = false;

statusIndividual.classList.toggle(
    'pending',
    !concluido && !possuiSeriesConcluidas
);

statusIndividual.classList.toggle(
    'in-progress',
    !concluido && possuiSeriesConcluidas
);

    };

    atualizarStatusIndividual();

    document.addEventListener(
        'progressoTreinoAtualizado',
        (event) => {

            if (
                event.detail.workoutId === workout.id
            ) {
                atualizarStatusIndividual();
            }
        }
    );
}

// EXERCÍCIO INDIVIDUAL

if (
    tipoExecucao === 'individual' ||
    !grupoExecucao
) {

    exercisesElement.appendChild(
        exerciseItem
    );

} else {

    let groupContainer =
        gruposAtivosCriados.get(
            grupoExecucao
        );

    // CRIA O GRUPO SOMENTE UMA VEZ

    if (!groupContainer) {

        groupContainer =
            document.createElement('div');

        groupContainer.className =
            `active-exercise-group ${tipoExecucao}`;

        groupContainer.dataset.exerciseGroup =
            grupoExecucao;

        const groupHeader =
            document.createElement('div');

        groupHeader.className =
            'active-exercise-group-header';

        // DESCOBRE O NÚMERO DO GRUPO

        const gruposDoMesmoTipo =
            exercicios
                .filter(item =>
                    (item.tipoExecucao || 'individual') ===
                        tipoExecucao &&
                    item.grupoExecucao
                )
                .map(item =>
                    item.grupoExecucao
                );

        const gruposUnicos =
            [...new Set(gruposDoMesmoTipo)];

        const numeroGrupo =
            gruposUnicos.indexOf(
                grupoExecucao
            ) + 1;

        const nomeTreino =
    workout.nome || 'TREINO';

groupHeader.textContent =
    tipoExecucao === 'bisset'
        ? `${nomeTreino} · BI-SET ${numeroGrupo}`
        : `${nomeTreino} · TRI-SET ${numeroGrupo}`;

const quantidadeSeries =
    Math.max(
        ...exercicios
            .filter(item =>
                item.grupoExecucao === grupoExecucao &&
                (item.tipoExecucao || 'individual') === tipoExecucao
            )
            .map(item =>
                Number(item.series) || 1
            )
    );

const roundInfo =
    document.createElement('span');

roundInfo.className =
    'active-exercise-group-rounds';

roundInfo.textContent =
    `${quantidadeSeries} ${
        quantidadeSeries === 1
            ? 'RODADA'
            : 'RODADAS'
    }`;

function atualizarRodadaGrupo() {

    const exerciciosGrupo =
        exercicios.filter(item =>
            item.grupoExecucao === grupoExecucao &&
            (item.tipoExecucao || 'individual') === tipoExecucao
        );
    const progressoAtual =
    carregarProgressoTreino();

let rodadasConcluidas = 0;

    for (
        let rodada = 1;
        rodada <= quantidadeSeries;
        rodada++
    ) {

        const rodadaCompleta =
            exerciciosGrupo.every(item => {

                const itemIndex =
                    exercicios.indexOf(item);

                const exerciseKey =
                    item.id ||
                    `exercise-${itemIndex}`;

                const seriesConcluidas =
    progressoAtual[workout.id]?.[exerciseKey] || [];

                /*
                 * Se o exercício possui menos séries
                 * que esta rodada, ele não impede
                 * a conclusão da rodada.
                 */
                if (
                    rodada >
                    (Number(item.series) || 1)
                ) {
                    return true;
                }

                return seriesConcluidas.includes(
                    rodada
                );
            });

        if (rodadaCompleta) {
            rodadasConcluidas++;
        } else {
            break;
        }
    }

   if (
    rodadasConcluidas >= quantidadeSeries
) {

    roundInfo.textContent =
        'CONCLUÍDO ✓';

    groupContainer.classList.add(
        'completed'
    );

   if (
    !groupContainer.dataset.autoCollapsed
) {

    groupContainer.classList.add(
        'collapsed'
    );

    const toggleBtn =
        groupContainer.querySelector(
            '.active-exercise-group-toggle'
        );

    if (toggleBtn) {

        toggleBtn.textContent = '▼';

        toggleBtn.setAttribute(
            'aria-label',
            'Mostrar exercícios'
        );
    }

    groupContainer.dataset.autoCollapsed =
        'true';
}

    return;
}

groupContainer.classList.remove(
    'completed'
);

groupContainer.classList.remove(
    'collapsed'
);

const toggleBtn =
    groupContainer.querySelector(
        '.active-exercise-group-toggle'
    );

if (toggleBtn) {

    toggleBtn.textContent = '▲';

    toggleBtn.setAttribute(
        'aria-label',
        'Ocultar exercícios'
    );
}

delete groupContainer.dataset.autoCollapsed;

const rodadaAtual =
    rodadasConcluidas + 1;

const algumaSerieMarcada = exerciciosGrupo.some(item => {
    const itemIndex = exercicios.indexOf(item);
    const chave = item.id || `exercise-${itemIndex}`;

    const series = progressoAtual[workout.id]?.[chave] || [];

    return Array.isArray(series) && series.length > 0;
});

roundInfo.textContent = algumaSerieMarcada
    ? `EM ANDAMENTO · RODADA ${rodadaAtual} DE ${quantidadeSeries}`
    : `PENDENTE · 0 DE ${quantidadeSeries} RODADAS`;
}

        atualizarRodadaGrupo();

document.addEventListener(
    'progressoTreinoAtualizado',
    (event) => {

        if (
            event.detail.workoutId === workout.id
        ) {
            atualizarRodadaGrupo();
        }

    }
);

groupHeader.appendChild(
    roundInfo
);

const toggleGroupBtn =
    document.createElement('button');

toggleGroupBtn.type = 'button';

toggleGroupBtn.className =
    'active-exercise-group-toggle';

toggleGroupBtn.setAttribute(
    'aria-label',
    'Ocultar exercícios'
);

toggleGroupBtn.textContent = '▲';

toggleGroupBtn.addEventListener(
    'click',
    () => {

        const isCollapsed =
            groupContainer.classList.toggle(
                'collapsed'
            );

        toggleGroupBtn.textContent =
            isCollapsed ? '▼' : '▲';

        toggleGroupBtn.setAttribute(
            'aria-label',
            isCollapsed
                ? 'Mostrar exercícios'
                : 'Ocultar exercícios'
        );
    }
);
groupHeader.appendChild(
    toggleGroupBtn
);

groupContainer.appendChild(
    groupHeader
);

        exercisesElement.appendChild(
            groupContainer
        );

        gruposAtivosCriados.set(
            grupoExecucao,
            groupContainer
        );
    }

    groupContainer.appendChild(
        exerciseItem
    );
}
    });

}

// ==================== MODAL TREINO ====================
function openWorkoutModal(workoutId) {
    editingWorkoutId = workoutId;
    const title = document.getElementById('workoutModalTitle');
    const input = document.getElementById('workoutNameInput');

input.classList.remove('input-error');
input.removeAttribute('aria-invalid');

/* LIMPAR VALIDACAO AO ABRIR O TREINO */
const avisoValidacaoTreino = document.getElementById(
    'workoutValidationMessage'
);

if (avisoValidacaoTreino) {
    avisoValidacaoTreino.hidden = true;
    avisoValidacaoTreino.textContent = '';
}

/* LIMPAR AVISO DE TREINO DUPLICADO AO ABRIR */
const avisoDuplicidadeTreino = document.getElementById(
    'workoutDuplicateWarning'
);

if (avisoDuplicidadeTreino) {
    avisoDuplicidadeTreino.hidden = true;
    avisoDuplicidadeTreino.textContent = '';
}

input.oninput = () => {
    input.classList.remove('input-error');
    input.removeAttribute('aria-invalid');

    /* ATUALIZAR CONTADOR DURANTE A DIGITACAO */
    const contador = document.getElementById(
        'workoutNameCounter'
    );

    if (contador) {
        contador.textContent =
            `${input.value.length} / ${input.maxLength} caracteres`;
    }

    /* VERIFICAR NOME DE TREINO DUPLICADO */
    const avisoDuplicado = document.getElementById(
        'workoutDuplicateWarning'
    );

    const normalizarNome = (texto) =>
        texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

    const nomeDigitado = normalizarNome(input.value);

    const duplicado = Boolean(
        nomeDigitado &&
        loadWorkouts().some(treino =>
            treino.id !== editingWorkoutId &&
            normalizarNome(treino.nome || '') === nomeDigitado
        )
    );

    if (avisoDuplicado) {
        avisoDuplicado.textContent = duplicado
            ? 'Já existe um treino com este nome. Confira se deseja criar outro.'
            : '';

        avisoDuplicado.hidden = !duplicado;
    }

    const aviso = document.getElementById(
        'workoutValidationMessage'
    );

    if (aviso) {
        aviso.hidden = true;
        aviso.textContent = '';
    }
};

input.onkeydown = (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        document.getElementById('workoutSaveBtn').click();
    }
};

if (workoutId) {
        const workouts = loadWorkouts();
        const workout = workouts.find(w => w.id === workoutId);
        title.textContent = 'Editar treino';
        input.value = workout ? workout.nome : '';
    } else {
        title.textContent = 'Novo treino';
        input.value = '';
    }

    /* ATUALIZAR CONTADOR AO ABRIR O TREINO */
    const contadorNomeTreino = document.getElementById(
        'workoutNameCounter'
    );

    if (contadorNomeTreino) {
        contadorNomeTreino.textContent =
            `${input.value.length} / ${input.maxLength} caracteres`;
    }

    workoutModalTrigger = document.activeElement;

    document.getElementById('workoutModalOverlay').classList.add('show');
    input.focus();
}

let workoutModalTrigger = null;

function closeWorkoutModal() {
    document.getElementById('workoutModalOverlay').classList.remove('show');
    editingWorkoutId = null;

    if (workoutModalTrigger) {
        workoutModalTrigger.focus();
        workoutModalTrigger = null;
    }
}

document
    .addEventListener(
        'keydown',
        (event) => {
            if (
                event.key === 'Escape' &&
                document
                    .getElementById(
                        'selectWorkoutModalOverlay'
                    )
                    .classList.contains(
                        'show'
                    )
            ) {
                closeSelectWorkoutModal();
            }
        }
    );

document.addEventListener('keydown', (event) => {

    const modal =
        document.getElementById('workoutModalOverlay');

    if (
        event.key !== 'Tab' ||
        !modal.classList.contains('show')
    ) {
        return;
    }

    const focusableElements =
        modal.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

    const firstElement = focusableElements[0];
    const lastElement =
        focusableElements[focusableElements.length - 1];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }

});

document.getElementById('btnNewWorkout').addEventListener('click', () => openWorkoutModal(null));

const btnEmptyNewWorkout =
    document.getElementById('btnEmptyNewWorkout');

if (btnEmptyNewWorkout) {
    btnEmptyNewWorkout.addEventListener(
        'click',
        () => openWorkoutModal(null)
    );
}

document.getElementById('workoutCancelBtn').addEventListener('click', closeWorkoutModal);
document.getElementById('workoutModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'workoutModalOverlay') closeWorkoutModal();
});

document.getElementById('workoutSaveBtn').addEventListener('click', () => {
    if (
        acessoInicialTreinosFitZone?.origem === 'supabase'
    ) {
        return;
    }

    const nome = document.getElementById('workoutNameInput').value.trim();

    if (!nome) {
        const input = document.getElementById(
            'workoutNameInput'
        );

        const aviso = document.getElementById(
            'workoutValidationMessage'
        );

        input.classList.add('input-error');
        input.setAttribute('aria-invalid', 'true');

        if (aviso) {
            aviso.textContent =
                'Informe um nome para o treino antes de salvar.';
            aviso.hidden = false;
        }

        input.focus();
        return;
    }

    const workouts = loadWorkouts();

    if (editingWorkoutId) {
        const workout = workouts.find(
            w => w.id === editingWorkoutId
        );

        if (!workout) {
            showWarningModal(
                'Este treino não foi encontrado. Atualize a página e tente novamente.'
            );
            return;
        }

        workout.nome = nome;
    } else {
        workouts.push({ id: uid(), nome, exercicios: [] });
    }

    const salvou = saveWorkouts(workouts);

    if (!salvou) {
        return;
    }

    closeWorkoutModal();
    renderWorkouts();
});

// ==================== MODAL DE CONFIRMAÇÃO ====================
let pendingDeleteAction = null;
let confirmModalTrigger = null;

function askConfirm(
    text,
    onConfirm,
    confirmLabel = 'Excluir'
) {
    confirmModalTrigger = document.activeElement;

    document.getElementById('confirmModalText').textContent = text;

    document.getElementById(
        'confirmDeleteBtn'
    ).textContent = confirmLabel;

    pendingDeleteAction = onConfirm;
    document.getElementById('confirmModalOverlay').classList.add('show');

    document.getElementById('confirmCancelBtn').focus();
}

function closeConfirmModal() {
    document.getElementById('confirmModalOverlay').classList.remove('show');
    pendingDeleteAction = null;

    if (
        confirmModalTrigger &&
        document.contains(confirmModalTrigger)
    ) {
        confirmModalTrigger.focus();
    }

    confirmModalTrigger = null;
}

document.addEventListener('keydown', (event) => {

    if (
        event.key === 'Escape' &&
        document
            .getElementById('confirmModalOverlay')
            .classList.contains('show')
    ) {
        closeConfirmModal();
    }

});

document.addEventListener('keydown', (event) => {

    const modal =
        document.getElementById('confirmModalOverlay');

    if (
        event.key !== 'Tab' ||
        !modal.classList.contains('show')
    ) {
        return;
    }

    const focusableElements =
        modal.querySelectorAll(
            'button, [tabindex]:not([tabindex="-1"])'
        );

    const firstElement = focusableElements[0];
    const lastElement =
        focusableElements[focusableElements.length - 1];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }

});

document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
document.getElementById('confirmModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModalOverlay') closeConfirmModal();
});
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (pendingDeleteAction) pendingDeleteAction();
    closeConfirmModal();
});

function resetActiveTraining() {
    const nameElement =
        document.getElementById('activeTrainingName');

    const statusElement =
        document.getElementById('activeTrainingStatus');

    const exercisesElement =
        document.getElementById('activeTrainingExercises');

    const finishButton =
        document.getElementById('btnFinishWorkout');

    nameElement.textContent =
        'Nenhum treino iniciado';

    statusElement.textContent =
        'AGUARDANDO';

    exercisesElement.innerHTML = `
        <div class="active-training-empty">
            <strong>Selecione um treino</strong>
            <p>
                Clique em “Iniciar treino” para acompanhar
                seus exercícios e séries.
            </p>
        </div>
    `;

    finishButton.disabled = true;
}

/* =========================================
   FITZONE - DUPLICAR TREINO
========================================= */

function duplicateWorkout(workoutId) {
    const workouts = loadWorkouts();

    const original = workouts.find(
        workout => workout.id === workoutId
    );

    if (!original) return;

    const gruposCopiados = new Map();

    const exerciciosCopiados = (
        original.exercicios || []
    ).map(exercicio => {
        let novoGrupo = null;

        if (exercicio.grupoExecucao) {
            if (!gruposCopiados.has(exercicio.grupoExecucao)) {
                gruposCopiados.set(
                    exercicio.grupoExecucao,
                    uid()
                );
            }

            novoGrupo = gruposCopiados.get(
                exercicio.grupoExecucao
            );
        }

        return {
            ...exercicio,
            id: uid(),
            grupoExecucao: novoGrupo
        };
    });

    const sufixo = ' (cópia)';

    const nomeBase = original.nome
        .slice(0, 50 - sufixo.length)
        .trimEnd();

    const novoTreino = {
        id: uid(),
        nome: nomeBase + sufixo,
        exercicios: exerciciosCopiados
    };

    workouts.push(novoTreino);

    const salvou = saveWorkouts(workouts);

    if (!salvou) return;

    renderWorkouts();

    /* DESTACAR O TREINO RECEM-DUPLICADO */
    const cartaoDuplicado = Array.from(
        document.querySelectorAll(
            '#workoutsList .workout-card'
        )
    ).find(card =>
        card.dataset.workoutId === novoTreino.id
    );

    if (cartaoDuplicado) {
        cartaoDuplicado.classList.add('just-duplicated');

        setTimeout(() => {
            cartaoDuplicado.classList.remove(
                'just-duplicated'
            );
        }, 4000);
    }

    /* EXIBIR NOTIFICACAO DE SUCESSO */
    const notificacao = document.getElementById(
        'workoutDuplicateSuccess'
    );

    if (notificacao) {
        notificacao.hidden = false;

        clearTimeout(duplicateWorkout.notificationTimer);

        duplicateWorkout.notificationTimer = setTimeout(() => {
            notificacao.hidden = true;
        }, 4000);
    }
}

function deleteWorkout(workoutId) {
    askConfirm(
        'Excluir este treino e todos os seus exercícios?',
        () => {
            let workouts = loadWorkouts();

            const treinoExiste = workouts.some(
                workout => workout.id === workoutId
            );

            if (!treinoExiste) {
                showWarningModal(
                    'Este treino não foi encontrado. Atualize a página e tente novamente.'
                );
                return;
            }

            workouts = workouts.filter(
                workout => workout.id !== workoutId
            );

            const salvou = saveWorkouts(workouts);

            if (!salvou) {
                return;
            }

            const treinoAtivo = carregarTreinoAtivo();

            if (
                treinoAtivo &&
                treinoAtivo.id === workoutId
            ) {
                try {
                    localStorage.removeItem(
                        obterChaveTreinoAtivo()
                    );

                    const progressoAtual =
                        carregarProgressoTreino();

                    delete progressoAtual[workoutId];

                    localStorage.setItem(
                        obterChaveProgressoTreino(),
                        JSON.stringify(progressoAtual)
                    );

                    resetActiveTraining();

                } catch (erro) {
                    console.warn(
                        'Treino excluído, mas não foi possível limpar todos os dados do treino ativo:',
                        erro
                    );
                }
            }

            renderWorkouts();
        }
    );
}

// ==================== MODAL EXERCÍCIO ====================

let exerciseModalTrigger = null;

function openExerciseModal(workoutId, exerciseId) {
    editingExerciseCtx = { workoutId, exerciseId };

    const title =
    document.getElementById('exerciseModalTitle');

    const nameInput =
        document.getElementById('exerciseNameInput');

    const typeInput =
        document.getElementById('exerciseTypeInput');

    const groupField =
        document.getElementById('exerciseGroupField');

    const seriesInput =
        document.getElementById('exerciseSeriesInput');

    const repsInput =
        document.getElementById('exerciseRepsInput');

    const restInput =
        document.getElementById('exerciseRestInput');

    /* LIMPAR AVISO AO ABRIR O FORMULARIO */
    const avisoValidacao = document.getElementById(
        'exerciseValidationMessage'
    );

    if (avisoValidacao) {
        avisoValidacao.hidden = true;
        avisoValidacao.textContent = '';
    }

    /* LIMPAR AVISO DE DUPLICIDADE AO ABRIR */
    const avisoDuplicidade = document.getElementById(
        'exerciseDuplicateWarning'
    );

    if (avisoDuplicidade) {
        avisoDuplicidade.hidden = true;
        avisoDuplicidade.textContent = '';
    }

    [
        nameInput,
        seriesInput,
        repsInput,
        restInput
    ].forEach(input => {
        input.classList.remove('input-error');
        input.removeAttribute('aria-invalid');
    });
    [
        nameInput,
        seriesInput,
        repsInput,
        restInput
    ].forEach(input => {
        input.oninput = () => {
            input.classList.remove('input-error');
            input.removeAttribute('aria-invalid');

            if (input === nameInput) {
                const contador = document.getElementById(
                    'exerciseNameCounter'
                );

                if (contador) {
                    contador.textContent =
                        `${nameInput.value.length} / ${nameInput.maxLength} caracteres`;
                }

                /* VERIFICAR EXERCICIO DUPLICADO */
                const avisoDuplicado = document.getElementById(
                    'exerciseDuplicateWarning'
                );

                const normalizarNome = (texto) =>
                    texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');

                const nomeDigitado = normalizarNome(nameInput.value);

                const treino = loadWorkouts().find(
                    workout => workout.id === editingExerciseCtx?.workoutId
                );

                const duplicado = Boolean(
                    nomeDigitado &&
                    treino?.exercicios.some(exercicio =>
                        exercicio.id !== editingExerciseCtx.exerciseId &&
                        normalizarNome(exercicio.nome || '') === nomeDigitado
                    )
                );

                if (avisoDuplicado) {
                    avisoDuplicado.textContent = duplicado
                        ? 'Este exercício já existe neste treino. Confira se deseja adicioná-lo novamente.'
                        : '';

                    avisoDuplicado.hidden = !duplicado;
                }
            }

            const aviso = document.getElementById(
                'exerciseValidationMessage'
            );

            if (aviso) {
                aviso.hidden = true;
                aviso.textContent = '';
            }
        };
    });

    nameInput.onkeydown = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            document
                .getElementById('exerciseSaveBtn')
                .click();
        }
    };

    let exerciseEditing = null;

    if (exerciseId) {
        const workouts = loadWorkouts();

        const workout = workouts.find(
            workout => workout.id === workoutId
        );

        const exercise =
            workout
                ? workout.exercicios.find(
                    exercise =>
                        exercise.id === exerciseId
                )
                : null;

        exerciseEditing = exercise;

        title.textContent = 'Editar exercício';

        nameInput.value =
            exercise ? exercise.nome : '';

        typeInput.value =
            exercise
                ? (exercise.tipoExecucao || 'individual')
                : 'individual';

        seriesInput.value =
            exercise ? exercise.series : '';

        repsInput.value =
            exercise ? exercise.repeticoes : '';

        restInput.value =
            exercise ? exercise.descanso : '';

    } else {
        title.textContent = 'Novo exercício';

        nameInput.value = '';
        typeInput.value = 'individual';
        seriesInput.value = '';
        repsInput.value = '';
        restInput.value = '';
    }

    /* ATUALIZAR CONTADOR AO ABRIR */
    const contadorNome = document.getElementById(
        'exerciseNameCounter'
    );

    if (contadorNome) {
        contadorNome.textContent =
            `${nameInput.value.length} / ${nameInput.maxLength} caracteres`;
    }

    // ========================================
    // CAMPO DE GRUPO - BI-SET / TRI-SET
    // ========================================

    const groupInput =
        document.getElementById('exerciseGroupInput');

    function updateGroupField() {
        const tipoExecucao =
            typeInput.value;

        // INDIVIDUAL NÃO USA GRUPO
        if (tipoExecucao === 'individual') {
            groupField.hidden = true;

            groupInput.innerHTML = `
                <option value="">
                    Novo grupo
                </option>
            `;

            return;
        }

        // BI-SET / TRI-SET
        groupField.hidden = false;

        const workouts =
            loadWorkouts();

        const workout =
            workouts.find(
                workout => workout.id === workoutId
            );

        groupInput.innerHTML = `
            <option value="">
                Novo grupo
            </option>
        `;

        if (!workout) {
            return;
        }

        // PROCURA GRUPOS JÁ EXISTENTES
        const gruposExistentes = new Set();

        workout.exercicios.forEach(exercicio => {
            if (
                exercicio.tipoExecucao === tipoExecucao &&
                exercicio.grupoExecucao
            ) {
                gruposExistentes.add(
                    exercicio.grupoExecucao
                );
            }
        });

        Array.from(gruposExistentes).forEach(
            (grupoId, index) => {
                const quantidadeNoGrupo =
                    workout.exercicios.filter(
                        exercicio =>
                            exercicio.grupoExecucao === grupoId &&
                            exercicio.tipoExecucao === tipoExecucao
                    ).length;

                const limiteGrupo =
                    tipoExecucao === 'bisset'
                        ? 2
                        : 3;

                const ehGrupoAtual =
                    exerciseEditing &&
                    exerciseEditing.grupoExecucao === grupoId;

                const grupoCompleto =
                    quantidadeNoGrupo >= limiteGrupo &&
                    !ehGrupoAtual;

                const option =
                    document.createElement('option');

                option.value = grupoId;

                const numeroGrupo =
                    index + 1;

                if (tipoExecucao === 'bisset') {
                    option.textContent =
                        `Bi-set ${numeroGrupo}${grupoCompleto ? ' — completo' : ''}`;
                } else {
                    option.textContent =
                        `Tri-set ${numeroGrupo}${grupoCompleto ? ' — completo' : ''}`;
                }

                if (grupoCompleto) {
                    option.disabled = true;
                }

                groupInput.appendChild(option);
            }
        );
    }

    updateGroupField();

    if (
        exerciseEditing &&
        exerciseEditing.grupoExecucao
    ) {
        groupInput.value =
            exerciseEditing.grupoExecucao;
    }

    typeInput.onchange =
        updateGroupField;

    exerciseModalTrigger =
        document.activeElement;

    document
        .getElementById('exerciseModalOverlay')
        .classList.add('show');

    nameInput.focus();
}

function closeExerciseModal() {
    document
        .getElementById('exerciseModalOverlay')
        .classList.remove('show');

    editingExerciseCtx = null;

    if (exerciseModalTrigger) {
        exerciseModalTrigger.focus();
        exerciseModalTrigger = null;
    }
}

document.addEventListener('keydown', (event) => {

    if (
        event.key === 'Escape' &&
        document
            .getElementById('exerciseModalOverlay')
            .classList.contains('show')
    ) {
        closeExerciseModal();
    }

});

document.addEventListener('keydown', (event) => {

    const modal =
    document.getElementById('exerciseModalOverlay');

    if (
        event.key !== 'Tab' ||
        !modal.classList.contains('show')
    ) {
        return;
    }

    const focusableElements =
        modal.querySelectorAll(
            'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

    const firstElement = focusableElements[0];
    const lastElement =
        focusableElements[focusableElements.length - 1];

    if (
        event.shiftKey &&
        document.activeElement === firstElement
    ) {
        event.preventDefault();
        lastElement.focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
    ) {
        event.preventDefault();
        firstElement.focus();
    }

});

document.getElementById('exerciseCancelBtn').addEventListener('click', closeExerciseModal);
document.getElementById('exerciseModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'exerciseModalOverlay') closeExerciseModal();
});

document.getElementById('exerciseSaveBtn').addEventListener('click', () => {
    if (
        acessoInicialTreinosFitZone?.origem === 'supabase'
    ) {
        return;
    }

    if (!editingExerciseCtx) return;

    const nome =
        document
            .getElementById('exerciseNameInput')
            .value
            .trim();

    const tipoExecucao =
        document
            .getElementById('exerciseTypeInput')
            .value;

    const grupoSelecionado =
        document
            .getElementById('exerciseGroupInput')
            .value;

    const series = document
        .getElementById('exerciseSeriesInput')
        .valueAsNumber;

    const repeticoes = document
        .getElementById('exerciseRepsInput')
        .valueAsNumber;

    const descanso = document
        .getElementById('exerciseRestInput')
        .valueAsNumber;

    const camposInvalidos = [
        ['exerciseNameInput', !nome],
        [
            'exerciseSeriesInput',
            !Number.isInteger(series) || series < 1
        ],
        [
            'exerciseRepsInput',
            !Number.isInteger(repeticoes) || repeticoes < 1
        ],
        [
            'exerciseRestInput',
            !Number.isInteger(descanso) || descanso < 0
        ]
    ];

    const possuiCampoInvalido =
        camposInvalidos.some(
            ([, invalid]) => invalid
        );

    if (possuiCampoInvalido) {
        const mensagens = {
            exerciseNameInput: 'Informe o nome do exercício.',
            exerciseSeriesInput: 'Informe uma quantidade válida de séries.',
            exerciseRepsInput: 'Informe uma quantidade válida de repetições.',
            exerciseRestInput: 'Informe um tempo de descanso válido.'
        };

        const erros = camposInvalidos
            .filter(([, invalido]) => invalido)
            .map(([id]) => mensagens[id]);

        const aviso = document.getElementById(
            'exerciseValidationMessage'
        );

        if (aviso) {
            aviso.textContent = erros.join(' ');
            aviso.hidden = false;
        }

        camposInvalidos.forEach(
            ([id, invalid]) => {
                const input =
                    document.getElementById(id);

                input.classList.toggle(
                    'input-error',
                    invalid
                );

                input.setAttribute(
                    'aria-invalid',
                    String(invalid)
                );
            }
        );

        const primeiroCampoInvalido =
            camposInvalidos.find(
                ([, invalid]) => invalid
            );

        if (primeiroCampoInvalido) {
            document
                .getElementById(
                    primeiroCampoInvalido[0]
                )
                .focus();
        }

        return;
    }

    const workouts =
        loadWorkouts();

    const workout =
        workouts.find(
            workout =>
                workout.id ===
                editingExerciseCtx.workoutId
        );

    if (!workout) return;

    // DEFINE O GRUPO DE EXECUÇÃO
    let grupoExecucao = null;

    if (tipoExecucao !== 'individual') {
        if (grupoSelecionado) {
            // USA UM GRUPO JÁ EXISTENTE
            grupoExecucao =
                grupoSelecionado;
        } else {
            // CRIA UM NOVO GRUPO
            grupoExecucao =
                uid();
        }
    }

    // ========================================
    // LIMITE DE EXERCÍCIOS POR GRUPO
    // ========================================

    if (
        tipoExecucao !== 'individual' &&
        grupoSelecionado
    ) {
        const limiteGrupo =
            tipoExecucao === 'bisset'
                ? 2
                : 3;

        const exerciciosNoGrupo =
            workout.exercicios.filter(
                exercicio => {
                    // AO EDITAR, NÃO CONTA
                    // O PRÓPRIO EXERCÍCIO
                    if (
                        editingExerciseCtx.exerciseId &&
                        exercicio.id ===
                            editingExerciseCtx.exerciseId
                    ) {
                        return false;
                    }

                    return (
                        exercicio.grupoExecucao ===
                            grupoExecucao &&
                        exercicio.tipoExecucao ===
                            tipoExecucao
                    );
                }
            );

        if (
            exerciciosNoGrupo.length >=
            limiteGrupo
        ) {
            showWarningModal(
                tipoExecucao === 'bisset'
                    ? 'Este Bi-set já possui 2 exercícios.'
                    : 'Este Tri-set já possui 3 exercícios.'
            );

            return;
        }
    }

    if (editingExerciseCtx.exerciseId) {
        const exercise =
            workout.exercicios.find(
                exercise =>
                    exercise.id ===
                    editingExerciseCtx.exerciseId
            );

        if (!exercise) {
            showWarningModal(
                'Este exercício não foi encontrado. Atualize a página e tente novamente.'
            );
            return;
        }

        if (exercise) {
            exercise.nome = nome;
            exercise.tipoExecucao = tipoExecucao;
            exercise.grupoExecucao = grupoExecucao;
            exercise.series = series;
            exercise.repeticoes = repeticoes;
            exercise.descanso = descanso;
        }
    } else {
        workout.exercicios.push({
            id: uid(),
            nome,
            tipoExecucao,
            grupoExecucao,
            series,
            repeticoes,
            descanso
        });
    }

    const salvou = saveWorkouts(workouts);

    if (!salvou) {
        return;
    }

    closeExerciseModal();
    renderWorkouts();
});

function deleteExercise(workoutId, exerciseId) {
    askConfirm(
        'Remover este exercício?',
        () => {
            const workouts =
                loadWorkouts();

            const workout =
                workouts.find(
                    workout =>
                        workout.id === workoutId
                );

            if (!workout) return;

            const exercicioExiste =
                Array.isArray(workout.exercicios) &&
                workout.exercicios.some(
                    exercise => exercise?.id === exerciseId
                );

            if (!exercicioExiste) {
                showWarningModal(
                    'Este exercício não foi encontrado. Atualize a página e tente novamente.'
                );
                return;
            }

            workout.exercicios =
                workout.exercicios.filter(
                    exercise =>
                        exercise.id !== exerciseId
                );

            const salvou = saveWorkouts(workouts);

            if (!salvou) {
                return;
            }

            renderWorkouts();
        }
    );
}

// ==================== CALENDÁRIO DE CHECK-IN ====================
const CHECKIN_STORAGE_KEY =
    'fitzoneCheckins';

function obterChaveCheckins() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar os check-ins.'
        );
    }

    return `${CHECKIN_STORAGE_KEY}:${sessao.email.trim().toLowerCase()}`;
}

function loadCheckins() {
    try {
        return (
            JSON.parse(
                localStorage.getItem(
                    obterChaveCheckins()
                )
            ) || {}
        );
    } catch (erro) {
        console.error(
            'Erro ao carregar check-ins:',
            erro
        );

        return {};
    }
}

function saveCheckins(data) {

    try {
        const chave = obterChaveCheckins();
        const dadosAtuais = localStorage.getItem(chave);

        if (dadosAtuais !== null) {
            const dadosVerificados = JSON.parse(dadosAtuais);

            if (
                !dadosVerificados ||
                typeof dadosVerificados !== 'object' ||
                Array.isArray(dadosVerificados)
            ) {
                throw new Error(
                    'Dados de check-in existentes inválidos.'
                );
            }
        }

        localStorage.setItem(
            chave,
            JSON.stringify(data)
        );

        return true;

    } catch (erro) {
        console.error(
            'Erro ao salvar check-ins:',
            erro
        );

        alert(
            'Não foi possível salvar o check-in. Tente novamente.'
        );

        return false;
    }
}

function calDateKey(year, month, day) {
    const formattedMonth =
        String(month + 1).padStart(2, '0');

    const formattedDay =
        String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
}

// ==================== FINALIZAR TREINO ====================
document
    .getElementById('btnFinishWorkout')
    .addEventListener(
        'click',
        () => {
            // Busca o treino selecionado
            const treinoAtivo =
                carregarTreinoAtivo();

            // Impede finalizar sem selecionar um treino
            if (!treinoAtivo) {
                document
                    .getElementById(
                        'selectWorkoutModalOverlay'
                    )
                    .classList.add('show');

                document
                    .getElementById(
                        'selectWorkoutOkBtn'
                    )
                    .focus();

                return;
            }

            // Busca os dados completos do treino
            const workouts =
                loadWorkouts();

            const workoutFinalizado =
                workouts.find(
                    workout =>
                        workout.id ===
                        treinoAtivo.id
                );

            // Preenche o resumo do modal
            document
                .getElementById(
                    'finishWorkoutName'
                )
                .textContent =
                    workoutFinalizado?.nome ||
                    treinoAtivo.nome ||
                    'Treino';

            document
                .getElementById(
                    'finishExerciseCount'
                )
                .textContent =
                    workoutFinalizado
                        ?.exercicios
                        ?.length || 0;

            // Calcula o total de séries
            // e quantas foram concluídas
            const progressoTreino =
                carregarProgressoTreino();

            let totalSeries = 0;
            let seriesConcluidas = 0;

            const exerciciosFinalizados =
                workoutFinalizado?.exercicios || [];

            exerciciosFinalizados.forEach(
                (exercicio, index) => {
                    const quantidadeSeries =
                        Number(
                            exercicio.series
                        ) || 0;

                    totalSeries +=
                        quantidadeSeries;

                    const exerciseKey =
                        exercicio.id ||
                        `exercise-${index}`;

                    const progressoExercicio =
                        progressoTreino[
                            treinoAtivo.id
                        ]?.[exerciseKey] || [];

                    seriesConcluidas +=
                        progressoExercicio.length;
                }
            );

            document
                .getElementById(
                    'finishSeriesCount'
                )
                .textContent =
                    `${seriesConcluidas} de ${totalSeries}`;

            const finishSeriesCount =
                document.getElementById(
                    'finishSeriesCount'
                );

            const finishSeriesItem =
                finishSeriesCount.closest(
                    '.finish-summary-item'
                );

            const todasSeriesConcluidas =
                totalSeries > 0 &&
                seriesConcluidas >=
                    totalSeries;

            if (seriesConcluidas === 0) {
                showWarningModal(
                    'Conclua pelo menos uma série antes de finalizar o treino.'
                );

                return;
            }

            finishSeriesItem
                .classList
                .toggle(
                    'complete',
                    todasSeriesConcluidas
                );

            finishSeriesItem
                .classList
                .toggle(
                    'incomplete',
                    !todasSeriesConcluidas
                );

            // Preenche a lista de exercícios realizados
            const finishExercisesList =
                document.getElementById(
                    'finishExercisesList'
                );

            finishExercisesList.innerHTML = '';

            let exerciciosIncompletos = 0;

            exerciciosFinalizados.forEach(
                (exercicio, index) => {
                    const totalSeriesExercicio =
                        Number(
                            exercicio.series
                        ) || 0;

                    const exerciseKey =
                        exercicio.id ||
                        `exercise-${index}`;

                    const progressoExercicio =
                        progressoTreino[
                            treinoAtivo.id
                        ]?.[exerciseKey] || [];

                    const concluidasExercicio =
                        progressoExercicio.length;

                    const exercicioCompleto =
                        totalSeriesExercicio > 0 &&
                        concluidasExercicio >=
                            totalSeriesExercicio;

                    if (!exercicioCompleto) {
                        exerciciosIncompletos++;
                    }

                    // Linha do exercício
                    const exerciseRow =
                        document.createElement(
                            'div'
                        );

                    exerciseRow.className =
                        exercicioCompleto
                            ? 'finish-exercise-row complete'
                            : 'finish-exercise-row incomplete';

                    // Ícone ✓ ou ✕
                    const exerciseStatus =
                        document.createElement(
                            'span'
                        );

                    exerciseStatus.className =
                        'finish-exercise-status';

                    exerciseStatus.textContent =
                        exercicioCompleto
                            ? '✓'
                            : '✕';

                    // Nome
                    const exerciseName =
                        document.createElement(
                            'strong'
                        );

                    exerciseName.className =
                        'finish-exercise-name';

                    exerciseName.textContent =
                        exercicio.nome ||
                        'Exercício';

                    // Séries
                    const exerciseSeries =
                        document.createElement(
                            'span'
                        );

                    exerciseSeries.className =
                        'finish-exercise-series';

                    exerciseSeries.textContent =
                        `${concluidasExercicio} de ${totalSeriesExercicio} séries`;

                    exerciseRow.appendChild(
                        exerciseStatus
                    );

                    exerciseRow.appendChild(
                        exerciseName
                    );

                    exerciseRow.appendChild(
                        exerciseSeries
                    );

                    finishExercisesList.appendChild(
                        exerciseRow
                    );
                }
            );

            const finishIncompleteCount =
                document.getElementById(
                    'finishIncompleteCount'
                );

            if (exerciciosIncompletos > 0) {
                finishIncompleteCount.hidden =
                    false;

                finishIncompleteCount.textContent =
                    exerciciosIncompletos === 1
                        ? '✕ 1 exercício incompleto'
                        : `✕ ${exerciciosIncompletos} exercícios incompletos`;
            } else {
                finishIncompleteCount.hidden =
                    true;
            }

            // Busca o histórico existente
            const historico =
                carregarHistoricoTreinos();

            // Monta o resumo detalhado dos exercícios
            const resumoExercicios =
                exerciciosFinalizados.map(
                    (exercicio, index) => {
                        const total =
                            Number(
                                exercicio.series
                            ) || 0;

                        const exerciseKey =
                            exercicio.id ||
                            `exercise-${index}`;

                        const progressoExercicio =
                            progressoTreino[
                                treinoAtivo.id
                            ]?.[exerciseKey] || [];

                        const concluidas =
                            progressoExercicio.length;

                        return {
                            id:
                                exercicio.id ||
                                null,

                            nome:
                                exercicio.nome ||
                                'Exercício',

                            seriesConcluidas:
                                concluidas,

                            seriesTotal:
                                total,

                            completo:
                                total > 0 &&
                                concluidas >= total,

                            tipoExecucao:
                                exercicio.tipoExecucao ||
                                'individual',

                            grupoExecucao:
                                exercicio.grupoExecucao ||
                                null
                        };
                    }
                );

            const hojeLocal = calDateKey(
                new Date().getFullYear(),
                new Date().getMonth(),
                new Date().getDate()
            );

            const treinoJaFinalizadoHoje =
                historico.some(registro => {
                    const dataRegistro =
                        new Date(registro.data);

                    if (
                        Number.isNaN(
                            dataRegistro.getTime()
                        )
                    ) {
                        return false;
                    }

                    const diaRegistro = calDateKey(
                        dataRegistro.getFullYear(),
                        dataRegistro.getMonth(),
                        dataRegistro.getDate()
                    );

                    return (
                        String(registro.workoutId) ===
                            String(treinoAtivo.id) &&
                        diaRegistro === hojeLocal
                    );
                });

            if (treinoJaFinalizadoHoje) {
                alert(
                    'Este treino já foi finalizado hoje e está registrado no histórico. Não é necessário finalizar novamente.'
                );

                return;
            }

            // Registra o treino concluído
            historico.push({
                workoutId:
                    treinoAtivo.id,

                nome:
                    treinoAtivo.nome,

                data:
                    new Date().toISOString(),

                exercicios:
                    resumoExercicios,

                totalExercicios:
                    exerciciosFinalizados.length,

                seriesConcluidas:
                    seriesConcluidas,

                seriesTotal:
                    totalSeries
            });

            // Salva o histórico atualizado
            try {
                const chave = obterChaveHistoricoTreinos();
                const dadosAtuais = localStorage.getItem(chave);

                if (dadosAtuais !== null) {
                    const historicoExistente = JSON.parse(dadosAtuais);

                    if (!Array.isArray(historicoExistente)) {
                        throw new Error(
                            'Histórico existente inválido.'
                        );
                    }
                }

                localStorage.setItem(
                    chave,
                    JSON.stringify(historico)
                );
            } catch (erro) {
                console.error(
                    'Erro ao salvar histórico do treino:',
                    erro
                );

                alert(
                    'Não foi possível salvar o histórico. O treino não será finalizado. Tente novamente.'
                );

                return;
            }

            const hoje =
                new Date();

            const chaveHoje =
                calDateKey(
                    hoje.getFullYear(),
                    hoje.getMonth(),
                    hoje.getDate()
                );

            const checkins =
                loadCheckins();

            const checkinExistente =
                checkins[chaveHoje];

            const treinoExistente =
                checkinExistente?.treino
                    ?.trim();

            const treinosDoDia =
                treinoExistente
                    ? treinoExistente
                        .split(' • ')
                        .map(
                            treino =>
                                treino.trim()
                        )
                    : [];

            const treinoJaRegistrado =
                treinosDoDia.includes(
                    treinoAtivo.nome
                );

            if (!treinoJaRegistrado) {
                treinosDoDia.push(
                    treinoAtivo.nome
                );
            }

            checkins[chaveHoje] = {
                checked: true,
                treino: treinosDoDia.join(
                    ' • '
                )
            };

            const checkinSalvo = saveCheckins(checkins);

            if (!checkinSalvo) {
                return;
            }

            // Limpa os dados do treino finalizado
            try {
                const progressoAtual =
                    carregarProgressoTreino();

                delete progressoAtual[
                    treinoAtivo.id
                ];

                localStorage.setItem(
                    obterChaveProgressoTreino(),
                    JSON.stringify(progressoAtual)
                );

                localStorage.removeItem(
                    obterChaveTreinoAtivo()
                );

            } catch (erro) {
                console.error(
                    'Erro ao limpar dados do treino finalizado:',
                    erro
                );

                alert(
                    'O treino foi registrado, mas não foi possível limpar todos os dados. Atualize a página e confira o histórico.'
                );

                return;
            }

            document
                .getElementById(
                    'btnFinishWorkout'
                )
                .disabled = true;

            // Abre o modal de sucesso
            document
                .getElementById(
                    'finishModalOverlay'
                )
                .classList.add(
                    'show'
                );

            document
                .getElementById(
                    'finishOkBtn'
                )
                .focus();
        }
    );

function closeFinishModal() {
    document
        .getElementById('finishModalOverlay')
        .classList.remove('show');

    resetActiveTraining();
    renderWorkouts();
}

document
    .getElementById(
        'finishOkBtn'
    )
    .addEventListener(
        'click',
        () => {
            document
                .getElementById(
                    'finishModalOverlay'
                )
                .classList.remove(
                    'show'
                );

            window.location.href =
                'perfil.html';
        }
    );

document
    .getElementById(
        'finishCloseBtn'
    )
    .addEventListener(
        'click',
        closeFinishModal
    );

document
    .getElementById(
        'finishModalOverlay'
    )
    .addEventListener(
        'click',
        (event) => {
            if (
                event.target.id ===
                'finishModalOverlay'
            ) {
                closeFinishModal();
            }
        }
    );

document.addEventListener(
    'keydown',
    (event) => {
        const overlay =
            document.getElementById(
                'finishModalOverlay'
            );

        if (
            event.key === 'Escape' &&
            overlay.classList.contains(
                'show'
            )
        ) {
            closeFinishModal();
        }
    }
);

document
    .addEventListener(
        'keydown',
        (event) => {
            const overlay =
                document.getElementById(
                    'finishModalOverlay'
                );

            if (
                event.key !== 'Tab' ||
                !overlay.classList.contains(
                    'show'
                )
            ) {
                return;
            }

            const focusableElements =
                overlay.querySelectorAll(
                    'button, [tabindex]:not([tabindex="-1"])'
                );

            const firstElement =
                focusableElements[0];

            const lastElement =
                focusableElements[
                    focusableElements.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement ===
                    firstElement
            ) {
                event.preventDefault();

                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement ===
                    lastElement
            ) {
                event.preventDefault();

                firstElement.focus();
            }
        }
    );

// ========================================
// MODAL - SELECIONAR TREINO
// ========================================

function closeSelectWorkoutModal() {
    document
        .getElementById(
            'selectWorkoutModalOverlay'
        )
        .classList.remove(
            'show'
        );

    document
        .getElementById(
            'btnFinishWorkout'
        )
        .focus();
}

document
    .getElementById(
        'selectWorkoutOkBtn'
    )
    .addEventListener(
        'click',
        closeSelectWorkoutModal
    );

document
    .getElementById(
        'selectWorkoutModalOverlay'
    )
    .addEventListener(
        'click',
        (event) => {
            if (
                event.target.id ===
                'selectWorkoutModalOverlay'
            ) {
                closeSelectWorkoutModal();
            }
        }
    );

document.addEventListener(
    'keydown',
    (event) => {
        const overlay =
            document.getElementById(
                'selectWorkoutModalOverlay'
            );

        if (
            event.key === 'Escape' &&
            overlay.classList.contains(
                'show'
            )
        ) {
            closeSelectWorkoutModal();
        }
    }
);

document
    .addEventListener(
        'keydown',
        (event) => {
            const overlay =
                document.getElementById(
                    'selectWorkoutModalOverlay'
                );

            if (
                event.key !== 'Tab' ||
                !overlay.classList.contains(
                    'show'
                )
            ) {
                return;
            }

            const focusableElements =
                overlay.querySelectorAll(
                    'button, [tabindex]:not([tabindex="-1"])'
                );

            const firstElement =
                focusableElements[0];

            const lastElement =
                focusableElements[
                    focusableElements.length - 1
                ];

            if (
                event.shiftKey &&
                document.activeElement ===
                    firstElement
            ) {
                event.preventDefault();

                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement ===
                    lastElement
            ) {
                event.preventDefault();

                firstElement.focus();
            }
        }
    );

/* =========================================
   FITZONE - MONITORAR SESSAO ENTRE ABAS
========================================= */

const emailSessaoInicialFitZone =
    carregarSessao()?.email ?? null;

/* =========================================
   FITZONE - VERIFICAR ORIGEM DO ACESSO
========================================= */

async function verificarOrigemAcessoTreinos() {
    const sessaoLocal = carregarSessao();

    if (sessaoLocal) {
        return {
            origem: 'local',
            autenticado: true,
            email: sessaoLocal.email
        };
    }

    const acessoSupabase =
        await identificarAcessoSupabaseTreinos();

    if (acessoSupabase.autenticado) {
        return {
            origem: 'supabase',
            autenticado: true,
            id: acessoSupabase.id,
            email: acessoSupabase.email
        };
    }

    return {
        origem: 'nenhuma',
        autenticado: false
    };
}

/* =========================================
   FITZONE - PREPARAR TREINOS SUPABASE
========================================= */

async function prepararTreinosSupabaseFitZone() {
    const acesso = await verificarOrigemAcessoTreinos();

    if (
        !acesso.autenticado ||
        acesso.origem !== 'supabase'
    ) {
        throw new Error(
            'Acesso Supabase inválido.'
        );
    }

    const treinos =
        await carregarTreinosPorOrigem(acesso);

    if (!Array.isArray(treinos)) {
        throw new Error(
            'Resposta inválida do banco de treinos.'
        );
    }

    return {
        usuarioId: acesso.id,
        treinos: treinos,
        somenteLeitura: true
    };
}

/* =========================================
   FITZONE - VERIFICAR CONTINUIDADE SUPABASE
========================================= */

async function verificarContinuidadeSupabaseTreinos(
    usuarioId
) {
    if (
        typeof usuarioId !== 'string' ||
        !usuarioId.trim()
    ) {
        return false;
    }

    const acesso =
        await identificarAcessoSupabaseTreinos();

    return (
        acesso.autenticado === true &&
        acesso.id === usuarioId
    );
}

/* =========================================
   FITZONE - CONFERIR SESSAO HIBRIDA
========================================= */

async function conferirSessaoHibridaTreinos(
    acessoInicial
) {
    if (
        !acessoInicial ||
        acessoInicial.autenticado !== true
    ) {
        return false;
    }

    const acessoAtual =
        await verificarOrigemAcessoTreinos();

    if (
        !acessoAtual.autenticado ||
        acessoAtual.origem !== acessoInicial.origem
    ) {
        return false;
    }

    if (acessoInicial.origem === 'local') {
        return (
            acessoAtual.email === acessoInicial.email
        );
    }

    if (acessoInicial.origem === 'supabase') {
        return (
            acessoAtual.id === acessoInicial.id
        );
    }

    return false;
}

/* =========================================
   FITZONE - IDENTIDADE INICIAL DA PAGINA
========================================= */

let acessoInicialTreinosFitZone = null;

/* =========================================
   FITZONE - VERIFICAR CONTINUIDADE DA SESSAO
========================================= */

function verificarContinuidadeSessaoFitZone(
    sessao = carregarSessao()
) {
    if (
        !sessao ||
        sessao.email !== emailSessaoInicialFitZone
    ) {
        console.warn(
            'Sessão FitZone encerrada ou alterada.'
        );

        window.location.replace('login.html');

        return false;
    }

    return true;
}

window.addEventListener('storage', async (event) => {
    if (event.storageArea !== localStorage) {
        return;
    }

    if (
        event.key !== 'fitzoneSessao' &&
        event.key !== null
    ) {
        return;
    }

    if (!acessoInicialTreinosFitZone) {
        return;
    }

    try {
        const sessaoValida =
            await conferirSessaoHibridaTreinos(
                acessoInicialTreinosFitZone
            );

        if (!sessaoValida) {
            console.warn(
                'Sessão FitZone encerrada ou alterada.'
            );

            window.location.replace('login.html');
        }
    } catch (erro) {
        console.error(
            'Erro ao verificar a sessão:',
            erro
        );

        window.location.replace('login.html');
    }
});

/* =========================================
   FITZONE - VERIFICAR SESSAO AO REABRIR PAGINA
========================================= */

window.addEventListener('pageshow', async () => {
    if (!acessoInicialTreinosFitZone) {
        return;
    }

    try {
        const sessaoValida =
            await conferirSessaoHibridaTreinos(
                acessoInicialTreinosFitZone
            );

        if (!sessaoValida) {
            console.warn(
                'Sessão FitZone encerrada ou alterada.'
            );

            window.location.replace('login.html');
        }
    } catch (erro) {
        console.error(
            'Erro ao verificar a sessão:',
            erro
        );

        window.location.replace('login.html');
    }
});

/* =========================================
   FITZONE - VERIFICAR SESSAO AO VOLTAR PARA ABA
========================================= */

document.addEventListener('visibilitychange', async () => {
    if (
        document.visibilityState !== 'visible' ||
        !acessoInicialTreinosFitZone
    ) {
        return;
    }

    try {
        const sessaoValida =
            await conferirSessaoHibridaTreinos(
                acessoInicialTreinosFitZone
            );

        if (!sessaoValida) {
            console.warn(
                'Sessão FitZone encerrada ou alterada.'
            );

            window.location.replace('login.html');
        }
    } catch (erro) {
        console.error(
            'Erro ao verificar a sessão:',
            erro
        );

        window.location.replace('login.html');
    }
});

// ==================== INICIALIZAÇÃO ====================
window.addEventListener(
    'DOMContentLoaded',
    async () => {

        /* =========================================
           IDENTIFICAR ORIGEM DA SESSAO
        ========================================= */

        let acessoPagina;

        try {
            const sessaoTradicional =
                carregarSessao();

            if (sessaoTradicional) {
                acessoPagina = {
                    origem: 'local',
                    autenticado: true,
                    email: sessaoTradicional.email
                };
            } else {
                acessoPagina =
                    await verificarOrigemAcessoTreinos();
            }

        } catch (erro) {
            console.error(
                'Erro ao identificar a sessão:',
                erro
            );

            window.location.replace('login.html');
            return;
        }

        /* =========================================
           TRATAR ACESSO SUPABASE SEPARADAMENTE
        ========================================= */

        if (
            acessoPagina.autenticado === true &&
            acessoPagina.origem === 'supabase'
        ) {
            acessoInicialTreinosFitZone = acessoPagina;

            const painel = document.createElement('main');
            painel.style.cssText =
                'width:100%;max-width:560px;' +
                'margin:0 auto;padding:0 12px 24px;' +
                'font-family:inherit;';

            const titulo = document.createElement('h1');
            titulo.textContent = 'Meus Treinos';

            const mensagem = document.createElement('p');
            mensagem.textContent =
                'Consultando seus treinos no Supabase...';

            const lista = document.createElement('div');
            lista.className = 'workouts-list';

            painel.append(titulo, mensagem, lista);

            const conteudoOriginal = document.body;

            Array.from(conteudoOriginal.children).forEach(
                elemento => {
                    if (
                        elemento.tagName !== 'SCRIPT' &&
                        elemento !== painel
                    ) {
                        elemento.hidden = true;
                    }
                }
            );

            conteudoOriginal.appendChild(painel);

            /* =========================================
               PREPARAR NAVEGACAO SUPABASE
            ========================================= */

            const navegacaoOriginal =
                document.querySelector('.page > .app-nav');

            if (navegacaoOriginal) {
                const navegacaoSupabase =
                    navegacaoOriginal.cloneNode(true);

                const botaoSairSupabase =
                    navegacaoSupabase.querySelector(
                        '#btnEndSession'
                    );

                if (botaoSairSupabase) {
                    botaoSairSupabase.removeAttribute('id');
                    botaoSairSupabase.disabled = true;

                    botaoSairSupabase.addEventListener(
                        'click',
                        async () => {
                            botaoSairSupabase.disabled = true;

                            try {
                                const cliente =
                                    inicializarSupabaseFitZone();

                                if (!cliente) {
                                    throw new Error(
                                        'Supabase indisponível.'
                                    );
                                }

                                const { error } =
                                    await cliente.auth.signOut({
                                        scope: 'local'
                                    });

                                if (error) {
                                    throw error;
                                }

                                window.location.replace(
                                    'login.html'
                                );

                            } catch (erro) {
                                console.error(
                                    'Erro ao sair do Supabase:',
                                    erro
                                );

                                alert(
                                    'Não foi possível encerrar a sessão.'
                                );

                                botaoSairSupabase.disabled = false;
                            }
                        }
                    );
                }

                if (botaoSairSupabase) {
                    botaoSairSupabase.disabled = false;
                }

                navegacaoSupabase.hidden = false;

                painel.insertBefore(
                    navegacaoSupabase,
                    painel.firstChild
                );
            }

            /* =========================================
               CABECALHO ORIGINAL PARA SUPABASE
            ========================================= */

            const cabecalhoOriginal =
                document.querySelector('.page > header');

            if (cabecalhoOriginal) {
                const cabecalhoSupabase =
                    cabecalhoOriginal.cloneNode(true);

                const imagemPersonagem =
                    cabecalhoSupabase.querySelector(
                        '#characterImg'
                    );

                if (imagemPersonagem) {
                    imagemPersonagem.removeAttribute('id');
                    imagemPersonagem.removeAttribute('src');
                    imagemPersonagem.style.display = 'none';
                }

                painel.insertBefore(
                    cabecalhoSupabase,
                    titulo
                );

                titulo.remove();
            }

            /* =========================================
               PLANEJAMENTO ORIGINAL PARA SUPABASE
            ========================================= */

            const planejamentoOriginal =
                document.querySelector(
                    '.page .workouts-header'
                );

            if (planejamentoOriginal) {
                const planejamentoSupabase =
                    planejamentoOriginal.cloneNode(true);

                painel.insertBefore(
                    planejamentoSupabase,
                    mensagem
                );
            }

            /* =========================================
               BUSCA ORIGINAL DE TREINOS SUPABASE
            ========================================= */

            const buscaOriginal =
                document.querySelector('.page .workout-search');

            if (buscaOriginal) {
                const buscaSupabase =
                    buscaOriginal.cloneNode(true);

                const campoBuscaSupabase =
                    buscaSupabase.querySelector('input');

                if (campoBuscaSupabase) {
                    campoBuscaSupabase.id =
                        'workoutSearchSupabase';

                    campoBuscaSupabase.setAttribute(
                        'aria-controls',
                        'workoutsListSupabase'
                    );

                    const rotulo =
                        buscaSupabase.querySelector('label');

                    if (rotulo) {
                        rotulo.htmlFor =
                            'workoutSearchSupabase';
                    }

                    lista.id = 'workoutsListSupabase';

                    painel.insertBefore(
                        buscaSupabase,
                        lista
                    );

                    campoBuscaSupabase.addEventListener(
                        'input',
                        () => {
                            renderizarCartoesSupabase(
                                lista.treinosSupabaseCompletos || [],
                                lista
                            );
                        }
                    );
                }
            }

            /* =========================================
               FORMULARIO ORIGINAL PARA SUPABASE
            ========================================= */

            const modalTreinoOriginal =
                document.getElementById(
                    'workoutModalOverlay'
                );

            if (modalTreinoOriginal) {
                painel.appendChild(modalTreinoOriginal);
            }

            const modalExercicioSupabase =
                document.getElementById(
                    'exerciseModalOverlay'
                );

            if (modalExercicioSupabase) {
                painel.appendChild(modalExercicioSupabase);
            }

            /* =========================================
               ABRIR FORMULARIO ORIGINAL NO SUPABASE
            ========================================= */

            const botaoNovoOriginal =
                document.getElementById('btnNewWorkout');

            if (botaoNovoOriginal && modalTreinoOriginal) {
                const cabecalhoPlanejamento =
                    painel.querySelector('.workouts-header');

                if (cabecalhoPlanejamento) {
                    const botaoClonado =
                        cabecalhoPlanejamento.querySelector(
                            '#btnNewWorkout'
                        );

                    if (botaoClonado) {
                        botaoClonado.remove();
                    }

                    cabecalhoPlanejamento.appendChild(
                        botaoNovoOriginal
                    );
                } else {
                    painel.insertBefore(
                        botaoNovoOriginal,
                        mensagem
                    );
                }

                const campoNome =
                    document.getElementById(
                        'workoutNameInput'
                    );

                const botaoSalvar =
                    document.getElementById(
                        'workoutSaveBtn'
                    );

                const botaoCancelar =
                    document.getElementById(
                        'workoutCancelBtn'
                    );

                let treinoEmEdicaoSupabase = null;

                lista.addEventListener(
                    'click',
                    async (evento) => {
                        const botaoEditar = evento.target.closest(
                            'button[data-editar-treino-supabase]'
                        );

                        if (
                            !botaoEditar ||
                            !lista.contains(botaoEditar) ||
                            !campoNome
                        ) {
                            return;
                        }

                        botaoEditar.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            const treino = treinos.find(
                                item =>
                                    item.id ===
                                    botaoEditar.dataset
                                        .editarTreinoSupabase
                            );

                            if (!treino) {
                                throw new Error(
                                    'Treino não encontrado.'
                                );
                            }

                            treinoEmEdicaoSupabase = treino;
                            campoNome.value = treino.nome;

                            document.getElementById(
                                'workoutModalTitle'
                            ).textContent = 'Editar treino';

                            modalTreinoOriginal.classList.add(
                                'show'
                            );

                            campoNome.focus();

                        } catch (erro) {
                            console.error(
                                'Erro ao abrir edição:',
                                erro
                            );

                            alert(
                                'Não foi possível abrir a edição.'
                            );

                        } finally {
                            botaoEditar.disabled = false;
                        }
                    }
                );

                /* =========================================
                   DUPLICAR E EXCLUIR TREINOS SUPABASE
                ========================================= */

                lista.addEventListener(
                    'click',
                    async (evento) => {
                        const botao = evento.target.closest(
                            'button[data-duplicar-treino-supabase], ' +
                            'button[data-excluir-treino-supabase]'
                        );

                        if (
                            !botao ||
                            !lista.contains(botao) ||
                            botao.disabled
                        ) {
                            return;
                        }

                        const duplicar =
                            botao.hasAttribute(
                                'data-duplicar-treino-supabase'
                            );

                        const treinoId = duplicar
                            ? botao.dataset.duplicarTreinoSupabase
                            : botao.dataset.excluirTreinoSupabase;

                        botao.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            const original = treinos.find(
                                treino => treino.id === treinoId
                            );

                            if (!original) {
                                throw new Error(
                                    'Treino não encontrado.'
                                );
                            }

                            if (duplicar) {
                                const gruposCopiados = new Map();

                                const exerciciosCopiados = (
                                    original.exercicios || []
                                ).map(exercicio => {
                                    let novoGrupo = null;

                                    if (exercicio.grupoExecucao) {
                                        if (
                                            !gruposCopiados.has(
                                                exercicio.grupoExecucao
                                            )
                                        ) {
                                            gruposCopiados.set(
                                                exercicio.grupoExecucao,
                                                crypto.randomUUID()
                                            );
                                        }

                                        novoGrupo = gruposCopiados.get(
                                            exercicio.grupoExecucao
                                        );
                                    }

                                    return {
                                        ...exercicio,
                                        id: crypto.randomUUID(),
                                        grupoExecucao: novoGrupo
                                    };
                                });

                                const sufixo = ' (cópia)';

                                const nomeBase = original.nome
                                    .slice(
                                        0,
                                        50 - sufixo.length
                                    )
                                    .trimEnd();

                                const novoTreino = {
                                    id: crypto.randomUUID(),
                                    nome: nomeBase + sufixo,
                                    exercicios: exerciciosCopiados
                                };

                                await salvarTreinoPorOrigem(
                                    acessoInicialTreinosFitZone,
                                    novoTreino
                                );

                                mensagem.textContent =
                                    'Treino duplicado com sucesso!';

                            } else {
                                const confirmado = window.confirm(
                                    `Deseja realmente excluir o treino "${original.nome}"?`
                                );

                                if (!confirmado) {
                                    return;
                                }

                                await excluirTreinoBancoSupabase(
                                    original.id
                                );

                                mensagem.textContent =
                                    'Treino excluído com sucesso!';
                            }

                            const atualizados =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            renderizarCartoesSupabase(
                                atualizados,
                                lista
                            );

                        } catch (erro) {
                            console.error(
                                'Erro na operação do treino Supabase:',
                                erro
                            );

                            alert(
                                'Não foi possível concluir a operação.'
                            );

                        } finally {
                            botao.disabled = false;
                        }
                    }
                );

                if (botaoSalvar && campoNome) {
                    botaoSalvar.disabled = false;

                    botaoSalvar.addEventListener(
                        'click',
                        async () => {
                            const nome = campoNome.value.trim();

                            if (!nome) {
                                alert('Informe o nome do treino.');
                                campoNome.focus();
                                return;
                            }

                            botaoSalvar.disabled = true;

                            try {
                                const sessaoValida =
                                    await conferirSessaoHibridaTreinos(
                                        acessoInicialTreinosFitZone
                                    );

                                if (!sessaoValida) {
                                    window.location.replace(
                                        'login.html'
                                    );
                                    return;
                                }

                                const novoTreino =
                                    treinoEmEdicaoSupabase
                                        ? {
                                            ...treinoEmEdicaoSupabase,
                                            nome: nome
                                        }
                                        : {
                                            id: crypto.randomUUID(),
                                            nome: nome,
                                            exercicios: []
                                        };

                                await salvarTreinoPorOrigem(
                                    acessoInicialTreinosFitZone,
                                    novoTreino
                                );

                                const treinosAtualizados =
                                    await carregarTreinosPorOrigem(
                                        acessoInicialTreinosFitZone
                                    );

                                renderizarCartoesSupabase(
                                    treinosAtualizados,
                                    lista
                                );

                                mensagem.textContent =
                                    'Treino salvo com sucesso!';

                                modalTreinoOriginal.classList.remove(
                                    'show'
                                );

                                campoNome.value = '';

                                treinoEmEdicaoSupabase = null;                               

                            } catch (erro) {
                                console.error(
                                    'Erro ao salvar treino Supabase:',
                                    erro
                                );

                                alert(
                                    'Não foi possível salvar o treino.'
                                );

                            } finally {
                                botaoSalvar.disabled = false;
                            }
                        }
                    );
                }

                botaoNovoOriginal.addEventListener(
                    'click',
                    () => {
                        treinoEmEdicaoSupabase = null;
                        if (campoNome) {
                            campoNome.value = '';
                        }

                        const tituloModal =
                            document.getElementById(
                                'workoutModalTitle'
                            );

                        if (tituloModal) {
                            tituloModal.textContent =
                                'Novo treino';
                        }

                        modalTreinoOriginal.classList.add(
                            'show'
                        );

                        if (campoNome) {
                            campoNome.focus();
                        }
                    }
                );

                if (botaoCancelar) {
                    botaoCancelar.addEventListener(
                        'click',
                        () => {
                            treinoEmEdicaoSupabase = null;
                            modalTreinoOriginal.classList.remove(
                                'show'
                            );
                        }
                    );
                }
            }

            /* =========================================
               EXERCICIOS INDIVIDUAIS SUPABASE
            ========================================= */

            if (modalExercicioSupabase) {
                let contextoExercicioSupabase = null;

                const campo = id =>
                    document.getElementById(id);

                let treinoGruposSupabase = null;
                let exercicioGruposSupabase = null;

                function atualizarGruposExercicioSupabase(
                    treino,
                    exercicio = null
                ) {
                    treinoGruposSupabase = treino;
                    exercicioGruposSupabase = exercicio;

                    const tipo =
                        campo('exerciseTypeInput').value;

                    const seletor =
                        campo('exerciseGroupInput');

                    const campoGrupo =
                        campo('exerciseGroupField');

                    seletor.replaceChildren();

                    const opcaoNova =
                        document.createElement('option');

                    opcaoNova.value = '';
                    opcaoNova.textContent = 'Novo grupo';
                    seletor.appendChild(opcaoNova);

                    campoGrupo.hidden =
                        tipo === 'individual';

                    if (tipo === 'individual') {
                        return;
                    }

                    const grupos = new Map();

                    (treino.exercicios || []).forEach(item => {
                        if (
                            item.tipoExecucao !== tipo ||
                            !item.grupoExecucao
                        ) {
                            return;
                        }

                        const grupo =
                            item.grupoExecucao;

                        grupos.set(
                            grupo,
                            (grupos.get(grupo) || 0) + 1
                        );
                    });

                    const limite =
                        tipo === 'bisset' ? 2 : 3;

                    let numero = 0;

                    grupos.forEach((quantidade, grupoId) => {
                        numero++;

                        const opcao =
                            document.createElement('option');

                        opcao.value = grupoId;

                        const grupoAtual =
                            exercicio?.grupoExecucao ===
                                grupoId &&
                            exercicio?.tipoExecucao === tipo;

                        opcao.disabled =
                            quantidade >= limite &&
                            !grupoAtual;

                        const nomeGrupo =
                            tipo === 'bisset'
                                ? 'Bi-set'
                                : 'Tri-set';

                        opcao.textContent =
                            `${nomeGrupo} ${numero}` +
                            (opcao.disabled
                                ? ' — completo'
                                : '');

                        seletor.appendChild(opcao);
                    });

                    if (
                        exercicio?.tipoExecucao === tipo &&
                        exercicio?.grupoExecucao
                    ) {
                        seletor.value =
                            exercicio.grupoExecucao;
                    }
                }

                campo('exerciseTypeInput').addEventListener(
                    'change',
                    () => {
                        if (treinoGruposSupabase) {
                            atualizarGruposExercicioSupabase(
                                treinoGruposSupabase,
                                exercicioGruposSupabase
                            );
                        }
                    }
                );

                const fecharExercicioSupabase = () => {
                    modalExercicioSupabase.classList.remove(
                        'show'
                    );

                    contextoExercicioSupabase = null;
                };

                lista.addEventListener(
                    'click',
                    async evento => {
                        const botao = evento.target.closest(
                            'button[data-adicionar-exercicio-supabase], ' +
                            'button[data-editar-exercicio-supabase]'
                        );

                        if (!botao || !lista.contains(botao)) {
                            return;
                        }

                        botao.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinoId =
                                botao.dataset
                                    .adicionarExercicioSupabase ||
                                botao.dataset
                                    .treinoExercicioSupabase;

                            const exercicioId =
                                botao.dataset
                                    .editarExercicioSupabase || null;

                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            const treino = treinos.find(
                                item => item.id === treinoId
                            );

                            if (!treino) {
                                throw new Error(
                                    'Treino não encontrado.'
                                );
                            }

                            const exercicio = exercicioId
                                ? (treino.exercicios || []).find(
                                    item => item.id === exercicioId
                                )
                                : null;

                            if (exercicioId && !exercicio) {
                                throw new Error(
                                    'Exercício não encontrado.'
                                );
                            }

                            contextoExercicioSupabase = {
                                treinoId,
                                exercicioId
                            };

                            campo('exerciseModalTitle').textContent =
                                exercicio
                                    ? 'Editar exercício'
                                    : 'Novo exercício';

                            campo('exerciseNameInput').value =
                                exercicio?.nome || '';

                            campo('exerciseSeriesInput').value =
                                exercicio?.series ?? '';

                            campo('exerciseRepsInput').value =
                                exercicio?.repeticoes ?? '';

                            campo('exerciseRestInput').value =
                                exercicio?.descanso ?? '';

                            campo('exerciseTypeInput').disabled =
                                false;

                            campo('exerciseTypeInput').value =
                                exercicio?.tipoExecucao || 'individual';

                            atualizarGruposExercicioSupabase(
                                treino,
                                exercicio
                            );

                            const aviso =
                                campo('exerciseValidationMessage');

                            aviso.hidden = true;
                            aviso.textContent = '';

                            modalExercicioSupabase.classList.add(
                                'show'
                            );

                            campo('exerciseNameInput').focus();

                        } catch (erro) {
                            console.error(
                                'Erro ao abrir exercício Supabase:',
                                erro
                            );

                            alert(
                                'Não foi possível abrir o exercício.'
                            );

                        } finally {
                            botao.disabled = false;
                        }
                    }
                );

                campo('exerciseCancelBtn').addEventListener(
                    'click',
                    fecharExercicioSupabase
                );

                modalExercicioSupabase.addEventListener(
                    'click',
                    evento => {
                        if (
                            evento.target ===
                            modalExercicioSupabase
                        ) {
                            fecharExercicioSupabase();
                        }
                    }
                );

                campo('exerciseSaveBtn').addEventListener(
                    'click',
                    async () => {
                        if (!contextoExercicioSupabase) {
                            return;
                        }

                        const nome =
                            campo('exerciseNameInput').value.trim();

                        const series =
                            campo('exerciseSeriesInput').valueAsNumber;

                        const repeticoes =
                            campo('exerciseRepsInput').valueAsNumber;

                        const descanso =
                            campo('exerciseRestInput').valueAsNumber;

                        if (
                            !nome ||
                            !Number.isInteger(series) ||
                            series < 1 ||
                            !Number.isInteger(repeticoes) ||
                            repeticoes < 1 ||
                            !Number.isInteger(descanso) ||
                            descanso < 0
                        ) {
                            const aviso =
                                campo('exerciseValidationMessage');

                            aviso.textContent =
                                'Preencha nome, séries, repetições ' +
                                'e descanso com valores válidos.';

                            aviso.hidden = false;
                            return;
                        }

                        const salvar =
                            campo('exerciseSaveBtn');

                        if (salvar.disabled) {
                            return;
                        }

                        salvar.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            const treino = treinos.find(
                                item =>
                                    item.id ===
                                    contextoExercicioSupabase.treinoId
                            );

                            if (!treino) {
                                throw new Error(
                                    'Treino não encontrado.'
                                );
                            }

                            if (!Array.isArray(treino.exercicios)) {
                                treino.exercicios = [];
                            }

                            const exercicioId =
                                contextoExercicioSupabase.exercicioId;

                            const existente = exercicioId
                                ? treino.exercicios.find(
                                    item => item.id === exercicioId
                                )
                                : null;

                            if (exercicioId && !existente) {
                                throw new Error(
                                    'Exercício não encontrado.'
                                );
                            }


                            const tipoExecucao =
                                campo('exerciseTypeInput').value;

                            const grupoSelecionado =
                                campo('exerciseGroupInput').value;

                            if (
                                ![
                                    'individual',
                                    'bisset',
                                    'triset'
                                ].includes(tipoExecucao)
                            ) {
                                throw new Error(
                                    'Tipo de execução inválido.'
                                );
                            }

                            let grupoExecucao = null;

                            if (tipoExecucao !== 'individual') {
                                const limite =
                                    tipoExecucao === 'bisset'
                                        ? 2
                                        : 3;

                                if (grupoSelecionado) {
                                    const quantidade =
                                        treino.exercicios.filter(
                                            item =>
                                                item.id !== exercicioId &&
                                                item.grupoExecucao ===
                                                    grupoSelecionado &&
                                                item.tipoExecucao ===
                                                    tipoExecucao
                                        ).length;

                                    const grupoExiste =
                                        treino.exercicios.some(
                                            item =>
                                                item.grupoExecucao ===
                                                    grupoSelecionado &&
                                                item.tipoExecucao ===
                                                    tipoExecucao
                                        );

                                    if (
                                        !grupoExiste ||
                                        quantidade >= limite
                                    ) {
                                        alert(
                                            'Este grupo está completo ' +
                                            'ou não está mais disponível.'
                                        );
                                        return;
                                    }

                                    grupoExecucao =
                                        grupoSelecionado;
                                } else {
                                    grupoExecucao =
                                        crypto.randomUUID();
                                }
                            }

                            const dados = {
                                nome,
                                tipoExecucao,
                                grupoExecucao,
                                series,
                                repeticoes,
                                descanso
                            };

                            if (existente) {
                                Object.assign(existente, dados);
                            } else {
                                treino.exercicios.push({
                                    id: crypto.randomUUID(),
                                    ...dados
                                });
                            }

                            await salvarTreinoPorOrigem(
                                acessoInicialTreinosFitZone,
                                treino
                            );

                            const atualizados =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            renderizarCartoesSupabase(
                                atualizados,
                                lista
                            );

                            mensagem.textContent =
                                'Exercício salvo com sucesso!';

                            fecharExercicioSupabase();

                        } catch (erro) {
                            console.error(
                                'Erro ao salvar exercício:',
                                erro
                            );

                            alert(
                                'Não foi possível salvar o exercício.'
                            );

                        } finally {
                            salvar.disabled = false;
                        }
                    }
                );

                /* =========================================
                   EXCLUIR EXERCICIOS SUPABASE
                ========================================= */

                lista.addEventListener(
                    'click',
                    async evento => {
                        const botao = evento.target.closest(
                            'button[data-excluir-exercicio-supabase]'
                        );

                        if (
                            !botao ||
                            !lista.contains(botao) ||
                            botao.disabled
                        ) {
                            return;
                        }

                        const confirmado = window.confirm(
                            'Deseja realmente excluir este exercício?'
                        );

                        if (!confirmado) {
                            return;
                        }

                        botao.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinoId =
                                botao.dataset.treinoExercicioSupabase;

                            const exercicioId =
                                botao.dataset.excluirExercicioSupabase;

                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            const treino = treinos.find(
                                item => item.id === treinoId
                            );

                            if (
                                !treino ||
                                !Array.isArray(treino.exercicios)
                            ) {
                                throw new Error(
                                    'Treino não encontrado.'
                                );
                            }

                            const quantidadeAnterior =
                                treino.exercicios.length;

                            treino.exercicios =
                                treino.exercicios.filter(
                                    item => item.id !== exercicioId
                                );

                            if (
                                treino.exercicios.length ===
                                quantidadeAnterior
                            ) {
                                throw new Error(
                                    'Exercício não encontrado.'
                                );
                            }

                            await salvarTreinoPorOrigem(
                                acessoInicialTreinosFitZone,
                                treino
                            );

                            const atualizados =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            renderizarCartoesSupabase(
                                atualizados,
                                lista
                            );

                            mensagem.textContent =
                                'Exercício excluído com sucesso!';

                        } catch (erro) {
                            console.error(
                                'Erro ao excluir exercício Supabase:',
                                erro
                            );

                            alert(
                                'Não foi possível excluir o exercício.'
                            );

                        } finally {
                            botao.disabled = false;
                        }
                    }
                );
            }

            /* =========================================
               PROGRESSO DAS SERIES SUPABASE
            ========================================= */

            const painelProgressoSupabase =
                document.createElement('section');

            painelProgressoSupabase.className =
                'active-training-section';

            painelProgressoSupabase.hidden = true;

            painel.insertBefore(
                painelProgressoSupabase,
                lista
            );

            /* =========================================
               HISTORICO VISUAL SUPABASE
            ========================================= */

            const painelHistoricoSupabase =
                document.createElement('section');

            painelHistoricoSupabase.className =
                'active-training-section';

            painel.insertBefore(
                painelHistoricoSupabase,
                lista
            );

            async function renderizarHistoricoSupabase() {
                const registros =
                    await consultarHistoricoTreinosSupabase();

                painelHistoricoSupabase.replaceChildren();

                const titulo =
                    document.createElement('h2');

                titulo.textContent = 'Histórico de treinos';

                painelHistoricoSupabase.appendChild(titulo);

                if (registros.length === 0) {
                    const vazio =
                        document.createElement('p');

                    vazio.textContent =
                        'Nenhum treino concluído ainda.';

                    painelHistoricoSupabase.appendChild(vazio);
                    return;
                }

                registros.forEach(registro => {
                    const cartao =
                        document.createElement('article');

                    cartao.className = 'workout-card';

                    const nome =
                        document.createElement('h3');

                    nome.textContent =
                        registro.nome || 'Treino';

                    const data =
                        document.createElement('p');

                    const partes =
                        (registro.dataLocal || '').split('-');

                    data.textContent =
                        partes.length === 3
                            ? `${partes[2]}/${partes[1]}/${partes[0]}`
                            : 'Data não informada';

                    const resumo =
                        document.createElement('p');

                    resumo.textContent =
                        `${registro.seriesConcluidas ?? 0} ` +
                        `de ${registro.seriesTotal ?? 0} ` +
                        'séries concluídas';

                    const detalhes =
                        document.createElement('details');

                    const abrirDetalhes =
                        document.createElement('summary');

                    abrirDetalhes.textContent =
                        'Ver exercícios';

                    detalhes.appendChild(abrirDetalhes);

                    const exercicios =
                        Array.isArray(registro.exercicios)
                            ? registro.exercicios
                            : [];

                    exercicios.forEach(exercicio => {
                        const linha =
                            document.createElement('p');

                        linha.textContent =
                            `${exercicio.nome || 'Exercício'}: ` +
                            `${exercicio.seriesConcluidas ?? 0} ` +
                            `de ${exercicio.seriesTotal ?? 0} séries`;

                        detalhes.appendChild(linha);
                    });

                    cartao.append(
                        nome,
                        data,
                        resumo,
                        detalhes
                    );

                    painelHistoricoSupabase.appendChild(
                        cartao
                    );
                });
            }

            async function renderizarProgressoSupabase() {
                const ativo =
                    await consultarTreinoAtivoSupabase();

                painelProgressoSupabase.replaceChildren();

                if (!ativo) {
                    painelProgressoSupabase.hidden = true;
                    return;
                }

                const treinos =
                    await carregarTreinosPorOrigem(
                        acessoInicialTreinosFitZone
                    );

                const treino = treinos.find(
                    item => item.id === ativo.id
                );

                if (!treino) {
                    painelProgressoSupabase.hidden = true;
                    return;
                }

                painelProgressoSupabase.hidden = false;

                const titulo =
                    document.createElement('h2');

                titulo.textContent =
                    `Treino em andamento: ${treino.nome}`;

                const resumo =
                    document.createElement('p');

                resumo.setAttribute('role', 'status');

                const exercicios =
                    treino.exercicios || [];

                const progresso = ativo.progresso || {};

                let totalSeries = 0;
                let seriesConcluidas = 0;

                exercicios.forEach(exercicio => {
                    const quantidade =
                        Number(exercicio.series) || 0;

                    const marcadas =
                        progresso[exercicio.id] || [];

                    totalSeries += quantidade;

                    seriesConcluidas += Array.from(
                        { length: quantidade },
                        (_, indice) => indice + 1
                    ).filter(numero =>
                        Array.isArray(marcadas) &&
                        marcadas.includes(numero)
                    ).length;
                });

                resumo.textContent =
                    `${seriesConcluidas} de ${totalSeries} séries concluídas`;

                painelProgressoSupabase.append(
                    titulo,
                    resumo
                );

                if (exercicios.length === 0) {
                    const aviso =
                        document.createElement('p');

                    aviso.textContent =
                        'Este treino não possui exercícios.';

                    painelProgressoSupabase.appendChild(aviso);
                    return;
                }

                exercicios.forEach(exercicio => {
                    const grupo =
                        document.createElement('div');

                    grupo.className =
                        'active-exercise-item';

                    const nome =
                        document.createElement('strong');

                    nome.textContent =
                        exercicio.nome || 'Exercício';

                    const descricao =
                        document.createElement('p');

                    descricao.textContent =
                        `${exercicio.series} séries × ` +
                        `${exercicio.repeticoes} repetições`;

                    grupo.append(nome, descricao);

                    const quantidade =
                        Math.max(
                            0,
                            Math.floor(Number(exercicio.series) || 0)
                        );

                    for (
                        let numero = 1;
                        numero <= quantidade;
                        numero++
                    ) {
                        const rotulo =
                            document.createElement('label');

                        rotulo.style.cssText =
                            'display:inline-flex;align-items:center;' +
                            'gap:6px;margin:8px 12px 8px 0;';

                        const checkbox =
                            document.createElement('input');

                        checkbox.type = 'checkbox';

                        checkbox.dataset.serieExercicio =
                            exercicio.id;

                        checkbox.dataset.numeroSerie =
                            String(numero);

                        checkbox.checked =
                            Array.isArray(
                                progresso[exercicio.id]
                            ) &&
                            progresso[exercicio.id].includes(
                                numero
                            );

                        const texto =
                            document.createElement('span');

                        texto.textContent =
                            `Série ${numero}`;

                        rotulo.append(checkbox, texto);
                        grupo.appendChild(rotulo);
                    }

                    painelProgressoSupabase.appendChild(
                        grupo
                    );

                });

                if (seriesConcluidas > 0) {
                    const botaoFinalizar =
                        document.createElement('button');

                    botaoFinalizar.type = 'button';
                    botaoFinalizar.className =
                        'btn btn-save';

                    botaoFinalizar.textContent =
                        '✓ Finalizar treino';

                    botaoFinalizar.dataset.finalizarTreinoSupabase =
                        ativo.id;

                    painelProgressoSupabase.appendChild(
                        botaoFinalizar
                    );
                }
            }

            painelProgressoSupabase.addEventListener(
                'change',
                async evento => {
                    const checkbox =
                        evento.target.closest(
                            'input[data-serie-exercicio]'
                        );

                    if (!checkbox) {
                        return;
                    }

                    const controles =
                        painelProgressoSupabase.querySelectorAll(
                            'input[data-serie-exercicio]'
                        );

                    controles.forEach(item => {
                        item.disabled = true;
                    });

                    try {
                        const sessaoValida =
                            await conferirSessaoHibridaTreinos(
                                acessoInicialTreinosFitZone
                            );

                        if (!sessaoValida) {
                            window.location.replace(
                                'login.html'
                            );
                            return;
                        }

                        const ativo =
                            await consultarTreinoAtivoSupabase();

                        if (!ativo) {
                            throw new Error(
                                'Nenhum treino ativo encontrado.'
                            );
                        }

                        const treinos =
                            await carregarTreinosPorOrigem(
                                acessoInicialTreinosFitZone
                            );

                        const treino = treinos.find(
                            item => item.id === ativo.id
                        );

                        const exercicio =
                            treino?.exercicios?.find(
                                item =>
                                    item.id ===
                                    checkbox.dataset.serieExercicio
                            );

                        const numero =
                            Number(
                                checkbox.dataset.numeroSerie
                            );

                        if (
                            !exercicio ||
                            !Number.isInteger(numero) ||
                            numero < 1 ||
                            numero > Number(exercicio.series)
                        ) {
                            throw new Error(
                                'Série ou exercício inválido.'
                            );
                        }

                        const progresso = {
                            ...ativo.progresso
                        };

                        const seriesAtuais =
                            progresso[exercicio.id];

                        const marcadas = new Set(
                            Array.isArray(seriesAtuais)
                                ? seriesAtuais
                                : []
                        );

                        if (checkbox.checked) {
                            marcadas.add(numero);
                        } else {
                            marcadas.delete(numero);
                        }

                        progresso[exercicio.id] =
                            Array.from(marcadas).sort(
                                (a, b) => a - b
                            );

                        await salvarTreinoAtivoSupabase({
                            id: ativo.id,
                            nome: ativo.nome,
                            progresso,
                            iniciadoEm: ativo.iniciadoEm
                        });

                        await renderizarProgressoSupabase();

                    } catch (erro) {
                        console.error(
                            'Erro ao atualizar séries:',
                            erro
                        );

                        alert(
                            'Não foi possível salvar o progresso.'
                        );

                        try {
                            await renderizarProgressoSupabase();
                        } catch (erroAtualizacao) {
                            console.error(
                                'Erro ao recuperar progresso:',
                                erroAtualizacao
                            );
                        }

                    } finally {
                        controles.forEach(item => {
                            item.disabled = false;
                        });
                    }
                }
            );

            /* =========================================
               FINALIZAR TREINO SUPABASE
            ========================================= */

            painelProgressoSupabase.addEventListener(
                'click',
                async evento => {
                    const botao = evento.target.closest(
                        'button[data-finalizar-treino-supabase]'
                    );

                    if (!botao || botao.disabled) {
                        return;
                    }

                    botao.disabled = true;

                    try {
                        const sessaoValida =
                            await conferirSessaoHibridaTreinos(
                                acessoInicialTreinosFitZone
                            );

                        if (!sessaoValida) {
                            window.location.replace('login.html');
                            return;
                        }

                        const ativo =
                            await consultarTreinoAtivoSupabase();

                        if (
                            !ativo ||
                            ativo.id !==
                                botao.dataset.finalizarTreinoSupabase
                        ) {
                            throw new Error(
                                'O treino ativo foi alterado.'
                            );
                        }

                        const treinos =
                            await carregarTreinosPorOrigem(
                                acessoInicialTreinosFitZone
                            );

                        const treino = treinos.find(
                            item => item.id === ativo.id
                        );

                        if (!treino) {
                            throw new Error(
                                'Treino não encontrado.'
                            );
                        }

                        const exercicios =
                            treino.exercicios || [];

                        let totalSeries = 0;
                        let seriesConcluidas = 0;

                        const resumoExercicios =
                            exercicios.map(exercicio => {
                                const total =
                                    Math.max(
                                        0,
                                        Math.floor(
                                            Number(exercicio.series) || 0
                                        )
                                    );

                                const marcadas =
                                    ativo.progresso?.[exercicio.id];

                                const concluidas =
                                    Array.from(
                                        { length: total },
                                        (_, indice) => indice + 1
                                    ).filter(numero =>
                                        Array.isArray(marcadas) &&
                                        marcadas.includes(numero)
                                    ).length;

                                totalSeries += total;
                                seriesConcluidas += concluidas;

                                return {
                                    id: exercicio.id,
                                    nome: exercicio.nome,
                                    seriesConcluidas: concluidas,
                                    seriesTotal: total,
                                    completo:
                                        total > 0 &&
                                        concluidas === total,
                                    tipoExecucao:
                                        exercicio.tipoExecucao ||
                                        'individual',
                                    grupoExecucao:
                                        exercicio.grupoExecucao ||
                                        null
                                };
                            });

                        if (seriesConcluidas === 0) {
                            alert(
                                'Conclua pelo menos uma série.'
                            );
                            return;
                        }

                        const hoje = new Date();

                        const dataLocal = calDateKey(
                            hoje.getFullYear(),
                            hoje.getMonth(),
                            hoje.getDate()
                        );

                        const historico =
                            await consultarHistoricoTreinosSupabase();

                        const jaConcluido =
                            historico.some(registro =>
                                registro.workoutId === ativo.id &&
                                registro.dataLocal === dataLocal
                            );

                        if (jaConcluido) {
                            alert(
                                'Este treino já foi concluído hoje.'
                            );
                            return;
                        }

                        const confirmar = window.confirm(
                            `Finalizar "${treino.nome}"?\n\n` +
                            `${seriesConcluidas} de ` +
                            `${totalSeries} séries concluídas.\n\n` +
                            'O resultado será registrado no histórico.'
                        );

                        if (!confirmar) {
                            return;
                        }

                        const registro = {
                            workoutId: treino.id,
                            nome: treino.nome,
                            data: new Date().toISOString(),
                            exercicios: resumoExercicios,
                            totalExercicios: exercicios.length,
                            seriesConcluidas,
                            seriesTotal: totalSeries
                        };

                        await registrarHistoricoTreinoSupabase(
                            registro,
                            dataLocal
                        );

                        try {
                            await limparTreinoAtivoSupabase();
                        } catch (erroLimpeza) {
                            console.error(
                                'Histórico registrado, mas falhou ' +
                                'a limpeza do treino ativo:',
                                erroLimpeza
                            );

                            alert(
                                'O treino foi registrado no histórico, ' +
                                'mas não foi possível limpar o treino ativo. ' +
                                'Não finalize novamente.'
                            );

                            return;
                        }

                        treinoAtivoSupabaseVisualId = null;

                        renderizarCartoesSupabase(
                            treinos,
                            lista
                        );

                        await renderizarProgressoSupabase();
                        await renderizarHistoricoSupabase();

                        mensagem.textContent =
                            'Treino finalizado e registrado ' +
                            'no histórico com sucesso!';

                    } catch (erro) {
                        console.error(
                            'Erro ao finalizar treino Supabase:',
                            erro
                        );

                        alert(
                            erro.message ||
                            'Não foi possível finalizar o treino.'
                        );

                    } finally {
                        botao.disabled = false;
                    }
                }
            );

            /* =========================================
               SELECIONAR TREINO ATIVO SUPABASE
            ========================================= */

            lista.addEventListener(
                'click',
                async evento => {
                    const botao = evento.target.closest(
                        'button[data-iniciar-treino-supabase]'
                    );

                    if (
                        !botao ||
                        !lista.contains(botao) ||
                        botao.disabled
                    ) {
                        return;
                    }

                    botao.disabled = true;

                    try {
                        const sessaoValida =
                            await conferirSessaoHibridaTreinos(
                                acessoInicialTreinosFitZone
                            );

                        if (!sessaoValida) {
                            window.location.replace('login.html');
                            return;
                        }

                        const treinoId =
                            botao.dataset.iniciarTreinoSupabase;

                        const treinos =
                            await carregarTreinosPorOrigem(
                                acessoInicialTreinosFitZone
                            );

                        const treino = treinos.find(
                            item => item.id === treinoId
                        );

                        if (!treino) {
                            throw new Error(
                                'Treino não encontrado.'
                            );
                        }

                        const ativoAtual =
                            await consultarTreinoAtivoSupabase();

                        if (ativoAtual?.id === treino.id) {
                            mensagem.textContent =
                                'Este treino já está selecionado.';
                            return;
                        }

                        if (
                            ativoAtual &&
                            !window.confirm(
                                'Já existe um treino em andamento. ' +
                                'Deseja selecionar outro?'
                            )
                        ) {
                            return;
                        }

                        await salvarTreinoAtivoSupabase({
                            id: treino.id,
                            nome: treino.nome,
                            progresso: {},
                            iniciadoEm:
                                new Date().toISOString()
                        });

                        treinoAtivoSupabaseVisualId =
                            treino.id;

                        renderizarCartoesSupabase(
                            treinos,
                            lista
                        );

                        mensagem.textContent =
                            'Treino selecionado com sucesso!';

                        await renderizarProgressoSupabase();

                    } catch (erro) {
                        console.error(
                            'Erro ao selecionar treino:',
                            erro
                        );

                        alert(
                            'Não foi possível selecionar o treino.'
                        );

                    } finally {
                        botao.disabled = false;
                    }
                }
            );

            try {
                const resultado =
                    await prepararTreinosSupabaseFitZone();

                const sessaoValida =
                    await conferirSessaoHibridaTreinos(
                        acessoInicialTreinosFitZone
                    );

                if (!sessaoValida) {
                    window.location.replace('login.html');
                    return;
                }

                mensagem.textContent =
                    resultado.treinos.length === 0
                        ? 'Nenhum treino cadastrado no banco.'
                        : 'Seus treinos estão atualizados.';

                const treinoAtivoSalvo =
                    await consultarTreinoAtivoSupabase();

                treinoAtivoSupabaseVisualId =
                    treinoAtivoSalvo?.id || null;

                renderizarCartoesSupabase(
                    resultado.treinos,
                    lista
                );

                await renderizarProgressoSupabase();
                await renderizarHistoricoSupabase();

                /* =========================================
                   BOTAO TEMPORARIO DE TESTE SUPABASE
                ========================================= */

                const botaoTeste =
                    document.createElement('button');

                botaoTeste.type = 'button';
                botaoTeste.textContent =
                    'Criar treino de teste';

                botaoTeste.style.cssText =
                    'display:block;margin:20px 0;' +
                    'padding:12px 18px;cursor:pointer;';

                painel.appendChild(botaoTeste);
                botaoTeste.style.display = 'none';
               
                botaoTeste.addEventListener(
                    'click',
                    async () => {
                        botaoTeste.disabled = true;
                        mensagem.textContent =
                            'Salvando treino no Supabase...';

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            const treinoTeste = {
                                id: 'teste-' + crypto.randomUUID(),
                                nome: 'Treino de teste Supabase',
                                exercicios: [
                                    {
                                        id: crypto.randomUUID(),
                                        nome: 'Supino reto',
                                        series: 3,
                                        repeticoes: 12,
                                        descanso: 60
                                    },
                                    {
                                        id: crypto.randomUUID(),
                                        nome: 'Crucifixo',
                                        series: 3,
                                        repeticoes: 10,
                                        descanso: 45
                                    }
                                ]
                            };

                            await salvarTreinoBancoSupabase(
                                treinoTeste
                            );

                            const treinosAtualizados =
                                await consultarTreinosBancoSupabase();

                            renderizarCartoesSupabase(
                                treinosAtualizados,
                                lista
                            );

                            mensagem.textContent =
                                'Treino salvo com sucesso no Supabase!';

                        } catch (erro) {
                            console.error(
                                'Erro ao salvar treino:',
                                erro
                            );

                            mensagem.textContent =
                                'Erro ao salvar treino no Supabase.';
                        } finally {
                            botaoTeste.disabled = false;
                        }
                    }
                );

                /* =========================================
                   EXCLUIR TREINO DE TESTE SUPABASE
                ========================================= */

                const botaoExcluir =
                    document.createElement('button');

                botaoExcluir.type = 'button';
                botaoExcluir.textContent =
                    'Excluir treino de teste';

                botaoExcluir.style.cssText =
                    'display:block;margin:12px 0;' +
                    'padding:12px 18px;cursor:pointer;';

                painel.appendChild(botaoExcluir);
                botaoExcluir.style.display = 'none';

                botaoExcluir.addEventListener(
                    'click',
                    async () => {
                        const treinos =
                            await consultarTreinosBancoSupabase();

                        const treinoTeste = treinos.find(
                            treino =>
                                treino.id.startsWith('teste-') &&
                                treino.nome ===
                                    'Treino de teste Supabase'
                        );

                        if (!treinoTeste) {
                            mensagem.textContent =
                                'Nenhum treino de teste encontrado.';
                            return;
                        }

                        const confirmar = window.confirm(
                            'Excluir o treino de teste?'
                        );

                        if (!confirmar) {
                            return;
                        }

                        botaoExcluir.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace(
                                    'login.html'
                                );
                                return;
                            }

                            await excluirTreinoBancoSupabase(
                                treinoTeste.id
                            );

                            const atualizados =
                                await consultarTreinosBancoSupabase();

                            renderizarCartoesSupabase(
                                atualizados,
                                lista
                            );

                            mensagem.textContent =
                                'Treino de teste excluído com sucesso!';

                        } catch (erro) {
                            console.error(
                                'Erro ao excluir treino:',
                                erro
                            );

                            mensagem.textContent =
                                'Não foi possível excluir o treino.';
                        } finally {
                            botaoExcluir.disabled = false;
                        }
                    }
                );

                /* =========================================
                   EDITAR TREINO DE TESTE SUPABASE
                ========================================= */

                const botaoEditar =
                    document.createElement('button');

                botaoEditar.type = 'button';
                botaoEditar.textContent =
                    'Editar treino de teste';

                botaoEditar.style.cssText =
                    'display:block;margin:12px 0;' +
                    'padding:12px 18px;cursor:pointer;';

                painel.appendChild(botaoEditar);
                botaoEditar.style.display = 'none';

                botaoEditar.addEventListener(
                    'click',
                    async () => {
                        botaoEditar.disabled = true;

                        try {
                            const sessaoValida =
                                await conferirSessaoHibridaTreinos(
                                    acessoInicialTreinosFitZone
                                );

                            if (!sessaoValida) {
                                window.location.replace('login.html');
                                return;
                            }

                            const treinos =
                                await consultarTreinosBancoSupabase();

                            const treinoTeste = treinos.find(
                                treino =>
                                    typeof treino.id === 'string' &&
                                    treino.id.startsWith('teste-') &&
                                    treino.nome ===
                                        'Treino de teste Supabase' &&
                                    Array.isArray(treino.exercicios) &&
                                    treino.exercicios.some(
                                        exercicio =>
                                            exercicio.nome === 'Supino reto'
                                    )
                            );

                            if (!treinoTeste) {
                                mensagem.textContent =
                                    'Treino de teste não encontrado.';
                                return;
                            }

                            const confirmar = window.confirm(
                                'Alterar Supino reto para 15 repetições?'
                            );

                            if (!confirmar) {
                                return;
                            }

                            const treinoEditado = {
                                ...treinoTeste,
                                exercicios: treinoTeste.exercicios.map(
                                    exercicio =>
                                        exercicio.nome === 'Supino reto'
                                            ? {
                                                ...exercicio,
                                                repeticoes: 15
                                            }
                                            : exercicio
                                )
                            };

                            await salvarTreinoBancoSupabase(
                                treinoEditado
                            );

                            const atualizados =
                                await consultarTreinosBancoSupabase();

                            renderizarCartoesSupabase(
                                atualizados,
                                lista
                            );

                            mensagem.textContent =
                                'Treino atualizado no Supabase!';

                        } catch (erro) {
                            console.error(
                                'Erro ao editar treino:',
                                erro
                            );

                            mensagem.textContent =
                                'Não foi possível editar o treino.';
                        } finally {
                            botaoEditar.disabled = false;
                        }
                    }
                );

            } catch (erro) {
                console.error(
                    'Erro ao consultar treinos Supabase:',
                    erro
                );

                mensagem.textContent =
                    'Não foi possível carregar os treinos. ' +
                    'Verifique a conexão e tente novamente.';
            }

            return;
        }

        const sessao =
            carregarSessao();

        if (!verificarContinuidadeSessaoFitZone(sessao)) {
            return;
        }

        /* =========================================
           REGISTRAR IDENTIDADE DA CONTA TRADICIONAL
        ========================================= */

        acessoInicialTreinosFitZone = {
            origem: 'local',
            autenticado: true,
            email: sessao.email
        };

        /* =========================================
           MOSTRAR PAGINA ATIVA NO MENU MOBILE
        ========================================= */

        if (window.matchMedia('(max-width: 520px)').matches) {
            const linkAtivo = document.querySelector(
                '.app-nav-actions .app-nav-link.active'
            );

            if (linkAtivo) {
                linkAtivo.scrollIntoView({
                    behavior: 'instant',
                    block: 'nearest',
                    inline: 'center'
                });
            }
        }

        const btnEndSession =
            document.getElementById(
                'btnEndSession'
            );

        if (btnEndSession) {
            btnEndSession.addEventListener(
                'click',
                () => {
                    localStorage.removeItem(
                        'fitzoneSessao'
                    );

                    window.location.href =
                        'login.html';
                }
            );
        }

        const genero =
            sessao && sessao.email
                ? localStorage.getItem(
                    `generoFitZone:${sessao.email.toLowerCase()}`
                )
                : null;

        const characterImg =
            document.getElementById(
                'characterImg'
            );

        const imagens = {
            masculino:
                'img/atleta-masculino.png',
            feminino:
                'img/atleta-feminino.png'
        };

        if (genero === 'masculino') {
            document.body.classList.add(
                'theme-masculino'
            );

            characterImg.src =
                imagens.masculino;

            characterImg.style.display =
                'block';
        } else if (
            genero === 'feminino'
        ) {
            document.body.classList.add(
                'theme-feminino'
            );

            characterImg.src =
                imagens.feminino;

            characterImg.style.display =
                'block';
        }

        renderWorkouts();

        /* =========================================
           EXERCICIO RECEBIDO DA BIBLIOTECA
        ========================================= */

        const exerciciosBiblioteca = {
            'supino-reto': 'Supino reto',
            'crucifixo': 'Crucifixo com halteres',
            'puxada-frontal': 'Puxada frontal',
            'remada-baixa': 'Remada baixa',
            'agachamento-livre': 'Agachamento livre',
            'leg-press': 'Leg press',
            'rosca-direta': 'Rosca direta',
            'triceps-polia': 'Tríceps na polia',
            'desenvolvimento': 'Desenvolvimento com halteres',
            'elevacao-lateral': 'Elevação lateral',
            'prancha': 'Prancha abdominal',
            'abdominal-crunch': 'Abdominal crunch',
            'supino-inclinado': 'Supino inclinado com halteres',
            'remada-unilateral': 'Remada unilateral com halter',
            'mesa-flexora': 'Mesa flexora',
            'rosca-martelo': 'Rosca martelo',
            'elevacao-frontal': 'Elevação frontal',
            'abdominal-infra': 'Elevação de joelhos',
            'cadeira-extensora': 'Cadeira extensora',
            'elevacao-pelvica': 'Elevação pélvica',
            'gemeos-em-pe': 'Gêmeos em pé (panturrilha)',
            'peck-deck': 'Crucifixo na máquina (Peck Deck)',
            'rosca-barra-w': 'Rosca com barra W',
            'triceps-corda': 'Tríceps corda',
            'flexao-bracos': 'Flexão de braços',
            'remada-curvada': 'Remada curvada com barra',
            'barra-fixa': 'Barra fixa',
            'rosca-scott': 'Rosca Scott',
            'triceps-frances': 'Tríceps francês com halter',
            'crucifixo-inverso': 'Crucifixo inverso na máquina',
            'face-pull': 'Face pull na polia',
            'abdominal-bicicleta': 'Abdominal bicicleta',
            'prancha-lateral': 'Prancha lateral'
        };

        const parametrosBiblioteca =
            new URLSearchParams(window.location.search);

        const exercicioIdBiblioteca =
            parametrosBiblioteca.get('biblioteca');

        const nomeExercicioBiblioteca =
            Object.hasOwn(
                exerciciosBiblioteca,
                exercicioIdBiblioteca
            )
                ? exerciciosBiblioteca[exercicioIdBiblioteca]
                : null;

        /* =========================================
           AVISO DO EXERCICIO SELECIONADO
        ========================================= */

        const avisoBiblioteca =
            document.getElementById(
                'librarySelectionNotice'
            );

        const nomeNoAviso =
            document.getElementById(
                'librarySelectedExercise'
            );

        if (
            nomeExercicioBiblioteca &&
            avisoBiblioteca &&
            nomeNoAviso
        ) {
            nomeNoAviso.textContent =
                nomeExercicioBiblioteca;

            avisoBiblioteca.hidden = false;
        }

        if (nomeExercicioBiblioteca) {
            let exercicioPendente = true;

            const listaTreinos =
                document.getElementById('workoutsList');

            listaTreinos.addEventListener('click', (evento) => {

                const botaoAdicionar = evento.target.closest(
                    '.btn-add-exercise'
                );

                if (!botaoAdicionar || !exercicioPendente) {
                    return;
                }

                const campoNome =
                    document.getElementById('exerciseNameInput');

                if (!campoNome) {
                    return;
                }

                campoNome.value = nomeExercicioBiblioteca;
                exercicioPendente = false;

                // Oculta o aviso após escolher o treino
                if (avisoBiblioteca) {
                    avisoBiblioteca.hidden = true;
                }

                parametrosBiblioteca.delete('biblioteca');

                const novaConsulta =
                    parametrosBiblioteca.toString();

                const novoEndereco =
                    window.location.pathname +
                    (novaConsulta ? `?${novaConsulta}` : '') +
                    window.location.hash;

                window.history.replaceState(
                    null,
                    '',
                    novoEndereco
                );
            });
        }

        const treinoAtivo =
            carregarTreinoAtivo();

        if (treinoAtivo) {
            const workouts =
                loadWorkouts();

            const workoutAtivo =
                workouts.find(
                    workout =>
                        workout.id ===
                        treinoAtivo.id
                );

            if (workoutAtivo) {
                renderActiveTraining(
                    workoutAtivo
                );
            } else {
                localStorage.removeItem(
                    obterChaveTreinoAtivo()
                );
            }
        }
    }
);

let warningModalPreviousFocus = null;

function showWarningModal(message) {
    warningModalPreviousFocus =
        document.activeElement;

    const overlay =
        document.getElementById(
            'warningModalOverlay'
        );

    const messageElement =
        document.getElementById(
            'warningModalMessage'
        );

    messageElement.textContent =
        message;

    overlay.classList.add(
        'show'
    );

    document
        .getElementById(
            'warningModalOkBtn'
        )
        .focus();
}

function closeWarningModal() {
    document
        .getElementById(
            'warningModalOverlay'
        )
        .classList.remove(
            'show'
        );

    if (
        warningModalPreviousFocus &&
        typeof warningModalPreviousFocus.focus ===
            'function'
    ) {
        warningModalPreviousFocus.focus();
    }

    warningModalPreviousFocus = null;
}

document
    .getElementById(
        'warningModalOkBtn'
    )
    .addEventListener(
        'click',
        closeWarningModal
    );

document.addEventListener(
    'keydown',
    (event) => {
        const overlay =
            document.getElementById(
                'warningModalOverlay'
            );

        if (
            event.key === 'Escape' &&
            overlay.classList.contains(
                'show'
            )
        ) {
            closeWarningModal();
        }
    }
);

document
    .getElementById(
        'warningModalOverlay'
    )
    .addEventListener(
        'click',
        (event) => {
            if (
                event.target.id ===
                'warningModalOverlay'
            ) {
                closeWarningModal();
            }
        }
    );

document.addEventListener(
    'keydown',
    (event) => {
        const overlay =
            document.getElementById(
                'warningModalOverlay'
            );

        if (
            event.key === 'Tab' &&
            overlay.classList.contains(
                'show'
            )
        ) {
            event.preventDefault();

            document
                .getElementById(
                    'warningModalOkBtn'
                )
                .focus();
        }
    }
);

/* =========================================
   FITZONE - PESQUISA DE TREINOS EM TEMPO REAL
========================================= */

const workoutSearchInput = document.getElementById(
    'workoutSearchInput'
);

if (workoutSearchInput) {
    workoutSearchInput.addEventListener('input', () => {
        renderWorkouts();
    });
}

/* =========================================
   FITZONE - PREPARAR DADOS DO BACKUP
========================================= */

function prepararDadosBackupFitZone() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'É necessário estar autenticado para exportar o backup.'
        );
    }

    const email = sessao.email.trim().toLowerCase();

    const chaves = {
        perfil: `fitzonePerfil:${email}`,
        fotoPerfil: `fotoPerfilFitZone:${email}`,
        treinos: `fitzoneTreinos:${email}`,
        historico: `historicoTreinos:${email}`,
        progresso: `progressoTreino:${email}`,
        treinoAtivo: `treinoAtivo:${email}`,
        checkins: `fitzoneCheckins:${email}`,
        metaMensal: `metaMensalFitZone:${email}`,
        favoritos: `fitzoneFavoritos:${email}`,
        secoesDesempenho: `fitzoneSecoesDesempenho:${email}`
    };

    const dados = {};

    Object.entries(chaves).forEach(([tipo, chave]) => {
        const valor = localStorage.getItem(chave);

        dados[tipo] = valor === null
            ? null
            : valor;
    });

    return {
        aplicativo: 'FitZone',
        versaoBackup: 1,
        contaEmail: email,
        exportadoEm: new Date().toISOString(),
        dados
    };

}

/* =========================================
   FITZONE - GERAR ARQUIVO DE BACKUP
========================================= */

function exportarBackupFitZone() {
    try {
        const backup = prepararDadosBackupFitZone();

        const conteudo = JSON.stringify(
            backup,
            null,
            2
        );

        const arquivo = new Blob(
            [conteudo],
            { type: 'application/json;charset=utf-8' }
        );

        const url = URL.createObjectURL(arquivo);

        const data = new Date()
            .toISOString()
            .slice(0, 10);

        const link = document.createElement('a');

        link.href = url;
        link.download = `fitzone-backup-${data}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);

    } catch (erro) {
        console.error(
            'Erro ao exportar backup do FitZone:',
            erro
        );

        showWarningModal(
            'Não foi possível preparar o backup. Tente novamente.'
        );
    }
}

/* =========================================
   FITZONE - ATIVAR EXPORTACAO DE BACKUP
========================================= */

const botaoExportarBackup = document.getElementById(
    'btnExportWorkoutBackup'
);

if (botaoExportarBackup) {
    botaoExportarBackup.addEventListener(
        'click',
        exportarBackupFitZone
    );

    botaoExportarBackup.disabled = false;
}

/* =========================================
   FITZONE - VALIDAR ESTRUTURA DO BACKUP
========================================= */

function validarEstruturaBackupFitZone(backup) {
    if (
        !backup ||
        typeof backup !== 'object' ||
        Array.isArray(backup)
    ) {
        return false;
    }

    if (
        backup.aplicativo !== 'FitZone' ||
        backup.versaoBackup !== 1 ||
        typeof backup.exportadoEm !== 'string' ||
        !Number.isFinite(Date.parse(backup.exportadoEm))
    ) {
        return false;
    }

    const dados = backup.dados;

    if (
        !dados ||
        typeof dados !== 'object' ||
        Array.isArray(dados)
    ) {
        return false;
    }

    const categoriasObrigatorias = [
        'perfil',
        'fotoPerfil',
        'treinos',
        'historico',
        'progresso',
        'treinoAtivo',
        'checkins',
        'metaMensal'
    ];

    const categoriasOpcionais = [
        'favoritos',
        'secoesDesempenho'
    ];

    const categoriasPermitidas = [
        ...categoriasObrigatorias,
        ...categoriasOpcionais
    ];

    const categoriasPresentes = Object.keys(dados);

    return (
        categoriasObrigatorias.every(categoria =>
            Object.hasOwn(dados, categoria)
        ) &&
        categoriasPresentes.every(categoria =>
            categoriasPermitidas.includes(categoria) &&
            (
                dados[categoria] === null ||
                typeof dados[categoria] === 'string'
            )
        )
    );
}

/* =========================================
   FITZONE - VALIDAR TIPOS DOS DADOS DO BACKUP
========================================= */

function validarTiposBackupFitZone(backup) {
    if (!validarEstruturaBackupFitZone(backup)) {
        return false;
    }

    const tiposEsperados = {
        perfil: 'objeto',
        treinos: 'lista',
        historico: 'lista',
        progresso: 'objeto',
        treinoAtivo: 'objeto',
        checkins: 'objeto'
    };

    try {
        for (const [categoria, tipo] of Object.entries(tiposEsperados)) {
            const valor = backup.dados[categoria];

            if (valor === null) {
                continue;
            }

            const dado = JSON.parse(valor);

            if (tipo === 'lista' && !Array.isArray(dado)) {
                return false;
            }

            if (
                tipo === 'objeto' &&
                (
                    dado === null ||
                    typeof dado !== 'object' ||
                    Array.isArray(dado)
                )
            ) {
                return false;
            }
        }

        const foto = backup.dados.fotoPerfil;

        if (
            foto !== null &&
            !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(foto)
        ) {
            return false;
        }

        const meta = backup.dados.metaMensal;

        if (
            meta !== null &&
            (
                !/^\d+$/.test(meta) ||
                Number(meta) < 1 ||
                Number(meta) > 100
            )
        ) {
            return false;
        }

        const favoritos = backup.dados.favoritos;

        if (favoritos !== undefined && favoritos !== null) {
            const lista = JSON.parse(favoritos);

            if (
                !Array.isArray(lista) ||
                !lista.every(id =>
                    typeof id === 'string' ||
                    typeof id === 'number'
                )
            ) {
                return false;
            }
        }

        const secoes = backup.dados.secoesDesempenho;

        if (secoes !== undefined && secoes !== null) {
            const preferencias = JSON.parse(secoes);

            if (
                !preferencias ||
                typeof preferencias !== 'object' ||
                Array.isArray(preferencias)
            ) {
                return false;
            }

            const secoesPermitidas = [
                '.training-summary',
                '.training-streak',
                '.monthly-goal',
                '.monthly-comparison',
                '.training-chart',
                '.fitzone-achievements',
                '.workout-history'
            ];

            if (
                !Object.entries(preferencias).every(
                    ([secao, expandida]) =>
                        secoesPermitidas.includes(secao) &&
                        typeof expandida === 'boolean'
                )
            ) {
                return false;
            }
        }

        return true;

    } catch (erro) {
        console.warn(
            'Backup com dados internos inválidos:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR TREINOS DO BACKUP
========================================= */

function validarTreinosBackupFitZone(backup) {
    if (!validarTiposBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.treinos;

        if (valor === null) {
            return true;
        }

        const treinos = JSON.parse(valor);

        const validarExercicio = (exercicio) => {
            if (
                !exercicio ||
                typeof exercicio !== 'object' ||
                Array.isArray(exercicio)
            ) {
                return false;
            }

            return (
                typeof exercicio.id === 'string' &&
                exercicio.id.length > 0 &&
                typeof exercicio.nome === 'string' &&
                exercicio.nome.trim().length > 0 &&
                Number.isInteger(exercicio.series) &&
                exercicio.series >= 1 &&
                Number.isInteger(exercicio.repeticoes) &&
                exercicio.repeticoes >= 1 &&
                Number.isInteger(exercicio.descanso) &&
                exercicio.descanso >= 0 &&
                (
                    exercicio.grupoExecucao == null ||
                    typeof exercicio.grupoExecucao === 'string'
                ) &&
                (
                    exercicio.tipoExecucao == null ||
                    ['individual', 'bisset', 'triset']
                        .includes(exercicio.tipoExecucao)
                )
            );
        };

        return treinos.every(treino =>
            treino !== null &&
            typeof treino === 'object' &&
            !Array.isArray(treino) &&
            typeof treino.id === 'string' &&
            treino.id.length > 0 &&
            typeof treino.nome === 'string' &&
            treino.nome.trim().length > 0 &&
            Array.isArray(treino.exercicios) &&
            treino.exercicios.every(validarExercicio)
        );

    } catch (erro) {
        console.warn(
            'Estrutura dos treinos do backup inválida:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR HISTORICO DO BACKUP
========================================= */

function validarHistoricoBackupFitZone(backup) {
    if (!validarTreinosBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.historico;

        if (valor === null) {
            return true;
        }

        const historico = JSON.parse(valor);

        if (!Array.isArray(historico)) {
            return false;
        }

        return historico.every(registro => {
            if (
                !registro ||
                typeof registro !== 'object' ||
                Array.isArray(registro)
            ) {
                return false;
            }

            return (
                typeof registro.workoutId === 'string' &&
                registro.workoutId.length > 0 &&

                typeof registro.nome === 'string' &&
                registro.nome.trim().length > 0 &&

                typeof registro.data === 'string' &&
                Number.isFinite(
                    Date.parse(registro.data)
                ) &&

                Array.isArray(registro.exercicios) &&

                Number.isInteger(registro.totalExercicios) &&
                registro.totalExercicios >= 0 &&

                Number.isInteger(registro.seriesConcluidas) &&
                registro.seriesConcluidas >= 0 &&

                Number.isInteger(registro.seriesTotal) &&
                registro.seriesTotal >= 0 &&

                registro.seriesConcluidas <=
                    registro.seriesTotal
            );
        });

    } catch (erro) {
        console.warn(
            'Historico do backup invalido:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR EXERCICIOS DO HISTORICO
========================================= */

function validarExerciciosHistoricoBackupFitZone(backup) {
    if (!validarHistoricoBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.historico;

        if (valor === null) {
            return true;
        }

        const historico = JSON.parse(valor);

        return historico.every(registro => {
            if (
                registro.totalExercicios !==
                registro.exercicios.length
            ) {
                return false;
            }

            return registro.exercicios.every(exercicio => {
                if (
                    !exercicio ||
                    typeof exercicio !== 'object' ||
                    Array.isArray(exercicio)
                ) {
                    return false;
                }

                return (
                    (
                        exercicio.id === null ||
                        (
                            typeof exercicio.id === 'string' &&
                            exercicio.id.length > 0
                        )
                    ) &&

                    typeof exercicio.nome === 'string' &&
                    exercicio.nome.trim().length > 0 &&

                    Number.isInteger(exercicio.seriesConcluidas) &&
                    exercicio.seriesConcluidas >= 0 &&

                    Number.isInteger(exercicio.seriesTotal) &&
                    exercicio.seriesTotal >= 0 &&

                    exercicio.seriesConcluidas <=
                        exercicio.seriesTotal &&

                    typeof exercicio.completo === 'boolean' &&

                    ['individual', 'bisset', 'triset']
                        .includes(exercicio.tipoExecucao) &&

                    (
                        exercicio.grupoExecucao === null ||
                        typeof exercicio.grupoExecucao === 'string'
                    )
                );
            });
        });

    } catch (erro) {
        console.warn(
            'Exercicios do historico do backup invalidos:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR CONTA DO BACKUP
========================================= */

function validarContaBackupFitZone(backup) {
    if (!validarExerciciosHistoricoBackupFitZone(backup)) {
        return false;
    }

    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        return false;
    }

    if (
        typeof backup.contaEmail !== 'string' ||
        !backup.contaEmail.trim()
    ) {
        return false;
    }

    const emailAtual = sessao.email
        .trim()
        .toLowerCase();

    const emailBackup = backup.contaEmail
        .trim()
        .toLowerCase();

    return emailAtual === emailBackup;
}

/* =========================================
   FITZONE - LER ARQUIVO DE BACKUP
========================================= */

async function lerArquivoBackupFitZone(arquivo) {
    const tamanhoMaximo = 20 * 1024 * 1024;

    if (!(arquivo instanceof File)) {
        throw new Error(
            'Selecione um arquivo de backup válido.'
        );
    }

    if (
        !arquivo.name.toLowerCase().endsWith('.json') ||
        arquivo.size === 0 ||
        arquivo.size > tamanhoMaximo
    ) {
        throw new Error(
            'O arquivo deve ser um JSON de até 20 MB.'
        );
    }

    let backup;

    try {
        const conteudo = await arquivo.text();
        backup = JSON.parse(conteudo);
    } catch (erro) {
        throw new Error(
            'Não foi possível ler o arquivo JSON.'
        );
    }

    if (!validarMedidasPerfilBackupFitZone(backup)) {
        throw new Error(
            'Backup inválido, incompatível ou de outra conta.'
        );
    }

    return backup;
}

/* =========================================
   FITZONE - VALIDAR PROGRESSO DO BACKUP
========================================= */

function validarProgressoBackupFitZone(backup) {
    if (!validarContaBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.progresso;

        if (valor === null) {
            return true;
        }

        const progresso = JSON.parse(valor);

        if (
            !progresso ||
            typeof progresso !== 'object' ||
            Array.isArray(progresso)
        ) {
            return false;
        }

        return Object.entries(progresso).every(
            ([treinoId, exercicios]) => {
                if (
                    !treinoId ||
                    !exercicios ||
                    typeof exercicios !== 'object' ||
                    Array.isArray(exercicios)
                ) {
                    return false;
                }

                return Object.entries(exercicios).every(
                    ([exercicioId, series]) => {
                        if (
                            !exercicioId ||
                            !Array.isArray(series)
                        ) {
                            return false;
                        }

                        return (
                            series.every(numero =>
                                Number.isInteger(numero) &&
                                numero >= 1
                            ) &&
                            new Set(series).size === series.length
                        );
                    }
                );
            }
        );

    } catch (erro) {
        console.warn(
            'Progresso do backup inválido:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR TREINO ATIVO DO BACKUP
========================================= */

function validarTreinoAtivoBackupFitZone(backup) {
    if (!validarProgressoBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.treinoAtivo;

        if (valor === null) {
            return true;
        }

        const treinoAtivo = JSON.parse(valor);

        if (
            !treinoAtivo ||
            typeof treinoAtivo !== 'object' ||
            Array.isArray(treinoAtivo) ||
            typeof treinoAtivo.id !== 'string' ||
            !treinoAtivo.id.trim() ||
            typeof treinoAtivo.nome !== 'string' ||
            !treinoAtivo.nome.trim()
        ) {
            return false;
        }

        const treinos = backup.dados.treinos === null
            ? []
            : JSON.parse(backup.dados.treinos);

        return treinos.some(treino =>
            treino.id === treinoAtivo.id
        );

    } catch (erro) {
        console.warn(
            'Treino ativo do backup inválido:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR CHECK-INS DO BACKUP
========================================= */

function validarCheckinsBackupFitZone(backup) {
    if (!validarTreinoAtivoBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.checkins;

        if (valor === null) {
            return true;
        }

        const checkins = JSON.parse(valor);

        if (
            !checkins ||
            typeof checkins !== 'object' ||
            Array.isArray(checkins)
        ) {
            return false;
        }

        return Object.entries(checkins).every(
            ([data, registro]) => {
                if (
                    !/^\d{4}-\d{2}-\d{2}$/.test(data)
                ) {
                    return false;
                }

                const [ano, mes, dia] =
                    data.split('-').map(Number);

                const dataVerificada =
                    new Date(Date.UTC(ano, mes - 1, dia));

                const dataValida =
                    dataVerificada.getUTCFullYear() === ano &&
                    dataVerificada.getUTCMonth() === mes - 1 &&
                    dataVerificada.getUTCDate() === dia;

                if (!dataValida) {
                    return false;
                }

                if (
                    !registro ||
                    typeof registro !== 'object' ||
                    Array.isArray(registro)
                ) {
                    return false;
                }

                return (
                    typeof registro.checked === 'boolean' &&
                    typeof registro.treino === 'string'
                );
            }
        );

    } catch (erro) {
        console.warn(
            'Check-ins do backup inválidos:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR PERFIL DO BACKUP
========================================= */

function validarPerfilBackupFitZone(backup) {
    if (!validarCheckinsBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.perfil;

        if (valor === null) {
            return true;
        }

        const perfil = JSON.parse(valor);

        if (
            !perfil ||
            typeof perfil !== 'object' ||
            Array.isArray(perfil)
        ) {
            return false;
        }

        const campos = [
            'nome',
            'idade',
            'tipoSanguineo',
            'peso',
            'altura',
            'treinador',
            'infoPessoais'
        ];

        for (const campo of campos) {
            if (
                Object.hasOwn(perfil, campo) &&
                typeof perfil[campo] !== 'string'
            ) {
                return false;
            }
        }

        if (
            Object.hasOwn(perfil, 'nome') &&
            !perfil.nome.trim()
        ) {
            return false;
        }

        return true;

    } catch (erro) {
        console.warn(
            'Perfil do backup inválido:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - VALIDAR MEDIDAS DO PERFIL
========================================= */

function validarMedidasPerfilBackupFitZone(backup) {
    if (!validarPerfilBackupFitZone(backup)) {
        return false;
    }

    try {
        const valor = backup.dados.perfil;

        if (valor === null) {
            return true;
        }

        const perfil = JSON.parse(valor);

        const limites = {
            idade: { minimo: 10, maximo: 120 },
            peso: { minimo: 20, maximo: 400 },
            altura: { minimo: 100, maximo: 250 }
        };

        return Object.entries(limites).every(
            ([campo, limite]) => {
                if (!Object.hasOwn(perfil, campo)) {
                    return true;
                }

                const texto = perfil[campo].trim();

                if (!texto) {
                    return false;
                }

                const numero = Number(texto);

                return (
                    Number.isFinite(numero) &&
                    numero >= limite.minimo &&
                    numero <= limite.maximo &&
                    (
                        campo !== 'idade' ||
                        Number.isInteger(numero)
                    )
                );
            }
        );

    } catch (erro) {
        console.warn(
            'Medidas do perfil no backup inválidas:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - CHAVES PARA RESTAURACAO
========================================= */

function obterChavesRestauracaoFitZone() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida para restauração do backup.'
        );
    }

    const email = sessao.email.trim().toLowerCase();

    return {
        perfil: `fitzonePerfil:${email}`,
        fotoPerfil: `fotoPerfilFitZone:${email}`,
        treinos: `fitzoneTreinos:${email}`,
        historico: `historicoTreinos:${email}`,
        progresso: `progressoTreino:${email}`,
        treinoAtivo: `treinoAtivo:${email}`,
        checkins: `fitzoneCheckins:${email}`,
        metaMensal: `metaMensalFitZone:${email}`,
        favoritos: `fitzoneFavoritos:${email}`,
        secoesDesempenho: `fitzoneSecoesDesempenho:${email}`
    };
}

/* =========================================
   FITZONE - CAPTURAR DADOS ANTES DA RESTAURACAO
========================================= */

function capturarDadosAtuaisFitZone() {
    const chaves = obterChavesRestauracaoFitZone();

    const dadosAtuais = {};

    Object.entries(chaves).forEach(([tipo, chave]) => {
        const valor = localStorage.getItem(chave);

        dadosAtuais[tipo] = valor === null
            ? null
            : valor;
    });

    return dadosAtuais;
}

/* =========================================
   FITZONE - PREPARAR PLANO DE RESTAURACAO
========================================= */

function prepararPlanoRestauracaoFitZone(backup) {
    if (!validarMedidasPerfilBackupFitZone(backup)) {
        throw new Error(
            'O backup não passou nas validações.'
        );
    }

    const chaves = obterChavesRestauracaoFitZone();

    const dadosAtuais = capturarDadosAtuaisFitZone();

    return Object.entries(chaves).map(
        ([tipo, chave]) => {
            const possuiCategoria = Object.hasOwn(
                backup.dados,
                tipo
            );

            return {
                tipo: tipo,
                chave: chave,
                valorAnterior: dadosAtuais[tipo],
                valorNovo: possuiCategoria
                    ? backup.dados[tipo]
                    : dadosAtuais[tipo]
            };
        }
    );
}

/* =========================================
   FITZONE - APLICAR PLANO DE RESTAURACAO
========================================= */

function aplicarPlanoRestauracaoFitZone(plano) {
    if (!verificarPlanoRestauracaoFitZone(plano)) {
        throw new Error(
            'O plano de restauração é inválido ou está desatualizado.'
        );
    }

    const alterados = [];

    try {
        plano.forEach(item => {
            if (item.valorAnterior === item.valorNovo) {
                return;
            }

            // Registra a chave antes de tentar modificá-la.
            alterados.push(item);

            if (item.valorNovo === null) {
                localStorage.removeItem(item.chave);
            } else {
                localStorage.setItem(
                    item.chave,
                    item.valorNovo
                );
            }
        });

        const gravacaoConfirmada = plano.every(item =>
            localStorage.getItem(item.chave) === item.valorNovo
        );

        if (!gravacaoConfirmada) {
            throw new Error(
                'Os dados gravados não correspondem ao backup.'
            );
        }

        return true;

    } catch (erro) {
        const falhasReversao = [];

        // Tenta recuperar os valores anteriores.
        [...alterados].reverse().forEach(item => {
            try {
                if (item.valorAnterior === null) {
                    localStorage.removeItem(item.chave);
                } else {
                    localStorage.setItem(
                        item.chave,
                        item.valorAnterior
                    );
                }
            } catch (erroReversao) {
                falhasReversao.push({
                    tipo: item.tipo,
                    erro: erroReversao
                });
            }
        });

        const reversaoConfirmada = [...alterados].every(item => {
            try {
                return localStorage.getItem(item.chave) ===
                    item.valorAnterior;
            } catch (erroVerificacao) {
                console.error(
                    'Erro ao verificar recuperação dos dados:',
                    erroVerificacao
                );
                return false;
            }
        });

        if (falhasReversao.length > 0 || !reversaoConfirmada) {
            console.error(
                'Falha ao reverter parte da restauração:',
                falhasReversao
            );

            throw new Error(
                'A restauração falhou e alguns dados podem não ter sido recuperados.'
            );
        }

        throw new Error(
            'A restauração falhou. Os valores anteriores foram recuperados.',
            { cause: erro }
        );
    }
}

/* =========================================
   FITZONE - BAIXAR BACKUP DE SEGURANCA
========================================= */

function baixarBackupSegurancaFitZone() {
    if (!validarPlanoPendenteRestauracaoFitZone()) {
        throw new Error(
            'Não é possível gerar a cópia de segurança: ' +
            'plano de restauração inválido ou desatualizado.'
        );
    }

    const backup = prepararDadosBackupFitZone();

    if (!validarMedidasPerfilBackupFitZone(backup)) {
        throw new Error(
            'Os dados atuais não passaram na validação.'
        );
    }

    const conteudo = JSON.stringify(backup, null, 2);

    const arquivo = new Blob(
        [conteudo],
        { type: 'application/json;charset=utf-8' }
    );

    const url = URL.createObjectURL(arquivo);

    const data = new Date()
        .toISOString()
        .replace(/[:.]/g, '-');

    const link = document.createElement('a');

    link.href = url;
    link.download =
        `fitzone-seguranca-antes-restauracao-${data}.json`;

    document.body.appendChild(link);

    try {
        link.click();
    } finally {
        link.remove();

        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
    }
}

/* =========================================
   FITZONE - VERIFICAR PLANO DE RESTAURACAO
========================================= */

function verificarPlanoRestauracaoFitZone(plano) {
    try {
        const chaves = obterChavesRestauracaoFitZone();

        const totalCategorias = Object.keys(chaves).length;

        if (
            !Array.isArray(plano) ||
            plano.length !== totalCategorias
        ) {
            return false;
        }

        const categorias = Object.keys(chaves);

        return categorias.every((tipo, indice) => {
            const item = plano[indice];

            if (
                !item ||
                typeof item !== 'object' ||
                Array.isArray(item) ||
                item.tipo !== tipo ||
                item.chave !== chaves[tipo]
            ) {
                return false;
            }

            if (
                !Object.hasOwn(item, 'valorAnterior') ||
                !Object.hasOwn(item, 'valorNovo')
            ) {
                return false;
            }

            const valoresValidos = [
                item.valorAnterior,
                item.valorNovo
            ].every(valor =>
                valor === null ||
                typeof valor === 'string'
            );

            if (!valoresValidos) {
                return false;
            }

            return (
                localStorage.getItem(item.chave) ===
                item.valorAnterior
            );
        });

    } catch (erro) {
        console.warn(
            'Plano de restauração inválido:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - RESUMO DA RESTAURACAO
========================================= */

function resumirPlanoRestauracaoFitZone(plano) {
    if (!verificarPlanoRestauracaoFitZone(plano)) {
        throw new Error(
            'O plano de restauração não é válido.'
        );
    }

    const categorias = plano.map(item => ({
        tipo: item.tipo,
        seraAlterado:
            item.valorAnterior !== item.valorNovo,
        possuiDadosAtuais:
            item.valorAnterior !== null,
        possuiDadosBackup:
            item.valorNovo !== null
    }));

    return {
        totalCategorias: categorias.length,

        categoriasAlteradas:
            categorias.filter(item =>
                item.seraAlterado
            ).length,

        categoriasMantidas:
            categorias.filter(item =>
                !item.seraAlterado
            ).length,

        categorias
    };
}

/* =========================================
   FITZONE - MODAL DE RESTAURACAO
========================================= */

let restoreBackupPreviousFocus = null;
let restoreBackupPendingPlan = null;

function abrirModalRestauracaoFitZone(plano = null) {
    const modal = document.getElementById(
        'restoreBackupModalOverlay'
    );

    const cancelar = document.getElementById(
        'restoreBackupCancelBtn'
    );

    const confirmar = document.getElementById(
        'restoreBackupConfirmBtn'
    );

    const resumoElemento = document.getElementById(
        'restoreBackupSummary'
    );

    const confirmacaoSeguranca = document.getElementById(
        'restoreBackupSafetyConfirm'
    );

    if (
        !modal ||
        !cancelar ||
        !confirmar ||
        !resumoElemento ||
        !confirmacaoSeguranca
    ) {
        return;
    }

    confirmar.disabled = true;
    confirmacaoSeguranca.checked = false;

    if (plano !== null) {
        if (!verificarPlanoRestauracaoFitZone(plano)) {
            console.warn(
                'Tentativa de abrir restauração com plano inválido.'
            );

            restoreBackupPendingPlan = null;
            return;
        }

        try {
            mostrarResumoRestauracaoFitZone(plano);
        } catch (erro) {
            console.warn(
                'Não foi possível preparar o resumo:',
                erro
            );

            return;
        }
    } else {
        resumoElemento.textContent =
            'Selecione um arquivo de backup válido ' +
            'para visualizar as alterações.';
    }

    restoreBackupPendingPlan = Array.isArray(plano)
        ? Object.freeze(
            plano.map(item =>
                Object.freeze({ ...item })
            )
        )
        : null;

    restoreBackupPreviousFocus = document.activeElement;

    modal.classList.add('show');

    cancelar.focus();
}

/* =========================================
   FITZONE - VALIDAR PLANO PENDENTE
========================================= */

function validarPlanoPendenteRestauracaoFitZone() {
    const modal = document.getElementById(
        'restoreBackupModalOverlay'
    );

    if (
        !modal ||
        !modal.classList.contains('show') ||
        !restoreBackupPendingPlan ||
        !verificarPlanoRestauracaoFitZone(
            restoreBackupPendingPlan
        )
    ) {
        console.warn(
            'Restauração não autorizada: ' +
            'janela fechada ou plano inválido.'
        );

        return false;
    }

    return true;
}

function fecharModalRestauracaoFitZone() {
    const modal = document.getElementById(
        'restoreBackupModalOverlay'
    );

    if (!modal) {
        return;
    }

    modal.classList.remove('show');

    restoreBackupPendingPlan = null;

    if (
        restoreBackupPreviousFocus &&
        document.contains(restoreBackupPreviousFocus) &&
        typeof restoreBackupPreviousFocus.focus === 'function'
    ) {
        restoreBackupPreviousFocus.focus();
    }

    restoreBackupPreviousFocus = null;
}

/* =========================================
   FITZONE - SOLICITAR BACKUP DE SEGURANCA
========================================= */

function solicitarBackupSegurancaFitZone() {
    if (!validarPlanoPendenteRestauracaoFitZone()) {
        showWarningModal(
            'O plano de restauração não é mais válido.'
        );
        return false;
    }

    try {
        baixarBackupSegurancaFitZone();
        return true;

    } catch (erro) {
        console.error(
            'Erro ao preparar a cópia de segurança:',
            erro
        );

        showWarningModal(
            'Não foi possível preparar a cópia de segurança. A restauração não será iniciada.'
        );

        return false;
    }
}

/* =========================================
   FITZONE - CONTROLAR CONFIRMACAO DE SEGURANCA
========================================= */

/* =========================================
   FITZONE - VERIFICAR AUTORIZACAO DA RESTAURACAO
========================================= */

function restauracaoAutorizadaFitZone() {
    const confirmacao = document.getElementById(
        'restoreBackupSafetyConfirm'
    );

    if (!confirmacao || !confirmacao.checked) {
        return false;
    }

    return validarPlanoPendenteRestauracaoFitZone();
}

const restoreBackupSafetyCheckbox = document.getElementById(
    'restoreBackupSafetyConfirm'
);

const restoreBackupConfirmButton = document.getElementById(
    'restoreBackupConfirmBtn'
);

if (
    restoreBackupSafetyCheckbox &&
    restoreBackupConfirmButton
) {
    restoreBackupSafetyCheckbox.addEventListener(
        'change',
        () => {
            const autorizado =
                restauracaoAutorizadaFitZone();

            // Libera a confirmação somente com autorização válida.
            restoreBackupConfirmButton.disabled = !autorizado;

            if (autorizado) {
                console.info(
                    'FitZone: restauração autorizada. ' +
                    'Aguardando confirmação do usuário.'
                );
            }
        }
    );
}

/* =========================================
   FITZONE - PREPARAR CONFIRMACAO DA RESTAURACAO
========================================= */

if (restoreBackupConfirmButton) {
    restoreBackupConfirmButton.addEventListener(
        'click',
        () => {
            if (!restauracaoAutorizadaFitZone()) {
                showWarningModal(
                    'A restauração não foi autorizada. Verifique o backup e a confirmação de segurança.'
                );
                return;
            }

            try {
                if (!restoreBackupPendingPlan) {
                    throw new Error(
                        'Nenhum plano de restauração disponível.'
                    );
                }

                const restaurou = aplicarPlanoRestauracaoFitZone(
                    restoreBackupPendingPlan
                );

                if (restaurou) {
                    fecharModalRestauracaoFitZone();

                    alert(
                        'Backup restaurado com sucesso! ' +
                        'A página será atualizada.'
                    );

                    window.location.reload();
                }

            } catch (erro) {
                console.error(
                    'FitZone: falha durante a restauração:',
                    erro
                );

                const mensagemErro =
                    erro instanceof Error ? erro.message : '';

                if (
                    mensagemErro.includes(
                        'alguns dados podem não ter sido recuperados'
                    )
                ) {
                    showWarningModal(
                        'Atenção: a restauração falhou e não foi possível ' +
                        'confirmar a recuperação de todos os dados anteriores. ' +
                        'Não tente restaurar novamente antes de verificar ' +
                        'suas informações e seu arquivo de segurança.'
                    );

                } else if (
                    mensagemErro.includes(
                        'Os valores anteriores foram recuperados'
                    )
                ) {
                    showWarningModal(
                        'A restauração não foi concluída, mas os dados ' +
                        'anteriores foram recuperados. ' +
                        'Nenhuma nova tentativa foi realizada.'
                    );

                } else {
                    showWarningModal(
                        'Não foi possível concluir a restauração. ' +
                        'Seus dados precisam ser verificados antes ' +
                        'de uma nova tentativa.'
                    );
                }
            }
        }
    );
}

const restoreBackupCancelButton = document.getElementById(
    'restoreBackupCancelBtn'
);

if (restoreBackupCancelButton) {
    restoreBackupCancelButton.addEventListener(
        'click',
        fecharModalRestauracaoFitZone
    );
}

/* =========================================
   FITZONE - FECHAR MODAL CLICANDO FORA
========================================= */

const restoreBackupOverlay = document.getElementById(
    'restoreBackupModalOverlay'
);

if (restoreBackupOverlay) {
    restoreBackupOverlay.addEventListener(
        'click',
        (event) => {
            if (event.target === restoreBackupOverlay) {
                fecharModalRestauracaoFitZone();
            }
        }
    );
}

/* =========================================
   FITZONE - FECHAR RESTAURACAO COM ESC
========================================= */

document.addEventListener('keydown', (event) => {
    const modal = document.getElementById(
        'restoreBackupModalOverlay'
    );

    if (
        event.key === 'Escape' &&
        modal &&
        modal.classList.contains('show')
    ) {
        event.preventDefault();

        fecharModalRestauracaoFitZone();
    }
});

/* =========================================
   FITZONE - CONTROLAR TAB NO MODAL
========================================= */

document.addEventListener('keydown', (event) => {
    const modal = document.getElementById(
        'restoreBackupModalOverlay'
    );

    if (
        event.key !== 'Tab' ||
        !modal ||
        !modal.classList.contains('show')
    ) {
        return;
    }

    const elementosFocaveis = Array.from(
        modal.querySelectorAll(
            'input:not(:disabled), button:not(:disabled)'
        )
    ).filter(elemento =>
        !elemento.hidden &&
        elemento.getClientRects().length > 0
    );

    if (elementosFocaveis.length === 0) {
        event.preventDefault();
        return;
    }

    const primeiro = elementosFocaveis[0];
    const ultimo = elementosFocaveis[elementosFocaveis.length - 1];

    if (
        !modal.contains(document.activeElement) ||
        (event.shiftKey && document.activeElement === primeiro)
    ) {
        event.preventDefault();
        (event.shiftKey ? ultimo : primeiro).focus();
    } else if (
        !event.shiftKey &&
        document.activeElement === ultimo
    ) {
        event.preventDefault();
        primeiro.focus();
    }
});

/* =========================================
   FITZONE - MOSTRAR RESUMO DA RESTAURACAO
========================================= */

function mostrarResumoRestauracaoFitZone(plano) {
    const elemento = document.getElementById(
        'restoreBackupSummary'
    );

    if (!elemento) {
        throw new Error(
            'Área de resumo da restauração não encontrada.'
        );
    }

    const resumo = resumirPlanoRestauracaoFitZone(plano);

    const nomes = {
        perfil: 'Perfil',
        fotoPerfil: 'Foto de perfil',
        treinos: 'Treinos',
        historico: 'Histórico',
        progresso: 'Progresso',
        treinoAtivo: 'Treino ativo',
        checkins: 'Check-ins',
        metaMensal: 'Meta mensal'
    };

    const alteradas = resumo.categorias
        .filter(item => item.seraAlterado)
        .map(item => nomes[item.tipo]);

    if (alteradas.length === 0) {
        elemento.textContent =
            'Nenhuma informação será alterada.';
    } else {
        elemento.textContent =
            `${resumo.categoriasAlteradas} de ` +
            `${resumo.totalCategorias} categorias serão alteradas: ` +
            alteradas.join(', ') + '.';
    }

    return resumo;
}

/* =========================================
   FITZONE - SELECIONAR ARQUIVO DE BACKUP
========================================= */

const btnRestaurarBackupFitZone = document.getElementById(
    'btnRestoreWorkoutBackup'
);

const inputArquivoBackupFitZone = document.getElementById(
    'workoutBackupFileInput'
);

if (
    btnRestaurarBackupFitZone &&
    inputArquivoBackupFitZone
) {
    // Permite selecionar um arquivo
    btnRestaurarBackupFitZone.disabled = false;
    inputArquivoBackupFitZone.disabled = false;

    btnRestaurarBackupFitZone.addEventListener(
        'click',
        () => {
            // Limpa a seleção anterior
            inputArquivoBackupFitZone.value = '';

            // Abre o seletor de arquivos
            inputArquivoBackupFitZone.click();
        }
    );
}

/* =========================================
   FITZONE - PROCESSAR ARQUIVO SELECIONADO
========================================= */

if (
    inputArquivoBackupFitZone &&
    btnRestaurarBackupFitZone
) {
    inputArquivoBackupFitZone.addEventListener(
        'change',
        async () => {
            const arquivo =
                inputArquivoBackupFitZone.files?.[0];

            if (!arquivo) {
                return;
            }

            btnRestaurarBackupFitZone.disabled = true;

            try {
                // Lê e valida o arquivo JSON
                const backup =
                    await lerArquivoBackupFitZone(arquivo);

                // Prepara o plano de restauração
                const plano =
                    prepararPlanoRestauracaoFitZone(backup);

                // Confere se o plano está consistente
                if (!verificarPlanoRestauracaoFitZone(plano)) {
                    throw new Error(
                        'O plano de restauração não é válido.'
                    );
                }

                // Abre a janela com o resumo
                abrirModalRestauracaoFitZone(plano);

            } catch (erro) {
                console.warn(
                    'Falha na validação do backup:',
                    erro.message
                );

                showWarningModal(
                    'Não foi possível validar o backup. ' +
                    'Verifique se o arquivo é válido ' +
                    'e pertence à conta atual.'
                );

            } finally {
                inputArquivoBackupFitZone.value = '';
                btnRestaurarBackupFitZone.disabled = false;
            }
        }
    );
}
