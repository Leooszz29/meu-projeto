const PROFILE_STORAGE_KEY = 'fitzonePerfil';


// ========================================
// CARREGAR PERFIL SALVO
// ========================================

function loadProfile() {
    try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);

        if (!saved) {
            return {};
        }

        const data = JSON.parse(saved);

        return data && typeof data === 'object' ? data : {};

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        return {};
    }
}


// ========================================
// SALVAR PERFIL
// ========================================

function saveProfile(data) {
    try {
        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        return false;
    }
}


// ========================================
// PEGAR VALOR DE UM CAMPO
// ========================================

function getValue(id) {
    const element = document.getElementById(id);

    if (!element) {
        return '';
    }

    return element.value.trim();
}


// ========================================
// PREENCHER FORMULÁRIO
// ========================================

function fillForm() {

    const perfil = loadProfile();

    let usuario = {};

    try {
        usuario =
            JSON.parse(localStorage.getItem('usuario')) || {};
    } catch (error) {
        console.warn('Não foi possível carregar o usuário:', error);
    }


    // Nome:
    // primeiro tenta o perfil salvo.
    // Se não existir, usa o nome do cadastro.

    const nome = document.getElementById('nome');

    if (nome) {
        nome.value =
            perfil.nome ||
            usuario.nome ||
            '';
    }


    const idade = document.getElementById('idade');

    if (idade) {
        idade.value = perfil.idade || '';
    }


    const tipoSanguineo =
        document.getElementById('tipoSanguineo');

    if (tipoSanguineo) {
        tipoSanguineo.value =
            perfil.tipoSanguineo || '';
    }


    const peso = document.getElementById('peso');

    if (peso) {
        peso.value = perfil.peso || '';
    }


    const altura = document.getElementById('altura');

    if (altura) {
        altura.value = perfil.altura || '';
    }


    const treinador =
        document.getElementById('treinador');

    if (treinador) {
        treinador.value =
            perfil.treinador || '';
    }


    const infoPessoais =
        document.getElementById('infoPessoais');

    if (infoPessoais) {
        infoPessoais.value =
            perfil.infoPessoais || '';
    }
}


// ========================================
// MOSTRAR SUCESSO
// ========================================

function showSuccess() {

    const successMessage =
        document.getElementById('successMessage');

    if (successMessage) {

        successMessage.textContent =
            'Perfil salvo com sucesso! 💪';

        successMessage.classList.add('show');

        setTimeout(() => {
            successMessage.classList.remove('show');
        }, 2200);
    }


    // Também altera o botão

    const button =
        document.getElementById('btnSaveProfile');

    if (!button) {
        return;
    }


    const label =
        button.querySelector('.btn-label');


    button.disabled = true;

    button.classList.add('saved');


    if (label) {

        label.innerHTML =
            '<span class="check-icon">✓</span> Salvo com sucesso!';

    } else {

        button.textContent =
            '✓ Salvo com sucesso!';
    }


    setTimeout(() => {

        button.disabled = false;

        button.classList.remove('saved');


        if (label) {

            label.textContent =
                'Salvar perfil';

        } else {

            button.textContent =
                'Salvar perfil';
        }

    }, 2200);
}


// ========================================
// SALVAR PERFIL PELO CLIQUE
// ========================================

function handleSaveProfile() {

    console.log('Salvar perfil acionado');


    const data = {

        nome: getValue('nome'),

        idade: getValue('idade'),

        tipoSanguineo:
            getValue('tipoSanguineo'),

        peso:
            getValue('peso'),

        altura:
            getValue('altura'),

        treinador:
            getValue('treinador'),

        infoPessoais:
            getValue('infoPessoais')
    };


    console.log('Dados do perfil:', data);


    const sucesso =
        saveProfile(data);


    if (!sucesso) {

        alert(
            'Não foi possível salvar o perfil. Tente novamente.'
        );

        return;
    }


    showSuccess();

    console.log(
        'Perfil salvo com sucesso no localStorage.'
    );
}


// ========================================
// FINALIZAR SESSÃO
// ========================================

function handleEndSession() {

    // IMPORTANTE:
    // Não apagamos fitzonePerfil.
    //
    // Assim, quando o usuário entrar novamente,
    // o perfil continuará salvo.

    try {

        localStorage.removeItem(
            'generoFitZone'
        );

        localStorage.removeItem(
            'rememberedEmail'
        );

    } catch (error) {

        console.warn(
            'Não foi possível limpar os dados da sessão:',
            error
        );
    }


    window.location.href = 'index.html';
}


