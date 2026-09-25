// ==================== SESSÃO ====================
function carregarSessao() {

    try {

        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        return sessaoJSON
            ? JSON.parse(sessaoJSON)
            : null;

    } catch (error) {

        console.warn(
            'Não foi possível carregar a sessão:',
            error
        );

        return null;
    }
}

function carregarTreinoAtivo() {

    try {

        const treinoAtivoJSON =
            localStorage.getItem('treinoAtivo');

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

function carregarProgressoTreino() {

    try {

        const progressoJSON =
            localStorage.getItem('progressoTreino');

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

const STORAGE_KEY = 'fitzoneTreinos';

function loadWorkouts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveWorkouts(workouts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
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

    workouts.forEach(workout => {
        const card = document.createElement('div');
        card.className = 'workout-card';

        const headerEl = document.createElement('div');
        headerEl.className = 'workout-header';

        const titleEl = document.createElement('div');
        titleEl.className = 'workout-title';
        titleEl.textContent = workout.nome;

        const actionsEl = document.createElement('div');
        actionsEl.className = 'workout-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'icon-btn';
        editBtn.title = 'Editar nome do treino';
        editBtn.innerHTML = '✎';
        editBtn.addEventListener('click', () => openWorkoutModal(workout.id));

        const delBtn = document.createElement('button');
        delBtn.className = 'icon-btn danger';
        delBtn.title = 'Excluir treino';
        delBtn.innerHTML = '🗑';
        delBtn.addEventListener('click', () => deleteWorkout(workout.id));

        actionsEl.appendChild(editBtn);
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
                exEditBtn.className = 'icon-btn';
                exEditBtn.title = 'Editar exercício';
                exEditBtn.innerHTML = '✎';
                exEditBtn.addEventListener('click', () => openExerciseModal(workout.id, ex.id));

                const exDelBtn = document.createElement('button');
                exDelBtn.className = 'icon-btn danger';
                exDelBtn.title = 'Remover exercício';
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
        addExBtn.className = 'btn-add-exercise';
        addExBtn.textContent = '+ Adicionar exercício';
        addExBtn.addEventListener('click', () => openExerciseModal(workout.id, null));
        card.appendChild(addExBtn);
        
        // BOTÃO INICIAR TREINO

const startBtn = document.createElement('button');

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

    // SALVA O TREINO SELECIONADO
    localStorage.setItem(
        'treinoAtivo',
        JSON.stringify({
            id: workout.id,
            nome: workout.nome
        })
    );


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

    if (
        !nameElement ||
        !statusElement ||
        !exercisesElement
    ) {
        return;
    }

    // CARREGA O PROGRESSO DAS SÉRIES

const progressoTreino =
    carregarProgressoTreino();

const progressoAtual =
    progressoTreino[workout.id] || {};
    

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
            JSON.parse(
                localStorage.getItem(
                    'progressoTreino'
                )
            ) || {};


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


       localStorage.setItem(
    'progressoTreino',
    JSON.stringify(progressoSalvo)
);

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
            JSON.parse(
                localStorage.getItem(
                    'progressoTreino'
                )
            ) || {};

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
    JSON.parse(
        localStorage.getItem(
            'progressoTreino'
        )
    ) || {};

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

    if (workoutId) {
        const workouts = loadWorkouts();
        const workout = workouts.find(w => w.id === workoutId);
        title.textContent = 'Editar treino';
        input.value = workout ? workout.nome : '';
    } else {
        title.textContent = 'Novo treino';
        input.value = '';
    }

    document.getElementById('workoutModalOverlay').classList.add('show');
    input.focus();
}

function closeWorkoutModal() {
    document.getElementById('workoutModalOverlay').classList.remove('show');
    editingWorkoutId = null;
}

document.getElementById('btnNewWorkout').addEventListener('click', () => openWorkoutModal(null));
document.getElementById('workoutCancelBtn').addEventListener('click', closeWorkoutModal);
document.getElementById('workoutModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'workoutModalOverlay') closeWorkoutModal();
});

document.getElementById('workoutSaveBtn').addEventListener('click', () => {
    const nome = document.getElementById('workoutNameInput').value.trim();
    if (!nome) {
        document.getElementById('workoutNameInput').focus();
        return;
    }

    const workouts = loadWorkouts();

    if (editingWorkoutId) {
        const workout = workouts.find(w => w.id === editingWorkoutId);
        if (workout) workout.nome = nome;
    } else {
        workouts.push({ id: uid(), nome, exercicios: [] });
    }

    saveWorkouts(workouts);
    closeWorkoutModal();
    renderWorkouts();
});

// ==================== MODAL DE CONFIRMAÇÃO ====================
let pendingDeleteAction = null;

function askConfirm(text, onConfirm) {
    document.getElementById('confirmModalText').textContent = text;
    pendingDeleteAction = onConfirm;
    document.getElementById('confirmModalOverlay').classList.add('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModalOverlay').classList.remove('show');
    pendingDeleteAction = null;
}

document.getElementById('confirmCancelBtn').addEventListener('click', closeConfirmModal);
document.getElementById('confirmModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'confirmModalOverlay') closeConfirmModal();
});
document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (pendingDeleteAction) pendingDeleteAction();
    closeConfirmModal();
});

function deleteWorkout(workoutId) {
    askConfirm('Excluir este treino e todos os seus exercícios?', () => {
        let workouts = loadWorkouts();
        workouts = workouts.filter(w => w.id !== workoutId);
        saveWorkouts(workouts);
        renderWorkouts();
    });
}

// ==================== MODAL EXERCÍCIO ====================
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

let exerciseEditing = null;

if (exerciseId) {
    const workouts = loadWorkouts();
    const workout = workouts.find(w => w.id === workoutId);
   const ex =
    workout
        ? workout.exercicios.find(
            e => e.id === exerciseId
        )
        : null;

exerciseEditing = ex;

    title.textContent = 'Editar exercício';

    nameInput.value = ex ? ex.nome : '';

    typeInput.value =
        ex ? (ex.tipoExecucao || 'individual') : 'individual';

    seriesInput.value = ex ? ex.series : '';
    repsInput.value = ex ? ex.repeticoes : '';
    restInput.value = ex ? ex.descanso : '';

} else {
    title.textContent = 'Novo exercício';

    nameInput.value = '';

    typeInput.value = 'individual';

    seriesInput.value = '';
    repsInput.value = '';
    restInput.value = '';
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
            w => w.id === workoutId
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
        gruposExistentes.add(exercicio.grupoExecucao);
    }
});

