
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
   FITZONE - PROTEGER IDENTIDADE DAS OPERACOES
========================================= */

async function obterAcessoVinculadoTreinos() {
    const acessoInicial = acessoInicialTreinosFitZone;

    if (
        !acessoInicial?.id ||
        acessoInicial.autenticado !== true ||
        acessoInicial.origem !== 'supabase' ||
        sessaoTreinosInvalidada
    ) {
        throw new Error('Sessão Supabase inválida.');
    }

    const acessoAtual =
        await identificarAcessoSupabaseTreinos();

    if (
        sessaoTreinosInvalidada ||
        acessoAtual.autenticado !== true ||
        acessoAtual.id !== acessoInicial.id
    ) {
        sessaoTreinosInvalidada = true;
        window.location.replace('login.html');

        throw new Error(
            'A conta foi alterada durante a operação.'
        );
    }

    return acessoInicial;
}

/* =========================================
   FITZONE - TREINO ATIVO NO SUPABASE
========================================= */

async function consultarTreinoAtivoSupabase() {
    const acesso =
        await obterAcessoVinculadoTreinos();

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
            'treino_id, treino_nome, progresso, iniciado_em, atualizado_em'
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
        iniciadoEm: data.iniciado_em,
        atualizadoEm: data.atualizado_em
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
        await obterAcessoVinculadoTreinos();

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
   FITZONE - FINALIZAR TREINO ATOMICAMENTE
========================================= */

async function finalizarTreinoAtomicoSupabase(
    ativo,
    treino,
    dataLocal
) {
    if (
        !ativo ||
        !treino ||
        typeof ativo.id !== 'string' ||
        !ativo.id.trim() ||
        treino.id !== ativo.id ||
        typeof treino.nome !== 'string' ||
        !Array.isArray(treino.exercicios) ||
        !ativo.progresso ||
        typeof ativo.progresso !== 'object' ||
        Array.isArray(ativo.progresso) ||
        typeof ativo.atualizadoEm !== 'string' ||
        !ativo.atualizadoEm ||
        typeof dataLocal !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dataLocal)
    ) {
        throw new Error(
            'Dados inválidos para finalizar o treino.'
        );
    }

    const acesso =
        await obterAcessoVinculadoTreinos();

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error('Supabase indisponível.');
    }

    const { data, error } = await cliente.rpc(
        'fitzone_finalizar_treino',
        {
            p_usuario_id: acesso.id,
            p_treino_id: ativo.id,
            p_data_local: dataLocal,
            p_progresso: ativo.progresso,
            p_iniciado_em: ativo.iniciadoEm ?? null,
            p_atualizado_em: ativo.atualizadoEm,
            p_nome: treino.nome,
            p_exercicios: treino.exercicios
        }
    );

    if (error) {
        if (error.code === '23505') {
            throw new Error(
                'Este treino já foi concluído hoje.'
            );
        }

        throw error;
    }

    if (typeof data !== 'string' || !data.trim()) {
        throw new Error(
            'Não foi possível confirmar a finalização. ' +
            'Atualize a página e confira o histórico.'
        );
    }

    return data;
}

/* =========================================
   FITZONE - CONSULTAR TREINOS NO SUPABASE
========================================= */

async function consultarTreinosBancoSupabase() {

    const acesso =
        await obterAcessoVinculadoTreinos();

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
        !acesso ||
        acesso.autenticado !== true ||
        acesso.origem !== 'supabase'
    ) {
        throw new Error(
            'Sessão inválida para carregar treinos.'
        );
    }

    return await consultarTreinosBancoSupabase();
}

/* =========================================
   FITZONE - SALVAMENTO UNIFICADO DE TREINOS
========================================= */

async function salvarTreinoPorOrigem(acesso, treino) {
    if (
        !acesso ||
        acesso.autenticado !== true ||
        acesso.origem !== 'supabase'
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

    return await salvarTreinoBancoSupabase(treino);
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
        await obterAcessoVinculadoTreinos();

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
        await obterAcessoVinculadoTreinos();

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
        .delete()
        .eq('usuario_id', acesso.id)
        .eq('treino_id', treinoId)
        .select('treino_id');

    if (error) {
        throw error;
    }

    if (!Array.isArray(data) || data.length !== 1) {
        throw new Error(
            'Não foi possível confirmar a exclusão do treino.'
        );
    }

    return true;

}

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
        botaoExcluirTreino.className = 'icon-btn danger';
        botaoExcluirTreino.textContent = '🗑';
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

        if (quantidade === 0) {
            const detalhes = document.createElement('div');

            detalhes.className = 'no-exercises';
            detalhes.textContent =
                'Nenhum exercício adicionado ainda.';

            card.appendChild(detalhes);
        }

        const adicionarExercicio =
            document.createElement('button');

        adicionarExercicio.type = 'button';
        adicionarExercicio.className = 'btn-add-exercise';
        adicionarExercicio.textContent = '+ Adicionar exercício';
        adicionarExercicio.dataset.adicionarExercicioSupabase =
            treino.id;   

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

                const seriesInfo = document.createElement('span');
                seriesInfo.textContent = `${series}x${repeticoes}`;

                const descansoInfo = document.createElement('span');
                descansoInfo.textContent = `${descanso}s`;

                detalhesExercicio.appendChild(seriesInfo);
                detalhesExercicio.appendChild(
                    document.createTextNode(' repetições · ')
                );
                detalhesExercicio.appendChild(descansoInfo);
                detalhesExercicio.appendChild(
                    document.createTextNode(' descanso')
                );

                const tipoExercicio =
                    document.createElement('span');

                const tipoExecucao =
                    exercicio.tipoExecucao || 'individual';

                const tiposExecucao = {
                    individual: 'INDIVIDUAL',
                    bisset: 'BI-SET',
                    triset: 'TRI-SET'
                };

                tipoExercicio.className =
                    `exercise-type-badge ${tipoExecucao}`;

                tipoExercicio.textContent =
                    tiposExecucao[tipoExecucao] || 'INDIVIDUAL';

                informacoes.appendChild(nome);
                informacoes.appendChild(detalhesExercicio);
                informacoes.appendChild(tipoExercicio);

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
                excluirExercicio.className = 'icon-btn danger';
                excluirExercicio.textContent = '🗑';
                excluirExercicio.title = 'Excluir exercício';

                excluirExercicio.setAttribute(
                    'aria-label',
                    'Excluir exercício'
                );

                excluirExercicio.dataset.excluirExercicioSupabase =
                    exercicio.id;

                excluirExercicio.dataset.treinoExercicioSupabase =
                    treino.id;

                const acoesExercicio =
                    document.createElement('div');

                acoesExercicio.className = 'exercise-actions';

                acoesExercicio.append(
                    editarExercicio,
                    excluirExercicio
                );

                linha.append(
                    informacoes,
                    acoesExercicio
                );

                card.appendChild(linha);

            });
        }

        card.appendChild(adicionarExercicio);

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

/* =========================================
   FITZONE - FORMULARIOS SUPABASE
========================================= */

function configurarModalTreinosSupabase({
    modal,
    campoNome,
    contador,
    avisoDuplicado,
    avisoValidacao,
    botaoSalvar,
    botaoCancelar,
    obterItens,
    obterIdEdicao,
    mensagemDuplicado
}) {
    let acionador = null;

    const normalizarNome = texto =>
        String(texto || '')
            .trim()
            .replace(/\s+/g, ' ')
            .toLocaleLowerCase('pt-BR');

    function limparValidacao() {
        if (avisoValidacao) {
            avisoValidacao.hidden = true;
            avisoValidacao.textContent = '';
        }
    }

    function atualizarNome() {
        if (contador) {
            contador.textContent =
                `${campoNome.value.length} / ${campoNome.maxLength} caracteres`;
        }

        const nome = normalizarNome(campoNome.value);
        const itens = obterItens() || [];

        const duplicado = Boolean(
            nome && itens.some(item =>
                item.id !== obterIdEdicao() &&
                normalizarNome(item.nome) === nome
            )
        );

        if (avisoDuplicado) {
            avisoDuplicado.hidden = !duplicado;
            avisoDuplicado.textContent =
                duplicado ? mensagemDuplicado : '';
        }
    }

    modal.querySelectorAll('input, select, textarea')
        .forEach(campo => {
            campo.addEventListener('input', () => {
                campo.classList.remove('input-error');
                campo.removeAttribute('aria-invalid');
                limparValidacao();

                if (campo === campoNome) {
                    atualizarNome();
                }
            });
        });

    campoNome.addEventListener('keydown', evento => {
        if (
            evento.key === 'Enter' &&
            !botaoSalvar.disabled
        ) {
            evento.preventDefault();
            botaoSalvar.click();
        }
    });

    modal.addEventListener('click', evento => {
        if (evento.target === modal) {
            botaoCancelar.click();
        }
    });

    modal.addEventListener('keydown', evento => {
        if (evento.key === 'Escape') {
            evento.preventDefault();
            botaoCancelar.click();
            return;
        }

        if (evento.key !== 'Tab') {
            return;
        }

        const focaveis = Array.from(
            modal.querySelectorAll(
                'input:not(:disabled), button:not(:disabled), ' +
                'select:not(:disabled), textarea:not(:disabled), ' +
                '[tabindex]:not([tabindex="-1"])'
            )
        ).filter(elemento =>
            !elemento.hidden &&
            elemento.getClientRects().length > 0
        );

        if (!focaveis.length) {
            evento.preventDefault();
            return;
        }

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (evento.shiftKey && document.activeElement === primeiro) {
            evento.preventDefault();
            ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
            evento.preventDefault();
            primeiro.focus();
        }
    });

    return {
        abrir(botaoOrigem) {
            acionador = botaoOrigem || document.activeElement;

            modal.querySelectorAll('input, select, textarea')
                .forEach(campo => {
                    campo.classList.remove('input-error');
                    campo.removeAttribute('aria-invalid');
                });

            limparValidacao();
            atualizarNome();

            modal.classList.add('show');
            campoNome.focus();
        },

        fechar() {
            modal.classList.remove('show');

            if (acionador?.isConnected) {
                acionador.focus();
            }

            acionador = null;
        }
    };
}

