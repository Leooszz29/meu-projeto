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
// APLICAR TEMA DO USUÁRIO
// ========================================

function aplicarTemaDesempenho() {
    try {
        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        const sessao =
            sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

        if (!sessao || !sessao.email) {
            return;
        }

        const genero =
            localStorage.getItem(
                `generoFitZone:${sessao.email.toLowerCase()}`
            );

        document.body.classList.remove(
            'theme-masculino',
            'theme-feminino'
        );

        if (genero === 'masculino') {
            document.body.classList.add('theme-masculino');
        } else if (genero === 'feminino') {
            document.body.classList.add('theme-feminino');
        }

    } catch (error) {
        console.warn(
            'Não foi possível aplicar o tema:',
            error
        );
    }
}

aplicarTemaDesempenho();

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
// GRÁFICO DE EVOLUÇÃO MENSAL
// ========================================

function carregarGraficoMensal() {
    const grafico = document.getElementById('trainingChart');

    if (!grafico) {
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
        console.warn('Erro ao carregar gráfico:', error);
    }

    const hoje = new Date();

    const botaoAtivo = document.querySelector(
        '.training-chart-filter.active'
    );

    const periodoSelecionado = Number(
        botaoAtivo?.dataset.months || 6
    );

    const quantidadeMeses = [3, 6, 12].includes(periodoSelecionado)
        ? periodoSelecionado
        : 6;

    const meses = Array.from(
        { length: quantidadeMeses },
        (_, indice) => {
            const data = new Date(
                hoje.getFullYear(),
                hoje.getMonth() - (quantidadeMeses - 1 - indice),
                1
            );

        return {
            ano: data.getFullYear(),
            mes: data.getMonth(),
            nome: data.toLocaleDateString('pt-BR', {
                month: 'short'
            }).replace('.', ''),
            total: 0
        };
    });

    historico.forEach((treino) => {
        if (!treino || !treino.data) {
            return;
        }

        const data = new Date(treino.data);

        if (Number.isNaN(data.getTime())) {
            return;
        }

        const mes = meses.find((item) =>
            item.ano === data.getFullYear() &&
            item.mes === data.getMonth()
        );

        if (mes) {
            mes.total++;
        }
    });

    const maiorTotal = Math.max(
        1,
        ...meses.map((mes) => mes.total)
    );

    grafico.innerHTML = '';

    meses.forEach((mes) => {
        const coluna = document.createElement('div');
        coluna.className = 'training-chart-column';

        const valor = document.createElement('span');
        valor.className = 'training-chart-value';
        valor.textContent = mes.total;

        const barra = document.createElement('div');
        barra.className = 'training-chart-bar';
        barra.style.height =
            `${Math.max(5, (mes.total / maiorTotal) * 150)}px`;

        const nome = document.createElement('span');
        nome.className = 'training-chart-month';
        nome.textContent = mes.nome;

        coluna.append(valor, barra, nome);
        grafico.appendChild(coluna);
    });

    grafico.setAttribute(
        'aria-label',
        'Treinos por mês: ' +
        meses.map((mes) => `${mes.nome}: ${mes.total}`).join(', ')
    );
}

carregarGraficoMensal();

// ========================================
// FILTROS DO GRÁFICO MENSAL
// ========================================

const botoesPeriodo = document.querySelectorAll(
    '.training-chart-filter'
);