// ========================================
// PERSONAGEM / GÊNERO
// ========================================

function loadCharacter() {

    const characterImg =
        document.getElementById('characterImg');

    if (!characterImg) {
        return;
    }


    let genero = null;

    try {

        genero =
            localStorage.getItem('generoFitZone');

    } catch (error) {

    console.warn(
        'Não foi possível carregar o gênero:',
        error
    );
}
    
// APLICA O TEMA DE ACORDO COM O GÊNERO
if (genero === 'masculino') {
    document.body.classList.add('theme-masculino');
} else if (genero === 'feminino') {
    document.body.classList.add('theme-feminino');
}

    const imagens = {

        masculino:
            'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',

        feminino:
            'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
    };


    if (genero && imagens[genero]) {

        characterImg.src =
            imagens[genero];

        characterImg.style.display =
            'block';

    } else {

        characterImg.style.display =
            'none';
    }
}

// ========================================
// CALCULAR IMC
// ========================================
function calcularIMC() {

    const pesoInput =
        document.getElementById('peso');

    const alturaInput =
        document.getElementById('altura');

    const imcInput =
        document.getElementById('imc');

    const classificacao =
        document.getElementById('imcClassificacao');

    if (!pesoInput || !alturaInput || !imcInput) {
        return;
    }

    const peso =
        parseFloat(pesoInput.value);

    const alturaCm =
        parseFloat(alturaInput.value);

    if (
        isNaN(peso) ||
        isNaN(alturaCm) ||
        peso <= 0 ||
        alturaCm <= 0
    ) {
        imcInput.value = '';

        if (classificacao) {
            classificacao.textContent = '';
        }

        return;
    }

    const alturaMetros =
        alturaCm / 100;

    const imc =
        peso / (alturaMetros * alturaMetros);

    imcInput.value =
    imc.toFixed(1);

    if (!classificacao) {
        return;
    }
    
   classificacao.className = 'imc-classificacao';

if (imc < 18.5) {

    classificacao.textContent = 'Baixo peso';
    classificacao.classList.add('baixo-peso');

} else if (imc < 25) {

    classificacao.textContent = 'Peso adequado';
    classificacao.classList.add('peso-adequado');

} else if (imc < 30) {

    classificacao.textContent = 'Sobrepeso';
    classificacao.classList.add('sobrepeso');

} else if (imc < 35) {

    classificacao.textContent = 'Obesidade grau I';
    classificacao.classList.add('obesidade-1');

} else if (imc < 40) {

    classificacao.textContent = 'Obesidade grau II';
    classificacao.classList.add('obesidade-2');

} else {

    classificacao.textContent = 'Obesidade grau III';
    classificacao.classList.add('obesidade-3');
}
    
}
// ========================================
// INICIALIZAÇÃO
// ========================================

function initializeIMC() {

    const pesoInput =
        document.getElementById('peso');

    const alturaInput =
        document.getElementById('altura');

    calcularIMC();

    if (pesoInput) {
        pesoInput.addEventListener(
            'input',
            calcularIMC
        );
    }

    if (alturaInput) {
        alturaInput.addEventListener(
            'input',
            calcularIMC
        );
    }
}

function initializeProfileActions() {

    const saveButton =
        document.getElementById('btnSaveProfile');

    const endSessionButton =
        document.getElementById('btnEndSession');

    if (saveButton) {
        saveButton.addEventListener(
            'click',
            handleSaveProfile
        );
    }

    if (endSessionButton) {
        endSessionButton.addEventListener(
            'click',
            handleEndSession
        );
    }
}
// ========================================
// RESUMO DOS TREINOS
// ========================================

function loadTrainingSummary() {

    const totalElement =
        document.getElementById('totalWorkouts');

    const monthElement =
        document.getElementById('currentMonthWorkouts');

    const lastElement =
        document.getElementById('lastWorkout');
    
    const lastNameElement =
    document.getElementById('lastWorkoutName');

    // Se os cards não existirem, encerra
    if (!totalElement || !monthElement || !lastElement) {
        return;
    }

    // Busca o histórico salvo
    const historico =
        JSON.parse(
            localStorage.getItem('historicoTreinos')
        ) || [];

    // TOTAL DE TREINOS
    totalElement.textContent = historico.length;

    // DATA ATUAL
    const agora = new Date();

    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // TREINOS CONCLUÍDOS NESTE MÊS
    const treinosDoMes = historico.filter((treino) => {

        const dataTreino =
            new Date(treino.data);

        return (
            dataTreino.getMonth() === mesAtual &&
            dataTreino.getFullYear() === anoAtual
        );
    });

    monthElement.textContent =
        treinosDoMes.length;

    // ÚLTIMO TREINO
    if (historico.length > 0) {

        const ultimoTreino =
            historico[historico.length - 1];

        const dataUltimoTreino =
            new Date(ultimoTreino.data);

        lastElement.textContent =
            dataUltimoTreino.toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: '2-digit'
                }
            );
        
        lastNameElement.textContent =
    ultimoTreino.nome || 'Treino';

       } else {

        lastElement.textContent = '—';

        lastNameElement.textContent = '—';

    }

}


