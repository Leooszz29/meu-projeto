// ========================================
// DESEMPENHO — CONTROLE DE SESSÃO
// ========================================

// ========================================
// VERIFICAR SESSÃO ATIVA
// ========================================

function verificarSessaoDesempenho() {
    try {
        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        const sessao =
            sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

        if (
            !sessao ||
            typeof sessao.email !== 'string' ||
            !sessao.email.trim()
        ) {
            window.location.replace('login.html');
        }
    } catch (error) {
        console.warn(
            'Não foi possível verificar a sessão:',
            error
        );

        window.location.replace('login.html');
    }
}

verificarSessaoDesempenho();

// ========================================
// CHAVE DO HISTÓRICO POR USUÁRIO
// ========================================

function obterChaveHistoricoDesempenho() {
    try {
        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        const sessao =
            sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

        if (
            !sessao ||
            typeof sessao.email !== 'string' ||
            !sessao.email.trim()
        ) {
            return null;
        }

        return `historicoTreinos:${sessao.email.toLowerCase()}`;

    } catch (error) {
        console.warn(
            'Não foi possível identificar o histórico:',
            error
        );

        return null;
    }
}

// ========================================
// CARREGAR RESUMO DO DESEMPENHO
// ========================================

function carregarResumoDesempenho() {
    const totalElement = document.getElementById('totalWorkouts');
    const monthElement = document.getElementById('currentMonthWorkouts');
    const lastElement = document.getElementById('lastWorkout');
    const lastNameElement = document.getElementById('lastWorkoutName');

    if (!totalElement || !monthElement || !lastElement || !lastNameElement) {
        return;
    }

    const chave = obterChaveHistoricoDesempenho();

    if (!chave) {
        return;
    }

    let historico = [];

    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        historico = Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.warn('Não foi possível carregar o histórico:', error);
    }

    const treinosValidos = historico.filter((treino) => {
        return treino &&
            treino.data &&
            !Number.isNaN(new Date(treino.data).getTime());
    });

    totalElement.textContent = treinosValidos.length;

    const agora = new Date();

    const treinosMes = treinosValidos.filter((treino) => {
        const data = new Date(treino.data);

        return data.getMonth() === agora.getMonth() &&
            data.getFullYear() === agora.getFullYear();
    });

    monthElement.textContent = treinosMes.length;

    if (treinosValidos.length > 0) {
        const ultimoTreino = [...treinosValidos].sort(
            (a, b) => new Date(b.data) - new Date(a.data)
        )[0];

        const data = new Date(ultimoTreino.data);

        lastElement.textContent = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });

        lastNameElement.textContent = ultimoTreino.nome || 'Treino';
    } else {
        lastElement.textContent = '—';
        lastNameElement.textContent = '—';
    }
}

carregarResumoDesempenho();

// ========================================
// CARREGAR INDICADORES DO HISTÓRICO
// ========================================

function carregarIndicadoresHistorico() {
    const chave = obterChaveHistoricoDesempenho();

    if (!chave) {
        return;
    }

    let historico = [];

    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        historico = Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.warn('Erro ao carregar indicadores:', error);
    }

    const treinosValidos = historico.filter((treino) => {
        return treino &&
            treino.data &&
            !Number.isNaN(new Date(treino.data).getTime());
    });

    const completos = treinosValidos.filter((treino) => {
        const total = Number(treino.seriesTotal);
        const concluidas = Number(treino.seriesConcluidas);

        return Array.isArray(treino.exercicios) &&
            Number.isFinite(total) &&
            Number.isFinite(concluidas) &&
            total > 0 &&
            concluidas >= 0 &&
            concluidas >= total;
    }).length;

    const parciais = treinosValidos.filter((treino) => {
        const total = Number(treino.seriesTotal);
        const concluidas = Number(treino.seriesConcluidas);

        return Array.isArray(treino.exercicios) &&
            Number.isFinite(total) &&
            Number.isFinite(concluidas) &&
            total > 0 &&
            concluidas >= 0 &&
            concluidas < total;
    }).length;

    const detalhados = completos + parciais;

    const taxa = detalhados > 0
        ? Math.round((completos / detalhados) * 100)
        : 0;

    const indicadores = {
        historyTotal: treinosValidos.length,
        historyComplete: completos,
        historyPartial: parciais,
        historyCompletionRate: `${taxa}%`
    };

    Object.entries(indicadores).forEach(([id, valor]) => {
        const elemento = document.getElementById(id);

        if (elemento) {
            elemento.textContent = valor;
        }
    });

    const barra = document.getElementById('historyCompletionBar');

    if (barra) {
        barra.style.width = `${taxa}%`;
    }
}

carregarIndicadoresHistorico();

// ========================================
// ORGANIZAR HISTÓRICO POR MÊS
// ========================================