Array.from(gruposExistentes).forEach(
    (grupoId, index) => {

        const quantidadeNoGrupo =
            workout.exercicios.filter(exercicio =>
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

        if (
            quantidadeNoGrupo >= limiteGrupo &&
            !ehGrupoAtual
        ) {
            return;
        }

        const option = document.createElement('option');

        option.value = grupoId;

        const numeroGrupo = index + 1;

        if (tipoExecucao === 'bisset') {
            option.textContent = `Bi-set ${numeroGrupo}`;
        } else {
            option.textContent = `Tri-set ${numeroGrupo}`;
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
}

document.getElementById('exerciseCancelBtn').addEventListener('click', closeExerciseModal);
document.getElementById('exerciseModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'exerciseModalOverlay') closeExerciseModal();
});

document.getElementById('exerciseSaveBtn').addEventListener('click', () => {
    if (!editingExerciseCtx) return;

    const nome =
    document.getElementById('exerciseNameInput').value.trim();

const tipoExecucao =
    document.getElementById('exerciseTypeInput').value;

const grupoSelecionado =
    document.getElementById('exerciseGroupInput').value;

const series =
    parseInt(
        document.getElementById('exerciseSeriesInput').value,
        10
    );
    const repeticoes = parseInt(document.getElementById('exerciseRepsInput').value, 10);
    const descanso = parseInt(document.getElementById('exerciseRestInput').value, 10);

    if (!nome || isNaN(series) || isNaN(repeticoes) || isNaN(descanso)) {
        [
            ['exerciseNameInput', !nome],
            ['exerciseSeriesInput', isNaN(series)],
            ['exerciseRepsInput', isNaN(repeticoes)],
            ['exerciseRestInput', isNaN(descanso)]
        ].forEach(([id, invalid]) => {
            const el = document.getElementById(id);
            el.style.borderColor = invalid ? '#c1443c' : '';
        });
        return;
    }

    const workouts = loadWorkouts();
    const workout = workouts.find(w => w.id === editingExerciseCtx.workoutId);
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
        workout.exercicios.filter(exercicio => {

            // AO EDITAR, NÃO CONTA O PRÓPRIO EXERCÍCIO
            if (
                editingExerciseCtx.exerciseId &&
                exercicio.id === editingExerciseCtx.exerciseId
            ) {
                return false;
            }

            return (
                exercicio.grupoExecucao === grupoExecucao &&
                exercicio.tipoExecucao === tipoExecucao
            );

        });

    if (exerciciosNoGrupo.length >= limiteGrupo) {

        alert(
            tipoExecucao === 'bisset'
                ? 'Este Bi-set já possui 2 exercícios.'
                : 'Este Tri-set já possui 3 exercícios.'
        );

        return;
    }
}

    if (editingExerciseCtx.exerciseId) {

    const ex =
        workout.exercicios.find(
            e => e.id === editingExerciseCtx.exerciseId
        );

    if (ex) {

        ex.nome = nome;

        ex.tipoExecucao =
            tipoExecucao;

        ex.grupoExecucao =
            grupoExecucao;

        ex.series =
            series;

        ex.repeticoes =
            repeticoes;

        ex.descanso =
            descanso;
    }

}
     else {
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

    saveWorkouts(workouts);
    closeExerciseModal();
    renderWorkouts();
});

function deleteExercise(workoutId, exerciseId) {
    askConfirm('Remover este exercício?', () => {
        const workouts = loadWorkouts();
        const workout = workouts.find(w => w.id === workoutId);
        if (!workout) return;
        workout.exercicios = workout.exercicios.filter(e => e.id !== exerciseId);
        saveWorkouts(workouts);
        renderWorkouts();
    });
}

// ==================== CALENDÁRIO DE CHECK-IN ====================
const CHECKIN_STORAGE_KEY = 'fitzoneCheckins';
const weekdayHeaders = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

let calCurrentDate = new Date();
let calViewYear = calCurrentDate.getFullYear();
let calViewMonth = calCurrentDate.getMonth();
let calSelectedDateKey = null;

document.getElementById('btnToggleCalendar').addEventListener('click', function () {
    const wrapper = document.getElementById('calendarWrapper');
    const isOpen = wrapper.classList.toggle('show');
    this.classList.toggle('open', isOpen);
    document.getElementById('toggleCalendarLabel').textContent = isOpen
        ? 'Ocultar calendário de check-in'
        : 'Mostrar calendário de check-in';
});

function loadCheckins() {
    try {
        return JSON.parse(localStorage.getItem(CHECKIN_STORAGE_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function saveCheckins(data) {
    localStorage.setItem(CHECKIN_STORAGE_KEY, JSON.stringify(data));
}

function calDateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function renderCalendar() {
    const data = loadCheckins();
    document.getElementById('monthLabel').textContent = `${monthNames[calViewMonth]} ${calViewYear}`;

    const grid = document.getElementById('daysGrid');
    grid.innerHTML = '';

    const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
    const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
    const todayKey = calDateKey(calCurrentDate.getFullYear(), calCurrentDate.getMonth(), calCurrentDate.getDate());

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty';
        grid.appendChild(empty);
    }

    let checkinsNoMes = 0;

    for (let d = 1; d <= daysInMonth; d++) {
        const key = calDateKey(calViewYear, calViewMonth, d);
        const entry = data[key];
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        if (key === todayKey) cell.classList.add('today');
        if (entry && entry.checked) {
            cell.classList.add('checked');
            checkinsNoMes++;
        }

        const num = document.createElement('div');
        num.className = 'num';
        num.textContent = d;
        cell.appendChild(num);

        if (entry && entry.treino) {
            const label = document.createElement('div');
            label.className = 'treino-label';
            label.textContent = entry.treino;
            cell.appendChild(label);
        }

        const badge = document.createElement('div');
        badge.className = 'check-badge';
        badge.textContent = '✓';
        cell.appendChild(badge);

        cell.addEventListener('click', () => openCheckinModal(key, d));
        grid.appendChild(cell);
    }

    document.getElementById('statMes').textContent = checkinsNoMes;
    document.getElementById('statSequencia').textContent = calcularSequencia(data);
}

function calcularSequencia(data) {
    let streak = 0;
    let d = new Date();
    while (true) {
        const key = calDateKey(d.getFullYear(), d.getMonth(), d.getDate());
        if (data[key] && data[key].checked) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function openCheckinModal(key, dayNum) {
    calSelectedDateKey = key;
    const data = loadCheckins();
    const entry = data[key] || { checked: false, treino: '' };

    const [y, m, d] = key.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = weekdayHeaders[dateObj.getDay()];
    document.getElementById('checkinModalDate').textContent = `${weekday}, ${d} de ${monthNames[m - 1]}`;

    const toggle = document.getElementById('checkinToggle');
    toggle.classList.toggle('active', !!entry.checked);
    toggle.dataset.checked = entry.checked ? 'true' : 'false';

    document.getElementById('checkinTreinoInput').value = entry.treino || '';

    document.getElementById('checkinModalOverlay').classList.add('show');
}

function closeCheckinModal() {
    document.getElementById('checkinModalOverlay').classList.remove('show');
    calSelectedDateKey = null;
}

document.getElementById('checkinToggle').addEventListener('click', function () {
    const isActive = this.classList.toggle('active');
    this.dataset.checked = isActive ? 'true' : 'false';
});

document.getElementById('checkinCancelBtn').addEventListener('click', closeCheckinModal);
document.getElementById('checkinModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'checkinModalOverlay') closeCheckinModal();
});

document.getElementById('checkinSaveBtn').addEventListener('click', () => {
    if (!calSelectedDateKey) return;
    const data = loadCheckins();
    const checked = document.getElementById('checkinToggle').dataset.checked === 'true';
    const treino = document.getElementById('checkinTreinoInput').value.trim();

    if (!checked && !treino) {
        delete data[calSelectedDateKey];
    } else {
        data[calSelectedDateKey] = { checked, treino };
    }

    saveCheckins(data);
    closeCheckinModal();
    renderCalendar();
});

document.getElementById('prevMonth').addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) { calViewMonth = 11; calViewYear--; }
    renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) { calViewMonth = 0; calViewYear++; }
    renderCalendar();
});

// ==================== FINALIZAR TREINO ====================
document.getElementById('btnFinishWorkout').addEventListener('click', () => {

    // Busca o treino selecionado
    const treinoAtivo =
    carregarTreinoAtivo();

    // Impede finalizar sem selecionar um treino
   if (!treinoAtivo) {

    document
        .getElementById('selectWorkoutModalOverlay')
        .classList.add('show');

    return;
}
    
// Busca os dados completos do treino
const workouts =
    loadWorkouts();

const workoutFinalizado =
    workouts.find(
        workout =>
            workout.id === treinoAtivo.id
    );
    
// Preenche o resumo do modal
document.getElementById(
    'finishWorkoutName'
).textContent =
    workoutFinalizado?.nome ||
    treinoAtivo.nome ||
    'Treino';

document.getElementById(
    'finishExerciseCount'
).textContent =
    workoutFinalizado?.exercicios?.length || 0;
    
    // Calcula o total de séries
// e quantas foram concluídas
const progressoTreino =
    JSON.parse(
        localStorage.getItem(
            'progressoTreino'
        )
    ) || {};

let totalSeries = 0;
let seriesConcluidas = 0;

const exerciciosFinalizados =
    workoutFinalizado?.exercicios || [];

exerciciosFinalizados.forEach(
    (exercicio, index) => {

        const quantidadeSeries =
            Number(exercicio.series) || 0;

        totalSeries += quantidadeSeries;

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

document.getElementById(
    'finishSeriesCount'
).textContent =
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
    seriesConcluidas >= totalSeries;

finishSeriesItem.classList.toggle(
    'complete',
    todasSeriesConcluidas
);

finishSeriesItem.classList.toggle(
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
            Number(exercicio.series) || 0;

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
            document.createElement('div');

        exerciseRow.className =
            exercicioCompleto
                ? 'finish-exercise-row complete'
                : 'finish-exercise-row incomplete';


        // Ícone ✓ ou ✕
        const exerciseStatus =
            document.createElement('span');

        exerciseStatus.className =
            'finish-exercise-status';

        exerciseStatus.textContent =
            exercicioCompleto
                ? '✓'
                : '✕';


        // Nome
        const exerciseName =
            document.createElement('strong');

        exerciseName.className =
            'finish-exercise-name';

        exerciseName.textContent =
            exercicio.nome ||
            'Exercício';


        // Séries
        const exerciseSeries =
            document.createElement('span');

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

    finishIncompleteCount.hidden = false;

    finishIncompleteCount.textContent =
        exerciciosIncompletos === 1
            ? '✕ 1 exercício incompleto'
            : `✕ ${exerciciosIncompletos} exercícios incompletos`;

} else {

    finishIncompleteCount.hidden = true;
}

    
    // Busca o histórico existente
    const historico =
        JSON.parse(localStorage.getItem('historicoTreinos')) || [];

    // Monta o resumo detalhado dos exercícios
const resumoExercicios =
    exerciciosFinalizados.map(
        (exercicio, index) => {

            const total =
                Number(exercicio.series) || 0;

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
    id: exercicio.id || null,

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

    // Registra o treino concluído
    historico.push({
    workoutId: treinoAtivo.id,
    nome: treinoAtivo.nome,
    data: new Date().toISOString(),

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
    localStorage.setItem(
        'historicoTreinos',
        JSON.stringify(historico)
    );

    // Remove o treino ativo após a conclusão
    localStorage.removeItem('treinoAtivo');

    // Abre o modal de sucesso
    document
        .getElementById('finishModalOverlay')
        .classList.add('show');
});

document.getElementById('finishOkBtn').addEventListener('click', () => {
    document.getElementById('finishModalOverlay').classList.remove('show');
    window.location.href = 'perfil.html';
});

document
    .getElementById('finishCloseBtn')
    .addEventListener('click', () => {

        document
            .getElementById('finishModalOverlay')
            .classList.remove('show');

    });

document.getElementById('finishModalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'finishModalOverlay') {
        document.getElementById('finishModalOverlay').classList.remove('show');
    }
});

// ========================================
// MODAL - SELECIONAR TREINO
// ========================================

document
    .getElementById('selectWorkoutOkBtn')
    .addEventListener('click', () => {

        document
            .getElementById('selectWorkoutModalOverlay')
            .classList.remove('show');

    });


document
    .getElementById('selectWorkoutModalOverlay')
    .addEventListener('click', (e) => {

        if (e.target.id === 'selectWorkoutModalOverlay') {

            document
                .getElementById('selectWorkoutModalOverlay')
                .classList.remove('show');

        }

    });

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {

    const sessao =
    carregarSessao();

if (!sessao || sessao.autenticado !== true) {
    window.location.href = 'login.html';
    return;
}
    const btnEndSession =
    document.getElementById('btnEndSession');

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

    const genero = localStorage.getItem('generoFitZone');

    const characterImg = document.getElementById('characterImg');

    const imagens = {
        masculino: 'img/atleta-masculino.png',
        feminino: 'img/atleta-feminino.png'
    };

    if (genero === 'masculino') {
        document.body.classList.add('theme-masculino');
        characterImg.src = imagens.masculino;
        characterImg.style.display = 'block';
    } else if (genero === 'feminino') {
        document.body.classList.add('theme-feminino');
        characterImg.src = imagens.feminino;
        characterImg.style.display = 'block';
    }

    renderWorkouts();
    renderCalendar();
});