// ========================================
// HISTÓRICO DE TREINOS
// ========================================

function loadWorkoutHistory() {

    const historyList =
        document.getElementById('workoutHistoryList');

    if (!historyList) {
        return;
    }

    const historico =
        JSON.parse(
            localStorage.getItem('historicoTreinos')
        ) || [];

    historyList.innerHTML = '';

    if (historico.length === 0) {

        historyList.innerHTML = `
            <div class="history-empty">
                Nenhum treino concluído ainda.
            </div>
        `;

        return;
    }


    // ========================================
    // AGRUPAR TREINOS POR MÊS
    // ========================================

    const grupos = {};

    historico.forEach((treino, index) => {

        const dataTreino =
            new Date(treino.data);

        if (Number.isNaN(dataTreino.getTime())) {
            return;
        }

        const chave =
            `${dataTreino.getFullYear()}-${dataTreino.getMonth()}`;

        if (!grupos[chave]) {

            grupos[chave] = {
                ano: dataTreino.getFullYear(),
                mes: dataTreino.getMonth(),
                treinos: []
            };

        }

        grupos[chave].treinos.push({
            ...treino,
            originalIndex: index
        });

    });


    // ========================================
    // ORDENAR MESES
    // MAIS RECENTE PRIMEIRO
    // ========================================

    const gruposOrdenados =
        Object.values(grupos).sort((a, b) => {

            const dataA =
                new Date(a.ano, a.mes, 1);

            const dataB =
                new Date(b.ano, b.mes, 1);

            return dataB - dataA;

        });


    // ========================================
    // CRIAR CADA MÊS
    // ========================================

    gruposOrdenados.forEach((grupo, indiceGrupo) => {

        const monthGroup =
            document.createElement('div');

        monthGroup.className = 'history-month';


        // CABEÇALHO DO MÊS

        const monthHeader =
            document.createElement('button');

        monthHeader.type = 'button';
        monthHeader.className = 'history-month-header';


        const nomeMes =
            new Date(
                grupo.ano,
                grupo.mes,
                1
            )
            .toLocaleDateString(
                'pt-BR',
                {
                    month: 'long',
                    year: 'numeric'
                }
            )
            .toUpperCase();


        const quantidade =
            grupo.treinos.length;

        monthHeader.innerHTML = `
            <span class="history-month-title">
                <span class="history-month-arrow">
                    ${indiceGrupo === 0 ? '▼' : '▶'}
                </span>

                ${nomeMes}
            </span>

            <span class="history-month-count">
                ${quantidade}
                ${quantidade === 1 ? 'treino' : 'treinos'}
            </span>
        `;


        // CONTEÚDO DO MÊS

        const monthContent =
            document.createElement('div');

        monthContent.className =
            'history-month-content';

        if (indiceGrupo !== 0) {
            monthContent.hidden = true;
        }


        // TREINOS MAIS RECENTES PRIMEIRO

        const treinosOrdenados =
            [...grupo.treinos].sort((a, b) => {

                return (
                    new Date(b.data) -
                    new Date(a.data)
                );

            });


        treinosOrdenados.forEach((treino) => {

            const item =
                document.createElement('div');

            item.className = 'history-item';


            const nome =
                document.createElement('span');

            nome.className =
                'history-workout-name';

            nome.textContent =
                treino.nome || 'Treino';


            const data =
                document.createElement('span');

            data.className =
                'history-date';

            const dataTreino =
                new Date(treino.data);

            data.textContent =
                dataTreino.toLocaleDateString(
                    'pt-BR',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }
                );


         // ÁREA DA DIREITA: DATA + EXCLUIR

const actions =
    document.createElement('div');

actions.className =
    'history-item-actions';


// BOTÃO EXCLUIR

const deleteButton =
    document.createElement('button');

deleteButton.type = 'button';

deleteButton.className =
    'history-delete-btn';

deleteButton.innerHTML = '🗑';

deleteButton.title =
    'Excluir este registro';

deleteButton.setAttribute(
    'aria-label',
    'Excluir treino do histórico'
);


// EXCLUIR TREINO

deleteButton.addEventListener(
    'click',
    () => {

        openHistoryDeleteModal(
            treino.originalIndex,
            treino.nome || 'Treino',
            data.textContent
        );

    }
);

// BOTÃO VER DETALHES
const detailsButton =
    document.createElement('button');

detailsButton.type = 'button';

detailsButton.className =
    'history-details-btn';

detailsButton.textContent =
    'Ver detalhes';

detailsButton.setAttribute(
    'aria-label',
    `Ver detalhes do treino ${
        treino.nome || 'Treino'
    }`
);

// Registros antigos ainda não possuem
// o resumo detalhado dos exercícios
if (
    !Array.isArray(treino.exercicios)
) {
    detailsButton.disabled = true;

    detailsButton.title =
        'Detalhes não disponíveis para este registro';
}

    detailsButton.addEventListener(
    'click',
    () => {

        if (
            !Array.isArray(treino.exercicios)
        ) {
            return;
        }

        // Nome do treino
        document.getElementById(
            'historyDetailsName'
        ).textContent =
            treino.nome || 'Treino';


        // Data
        const dataDetalhes =
            new Date(treino.data);

        document.getElementById(
            'historyDetailsDate'
        ).textContent =
            dataDetalhes.toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }
            );


        // Quantidade de exercícios
        document.getElementById(
            'historyDetailsExercises'
        ).textContent =
            treino.totalExercicios ??
            treino.exercicios.length;


        // Séries
        document.getElementById(
            'historyDetailsSeries'
        ).textContent =
            `${treino.seriesConcluidas ?? 0} de ${treino.seriesTotal ?? 0}`;

        // ========================================
// PORCENTAGEM DE CONCLUSÃO
// ========================================

const seriesConcluidas =
    Number(
        treino.seriesConcluidas
    ) || 0;

const seriesTotal =
    Number(
        treino.seriesTotal
    ) || 0;

const porcentagemConclusao =
    seriesTotal > 0
        ? Math.round(
            (
                seriesConcluidas /
                seriesTotal
            ) * 100
        )
        : 0;

document.getElementById(
    'historyDetailsCompletion'
).textContent =
    `${porcentagemConclusao}%`;

const completionCard =
    document.getElementById(
        'historyDetailsCompletionCard'
    );

const conclusaoCompleta =
    porcentagemConclusao >= 100;

completionCard.classList.toggle(
    'complete',
    conclusaoCompleta
);

completionCard.classList.toggle(
    'incomplete',
    !conclusaoCompleta
);
        
        
    // ========================================
// STATUS GERAL DO TREINO
// ========================================

const exerciciosIncompletos =
    treino.exercicios.filter(
        exercicio =>
            !exercicio.completo
    ).length;

const treinoCompleto =
    exerciciosIncompletos === 0;

const statusBox =
    document.getElementById(
        'historyDetailsStatus'
    );

const statusIcon =
    document.getElementById(
        'historyDetailsStatusIcon'
    );

const statusTitle =
    document.getElementById(
        'historyDetailsStatusTitle'
    );

const statusMessage =
    document.getElementById(
        'historyDetailsStatusMessage'
    );

statusBox.classList.toggle(
    'complete',
    treinoCompleto
);

statusBox.classList.toggle(
    'incomplete',
    !treinoCompleto
);

if (treinoCompleto) {

    statusIcon.textContent = '✓';

    statusTitle.textContent =
        'Treino completo!';

    statusMessage.textContent =
        'Todos os exercícios foram realizados.';

} else {

    statusIcon.textContent = '✕';

    statusTitle.textContent =
        'Treino incompleto';

    statusMessage.textContent =
        exerciciosIncompletos === 1
            ? '1 exercício ficou incompleto.'
            : `${exerciciosIncompletos} exercícios ficaram incompletos.`;
}

        // Lista de exercícios
        const exerciseList =
            document.getElementById(
                'historyDetailsExerciseList'
            );

        exerciseList.innerHTML = '';


        treino.exercicios.forEach(
            (exercicio) => {

                const row =
                    document.createElement('div');

                row.className =
                    exercicio.completo
                        ? 'history-details-exercise complete'
                        : 'history-details-exercise incomplete';


                const status =
                    document.createElement('span');

                status.className =
                    'history-details-exercise-status';

                status.textContent =
                    exercicio.completo
                        ? '✓'
                        : '✕';


                const name =
                    document.createElement('strong');

                name.className =
                    'history-details-exercise-name';

                name.textContent =
                    exercicio.nome ||
                    'Exercício';


                const series =
                    document.createElement('span');

                series.className =
                    'history-details-exercise-series';

                series.textContent =
                    `${exercicio.seriesConcluidas ?? 0} de ${exercicio.seriesTotal ?? 0} séries`;


                row.appendChild(status);
                row.appendChild(name);
                row.appendChild(series);

                exerciseList.appendChild(row);
            }
        );


        // Abre o modal
        document.getElementById(
            'historyDetailsModalOverlay'
        ).classList.add('show');

    }
);

actions.appendChild(data);
actions.appendChild(detailsButton);
actions.appendChild(deleteButton);

item.appendChild(nome);
item.appendChild(actions);

monthContent.appendChild(item);

        });


        // ABRIR / FECHAR O MÊS

        monthHeader.addEventListener(
            'click',
            () => {

                const fechado =
                    monthContent.hidden;

                monthContent.hidden =
                    !fechado;

                const arrow =
                    monthHeader.querySelector(
                        '.history-month-arrow'
                    );

                arrow.textContent =
                    fechado ? '▼' : '▶';

            }
        );


        monthGroup.appendChild(monthHeader);
        monthGroup.appendChild(monthContent);

        historyList.appendChild(monthGroup);

    });

}