function obterHistoricoAgrupado() {
    const chave = obterChaveHistoricoDesempenho();

    if (!chave) {
        return [];
    }

    let historico = [];

    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        historico = Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.warn('Erro ao organizar histórico:', error);
        return [];
    }

    const grupos = {};

    historico.forEach((treino, indice) => {
        if (!treino || !treino.data) {
            return;
        }

        const data = new Date(treino.data);

        if (Number.isNaN(data.getTime())) {
            return;
        }

        const chaveMes = `${data.getFullYear()}-${data.getMonth()}`;

        if (!grupos[chaveMes]) {
            grupos[chaveMes] = {
                ano: data.getFullYear(),
                mes: data.getMonth(),
                treinos: []
            };
        }

        grupos[chaveMes].treinos.push({
            ...treino,
            originalIndex: indice
        });
    });

    return Object.values(grupos)
        .sort((a, b) =>
            b.ano - a.ano || b.mes - a.mes
        )
        .map((grupo) => ({
            ...grupo,
            treinos: grupo.treinos.sort(
                (a, b) => new Date(b.data) - new Date(a.data)
            )
        }));
}

// ========================================
// EXIBIR HISTÓRICO POR MÊS
// ========================================

function exibirHistoricoDesempenho() {
    const lista = document.getElementById('workoutHistoryList');

    if (!lista) {
        return;
    }

    const grupos = obterHistoricoAgrupado();

    lista.replaceChildren();

    if (grupos.length === 0) {
        const mensagem = document.createElement('div');
        mensagem.className = 'history-empty';
        mensagem.textContent = 'Nenhum treino concluído ainda.';

        lista.appendChild(mensagem);
        return;
    }

    grupos.forEach((grupo, indice) => {
        const container = document.createElement('div');
        container.className = 'history-month';

        const cabecalho = document.createElement('button');
        cabecalho.type = 'button';
        cabecalho.className = 'history-month-header';

        const nomeMes = new Date(
            grupo.ano,
            grupo.mes,
            1
        ).toLocaleDateString('pt-BR', {
            month: 'long',
            year: 'numeric'
        }).toUpperCase();

        const titulo = document.createElement('span');
        titulo.className = 'history-month-title';

        const seta = document.createElement('span');
        seta.className = 'history-month-arrow';
        seta.textContent = indice === 0 ? '▼' : '▶';

        titulo.append(seta, ` ${nomeMes}`);

        const quantidade = document.createElement('span');
        quantidade.className = 'history-month-summary';
        quantidade.textContent =
            `${grupo.treinos.length} ${
                grupo.treinos.length === 1 ? 'treino' : 'treinos'
            }`;

        cabecalho.append(titulo, quantidade);

        const conteudo = document.createElement('div');
        conteudo.className = 'history-month-content';
        conteudo.hidden = indice !== 0;

        cabecalho.setAttribute(
            'aria-expanded',
            String(!conteudo.hidden)
        );

        cabecalho.addEventListener('click', () => {
            conteudo.hidden = !conteudo.hidden;

            seta.textContent = conteudo.hidden ? '▶' : '▼';

            cabecalho.setAttribute(
                'aria-expanded',
                String(!conteudo.hidden)
            );
        });

        // ========================================
        // EXIBIR TREINOS DO MÊS
        // ========================================

        grupo.treinos.forEach((treino) => {
            const item = document.createElement('div');
            item.className = 'history-item';

            const nome = document.createElement('span');
            nome.className = 'history-workout-name';
            nome.textContent = treino.nome || 'Treino';

            const status = document.createElement('div');
            status.className = 'history-workout-status';

            const total = Number(treino.seriesTotal);
            const concluidas = Number(treino.seriesConcluidas);

            const possuiDetalhes =
                Array.isArray(treino.exercicios) &&
                Number.isFinite(total) &&
                Number.isFinite(concluidas) &&
                total > 0 &&
                concluidas >= 0;

            if (possuiDetalhes) {
                const completo = concluidas >= total;

                status.classList.add(
                    completo ? 'complete' : 'incomplete'
                );

                status.textContent = completo
                    ? `✓ Completo · ${concluidas} de ${total} séries`
                    : `● Parcial · ${concluidas} de ${total} séries`;
            } else {
                status.classList.add('legacy');
                status.textContent = 'Registro anterior';
            }

            const data = document.createElement('span');
            data.className = 'history-date';

            data.textContent = new Date(
                treino.data
            ).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            // BOTÃO VER DETALHES
            const botaoDetalhes = document.createElement('button');

            botaoDetalhes.type = 'button';
            botaoDetalhes.className = 'history-details-btn';
            botaoDetalhes.textContent = 'Ver detalhes';

            botaoDetalhes.setAttribute(
                'aria-label',
                `Ver detalhes do treino ${treino.nome || 'Treino'}`
            );

            // Registros antigos não possuem detalhes
            botaoDetalhes.disabled = !possuiDetalhes;

            if (!possuiDetalhes) {
                botaoDetalhes.title =
                    'Detalhes não disponíveis para este registro';
            }

            botaoDetalhes.addEventListener('click', () => {
                const janela = document.getElementById(
                    'historyDetailsModalOverlay'
                );

                if (!janela || !possuiDetalhes) {
                    return;
                }

                const titulo = document.getElementById(
                    'historyDetailsName'
                );

                const dataDetalhes = document.getElementById(
                    'historyDetailsDate'
                );

                if (titulo) {
                    titulo.textContent = treino.nome || 'Treino';
                }

                if (dataDetalhes) {
                    dataDetalhes.textContent = new Date(
                        treino.data
                    ).toLocaleDateString('pt-BR');
                }

                // ========================================
                // STATUS GERAL DO TREINO
                // ========================================

                const resumoStatus = document.getElementById(
                    'historyDetailsStatus'
                );

                const tituloStatus = document.getElementById(
                    'historyDetailsStatusTitle'
                );

                const mensagemStatus = document.getElementById(
                    'historyDetailsStatusMessage'
                );

                const iconeStatus = document.getElementById(
                    'historyDetailsStatusIcon'
                );

                const seriesTotalStatus = Math.max(
                    0,
                    Number(treino.seriesTotal) || 0
                );

                const seriesConcluidasStatus = Math.max(
                    0,
                    Math.min(
                        Number(treino.seriesConcluidas) || 0,
                        seriesTotalStatus
                    )
                );

                const treinoCompletoStatus =
                    seriesTotalStatus > 0 &&
                    seriesConcluidasStatus >= seriesTotalStatus;

                if (resumoStatus) {
                    resumoStatus.classList.toggle(
                        'complete',
                        treinoCompletoStatus
                    );

                    resumoStatus.classList.toggle(
                        'incomplete',
                        !treinoCompletoStatus
                    );
                }

                if (iconeStatus) {
                    iconeStatus.textContent =
                        treinoCompletoStatus ? '✓' : '!';
                }

                if (tituloStatus) {
                    tituloStatus.textContent =
                        treinoCompletoStatus
                            ? 'Treino completo!'
                            : 'Treino parcial';
                }

                if (mensagemStatus) {
                    mensagemStatus.textContent =
                        treinoCompletoStatus
                            ? 'Todos os exercícios foram realizados.'
                            : `${seriesConcluidasStatus} de ${seriesTotalStatus} séries concluídas.`;
                }

                // ========================================
                // ATUALIZAR CARTÃO DE CONCLUSÃO
                // ========================================

                const contadorConclusao = document.getElementById(
                    'historyDetailsCompletion'
                );

                const cartaoConclusao = document.getElementById(
                    'historyDetailsCompletionCard'
                );

                const iconeProgresso = document.getElementById(
                    'historyDetailsProgressIcon'
                );

                const totalSeriesConclusao = Math.max(
                    0,
                    Number(treino.seriesTotal) || 0
                );

                const realizadasConclusao = Math.max(
                    0,
                    Math.min(
                        Number(treino.seriesConcluidas) || 0,
                        totalSeriesConclusao
                    )
                );

                const porcentagemConclusao = totalSeriesConclusao > 0
                    ? Math.round(
                        (realizadasConclusao / totalSeriesConclusao) * 100
                    )
                    : 0;

                const conclusaoCompleta =
                    totalSeriesConclusao > 0 &&
                    realizadasConclusao >= totalSeriesConclusao;

                if (contadorConclusao) {
                    contadorConclusao.textContent =
                        `${porcentagemConclusao}%`;
                }

                if (cartaoConclusao) {
                    cartaoConclusao.classList.toggle(
                        'complete',
                        conclusaoCompleta
                    );

                    cartaoConclusao.classList.toggle(
                        'incomplete',
                        !conclusaoCompleta
                    );
                }

                if (iconeProgresso) {
                    iconeProgresso.style.setProperty(
                        '--progress',
                        `${porcentagemConclusao * 3.6}deg`
                    );
                }

                // ATUALIZAR CARTÃO DE SÉRIES CONCLUÍDAS
                const contadorSeries = document.getElementById(
                    'historyDetailsSeries'
                );

                if (contadorSeries) {
                    const totalSeries = Math.max(
                        0,
                        Number(treino.seriesTotal) || 0
                    );

                    const seriesRealizadas = Math.max(
                        0,
                        Math.min(
                            Number(treino.seriesConcluidas) || 0,
                            totalSeries
                        )
                    );

                    contadorSeries.textContent =
                        `${seriesRealizadas} de ${totalSeries}`;
                }

                // ATUALIZAR CARTÃO DE EXERCÍCIOS
                const contadorExercicios = document.getElementById(
                    'historyDetailsExerciseCount'
                );

                if (contadorExercicios) {
                    const exerciciosRegistrados =
                        Array.isArray(treino.exercicios)
                            ? treino.exercicios
                            : [];

                    const totalInformado = Number(
                        treino.totalExercicios
                    );

                    const totalExercicios =
                        treino.totalExercicios != null &&
                        Number.isFinite(totalInformado) &&
                        totalInformado >= 0
                            ? totalInformado
                            : exerciciosRegistrados.length;

                    contadorExercicios.textContent = totalExercicios;
                }

                // LISTA DE EXERCÍCIOS DO TREINO
                const listaExercicios = document.getElementById(
                    'historyDetailsExercises'
                );

                if (listaExercicios) {
                    listaExercicios.replaceChildren();

                    const exercicios = Array.isArray(treino.exercicios)
                        ? treino.exercicios
                        : [];

                    if (exercicios.length === 0) {
                        const mensagem = document.createElement('p');
                        mensagem.textContent =
                            'Nenhum detalhe de exercício disponível.';
                        listaExercicios.appendChild(mensagem);
                    }

                    exercicios.forEach((exercicio, indice) => {
                        const itemExercicio = document.createElement('div');

                        const nomeExercicio = document.createElement('strong');
                        nomeExercicio.textContent =
                            `${indice + 1}. ${exercicio.nome || 'Exercício'}`;

                        const total = Math.max(
                            0,
                            Number(exercicio.seriesTotal) || 0
                        );

                        const concluidas = Math.max(
                            0,
                            Math.min(
                                Number(exercicio.seriesConcluidas) || 0,
                                total
                            )
                        );

                        itemExercicio.className =
                            concluidas === total && total > 0
                                ? 'history-details-exercise complete'
                                : 'history-details-exercise incomplete';

                        nomeExercicio.className =
                            'history-details-exercise-name';

                        const informacao = document.createElement('span');
                        informacao.className =
                            'history-details-exercise-series';

                        informacao.textContent =
                            `${concluidas} de ${total} séries`;

                        const iconeStatus = document.createElement('span');
                        iconeStatus.className =
                            'history-details-exercise-status';

                        iconeStatus.textContent =
                            concluidas === total && total > 0
                                ? '✓'
                                : '✕';

                        itemExercicio.append(
                            iconeStatus,
                            nomeExercicio,
                            informacao
                        );

                        listaExercicios.appendChild(itemExercicio);
                    });
                }

                janela.hidden = false;
                janela.classList.add('show');

                document.getElementById(
                    'historyDetailsCloseBtn'
                )?.focus();
            });

            // BOTÃO EXCLUIR TREINO
            const botaoExcluir = document.createElement('button');

            botaoExcluir.type = 'button';
            botaoExcluir.className = 'history-delete-btn';
            botaoExcluir.textContent = '🗑';

            botaoExcluir.setAttribute(
                'aria-label',
                `Excluir treino ${treino.nome || 'Treino'}`
            );

            botaoExcluir.title = 'Excluir treino';

            item.append(
                nome,
                status,
                data,
                botaoDetalhes,
                botaoExcluir
            );
            conteudo.appendChild(item);
        });

        container.append(cabecalho, conteudo);
        lista.appendChild(container);
    });
}