botoesPeriodo.forEach((botao) => {
    botao.addEventListener('click', () => {

        botoesPeriodo.forEach((item) => {
            item.classList.remove('active');
            item.setAttribute('aria-pressed', 'false');
        });

        botao.classList.add('active');
        botao.setAttribute('aria-pressed', 'true');

        const descricao = document.getElementById(
            'chartDescription'
        );

        if (descricao) {
            const quantidade = Number(botao.dataset.months);

            descricao.textContent =
                `Acompanhe seus treinos nos últimos ${quantidade} meses.`;
        }

        carregarGraficoMensal();
    });
});

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

                status.innerHTML = completo
                    ? `
                        <span class="history-status-icon">✓</span>

                        <span class="history-status-content">
                            <span class="history-status-title">
                                Completo
                                <span class="history-status-separator">·</span>
                            </span>

                            <span class="history-status-series">
                                ${concluidas} de ${total} séries
                            </span>
                        </span>
                    `
                    : `
                        <span class="history-status-icon">●</span>

                        <span class="history-status-content">
                            <span class="history-status-title">
                                Parcial
                                <span class="history-status-separator">·</span>
                            </span>

                            <span class="history-status-series">
                                ${concluidas} de ${total} séries
                            </span>
                        </span>
                    `;
            } else {
                status.classList.add('legacy');
                status.textContent = 'Registro anterior';
            }

            const data = document.createElement('span');
            data.className = 'history-date';

            const dataFormatada = new Date(
                treino.data
            ).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            data.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <rect
                        x="3"
                        y="5"
                        width="18"
                        height="16"
                        rx="2"
                    />
                    <path d="M16 3v4" />
                    <path d="M8 3v4" />
                    <path d="M3 10h18" />
                </svg>

                <span>${dataFormatada}</span>
            `;

            // BOTÃO VER DETALHES
            const botaoDetalhes = document.createElement('button');

            botaoDetalhes.type = 'button';
            botaoDetalhes.className = 'history-details-btn';
            botaoDetalhes.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path
                        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    />
                    <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                    />
                </svg>

                <span>Ver detalhes</span>
            `;

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
            botaoExcluir.innerHTML = `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 10v6" />
                    <path d="M14 10v6" />
                </svg>
            `;

            botaoExcluir.setAttribute(
                'aria-label',
                `Excluir treino ${treino.nome || 'Treino'}`
            );

            botaoExcluir.title = 'Excluir treino';

            // IDENTIFICAR O TREINO A SER EXCLUÍDO
            botaoExcluir.dataset.originalIndex =
                String(treino.originalIndex);

            botaoExcluir.addEventListener('click', () => {
                const modal = document.getElementById(
                    'historyDeleteModal'
                );

                const mensagem = document.getElementById(
                    'historyDeleteMessage'
                );

                if (!modal || !mensagem) {
                    return;
                }

                mensagem.textContent =
                    `Deseja excluir "${treino.nome || 'Treino'}" realizado em ${dataFormatada}?`;

                modal.dataset.originalIndex =
                    botaoExcluir.dataset.originalIndex;

                modal.classList.add('show');
            });

            // BARRA DE AÇÕES DO HISTÓRICO
            const barraAcoes = document.createElement('div');

            barraAcoes.className =
                'history-item-actions';

            barraAcoes.append(
                data,
                botaoDetalhes,
                botaoExcluir
            );

            item.append(
                nome,
                status,
                barraAcoes
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

// ========================================
// CANCELAR EXCLUSÃO DO HISTÓRICO
// ========================================

const modalExcluirTreino = document.getElementById(
    'historyDeleteModal'
);

const botaoCancelarExclusao = document.getElementById(
    'historyDeleteCancel'
);

function fecharModalExclusao() {
    if (!modalExcluirTreino) {
        return;
    }

    modalExcluirTreino.classList.remove('show');
}

if (botaoCancelarExclusao) {
    botaoCancelarExclusao.addEventListener(
        'click',
        fecharModalExclusao
    );
}

// ========================================
// FECHAR EXCLUSÃO AO CLICAR FORA
// ========================================

if (modalExcluirTreino) {
    modalExcluirTreino.addEventListener(
        'click',
        (event) => {
            if (event.target === modalExcluirTreino) {
                fecharModalExclusao();
            }
        }
    );
}

// ========================================
// CONFIRMAR EXCLUSÃO DO TREINO
// ========================================

const botaoConfirmarExclusao = document.getElementById(
    'historyDeleteConfirm'
);

if (botaoConfirmarExclusao) {
    botaoConfirmarExclusao.addEventListener(
        'click',
        () => {           
            if (!modalExcluirTreino) {
                return;
            }

            const indiceTexto =
                modalExcluirTreino.dataset.originalIndex;

            if (
                indiceTexto === undefined ||
                !/^(0|[1-9]\d*)$/.test(indiceTexto)
            ) {
                return;
            }

            const indice = Number(indiceTexto);
            const chave = obterChaveHistoricoDesempenho();

            if (!chave) {
                return;
            }

            try {
                const dados = JSON.parse(
                    localStorage.getItem(chave)
                );

                if (
                    !Array.isArray(dados) ||
                    !Number.isSafeInteger(indice) ||
                    indice >= dados.length
                ) {
                    return;
                }

                dados.splice(indice, 1);

                localStorage.setItem(
                    chave,
                    JSON.stringify(dados)
                );

                fecharModalExclusao();

                delete modalExcluirTreino.dataset.originalIndex;

                carregarResumoDesempenho();
                carregarGraficoMensal();
                carregarIndicadoresHistorico();
                exibirHistoricoDesempenho();

            } catch (error) {
                console.error(
                    'Erro ao excluir treino:',
                    error
                );

                alert(
                    'Não foi possível excluir o treino. Tente novamente.'
                );
            }
        }
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
