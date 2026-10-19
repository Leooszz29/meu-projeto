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
            !sessao.email.trim()
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

        return treinoAtivoJSON
            ? JSON.parse(treinoAtivoJSON)
            : null;

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
        return JSON.parse(
            localStorage.getItem(obterChaveTreinos())
        ) || [];
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
                meta.innerHTML = `<span>${ex.series}x${ex.repeticoes}</span> repetições · <span>${ex.descanso}s</span> descanso`;

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

statusIndividual.textContent =
    concluido
        ? 'CONCLUÍDO ✓'
        : '';

statusIndividual.hidden =
    !concluido;
        
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

roundInfo.textContent =
    `RODADA ${rodadaAtual} DE ${quantidadeSeries}`;
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
        const workout = workouts.find(w => w.id === editingWorkoutId);
        if (workout) workout.nome = nome;
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

// ==================== INICIALIZAÇÃO ====================
window.addEventListener(
    'DOMContentLoaded',
    () => {
        const sessao =
            carregarSessao();
        
        if (!sessao) {
            window.location.href =
                'login.html';

            return;
        }
        
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
        metaMensal: `metaMensalFitZone:${email}`
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

    const categorias = [
        'perfil',
        'fotoPerfil',
        'treinos',
        'historico',
        'progresso',
        'treinoAtivo',
        'checkins',
        'metaMensal'
    ];

    return (
        Object.keys(dados).length === categorias.length &&
        categorias.every(categoria =>
            Object.hasOwn(dados, categoria) &&
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
        metaMensal: `metaMensalFitZone:${email}`
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
        ([tipo, chave]) => ({
            tipo: tipo,
            chave: chave,
            valorAnterior: dadosAtuais[tipo],
            valorNovo: backup.dados[tipo]
        })
    );
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
    if (
        !Array.isArray(plano) ||
        plano.length !== 8
    ) {
        return false;
    }

    try {
        const chaves = obterChavesRestauracaoFitZone();

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

    if (
        !modal ||
        !cancelar ||
        !confirmar ||
        !resumoElemento
    ) {
        return;
    }

    confirmar.disabled = true;

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

    const botoes = Array.from(
        modal.querySelectorAll('button:not(:disabled)')
    ).filter(botao => !botao.hidden);

    if (botoes.length === 0) {
        event.preventDefault();
        return;
    }

    const primeiro = botoes[0];
    const ultimo = botoes[botoes.length - 1];

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