exibirHistoricoDesempenho();

// ========================================
// FECHAR JANELA DE DETALHES
// ========================================

const janelaDetalhes = document.getElementById(
    'historyDetailsModalOverlay'
);

const botaoFecharDetalhes = document.getElementById(
    'historyDetailsCloseBtn'
);

function fecharJanelaDetalhes() {
    if (!janelaDetalhes) {
        return;
    }

    janelaDetalhes.classList.remove('show');
    janelaDetalhes.hidden = true;
}

if (botaoFecharDetalhes) {
    botaoFecharDetalhes.addEventListener(
        'click',
        fecharJanelaDetalhes
    );
}

// ========================================
// BOTÃO INFERIOR - FECHAR DETALHES
// ========================================

const botaoFecharRodape = document.getElementById(
    'historyDetailsFooterBtn'
);

if (botaoFecharRodape) {
    botaoFecharRodape.addEventListener(
        'click',
        fecharJanelaDetalhes
    );
}

const btnEndSession =
    document.getElementById('btnEndSession');

if (btnEndSession) {
    btnEndSession.addEventListener(
        'click',
        () => {
            try {
                localStorage.removeItem('fitzoneSessao');
            } catch (error) {
                console.warn(
                    'Não foi possível encerrar a sessão:',
                    error
                );
            }

            window.location.href = 'login.html';
        }
    );
}