function calDateKey(year, month, day) {
    const formattedMonth =
        String(month + 1).padStart(2, '0');

    const formattedDay =
        String(day).padStart(2, '0');

    return `${year}-${formattedMonth}-${formattedDay}`;
}

/* =========================================
   FITZONE - VERIFICAR ORIGEM DO ACESSO
========================================= */

async function verificarOrigemAcessoTreinos() {
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
    const acesso = await obterAcessoVinculadoTreinos();

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
   FITZONE - CONFERIR SESSAO SUPABASE
========================================= */

async function conferirSessaoHibridaTreinos(
    acessoInicial
) {
    if (
        !acessoInicial ||
        acessoInicial.autenticado !== true ||
        acessoInicial.origem !== 'supabase' ||
        !acessoInicial.id
    ) {
        return false;
    }

    return await verificarContinuidadeSupabaseTreinos(
        acessoInicial.id
    );
}

/* =========================================
   FITZONE - IDENTIDADE INICIAL DA PAGINA
========================================= */

let acessoInicialTreinosFitZone = null;
let sessaoTreinosInvalidada = false;

/* =========================================
   FITZONE - MONITORAR AUTENTICACAO SUPABASE
========================================= */

function monitorarSessaoSupabaseTreinos() {
    const cliente =
        inicializarSupabaseFitZone();

    if (!cliente) {
        return;
    }

    cliente.auth.onAuthStateChange(
        (evento, sessaoAtual) => {
            if (!acessoInicialTreinosFitZone) {
                return;
            }

            const idUsuarioAtual =
                sessaoAtual?.user?.id;

            if (
                evento === 'SIGNED_OUT' ||
                (
                    evento === 'SIGNED_IN' &&
                    idUsuarioAtual !==
                        acessoInicialTreinosFitZone.id
                )
            ) {
                sessaoTreinosInvalidada = true;

                window.location.replace('login.html');
            }
        }
    );
}

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
            acessoPagina =
                await verificarOrigemAcessoTreinos();

            if (
                navigator.onLine === false &&
                acessoPagina?.autenticado !== true
            ) {
                throw new Error(
                    'Sem conexão para validar a conta Supabase.'
                );
            }

        } catch (erro) {
            console.error(
                'Erro ao identificar a sessão:',
                erro
            );

            if (navigator.onLine === false) {
                const avisoOffline = document.createElement('main');

                avisoOffline.style.cssText =
                    'min-height:100vh;' +
                    'display:flex;' +
                    'flex-direction:column;' +
                    'align-items:center;' +
                    'justify-content:center;' +
                    'gap:16px;' +
                    'padding:24px;' +
                    'text-align:center;';

                const titulo = document.createElement('h1');
                titulo.textContent = 'FITZONE';

                const mensagem = document.createElement('p');
                mensagem.textContent =
                    'Você está sem internet. ' +
                    'Não foi possível verificar sua conta Supabase.';

                const orientacao = document.createElement('p');
                orientacao.textContent =
                    'Conecte-se à internet para continuar.';

                const botao = document.createElement('button');
                botao.type = 'button';
                botao.textContent = 'Tentar novamente';

                botao.addEventListener('click', () => {
                    window.location.reload();
                });

                avisoOffline.append(
                    titulo,
                    mensagem,
                    orientacao,
                    botao
                );

                document.body.replaceChildren(avisoOffline);
                return;
            }

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
            acessoInicialTreinosFitZone = Object.freeze({
                ...acessoPagina
            });

            monitorarSessaoSupabaseTreinos();

            /* =========================================
               TEMA TREINOS SUPABASE - NUVEM
            ========================================= */

            await sincronizarTemaSupabaseFitZone();

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

            /* =========================================
               BACKUP DE TREINOS SUPABASE V1
            ========================================= */

            const botaoBackupSupabase =
                document.createElement('button');

            botaoBackupSupabase.type = 'button';
            botaoBackupSupabase.className =
                'btn-export-backup';

            botaoBackupSupabase.textContent =
                'Exportar backup';

            botaoBackupSupabase.style.cssText =
                'display:block;' +
                'margin:16px 0;' +
                'padding:12px 18px;' +
                'cursor:pointer;';

            painel.insertBefore(
                botaoBackupSupabase,
                lista
            );

            /* =========================================
               CONSULTAR REGISTROS PARA BACKUP
            ========================================= */

            async function consultarRegistrosBackupSupabase(
                cliente,
                tabela,
                usuarioId,
                colunaOrdenacao
            ) {
                const registros = [];
                const tamanhoPagina = 500;

                let inicio = 0;

                while (true) {
                    const { data, error } = await cliente
                        .from(tabela)
                        .select('*')
                        .eq('usuario_id', usuarioId)
                        .order(colunaOrdenacao, {
                            ascending: true
                        })
                        .range(
                            inicio,
                            inicio + tamanhoPagina - 1
                        );

                    if (error) {
                        throw error;
                    }

                    registros.push(...(data || []));

                    if (!data || data.length < tamanhoPagina) {
                        break;
                    }

                    inicio += tamanhoPagina;
                }

                return registros;
            }

            /* =========================================
               GERAR BACKUP SUPABASE
            ========================================= */

            botaoBackupSupabase.addEventListener(
                'click',
                async () => {
                    botaoBackupSupabase.disabled = true;

                    const textoOriginal =
                        botaoBackupSupabase.textContent;

                    botaoBackupSupabase.textContent =
                        'Preparando backup...';

                    try {
                        const identidade =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidade ||
                            identidade.id !== acessoPagina.id
                        ) {
                            throw new Error(
                                'Sessão Supabase inválida.'
                            );
                        }

                        const cliente =
                            inicializarSupabaseFitZone();

                        if (!cliente) {
                            throw new Error(
                                'Supabase indisponível.'
                            );
                        }

                        const treinos =
                            await consultarRegistrosBackupSupabase(
                                cliente,
                                'fitzone_treinos',
                                identidade.id,
                                'treino_id'
                            );

                        const historico =
                            await consultarRegistrosBackupSupabase(
                                cliente,
                                'fitzone_historico_treinos',
                                identidade.id,
                                'id'
                            );

                        const { data: treinoAtivo, error } =
                            await cliente
                                .from('fitzone_treino_ativo')
                                .select('*')
                                .eq('usuario_id', identidade.id)
                                .maybeSingle();

                        if (error) {
                            throw error;
                        }

                        const identidadeFinal =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidadeFinal ||
                            identidadeFinal.id !== identidade.id
                        ) {
                            throw new Error(
                                'A conta foi alterada durante o backup.'
                            );
                        }

                        const backup = {
                            aplicativo: 'FitZone',
                            origem: 'supabase',
                            versaoBackup: 1,
                            tipo: 'treinos-historico',
                            exportadoEm:
                                new Date().toISOString(),
                            usuarioId: identidade.id,
                            dados: {
                                treinos,
                                historico,
                                treinoAtivo
                            }
                        };

                        const conteudo = JSON.stringify(
                            backup,
                            null,
                            2
                        );

                        const arquivo = new Blob(
                            [conteudo],
                            {
                                type:
                                    'application/json;charset=utf-8'
                            }
                        );

                        const url =
                            URL.createObjectURL(arquivo);

                        const link =
                            document.createElement('a');

                        const data =
                            new Date().toISOString().slice(0, 10);

                        link.href = url;

                        link.download =
                            `fitzone-supabase-treinos-${data}.json`;

                        document.body.appendChild(link);
                        link.click();
                        link.remove();

                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                        }, 1000);

                        alert(
                            'Backup de treinos Supabase ' +
                            'exportado com sucesso!'
                        );

                    } catch (erro) {
                        console.error(
                            'Erro ao exportar backup Supabase:',
                            erro
                        );

                        alert(
                            'Não foi possível exportar o backup. ' +
                            'Confira sua conexão e tente novamente.'
                        );

                    } finally {
                        botaoBackupSupabase.disabled = false;
                        botaoBackupSupabase.textContent =
                            textoOriginal;
                    }
                }
            );

            /* =========================================
               VALIDAR BACKUP SUPABASE V1
               SOMENTE LEITURA
            ========================================= */

            const botaoValidarBackupSupabase =
                document.createElement('button');

            botaoValidarBackupSupabase.type = 'button';
            botaoValidarBackupSupabase.className =
                'btn-export-backup';

            botaoValidarBackupSupabase.textContent =
                'Restaurar backup';

            botaoValidarBackupSupabase.style.cssText =
                'display:block;' +
                'margin:8px 0 16px;' +
                'padding:12px 18px;' +
                'cursor:pointer;';

            const campoArquivoBackupSupabase =
                document.createElement('input');

            campoArquivoBackupSupabase.type = 'file';
            campoArquivoBackupSupabase.accept =
                '.json,application/json';

            campoArquivoBackupSupabase.hidden = true;

            const resultadoBackupSupabase =
                document.createElement('div');

            resultadoBackupSupabase.setAttribute(
                'role',
                'status'
            );

            resultadoBackupSupabase.setAttribute(
                'aria-live',
                'polite'
            );

            resultadoBackupSupabase.style.cssText =
                'margin:8px 0 16px;' +
                'padding:12px;' +
                'border:1px solid currentColor;' +
                'border-radius:8px;' +
                'white-space:pre-line;';

            resultadoBackupSupabase.hidden = true;

            painel.insertBefore(
                botaoValidarBackupSupabase,
                lista
            );

            painel.insertBefore(
                campoArquivoBackupSupabase,
                lista
            );

            painel.insertBefore(
                resultadoBackupSupabase,
                lista
            );

            /* =========================================
               RESTAURAR TREINOS AUSENTES SUPABASE V1
            ========================================= */

            let backupValidadoParaRestauracao = null;

            const botaoRestaurarTreinosSupabase =
                document.createElement('button');

            botaoRestaurarTreinosSupabase.type = 'button';
            botaoRestaurarTreinosSupabase.className =
                'btn-export-backup';

            botaoRestaurarTreinosSupabase.textContent =
                'Restaurar treinos ausentes';

            botaoRestaurarTreinosSupabase.disabled = true;

            botaoRestaurarTreinosSupabase.style.cssText =
                'display:block;' +
                'margin:8px 0 16px;' +
                'padding:12px 18px;' +
                'cursor:pointer;';

            painel.insertBefore(
                botaoRestaurarTreinosSupabase,
                lista
            );

            /* =========================================
               RESTAURACAO DO HISTORICO SUPABASE V1
               PREPARACAO - SOMENTE LEITURA
            ========================================= */

            const botaoRestaurarHistoricoSupabase =
                document.createElement('button');

            botaoRestaurarHistoricoSupabase.type = 'button';
            botaoRestaurarHistoricoSupabase.className =
                'btn-export-backup';

            botaoRestaurarHistoricoSupabase.textContent =
                'Restaurar histórico ausente';

            botaoRestaurarHistoricoSupabase.disabled = true;

            botaoRestaurarHistoricoSupabase.title =
                'A recuperação do histórico ainda está em preparação.';

            botaoRestaurarHistoricoSupabase.style.cssText =
                'display:block;' +
                'margin:8px 0 16px;' +
                'padding:12px 18px;' +
                'cursor:pointer;';

            painel.insertBefore(
                botaoRestaurarHistoricoSupabase,
                lista
            );

            /* =========================================
               RESTAURAR TREINO ATIVO SUPABASE V1
            ========================================= */

            const botaoRestaurarAtivoSupabase =
                document.createElement('button');

            botaoRestaurarAtivoSupabase.type = 'button';
            botaoRestaurarAtivoSupabase.className =
                'btn-export-backup';

            botaoRestaurarAtivoSupabase.textContent =
                'Restaurar treino em andamento';

            botaoRestaurarAtivoSupabase.disabled = true;

            botaoRestaurarAtivoSupabase.style.cssText =
                'display:block;' +
                'margin:8px 0 16px;' +
                'padding:12px 18px;' +
                'cursor:pointer;';

            painel.insertBefore(
                botaoRestaurarAtivoSupabase,
                lista
            );

            /* =========================================
               FITZONE - GERENCIADOR DE BACKUPS SUPABASE
            ========================================= */

            const gerenciadorBackupSupabase =
                document.createElement('details');

            gerenciadorBackupSupabase.className =
                'fitzone-backup-manager';

            const tituloBackupSupabase =
                document.createElement('summary');

            tituloBackupSupabase.textContent =
                'Gerenciar backups';

            const conteudoBackupSupabase =
                document.createElement('div');

            conteudoBackupSupabase.className =
                'fitzone-backup-content';

            const acoesBackupSupabase =
                document.createElement('div');

            acoesBackupSupabase.className =
                'workout-backup-actions';

            acoesBackupSupabase.append(
                botaoBackupSupabase,
                botaoValidarBackupSupabase,
                botaoRestaurarTreinosSupabase,
                botaoRestaurarHistoricoSupabase,
                botaoRestaurarAtivoSupabase,
                campoArquivoBackupSupabase
            );

            [
                botaoBackupSupabase,
                botaoValidarBackupSupabase,
                botaoRestaurarTreinosSupabase,
                botaoRestaurarHistoricoSupabase,
                botaoRestaurarAtivoSupabase
            ].forEach(botao => {
                botao.style.margin = '0';
                botao.style.width = '100%';
            });

            conteudoBackupSupabase.append(
                acoesBackupSupabase,
                resultadoBackupSupabase
            );

            gerenciadorBackupSupabase.append(
                tituloBackupSupabase,
                conteudoBackupSupabase
            );

            painel.insertBefore(
                gerenciadorBackupSupabase,
                lista
            );

            /* =========================================
               VERIFICAR ESTRUTURA DO ARQUIVO
            ========================================= */

            function validarEstruturaBackupSupabase(backup) {
                const objetoValido = valor =>
                    valor !== null &&
                    typeof valor === 'object' &&
                    !Array.isArray(valor);

                if (!objetoValido(backup)) {
                    throw new Error(
                        'O arquivo não contém um backup válido.'
                    );
                }

                if (
                    backup.aplicativo !== 'FitZone' ||
                    backup.origem !== 'supabase' ||
                    backup.versaoBackup !== 1 ||
                    backup.tipo !== 'treinos-historico'
                ) {
                    throw new Error(
                        'Formato ou versão do backup incompatível.'
                    );
                }

                if (
                    typeof backup.usuarioId !== 'string' ||
                    !backup.usuarioId.trim()
                ) {
                    throw new Error(
                        'O backup não possui identificação válida.'
                    );
                }

                if (
                    typeof backup.exportadoEm !== 'string' ||
                    !Number.isFinite(
                        Date.parse(backup.exportadoEm)
                    )
                ) {
                    throw new Error(
                        'Data de exportação inválida.'
                    );
                }

                if (
                    !objetoValido(backup.dados) ||
                    !Array.isArray(backup.dados.treinos) ||
                    !Array.isArray(backup.dados.historico) ||
                    (
                        backup.dados.treinoAtivo !== null &&
                        !objetoValido(
                            backup.dados.treinoAtivo
                        )
                    )
                ) {
                    throw new Error(
                        'As seções do backup estão incompletas.'
                    );
                }

                const idsTreinos = new Set();

                for (const treino of backup.dados.treinos) {
                    if (
                        !objetoValido(treino) ||
                        typeof treino.treino_id !== 'string' ||
                        !treino.treino_id.trim() ||
                        !objetoValido(treino.dados) ||
                        typeof treino.dados.nome !== 'string' ||
                        !treino.dados.nome.trim() ||
                        !Array.isArray(treino.dados.exercicios)
                    ) {
                        throw new Error(
                            'Foi encontrado um treino inválido.'
                        );
                    }

                    if (idsTreinos.has(treino.treino_id)) {
                        throw new Error(
                            'O backup contém treinos duplicados.'
                        );
                    }

                    idsTreinos.add(treino.treino_id);
                }

                const idsHistoricoBackup = new Set();

                for (const registro of backup.dados.historico) {

                    const identificador = registro?.id;

                    const idValido =
                        (
                            typeof identificador === 'string' &&
                            (
                                /^[0-9]+$/.test(identificador) ||
                                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                                    identificador
                                )
                            )
                        ) ||
                        (
                            typeof identificador === 'number' &&
                            Number.isSafeInteger(identificador) &&
                            identificador > 0
                        );

                    if (
                        !objetoValido(registro) ||
                        !idValido ||
                        typeof registro.treino_id !== 'string' ||
                        !registro.treino_id.trim() ||
                        !objetoValido(registro.dados)
                    ) {
                        throw new Error(
                            'Foi encontrado um registro de histórico inválido.'
                        );
                    }

                    const idHistorico = String(registro.id);

                    if (idsHistoricoBackup.has(idHistorico)) {
                        throw new Error(
                            'O backup contém históricos duplicados.'
                        );
                    }

                    idsHistoricoBackup.add(idHistorico);
                }

                const ativo = backup.dados.treinoAtivo;

                if (
                    ativo !== null &&
                    (
                        typeof ativo.treino_id !== 'string' ||
                        !ativo.treino_id.trim() ||
                        !objetoValido(ativo.progresso)
                    )
                ) {
                    throw new Error(
                        'Os dados do treino ativo são inválidos.'
                    );
                }

                return {
                    treinos: backup.dados.treinos.length,
                    historico: backup.dados.historico.length,
                    treinoAtivo: ativo !== null
                };
            }

            /* =========================================
               SELECIONAR ARQUIVO JSON
            ========================================= */

            botaoValidarBackupSupabase.addEventListener(
                'click',
                () => {
                    campoArquivoBackupSupabase.value = '';
                    campoArquivoBackupSupabase.click();
                }
            );

            /* =========================================
               ANALISAR BACKUP SEM ALTERAR O BANCO
            ========================================= */

            campoArquivoBackupSupabase.addEventListener(
                'change',
                async () => {
                    const arquivo =
                        campoArquivoBackupSupabase.files?.[0];

                    if (!arquivo) {
                        return;
                    }

                    backupValidadoParaRestauracao = null;
                    botaoRestaurarTreinosSupabase.disabled = true;
                    botaoRestaurarHistoricoSupabase.disabled = true;
                    botaoRestaurarAtivoSupabase.disabled = true;
                    botaoValidarBackupSupabase.disabled = true;

                    resultadoBackupSupabase.hidden = false;
                    resultadoBackupSupabase.textContent =
                        'Analisando arquivo de backup...';

                    try {
                        if (arquivo.size > 15 * 1024 * 1024) {
                            throw new Error(
                                'O arquivo ultrapassa o limite ' +
                                'de 15 MB para validação.'
                            );
                        }

                        const conteudo = await arquivo.text();
                        const backup = JSON.parse(conteudo);

                        const resumo =
                            validarEstruturaBackupSupabase(
                                backup
                            );

                        const identidade =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidade ||
                            identidade.id !== acessoPagina.id
                        ) {
                            throw new Error(
                                'A sessão Supabase foi alterada.'
                            );
                        }

                        if (
                            backup.usuarioId !== identidade.id
                        ) {
                            throw new Error(
                                'Este backup pertence a outra ' +
                                'conta Supabase.'
                            );
                        }

                        const dataExportacao =
                            new Date(
                                backup.exportadoEm
                            ).toLocaleString('pt-BR');

                        /* =========================================
                           COMPARAR BACKUP COM O BANCO
                           SOMENTE LEITURA - V2
                        ========================================= */

                        const clienteComparacao =
                            inicializarSupabaseFitZone();

                        if (!clienteComparacao) {
                            throw new Error(
                                'Supabase indisponível para comparação.'
                            );
                        }

                        const treinosExistentes =
                            await consultarRegistrosBackupSupabase(
                                clienteComparacao,
                                'fitzone_treinos',
                                identidade.id,
                                'treino_id'
                            );

                        const historicoExistente =
                            await consultarRegistrosBackupSupabase(
                                clienteComparacao,
                                'fitzone_historico_treinos',
                                identidade.id,
                                'id'
                            );

                        const {
                            data: ativoExistente,
                            error: erroAtivoExistente
                        } = await clienteComparacao
                            .from('fitzone_treino_ativo')
                            .select('treino_id')
                            .eq('usuario_id', identidade.id)
                            .maybeSingle();

                        if (erroAtivoExistente) {
                            throw erroAtivoExistente;
                        }

                        const identidadeFinalComparacao =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidadeFinalComparacao ||
                            identidadeFinalComparacao.id !==
                                identidade.id
                        ) {
                            throw new Error(
                                'A sessão mudou durante a comparação.'
                            );
                        }

                        /* =========================================
                           ANALISE DE CONFLITOS DE CONTEUDO
                        ========================================= */

                        function normalizarDadosComparacao(valor) {
                            if (Array.isArray(valor)) {
                                return valor.map(
                                    normalizarDadosComparacao
                                );
                            }

                            if (
                                valor !== null &&
                                typeof valor === 'object'
                            ) {
                                const normalizado = {};

                                Object.keys(valor)
                                    .sort()
                                    .forEach(chave => {
                                        normalizado[chave] =
                                            normalizarDadosComparacao(
                                                valor[chave]
                                            );
                                    });

                                return normalizado;
                            }

                            return valor;
                        }

                        function dadosIguaisBackup(a, b) {
                            return JSON.stringify(
                                normalizarDadosComparacao(a)
                            ) === JSON.stringify(
                                normalizarDadosComparacao(b)
                            );
                        }

                        const mapaTreinosAtuais = new Map(
                            treinosExistentes.map(
                                treino => [
                                    treino.treino_id,
                                    treino
                                ]
                            )
                        );

                        const mapaHistoricoAtual = new Map(
                            historicoExistente.map(
                                registro => [
                                    String(registro.id),
                                    registro
                                ]
                            )
                        );

                        let treinosNovos = 0;
                        let treinosIdenticos = 0;
                        let treinosDivergentes = 0;

                        for (const treino of backup.dados.treinos) {
                            const atual = mapaTreinosAtuais.get(
                                treino.treino_id
                            );

                            if (!atual) {
                                treinosNovos++;
                            } else if (
                                dadosIguaisBackup(
                                    treino.dados,
                                    atual.dados
                                )
                            ) {
                                treinosIdenticos++;
                            } else {
                                treinosDivergentes++;
                            }
                        }

                        let historicosNovos = 0;
                        let historicosIdenticos = 0;
                        let historicosDivergentes = 0;

                        for (const registro of backup.dados.historico) {
                            const atual = mapaHistoricoAtual.get(
                                String(registro.id)
                            );

                            if (!atual) {
                                historicosNovos++;
                                continue;
                            }

                            const camposBackup = {
                                treino_id: registro.treino_id,
                                data_local: registro.data_local,
                                dados: registro.dados,
                                concluido_em: registro.concluido_em
                            };

                            const camposAtuais = {
                                treino_id: atual.treino_id,
                                data_local: atual.data_local,
                                dados: atual.dados,
                                concluido_em: atual.concluido_em
                            };

                            if (
                                dadosIguaisBackup(
                                    camposBackup,
                                    camposAtuais
                                )
                            ) {
                                historicosIdenticos++;
                            } else {
                                historicosDivergentes++;
                            }
                        }

                        /* =========================================
                           HISTORICOS RECUPERAVEIS - V1
                           VERIFICAR ID, TREINO E DATA
                        ========================================= */

                        function chaveConclusaoHistorico(registro) {
                            return JSON.stringify([
                                registro.treino_id,
                                registro.data_local
                            ]);
                        }

                        const idsHistoricosAtuais = new Set(
                            historicoExistente.map(
                                registro => String(registro.id)
                            )
                        );

                        const conclusoesAtuais = new Set(
                            historicoExistente.map(
                                chaveConclusaoHistorico
                            )
                        );

                        const conclusoesBackup = new Set();

                        let historicosRecuperaveis = 0;
                        let historicosProtegidos = 0;

                        for (const registro of backup.dados.historico) {
                            if (
                                registro.usuario_id !== identidade.id ||
                                typeof registro.data_local !== 'string' ||
                                !/^\d{4}-\d{2}-\d{2}$/.test(
                                    registro.data_local
                                ) ||
                                typeof registro.concluido_em !== 'string' ||
                                !Number.isFinite(
                                    Date.parse(registro.concluido_em)
                                )
                            ) {
                                throw new Error(
                                    'O backup contém um histórico ' +
                                    'com conta ou data inválida.'
                                );
                            }

                            const chave =
                                chaveConclusaoHistorico(registro);

                            if (conclusoesBackup.has(chave)) {
                                throw new Error(
                                    'O backup possui mais de uma ' +
                                    'conclusão para o mesmo treino e dia.'
                                );
                            }

                            conclusoesBackup.add(chave);

                            if (
                                idsHistoricosAtuais.has(
                                    String(registro.id)
                                ) ||
                                conclusoesAtuais.has(chave)
                            ) {
                                historicosProtegidos++;
                            } else {
                                historicosRecuperaveis++;
                            }
                        }

                        const resumoComparacao =
                            '\n\nCOMPARAÇÃO COM O SUPABASE\n' +
                            '\nTREINOS\n' +
                            'Novos: ' + treinosNovos +
                            '\nIdênticos: ' + treinosIdenticos +
                            '\nDivergentes: ' + treinosDivergentes +
                            '\n\nHISTÓRICO\n' +
                            'Novos: ' + historicosNovos +
                            '\nIdênticos: ' + historicosIdenticos +
                            '\nDivergentes: ' +
                            historicosDivergentes +
                            '\n\nTREINO ATIVO\n' +
                            'Existe no banco: ' +
                            (ativoExistente ? 'Sim' : 'Não') +
                            '\nExiste no backup: ' +
                            (
                                backup.dados.treinoAtivo
                                    ? 'Sim'
                                    : 'Não'
                            ) +
                            '\n\nRegistros divergentes exigem ' +
                            'tratamento antes da restauração.';

                        /* =========================================
                           CONFERIR IDENTIDADE DOS REGISTROS
                        ========================================= */

                        for (const treino of backup.dados.treinos) {
                            if (
                                treino.usuario_id !== identidade.id ||
                                treino.dados.id !== treino.treino_id
                            ) {
                                throw new Error(
                                    'O backup possui um treino com ' +
                                    'identificação inconsistente.'
                                );
                            }
                        }

                        /* =========================================
                           VERIFICAR TREINO ATIVO RECUPERAVEL
                        ========================================= */

                        const ativoBackup =
                            backup.dados.treinoAtivo;

                        const treinoAtivoDisponivel =
                            ativoBackup !== null &&
                            treinosExistentes.some(
                                treino =>
                                    treino.treino_id ===
                                    ativoBackup.treino_id
                            );

                        const ativoRecuperavel =
                            ativoBackup !== null &&
                            !ativoExistente &&
                            treinoAtivoDisponivel;

                        botaoRestaurarAtivoSupabase.disabled =
                            !ativoRecuperavel;

                        backupValidadoParaRestauracao = backup;

                        botaoRestaurarTreinosSupabase.disabled =
                            treinosNovos === 0;

                        botaoRestaurarHistoricoSupabase.disabled =
                            historicosRecuperaveis === 0;

                        botaoRestaurarHistoricoSupabase.title =
                            historicosRecuperaveis > 0
                                ? 'Recuperar históricos ausentes'
                                : 'Nenhum histórico ausente.';

                        resultadoBackupSupabase.textContent =
                            '✓ Estrutura inicial validada\n\n' +
                            `Arquivo: ${arquivo.name}\n` +
                            `Exportado em: ${dataExportacao}\n` +
                            `Treinos: ${resumo.treinos}\n` +
                            `Histórico: ${resumo.historico}\n` +
                            'Treino ativo: ' +
                            (
                                resumo.treinoAtivo
                                    ? 'Sim'
                                    : 'Não'
                            ) +

                            resumoComparacao +
                            '\n\nTreinos recuperáveis: ' +
                            treinosNovos +
                            '\n\nRESTAURAÇÃO DO HISTÓRICO\n' +
                            'Históricos recuperáveis: ' +
                            historicosRecuperaveis +
                            '\nHistóricos protegidos: ' +
                            historicosProtegidos +                           
                            '\n\nRESTAURAÇÃO DO TREINO ATIVO\n' +
                            'Treino ativo recuperável: ' +
                            (ativoRecuperavel ? 'Sim' : 'Não') +
                            '\n' +
                            '\n\nComparação concluída. ' +
                            'Nenhum dado foi alterado nesta análise. ' +
                            'A restauração pode ser iniciada ' +
                            'somente para históricos ausentes.';

                    } catch (erro) {
                        console.error(
                            'Erro ao validar backup Supabase:',
                            erro
                        );

                        resultadoBackupSupabase.textContent =
                            '✕ Não foi possível validar o backup.\n' +
                            erro.message +
                            '\n\nNenhum dado foi alterado.';

                    } finally {
                        botaoValidarBackupSupabase.disabled = false;
                        campoArquivoBackupSupabase.value = '';
                    }
                }
            );

            /* =========================================
               RESTAURACAO PROTEGIDA DE TREINOS
               SOMENTE REGISTROS AUSENTES
            ========================================= */

            botaoRestaurarTreinosSupabase.addEventListener(
                'click',
                async () => {
                    const backup =
                        backupValidadoParaRestauracao;

                    if (!backup) {
                        alert(
                            'Valide um backup antes de restaurar.'
                        );
                        return;
                    }

                    botaoRestaurarTreinosSupabase.disabled = true;
                    botaoValidarBackupSupabase.disabled = true;

                    try {
                        validarEstruturaBackupSupabase(backup);

                        const identidade =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidade ||
                            identidade.id !== acessoPagina.id ||
                            backup.usuarioId !== identidade.id
                        ) {
                            throw new Error(
                                'O backup não pertence à conta atual.'
                            );
                        }

                        const cliente =
                            inicializarSupabaseFitZone();

                        if (!cliente) {
                            throw new Error(
                                'Supabase indisponível.'
                            );
                        }

                        async function obterTreinosAusentes() {
                            const atuais =
                                await consultarRegistrosBackupSupabase(
                                    cliente,
                                    'fitzone_treinos',
                                    identidade.id,
                                    'treino_id'
                                );

                            const idsAtuais = new Set(
                                atuais.map(
                                    treino => treino.treino_id
                                )
                            );

                            return backup.dados.treinos.filter(
                                treino =>
                                    !idsAtuais.has(treino.treino_id)
                            );
                        }

                        const ausentes =
                            await obterTreinosAusentes();

                        if (ausentes.length === 0) {
                            alert(
                                'Todos os treinos do backup ' +
                                'já existem no Supabase.'
                            );
                            return;
                        }

                        if (ausentes.length > 200) {
                            throw new Error(
                                'Este backup possui mais de 200 ' +
                                'treinos ausentes. A restauração ' +
                                'em lote exige tratamento adicional.'
                            );
                        }

                        for (const treino of ausentes) {
                            if (
                                treino.usuario_id !== identidade.id ||
                                treino.dados?.id !== treino.treino_id
                            ) {
                                throw new Error(
                                    'Foi encontrado um treino ' +
                                    'com identificação inválida.'
                                );
                            }
                        }

                        const confirmar = window.confirm(
                            `Foram encontrados ${ausentes.length} ` +
                            'treino(s) ausente(s).\n\n' +
                            'Deseja recuperar esses treinos?\n\n' +
                            'Os treinos existentes, o histórico ' +
                            'e o treino ativo serão preservados.'
                        );

                        if (!confirmar) {
                            return;
                        }

                        const identidadeFinal =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidadeFinal ||
                            identidadeFinal.id !== identidade.id
                        ) {
                            throw new Error(
                                'A sessão mudou durante a restauração.'
                            );
                        }

                        const novosConfirmados =
                            await obterTreinosAusentes();

                        const idsConfirmados = new Set(
                            novosConfirmados.map(
                                treino => treino.treino_id
                            )
                        );

                        const registrosParaInserir =
                            ausentes.filter(
                                treino =>
                                    idsConfirmados.has(
                                        treino.treino_id
                                    )
                            );

                        if (registrosParaInserir.length === 0) {
                            alert(
                                'Os treinos já foram recuperados ' +
                                'ou cadastrados em outra sessão.'
                            );
                            return;
                        }

                        const registros = registrosParaInserir.map(
                            treino => ({
                                usuario_id: identidade.id,
                                treino_id: treino.treino_id,
                                dados: treino.dados,
                                atualizado_em:
                                    treino.atualizado_em ||
                                    new Date().toISOString()
                            })
                        );

                        await obterAcessoVinculadoTreinos();

                        const { error } = await cliente
                            .from('fitzone_treinos')
                            .insert(registros);

                        if (error) {
                            throw error;
                        }

                        alert(
                            `${registros.length} treino(s) ` +
                            'recuperado(s) com sucesso!\n\n' +
                            'A página será atualizada.'
                        );

                        window.location.reload();

                    } catch (erro) {
                        console.error(
                            'Erro na restauração Supabase:',
                            erro
                        );

                        alert(
                            'Não foi possível concluir a restauração.\n' +
                            erro.message +
                            '\n\nConfira os dados atuais antes ' +
                            'de tentar novamente.'
                        );

                    } finally {
                        backupValidadoParaRestauracao = null;
                        botaoRestaurarTreinosSupabase.disabled = true;
                        botaoValidarBackupSupabase.disabled = false;
                    }
                }
            );

            /* =========================================
               FITZONE - RESTAURAR HISTORICO SUPABASE V2
               SOMENTE CONCLUSOES AUSENTES
            ========================================= */

            botaoRestaurarHistoricoSupabase.addEventListener(
                'click',
                async () => {
                    const backup =
                        backupValidadoParaRestauracao;

                    if (!backup) {
                        alert('Valide o backup novamente.');
                        return;
                    }

                    botaoRestaurarHistoricoSupabase.disabled = true;
                    botaoRestaurarTreinosSupabase.disabled = true;
                    botaoValidarBackupSupabase.disabled = true;

                    let recuperados = 0;

                    try {
                        validarEstruturaBackupSupabase(backup);

                        const identidade =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidade ||
                            identidade.id !== acessoPagina.id ||
                            backup.usuarioId !== identidade.id
                        ) {
                            throw new Error(
                                'A sessão não corresponde ao backup.'
                            );
                        }

                        const cliente =
                            inicializarSupabaseFitZone();

                        if (!cliente) {
                            throw new Error(
                                'Supabase indisponível.'
                            );
                        }

                        function chaveHistorico(registro) {
                            return JSON.stringify([
                                registro.treino_id,
                                registro.data_local
                            ]);
                        }

                        /* VALIDAR TODOS OS REGISTROS ANTES */

                        const chavesBackup = new Set();

                        for (const registro of backup.dados.historico) {
                            const chave = chaveHistorico(registro);

                            if (
                                registro.usuario_id !== identidade.id ||
                                typeof registro.treino_id !== 'string' ||
                                !registro.treino_id.trim() ||
                                typeof registro.data_local !== 'string' ||
                                !/^\d{4}-\d{2}-\d{2}$/.test(
                                    registro.data_local
                                ) ||
                                typeof registro.concluido_em !== 'string' ||
                                !Number.isFinite(
                                    Date.parse(registro.concluido_em)
                                ) ||
                                !registro.dados ||
                                typeof registro.dados !== 'object' ||
                                Array.isArray(registro.dados) ||
                                chavesBackup.has(chave)
                            ) {
                                throw new Error(
                                    'O backup contém históricos inválidos ' +
                                    'ou conclusões duplicadas.'
                                );
                            }

                            chavesBackup.add(chave);
                        }

                        /* CONSULTAR DADOS ATUAIS */

                        async function consultarAusentes() {
                            const atuais =
                                await consultarRegistrosBackupSupabase(
                                    cliente,
                                    'fitzone_historico_treinos',
                                    identidade.id,
                                    'id'
                                );

                            const ids = new Set(
                                atuais.map(
                                    registro => String(registro.id)
                                )
                            );

                            const conclusoes = new Set(
                                atuais.map(chaveHistorico)
                            );

                            return backup.dados.historico.filter(
                                registro =>
                                    !ids.has(String(registro.id)) &&
                                    !conclusoes.has(
                                        chaveHistorico(registro)
                                    )
                            );
                        }

                        const ausentes =
                            await consultarAusentes();

                        if (ausentes.length === 0) {
                            alert(
                                'Todos os históricos desse backup ' +
                                'já estão protegidos no Supabase.'
                            );
                            return;
                        }

                        if (ausentes.length > 100) {
                            throw new Error(
                                'Há mais de 100 históricos ausentes. ' +
                                'Esta versão permite recuperar até ' +
                                '100 registros por operação.'
                            );
                        }

                        /* CONFIRMAÇÃO OBRIGATÓRIA */

                        const confirmar = window.confirm(
                            `Foram encontrados ${ausentes.length} ` +
                            'histórico(s) recuperável(is).\n\n' +
                            'Deseja restaurar esses registros?\n\n' +
                            'Os históricos existentes não serão ' +
                            'substituídos. Os treinos e o treino ' +
                            'ativo não serão alterados.'
                        );

                        if (!confirmar) {
                            return;
                        }

                        /* REVALIDAR CONTA E REGISTROS */

                        const identidadeFinal =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidadeFinal ||
                            identidadeFinal.id !== identidade.id
                        ) {
                            throw new Error(
                                'A sessão mudou durante a restauração.'
                            );
                        }

                        const ausentesConfirmados =
                            await consultarAusentes();

                        const chavesConfirmadas = new Set(
                            ausentesConfirmados.map(
                                chaveHistorico
                            )
                        );

                        const registrosParaRestaurar =
                            ausentes.filter(
                                registro =>
                                    chavesConfirmadas.has(
                                        chaveHistorico(registro)
                                    )
                            );

                        if (registrosParaRestaurar.length === 0) {
                            alert(
                                'Nenhum histórico permanece ausente.'
                            );
                            return;
                        }

                        /* INSERIR SEM SUBSTITUIR EXISTENTES */

                        for (const registro of registrosParaRestaurar) {
                            const identidadeAtual =
                                await obterAcessoVinculadoTreinos();

                            if (
                                !identidadeAtual ||
                                identidadeAtual.id !== identidade.id
                            ) {
                                throw new Error(
                                    'Sessão alterada durante a restauração.'
                                );
                            }

                            const { error } = await cliente
                                .from('fitzone_historico_treinos')
                                .insert({
                                    usuario_id: identidade.id,
                                    treino_id: registro.treino_id,
                                    data_local: registro.data_local,
                                    dados: registro.dados,
                                    concluido_em:
                                        registro.concluido_em
                                });

                            if (error) {
                                if (error.code === '23505') {
                                    console.warn(
                                        'Histórico já existente, ignorado:',
                                        registro.treino_id,
                                        registro.data_local
                                    );
                                    continue;
                                }

                                throw error;
                            }

                            recuperados++;
                        }

                        resultadoBackupSupabase.hidden = false;

                        resultadoBackupSupabase.textContent =
                            'Restauração de histórico concluída.\n' +
                            `Históricos recuperados: ${recuperados}\n` +
                            'Os registros existentes foram preservados.\n' +
                            'Valide o backup novamente para ' +
                            'atualizar a comparação.';

                        alert(
                            `${recuperados} histórico(s) ` +
                            'recuperado(s).\n\n' +
                            'Atualize a página para conferir ' +
                            'o histórico no FitZone.'
                        );

                    } catch (erro) {
                        console.error(
                            'Falha na restauração do histórico:',
                            erro
                        );

                        alert(
                            'A restauração foi interrompida.\n' +
                            `Registros inseridos nesta tentativa: ${recuperados}.\n` +
                            erro.message +
                            '\nConfira o histórico antes de tentar novamente.'
                        );

                    } finally {
                        backupValidadoParaRestauracao = null;

                        botaoRestaurarHistoricoSupabase.disabled =
                            true;

                        botaoRestaurarTreinosSupabase.disabled =
                            true;

                        botaoValidarBackupSupabase.disabled =
                            false;
                    }
                }
            );

            /* =========================================
               EXECUTAR RESTAURACAO DO TREINO ATIVO
            ========================================= */

            botaoRestaurarAtivoSupabase.addEventListener(
                'click',
                async () => {
                    const backup =
                        backupValidadoParaRestauracao;

                    if (!backup) {
                        alert('Valide o backup novamente.');
                        return;
                    }

                    botaoRestaurarAtivoSupabase.disabled = true;
                    botaoRestaurarTreinosSupabase.disabled = true;
                    botaoRestaurarHistoricoSupabase.disabled = true;
                    botaoValidarBackupSupabase.disabled = true;

                    try {
                        validarEstruturaBackupSupabase(backup);

                        const identidade =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidade ||
                            identidade.id !== acessoPagina.id ||
                            backup.usuarioId !== identidade.id
                        ) {
                            throw new Error(
                                'A conta não corresponde ao backup.'
                            );
                        }

                        const ativo = backup.dados.treinoAtivo;

                        if (!ativo) {
                            throw new Error(
                                'O backup não contém treino ativo.'
                            );
                        }

                        if (
                            ativo.usuario_id !== identidade.id ||
                            typeof ativo.treino_id !== 'string' ||
                            !ativo.treino_id.trim() ||
                            typeof ativo.treino_nome !== 'string' ||
                            !ativo.treino_nome.trim() ||
                            !ativo.progresso ||
                            typeof ativo.progresso !== 'object' ||
                            Array.isArray(ativo.progresso) ||
                            typeof ativo.iniciado_em !== 'string' ||
                            !Number.isFinite(
                                Date.parse(ativo.iniciado_em)
                            )
                        ) {
                            throw new Error(
                                'Os dados do treino ativo são inválidos.'
                            );
                        }

                        const cliente =
                            inicializarSupabaseFitZone();

                        if (!cliente) {
                            throw new Error(
                                'Supabase indisponível.'
                            );
                        }

                        async function verificarCondicoesAtivo() {
                            const {
                                data: ativoAtual,
                                error: erroAtivo
                            } = await cliente
                                .from('fitzone_treino_ativo')
                                .select('treino_id')
                                .eq('usuario_id', identidade.id)
                                .maybeSingle();

                            if (erroAtivo) {
                                throw erroAtivo;
                            }

                            if (ativoAtual) {
                                throw new Error(
                                    'Já existe um treino em andamento. ' +
                                    'Ele não será substituído.'
                                );
                            }

                            const {
                                data: treino,
                                error: erroTreino
                            } = await cliente
                                .from('fitzone_treinos')
                                .select('treino_id')
                                .eq('usuario_id', identidade.id)
                                .eq('treino_id', ativo.treino_id)
                                .maybeSingle();

                            if (erroTreino) {
                                throw erroTreino;
                            }

                            if (!treino) {
                                throw new Error(
                                    'O treino correspondente não existe. ' +
                                    'Recupere primeiro o treino cadastrado.'
                                );
                            }
                        }

                        await verificarCondicoesAtivo();

                        const confirmar = window.confirm(
                            'Deseja recuperar o treino em andamento ' +
                            'do backup?\n\n' +
                            `Treino: ${ativo.treino_nome}\n` +
                            'O progresso das séries será recuperado.\n\n' +
                            'Nenhum treino ativo existente será substituído.'
                        );

                        if (!confirmar) {
                            return;
                        }

                        const identidadeFinal =
                            await obterAcessoVinculadoTreinos();

                        if (
                            !identidadeFinal ||
                            identidadeFinal.id !== identidade.id
                        ) {
                            throw new Error(
                                'A sessão mudou durante a restauração.'
                            );
                        }

                        await verificarCondicoesAtivo();

                        await obterAcessoVinculadoTreinos();

                        const { error } = await cliente
                            .from('fitzone_treino_ativo')
                            .insert({

                                usuario_id: identidade.id,
                                treino_id: ativo.treino_id,
                                treino_nome: ativo.treino_nome,
                                progresso: ativo.progresso,
                                iniciado_em: ativo.iniciado_em,
                                atualizado_em:
                                    new Date().toISOString()
                            });

                        if (error) {
                            throw error;
                        }

                        alert(
                            'Treino em andamento recuperado!\n\n' +
                            'A página será atualizada.'
                        );

                        window.location.reload();

                    } catch (erro) {
                        console.error(
                            'Erro ao restaurar treino ativo:',
                            erro
                        );

                        alert(
                            'Não foi possível recuperar o treino ativo.\n' +
                            erro.message +
                            '\n\nConfira os dados existentes ' +
                            'antes de tentar novamente.'
                        );

                    } finally {
                        backupValidadoParaRestauracao = null;
                        botaoRestaurarAtivoSupabase.disabled = true;
                        botaoRestaurarTreinosSupabase.disabled = true;
                        botaoRestaurarHistoricoSupabase.disabled = true;
                        botaoValidarBackupSupabase.disabled = false;
                    }
                }
            );

            const conteudoOriginal = document.body;

            Array.from(conteudoOriginal.children).forEach(
                elemento => {
                    if (
                        elemento.tagName !== 'SCRIPT' &&
                        elemento !== painel &&
                        elemento.id !== 'fitzoneTreinosLoader'
                    ) {
                        elemento.hidden = true;
                    }
                }
            );

            conteudoOriginal.appendChild(painel);

            /* =========================================
               CARREGAMENTO TREINOS SUPABASE V4
            ========================================= */

            const telaCarregamentoTreinos =
                document.getElementById(
                    'fitzoneTreinosLoader'
                );

            function finalizarCarregamentoTreinos() {
                telaCarregamentoTreinos.remove();
            }

            function falhaCarregamentoTreinos(erro) {
                console.error(
                    'Falha na inicialização dos treinos:',
                    erro
                );

                telaCarregamentoTreinos.querySelector(
                    '.fitzone-treinos-spinner'
                )?.remove();

                const texto =
                    telaCarregamentoTreinos.querySelector('p');

                if (texto) {
                    texto.textContent =
                        'Não foi possível carregar seus treinos. ' +
                        'Atualize a página ou verifique sua conexão.';
                }
            }

            function capturarFalhaInicialTreinos(evento) {
                if (
                    !telaCarregamentoTreinos.isConnected
                ) {
                    return;
                }

                falhaCarregamentoTreinos(
                    evento.reason
                );
            }

            window.addEventListener(
                'unhandledrejection',
                capturarFalhaInicialTreinos
            );

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

                /* =========================================
                   CORRIGIR ESPACO VAZIO DO CABECALHO
                   SUPABASE
                ========================================= */

                const areaPersonagem =
                    cabecalhoSupabase.querySelector(
                        '.character-preview'
                    );

                if (areaPersonagem) {
                    areaPersonagem.remove();
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

                const interfaceModalTreino =
                    configurarModalTreinosSupabase({
                        modal: modalTreinoOriginal,
                        campoNome,
                        contador: document.getElementById('workoutNameCounter'),
                        avisoDuplicado: document.getElementById('workoutDuplicateWarning'),
                        avisoValidacao: document.getElementById('workoutValidationMessage'),
                        botaoSalvar,
                        botaoCancelar,
                        obterItens: () => lista.treinosSupabaseCompletos || [],
                        obterIdEdicao: () => treinoEmEdicaoSupabase?.id,
                        mensagemDuplicado:
                            'Já existe um treino com este nome. Confira se deseja criar outro.'
                    });

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

                            interfaceModalTreino.abrir(botaoEditar);

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

                                interfaceModalTreino.fechar();

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

                        interfaceModalTreino.abrir(botaoNovoOriginal);
                    }
                );

                if (botaoCancelar) {
                    botaoCancelar.addEventListener(
                        'click',
                        () => {
                            treinoEmEdicaoSupabase = null;
                            interfaceModalTreino.fechar();
                        }
                    );
                }
            }

            /* =========================================
               EXERCICIOS INDIVIDUAIS SUPABASE
            ========================================= */

            /* =========================================
               EXERCICIO RECEBIDO DA BIBLIOTECA
               SUPABASE V1
            ========================================= */

            const exerciciosBibliotecaSupabase = {
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

            const parametrosBibliotecaSupabase =
                new URLSearchParams(window.location.search);

            const exercicioIdBibliotecaSupabase =
                parametrosBibliotecaSupabase.get('biblioteca');

            let nomePendenteBibliotecaSupabase =
                Object.hasOwn(
                    exerciciosBibliotecaSupabase,
                    exercicioIdBibliotecaSupabase
                )
                    ? exerciciosBibliotecaSupabase[
                        exercicioIdBibliotecaSupabase
                    ]
                    : null;

            let avisoBibliotecaSupabase = null;

            if (nomePendenteBibliotecaSupabase) {
                avisoBibliotecaSupabase =
                    document.createElement('p');

                avisoBibliotecaSupabase.style.cssText =
                    'padding:12px 16px;' +
                    'border:1px solid currentColor;' +
                    'border-radius:8px;' +
                    'margin:12px 0;';

                avisoBibliotecaSupabase.textContent =
                    'Exercício selecionado: ' +
                    nomePendenteBibliotecaSupabase +
                    '. Clique em + Adicionar exercício ' +
                    'no treino desejado.';

                painel.insertBefore(
                    avisoBibliotecaSupabase,
                    lista
                );
            }

            if (modalExercicioSupabase) {
                let contextoExercicioSupabase = null;

                const campo = id =>
                    document.getElementById(id);

                let treinoGruposSupabase = null;
                let exercicioGruposSupabase = null;

                const interfaceModalExercicio =
                    configurarModalTreinosSupabase({
                        modal: modalExercicioSupabase,
                        campoNome: campo('exerciseNameInput'),
                        contador: campo('exerciseNameCounter'),
                        avisoDuplicado: campo('exerciseDuplicateWarning'),
                        avisoValidacao: campo('exerciseValidationMessage'),
                        botaoSalvar: campo('exerciseSaveBtn'),
                        botaoCancelar: campo('exerciseCancelBtn'),
                        obterItens: () => treinoGruposSupabase?.exercicios || [],
                        obterIdEdicao: () => contextoExercicioSupabase?.exercicioId,
                        mensagemDuplicado:
                            'Este exercício já existe neste treino. Confira se deseja adicioná-lo novamente.'
                    });

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
                    interfaceModalExercicio.fechar();

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
                                exercicio?.nome ||
                                (
                                    nomePendenteBibliotecaSupabase &&
                                    !exercicioId
                                        ? nomePendenteBibliotecaSupabase
                                        : ''
                                );

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

                            interfaceModalExercicio.abrir(botao);

                            if (
                                nomePendenteBibliotecaSupabase &&
                                !exercicioId
                            ) {
                                nomePendenteBibliotecaSupabase = null;

                                if (avisoBibliotecaSupabase) {
                                    avisoBibliotecaSupabase.remove();
                                }

                                parametrosBibliotecaSupabase.delete(
                                    'biblioteca'
                                );

                                const novaConsulta =
                                    parametrosBibliotecaSupabase.toString();

                                const novoEndereco =
                                    window.location.pathname +
                                    (
                                        novaConsulta
                                            ? `?${novaConsulta}`
                                            : ''
                                    ) +
                                    window.location.hash;

                                window.history.replaceState(
                                    null,
                                    '',
                                    novoEndereco
                                );
                            }

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
                'active-training';

            painelProgressoSupabase.hidden = true;

            lista.insertAdjacentElement(
                'afterend',
                painelProgressoSupabase
            );

            let treinoExibidoSupabase = null;

            async function renderizarProgressoSupabase(
                ativoInformado = null,
                treinoInformado = null
            ) {
                const ativo =
                    ativoInformado ||
                    await consultarTreinoAtivoSupabase();

                painelProgressoSupabase.replaceChildren();

                if (!ativo) {
                    treinoExibidoSupabase = null;
                    painelProgressoSupabase.hidden = true;
                    return;
                }

                let treino = treinoInformado;

                if (!treino || treino.id !== ativo.id) {
                    const treinos =
                        await carregarTreinosPorOrigem(
                            acessoInicialTreinosFitZone
                        );

                    treino = treinos.find(
                        item => item.id === ativo.id
                    );
                }

                if (!treino) {
                    treinoExibidoSupabase = null;
                    painelProgressoSupabase.hidden = true;
                    return;
                }

                treinoExibidoSupabase = treino;
                painelProgressoSupabase.hidden = false;

                /* =========================================
                   CABECALHO ORIGINAL DO TREINO ATIVO
                ========================================= */

                const cabecalho =
                    document.createElement('div');

                cabecalho.className =
                    'active-training-header';

                const identificacao =
                    document.createElement('div');

                const etiqueta =
                    document.createElement('span');

                etiqueta.className =
                    'active-training-eyebrow';

                etiqueta.textContent =
                    'TREINO EM ANDAMENTO';

                const titulo =
                    document.createElement('h2');

                titulo.textContent = treino.nome;

                identificacao.append(
                    etiqueta,
                    titulo
                );

                const status =
                    document.createElement('span');

                status.className =
                    'active-training-status';

                status.textContent =
                    'EM ANDAMENTO';

                cabecalho.append(
                    identificacao,
                    status
                );

                const resumo =
                    document.createElement('p');

                resumo.setAttribute(
                    'role',
                    'status'
                );

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
                    cabecalho,
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

                exercicios.forEach((exercicio, indice) => {
                    const grupo =
                        document.createElement('div');

                    grupo.className =
                        'active-exercise-item';

                    const numeroExercicio =
                        document.createElement('span');

                    numeroExercicio.className =
                        'active-exercise-number';

                    numeroExercicio.textContent =
                        String(indice + 1).padStart(2, '0');

                    const informacoes =
                        document.createElement('div');

                    informacoes.className =
                        'active-exercise-info';

                    const nome =
                        document.createElement('strong');

                    nome.className =
                        'active-exercise-name';

                    nome.textContent =
                        exercicio.nome || 'Exercício';

                    const descricao =
                        document.createElement('p');

                    descricao.className =
                        'active-exercise-meta';

                    descricao.textContent =
                        `${exercicio.series} séries × ` +
                        `${exercicio.repeticoes} repetições`;

                    const controlesSeries =
                        document.createElement('div');

                    controlesSeries.className =
                        'active-series-controls';

                    informacoes.append(
                        nome,
                        descricao,
                        controlesSeries
                    );

                    grupo.append(
                        numeroExercicio,
                        informacoes
                    );

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

                        rotulo.className =
                            'active-series-checkbox-label';

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
                            String(numero);

                        rotulo.append(checkbox, texto);
                        controlesSeries.appendChild(rotulo);
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
                        'btn-finish-workout';

                    botaoFinalizar.textContent =
                        'Finalizar Treino';

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

                    let progressoSalvoNoBanco = false;

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

                        let treino = treinoExibidoSupabase;

                        if (!treino || treino.id !== ativo.id) {
                            const treinos =
                                await carregarTreinosPorOrigem(
                                    acessoInicialTreinosFitZone
                                );

                            treino = treinos.find(
                                item => item.id === ativo.id
                            );
                        }

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

                        progressoSalvoNoBanco = true;

                        await renderizarProgressoSupabase(
                            {
                                ...ativo,
                                progresso
                            },
                            treino
                        );

                    } catch (erro) {
                        console.error(
                            'Erro ao atualizar séries:',
                            erro
                        );

                        alert(
                            progressoSalvoNoBanco
                                ? 'O progresso foi salvo no Supabase, ' +
                                  'mas não foi possível atualizar a tela. ' +
                                  'Reabra a página para conferir as séries.'
                                : 'Não foi possível confirmar o salvamento ' +
                                  'do progresso. Verifique a conexão e ' +
                                  'reabra a página antes de tentar novamente.'
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

                    let finalizacaoConfirmada = false;

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

                        exercicios.forEach(exercicio => {
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

                        const confirmar = window.confirm(
                            `Finalizar "${treino.nome}"?\n\n` +
                            `${seriesConcluidas} de ` +
                            `${totalSeries} séries concluídas.\n\n` +
                            'O resultado será registrado no histórico.'
                        );

                        if (!confirmar) {
                            return;
                        }

                        await finalizarTreinoAtomicoSupabase(
                            ativo,
                            treino,
                            dataLocal
                        );

                        finalizacaoConfirmada = true;

                        treinoAtivoSupabaseVisualId = null;

                        renderizarCartoesSupabase(
                            treinos,
                            lista
                        );

                        await renderizarProgressoSupabase();

                        mensagem.textContent =
                            'Treino finalizado e registrado ' +
                            'no histórico com sucesso!';

                    } catch (erro) {
                        console.error(
                            'Erro ao finalizar treino Supabase:',
                            erro
                        );

                        alert(
                            finalizacaoConfirmada
                                ? 'O treino foi finalizado no Supabase, ' +
                                  'mas não foi possível atualizar a tela. ' +
                                  'Reabra a página para conferir.'
                                : (
                                    erro.message ||
                                    'Não foi possível confirmar a finalização.'
                                ) +
                                  '\n\nAtualize a página e confira o histórico ' +
                                  'e o treino ativo antes de tentar novamente.'
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
                mensagem.textContent =
                    'Carregando seus treinos...';

                lista.setAttribute(
                    'aria-busy',
                    'true'
                );

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

                lista.removeAttribute('aria-busy');

                window.removeEventListener(
                    'unhandledrejection',
                    capturarFalhaInicialTreinos
                );

                finalizarCarregamentoTreinos();

            } catch (erro) {
                console.error(
                    'Erro ao consultar treinos Supabase:',
                    erro
                );

                mensagem.textContent =
                    'Não foi possível carregar os treinos. ' +
                    'Verifique a conexão e tente novamente.';

                lista.removeAttribute('aria-busy');

                window.removeEventListener(
                    'unhandledrejection',
                    capturarFalhaInicialTreinos
                );

                falhaCarregamentoTreinos(erro);
            }

            return;
        }
           
        window.location.replace('login.html');
    }
);