// ========================================
// MODAL DE EXCLUSÃO DO HISTÓRICO
// ========================================

let historyDeleteIndex = null;


function openHistoryDeleteModal(
    index,
    nome,
    data
) {

    const modal =
        document.getElementById(
            'historyDeleteModal'
        );

    const message =
        document.getElementById(
            'historyDeleteMessage'
        );

    if (!modal || !message) {
        return;
    }

    historyDeleteIndex = index;

    message.textContent =
        `Deseja excluir "${nome}" realizado em ${data}?`;

    modal.classList.add('show');

}


function closeHistoryDeleteModal() {

    const modal =
        document.getElementById(
            'historyDeleteModal'
        );

    if (!modal) {
        return;
    }

    modal.classList.remove('show');

    historyDeleteIndex = null;

}


function initializeHistoryDeleteModal() {

    const modal =
        document.getElementById(
            'historyDeleteModal'
        );

    const cancelButton =
        document.getElementById(
            'historyDeleteCancel'
        );

    const confirmButton =
        document.getElementById(
            'historyDeleteConfirm'
        );

    if (
        !modal ||
        !cancelButton ||
        !confirmButton
    ) {
        return;
    }


    // CANCELAR

    cancelButton.addEventListener(
        'click',
        closeHistoryDeleteModal
    );


    // CLICAR FORA DO MODAL

    modal.addEventListener(
        'click',
        (event) => {

            if (event.target === modal) {
                closeHistoryDeleteModal();
            }

        }
    );


    // CONFIRMAR EXCLUSÃO

    confirmButton.addEventListener(
        'click',
        () => {

            if (historyDeleteIndex === null) {
                return;
            }

            const historico =
                JSON.parse(
                    localStorage.getItem(
                        'historicoTreinos'
                    )
                ) || [];

            if (
                historyDeleteIndex < 0 ||
                historyDeleteIndex >= historico.length
            ) {
                closeHistoryDeleteModal();
                return;
            }

            historico.splice(
                historyDeleteIndex,
                1
            );

            localStorage.setItem(
                'historicoTreinos',
                JSON.stringify(historico)
            );

            closeHistoryDeleteModal();

            loadTrainingSummary();
            loadWorkoutHistory();

        }
    );

}

function initializeProfile() {

    console.log('PERFIL.JS INICIADO');

    fillForm();

    loadCharacter();

    initializeIMC();

  initializeProfileActions();

loadTrainingSummary();

loadWorkoutHistory();

initializeHistoryDeleteModal();

}

// ========================================
// EXECUTAR
// ========================================

if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        initializeProfile
    );

} else {

    initializeProfile();
}

// ========================================
// MODAL — DETALHES DO HISTÓRICO
// ========================================

document.addEventListener(
    'click',
    (event) => {

        const modalOverlay =
            document.getElementById(
                'historyDetailsModalOverlay'
            );

        if (!modalOverlay) {
            return;
        }


        // Fecha pelo botão X
        if (
            event.target.closest(
                '#historyDetailsCloseBtn'
            )
        ) {

            modalOverlay.classList.remove(
                'show'
            );

            return;
        }


        // Fecha clicando fora da janela
        if (
            event.target === modalOverlay
        ) {

            modalOverlay.classList.remove(
                'show'
            );
        }

    }
);
