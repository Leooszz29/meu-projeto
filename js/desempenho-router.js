
"use strict";

/* =========================================
   FITZONE - DESEMPENHO SUPABASE
   Indicadores, conquistas e historico
========================================= */

(async function iniciarDesempenhoFitZone() {

    function finalizarCarregamentoDesempenho() {
        document.body.classList.add(
            'fitzone-desempenho-ready'
        );

        document.getElementById(
            'fitzoneDesempenhoLoader'
        )?.remove();
    }

    function mostrarErroCarregamentoDesempenho() {
        const loader = document.getElementById(
            'fitzoneDesempenhoLoader'
        );

        const mensagem = loader?.querySelector('p');

        if (mensagem) {
            mensagem.textContent =
                'Não foi possível carregar o desempenho. ' +
                'Verifique sua conexão e atualize a página.';
        }

        loader?.querySelector(
            '.fitzone-desempenho-spinner'
        )?.remove();
    }

    const pagina = document.querySelector('.page');

    function mostrarAvisoOfflineDesempenho() {
        const aviso = document.createElement('main');

        aviso.style.cssText =
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

        aviso.append(
            titulo,
            mensagem,
            orientacao,
            botao
        );

        document.body.replaceChildren(aviso);
    }

    try {
        const identidade =
            await obterIdentidadeSupabaseFitZone();

        if (!identidade?.id) {
            if (navigator.onLine === false) {
                mostrarAvisoOfflineDesempenho();
                return;
            }

            window.location.replace('login.html');
            return;
        }

        const cliente = inicializarSupabaseFitZone();

        if (!cliente) {
            throw new Error('Supabase indisponível.');
        }

        /* =========================================
           MONITORAR SESSAO SUPABASE
        ========================================= */

        cliente.auth.onAuthStateChange(
            (evento, sessaoAtual) => {
                const idUsuarioAtual =
                    sessaoAtual?.user?.id;

                if (
                    evento === 'SIGNED_OUT' ||
                    (
                        evento === 'SIGNED_IN' &&
                        idUsuarioAtual !== identidade.id
                    )
                ) {
                    window.location.replace('login.html');
                }
            }
        );

        /* =========================================
           TEMA DESEMPENHO SUPABASE - NUVEM
        ========================================= */

        await sincronizarTemaSupabaseFitZone(identidade);

        /* =========================================
           HISTORICO DO USUARIO AUTENTICADO
        ========================================= */

        const { data, error } = await cliente
            .from('fitzone_historico_treinos')
            .select(
                'id, data_local, dados, concluido_em'
            )
            .eq('usuario_id', identidade.id)
            .order('concluido_em', {
                ascending: false
            });

        if (error) {
            throw error;
        }

        const historico = Array.isArray(data)
            ? data
            : [];

        /* =========================================
           CONTADORES PRINCIPAIS
        ========================================= */

        const hoje = new Date();

        const mesAtual =
            hoje.getFullYear() + '-' +
            String(hoje.getMonth() + 1).padStart(2, '0');

        const treinosMes = historico.filter(
            registro =>
                typeof registro.data_local === 'string' &&
                registro.data_local.startsWith(mesAtual)
        );

        document.getElementById(
            'totalWorkouts'
        ).textContent = String(historico.length);

        document.getElementById(
            'currentMonthWorkouts'
        ).textContent = String(treinosMes.length);

        const campoUltimo =
            document.getElementById('lastWorkout');

        const campoNome =
            document.getElementById('lastWorkoutName');

        if (historico.length > 0) {
            const ultimo = historico[0];

            const dataLocal = ultimo.data_local;

            if (
                typeof dataLocal === 'string' &&
                /^\d{4}-\d{2}-\d{2}$/.test(dataLocal)
            ) {
                const [ano, mes, dia] =
                    dataLocal.split('-');

                campoUltimo.textContent =
                    `${dia}/${mes}/${ano}`;
            } else {
                campoUltimo.textContent = '—';
            }

            campoNome.textContent =
                ultimo.dados?.nome ||
                ultimo.dados?.nomeTreino ||
                'Treino';
        } else {
            campoUltimo.textContent = '—';
            campoNome.textContent = 'Nenhum treino ainda';
        }

        /* =========================================
           SEQUENCIA SEMANAL - SUPABASE
        ========================================= */

        function obterDataLocalTreino(registro) {
            const data = registro?.data_local;

            if (
                typeof data !== 'string' ||
                !/^\d{4}-\d{2}-\d{2}$/.test(data)
            ) {
                return null;
            }

            const [ano, mes, dia] = data.split('-').map(Number);
            const resultado = new Date(ano, mes - 1, dia);

            if (
                resultado.getFullYear() !== ano ||
                resultado.getMonth() !== mes - 1 ||
                resultado.getDate() !== dia
            ) {
                return null;
            }

            return resultado;
        }

        function inicioSemanaTreino(data) {
            const resultado = new Date(
                data.getFullYear(),
                data.getMonth(),
                data.getDate()
            );

            const diasDesdeSegunda =
                (resultado.getDay() + 6) % 7;

            resultado.setDate(
                resultado.getDate() - diasDesdeSegunda
            );

            return resultado;
        }

        function chaveSemanaTreino(data) {
            return [
                data.getFullYear(),
                data.getMonth(),
                data.getDate()
            ].join('-');
        }

        const semanasComTreinos = new Set();

        const hojeSequencia = new Date();
        hojeSequencia.setHours(23, 59, 59, 999);

        historico.forEach(registro => {
            const data = obterDataLocalTreino(registro);

            if (!data || data > hojeSequencia) {
                return;
            }

            semanasComTreinos.add(
                chaveSemanaTreino(inicioSemanaTreino(data))
            );
        });

        const referenciaSemana =
            inicioSemanaTreino(hojeSequencia);

        if (
            !semanasComTreinos.has(
                chaveSemanaTreino(referenciaSemana)
            )
        ) {
            referenciaSemana.setDate(
                referenciaSemana.getDate() - 7
            );
        }

        let sequenciaSemanal = 0;

        while (
            semanasComTreinos.has(
                chaveSemanaTreino(referenciaSemana)
            )
        ) {
            sequenciaSemanal++;

            referenciaSemana.setDate(
                referenciaSemana.getDate() - 7
            );
        }

        const contadorSequencia =
            document.getElementById('trainingStreakCount');

        const mensagemSequencia =
            document.getElementById('trainingStreakMessage');

        if (contadorSequencia) {
            contadorSequencia.textContent =
                String(sequenciaSemanal);
        }

        if (mensagemSequencia) {
            if (sequenciaSemanal === 0) {
                mensagemSequencia.textContent =
                    'Registre seus treinos para iniciar sua sequência!';
            } else if (sequenciaSemanal === 1) {
                mensagemSequencia.textContent =
                    'Você completou 1 semana de treinos. Continue assim!';
            } else {
                mensagemSequencia.textContent =
                    `🔥 Excelente! Você está há ${sequenciaSemanal} ` +
                    'semanas consecutivas treinando!';
            }
        }

        /* =========================================
           COMPARACAO MENSAL - SUPABASE
        ========================================= */

        const inicioMesAnterior = new Date(
            hoje.getFullYear(),
            hoje.getMonth() - 1,
            1
        );

        const anoAnterior =
            inicioMesAnterior.getFullYear();

        const mesAnterior =
            String(
                inicioMesAnterior.getMonth() + 1
            ).padStart(2, '0');

        const prefixoAnterior =
            `${anoAnterior}-${mesAnterior}`;

        const totalAtual = treinosMes.length;

        const totalAnterior = historico.filter(registro =>
            typeof registro.data_local === 'string' &&
            registro.data_local.startsWith(prefixoAnterior)
        ).length;

        const campoAnterior =
            document.getElementById('previousMonthTotal');

        const campoAtual =
            document.getElementById('currentMonthTotal');

        const campoPercentual =
            document.getElementById('monthlyComparisonPercent');

        const campoMensagem =
            document.getElementById('monthlyComparisonMessage');

        const resultadoComparacao =
            document.getElementById('monthlyComparisonResult');

        if (campoAnterior) {
            campoAnterior.textContent = String(totalAnterior);
        }

        if (campoAtual) {
            campoAtual.textContent = String(totalAtual);
        }

        if (
            campoPercentual &&
            campoMensagem &&
            resultadoComparacao
        ) {
            resultadoComparacao.classList.remove(
                'positive',
                'negative',
                'neutral'
            );

            if (totalAnterior === 0) {
                campoPercentual.textContent = '—';

                campoMensagem.textContent =
                    totalAtual > 0
                        ? 'Primeiros treinos registrados neste mês.'
                        : 'Nenhum treino registrado nos dois meses.';

                resultadoComparacao.classList.add('neutral');
            } else {
                const variacao =
                    ((totalAtual - totalAnterior) /
                        totalAnterior) * 100;

                const percentual =
                    Math.abs(variacao).toLocaleString(
                        'pt-BR',
                        { maximumFractionDigits: 1 }
                    );

                if (variacao > 0) {
                    campoPercentual.textContent =
                        `+${percentual}%`;

                    campoMensagem.textContent =
                        'Mais treinos que no mês anterior.';

                    resultadoComparacao.classList.add('positive');
                } else if (variacao < 0) {
                    campoPercentual.textContent =
                        `-${percentual}%`;

                    campoMensagem.textContent =
                        'Menos treinos que no mês anterior.';

                    resultadoComparacao.classList.add('negative');
                } else {
                    campoPercentual.textContent = '0%';

                    campoMensagem.textContent =
                        'Mesma quantidade de treinos do mês anterior.';

                    resultadoComparacao.classList.add('neutral');
                }
            }
        }

        /* =========================================
           META MENSAL - SUPABASE
        ========================================= */

        let metaMensalConfirmada =
            FITZONE_PREFERENCIAS_PADRAO.metaMensal;

        let metaMensalDisponivel = false;

        const campoMeta =
            document.getElementById('monthlyGoalInput');

        const botaoDiminuirMeta =
            document.getElementById('decreaseMonthlyGoal');

        const botaoAumentarMeta =
            document.getElementById('increaseMonthlyGoal');

        const botaoSalvarMeta =
            document.getElementById('saveMonthlyGoal');

        const contadorMeta =
            document.getElementById('monthlyGoalCount');

        const percentualMeta =
            document.getElementById('monthlyGoalPercent');

        const barraMeta =
            document.getElementById('monthlyGoalBar');

        const progressoMeta =
            document.getElementById('monthlyGoalProgress');

        const mensagemMeta =
            document.getElementById('monthlyGoalMessage');

        function validarValorMeta(valor) {
            const meta = Number(valor);

            return Number.isInteger(meta) &&
                meta >= 1 &&
                meta <= 100;
        }

        function atualizarMetaSupabase() {
            if (!campoMeta) {
                return;
            }

            const meta = Number(campoMeta.value);

            if (!validarValorMeta(meta)) {
                return;
            }

            const realizados = treinosMes.length;

            const porcentagem = Math.min(
                100,
                Math.round((realizados / meta) * 100)
            );

            const faltam = Math.max(
                0,
                meta - realizados
            );

            const concluida = realizados >= meta;

            if (contadorMeta) {
                contadorMeta.textContent =
                    `${realizados} / ${meta} treinos`;
            }

            if (percentualMeta) {
                percentualMeta.textContent =
                    `${porcentagem}%`;
            }

            if (barraMeta) {
                barraMeta.style.width =
                    `${porcentagem}%`;
            }

            if (progressoMeta) {
                progressoMeta.setAttribute(
                    'aria-valuenow',
                    String(porcentagem)
                );

                progressoMeta.classList.toggle(
                    'monthly-goal-completed',
                    concluida
                );
            }

            if (mensagemMeta) {
                mensagemMeta.classList.toggle(
                    'monthly-goal-success',
                    concluida
                );

                mensagemMeta.textContent =
                    concluida
                        ? '🏆 Parabéns! Você atingiu sua meta mensal!'
                        : `Faltam ${faltam} treinos para atingir sua meta!`;
            }
        }


        /* =========================================
           CARREGAR META SALVA NO SUPABASE
        ========================================= */

        if (campoMeta) {
            try {
                const preferencias =
                    await carregarPreferenciasSupabaseFitZone(
                        identidade.id
                    );

                metaMensalConfirmada =
                    preferencias.metaMensal;

                metaMensalDisponivel = true;

            } catch (erro) {
                console.warn(
                    'Não foi possível sincronizar a meta mensal:',
                    erro
                );

                const preferenciasLocais =
                    obterPreferenciasContingenciaFitZone(
                        identidade.id
                    );

                metaMensalConfirmada =
                    preferenciasLocais.metaMensal;

                metaMensalDisponivel = false;
            }

            campoMeta.value =
                String(metaMensalConfirmada);

            atualizarMetaSupabase();

            if (!metaMensalDisponivel) {
                campoMeta.disabled = true;

                if (botaoDiminuirMeta) {
                    botaoDiminuirMeta.disabled = true;
                }

                if (botaoAumentarMeta) {
                    botaoAumentarMeta.disabled = true;
                }

                if (botaoSalvarMeta) {
                    botaoSalvarMeta.disabled = true;
                }

                if (mensagemMeta) {
                    mensagemMeta.textContent =
                        'Não foi possível sincronizar a meta. ' +
                        'Atualize a página para tentar novamente.';
                }
            }
        }

        /* =========================================
           CONTROLES DA META
        ========================================= */

        if (botaoDiminuirMeta && campoMeta) {
            botaoDiminuirMeta.addEventListener(
                'click',
                () => {
                    const atual = Number(campoMeta.value);

                    campoMeta.value =
                        validarValorMeta(atual)
                            ? String(Math.max(1, atual - 1))
                            : '12';
                }
            );
        }

        if (botaoAumentarMeta && campoMeta) {
            botaoAumentarMeta.addEventListener(
                'click',
                () => {
                    const atual = Number(campoMeta.value);

                    campoMeta.value =
                        validarValorMeta(atual)
                            ? String(Math.min(100, atual + 1))
                            : '12';
                }
            );
        }

        /* =========================================
           SALVAR META POR CONTA SUPABASE
        ========================================= */

        if (botaoSalvarMeta && campoMeta) {
            botaoSalvarMeta.addEventListener(
                'click',
                async () => {
                    if (
                        botaoSalvarMeta.disabled ||
                        !metaMensalDisponivel
                    ) {
                        return;
                    }

                    const meta = Number(campoMeta.value);

                    if (!validarValorMeta(meta)) {
                        alert(
                            'Informe uma meta entre 1 e 100 treinos.'
                        );
                        return;
                    }

                    botaoSalvarMeta.disabled = true;
                    campoMeta.disabled = true;

                    if (botaoDiminuirMeta) {
                        botaoDiminuirMeta.disabled = true;
                    }

                    if (botaoAumentarMeta) {
                        botaoAumentarMeta.disabled = true;
                    }

                    try {
                        const preferencias =
                            await salvarPreferenciasSupabaseFitZone(
                                identidade.id,
                                {
                                    metaMensal: meta
                                }
                            );

                        metaMensalConfirmada =
                            preferencias.metaMensal;

                        campoMeta.value =
                            String(metaMensalConfirmada);

                        atualizarMetaSupabase();

                        alert(
                            'Meta mensal salva com sucesso!'
                        );

                    } catch (erro) {
                        console.error(
                            'Erro ao salvar meta Supabase:',
                            erro
                        );

                        campoMeta.value =
                            String(metaMensalConfirmada);

                        atualizarMetaSupabase();

                        alert(
                            'Não foi possível confirmar ' +
                            'o salvamento da meta. ' +
                            'Atualize a página e confira o valor.'
                        );

                    } finally {
                        botaoSalvarMeta.disabled = false;
                        campoMeta.disabled = false;

                        if (botaoDiminuirMeta) {
                            botaoDiminuirMeta.disabled = false;
                        }

                        if (botaoAumentarMeta) {
                            botaoAumentarMeta.disabled = false;
                        }
                    }
                }
            );
        }

        /* =========================================
           GRAFICO DE EVOLUCAO MENSAL - SUPABASE
        ========================================= */

        const graficoSupabase =
            document.getElementById('trainingChart');

        const descricaoGraficoSupabase =
            document.getElementById('chartDescription');

        const botoesPeriodoSupabase =
            document.querySelectorAll('.training-chart-filter');

        function renderizarGraficoSupabase() {
            if (!graficoSupabase) {
                return;
            }

            const botaoAtivo = document.querySelector(
                '.training-chart-filter.active'
            );

            const periodo = Number(
                botaoAtivo?.dataset.months || 6
            );

            const quantidadeMeses =
                [3, 6, 12].includes(periodo)
                    ? periodo
                    : 6;

            if (descricaoGraficoSupabase) {
                descricaoGraficoSupabase.textContent =
                    `Acompanhe seus treinos nos últimos ${quantidadeMeses} meses.`;
            }

            const agora = new Date();

            const meses = Array.from(
                { length: quantidadeMeses },
                (_, indice) => {
                    const data = new Date(
                        agora.getFullYear(),
                        agora.getMonth() -
                            (quantidadeMeses - 1 - indice),
                        1
                    );

                    return {
                        ano: data.getFullYear(),
                        mes: data.getMonth(),
                        nome: data.toLocaleDateString(
                            'pt-BR',
                            { month: 'short' }
                        ).replace('.', ''),
                        total: 0
                    };
                }
            );

            /* Distribuir os treinos nos meses */

            historico.forEach(registro => {
                const data = registro?.data_local;

                if (
                    typeof data !== 'string' ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(data)
                ) {
                    return;
                }

                const [ano, mes, dia] =
                    data.split('-').map(Number);

                const dataValida =
                    new Date(ano, mes - 1, dia);

                if (
                    dataValida.getFullYear() !== ano ||
                    dataValida.getMonth() !== mes - 1 ||
                    dataValida.getDate() !== dia
                ) {
                    return;
                }

                const mesCorrespondente = meses.find(item =>
                    item.ano === ano &&
                    item.mes === mes - 1
                );

                if (mesCorrespondente) {
                    mesCorrespondente.total++;
                }
            });

            const maiorTotal = Math.max(
                1,
                ...meses.map(mes => mes.total)
            );

            graficoSupabase.replaceChildren();

            meses.forEach(mes => {
                const coluna = document.createElement('div');

                coluna.className = 'training-chart-column';

                if (
                    mes.ano === agora.getFullYear() &&
                    mes.mes === agora.getMonth()
                ) {
                    coluna.classList.add('current-month');
                }

                const valor = document.createElement('span');

                valor.className = 'training-chart-value';
                valor.textContent = String(mes.total);

                const barra = document.createElement('div');

                barra.className = 'training-chart-bar';

                barra.style.height =
                    `${Math.max(
                        5,
                        (mes.total / maiorTotal) * 150
                    )}px`;

                const nome = document.createElement('span');

                nome.className = 'training-chart-month';
                nome.textContent = mes.nome;

                coluna.append(valor, barra, nome);

                graficoSupabase.appendChild(coluna);
            });

            graficoSupabase.setAttribute(
                'aria-label',
                'Treinos por mês: ' +
                meses.map(
                    mes => `${mes.nome}: ${mes.total}`
                ).join(', ')
            );
        }

        /* =========================================
           FILTROS DO GRAFICO SUPABASE
        ========================================= */

        botoesPeriodoSupabase.forEach(botao => {
            botao.addEventListener('click', () => {
                botoesPeriodoSupabase.forEach(item => {
                    item.classList.remove('active');

                    item.setAttribute(
                        'aria-pressed',
                        'false'
                    );
                });

                botao.classList.add('active');

                botao.setAttribute(
                    'aria-pressed',
                    'true'
                );

                renderizarGraficoSupabase();
            });
        });

        renderizarGraficoSupabase();

        /* =========================================
           MINHAS CONQUISTAS - SUPABASE
        ========================================= */

        const conquistasSupabase = [
            {
                id: 'primeiro-passo',
                nome: 'Primeiro Passo',
                icone: '🥉',
                descricao: 'Conclua seu primeiro registro de treino.',
                meta: 1
            },
            {
                id: 'em-evolucao',
                nome: 'Em Evolução',
                icone: '🥈',
                descricao: 'Registre 5 treinos.',
                meta: 5
            },
            {
                id: 'determinacao',
                nome: 'Determinação',
                icone: '🥇',
                descricao: 'Registre 10 treinos.',
                meta: 10
            },
            {
                id: 'consistencia',
                nome: 'Consistência',
                icone: '🏆',
                descricao: 'Registre 25 treinos.',
                meta: 25
            },
            {
                id: 'semana-ativa',
                nome: 'Semana Ativa',
                icone: '🔥',
                descricao:
                    'Treine em 3 dias diferentes nos últimos 7 dias.',
                meta: 3,
                tipo: 'dias-semana'
            },
            {
                id: 'elite-fitzone',
                nome: 'Elite FitZone',
                icone: '💎',
                descricao: 'Registre 50 treinos.',
                meta: 50
            }
        ];

        function calcularConquistasSupabase() {
            const registrosValidos = historico.filter(
                registro => obterDataLocalTreino(registro) !== null
            );

            const totalTreinos = registrosValidos.length;

            const hojeConquistas = new Date();
            hojeConquistas.setHours(0, 0, 0, 0);

            const inicioPeriodo = new Date(hojeConquistas);
            inicioPeriodo.setDate(
                inicioPeriodo.getDate() - 6
            );

            const diasComTreino = new Set();

            registrosValidos.forEach(registro => {
                const data =
                    obterDataLocalTreino(registro);

                if (
                    !data ||
                    data < inicioPeriodo ||
                    data > hojeConquistas
                ) {
                    return;
                }

                diasComTreino.add(registro.data_local);
            });

            return conquistasSupabase.map(conquista => {
                const progresso =
                    conquista.tipo === 'dias-semana'
                        ? diasComTreino.size
                        : totalTreinos;

                return {
                    ...conquista,
                    progresso,
                    desbloqueada:
                        progresso >= conquista.meta
                };
            });
        }

        function exibirConquistasSupabase() {
            const grade = document.getElementById(
                'fitzoneAchievementsGrid'
            );

            if (!grade) {
                return;
            }

            const conquistas =
                calcularConquistasSupabase();

            grade.replaceChildren();

            conquistas.forEach(conquista => {
                const card = document.createElement(
                    'article'
                );

                card.className =
                    'fitzone-achievement-card';

                card.classList.add(
                    conquista.desbloqueada
                        ? 'unlocked'
                        : 'locked'
                );

                const icone =
                    document.createElement('span');

                icone.className =
                    'fitzone-achievement-icon';

                icone.textContent = conquista.icone;

                icone.setAttribute(
                    'aria-hidden',
                    'true'
                );

                const nome =
                    document.createElement('h3');

                nome.className =
                    'fitzone-achievement-name';

                nome.textContent = conquista.nome;

                const descricao =
                    document.createElement('p');

                descricao.className =
                    'fitzone-achievement-description';

                descricao.textContent =
                    conquista.descricao;

                const progresso =
                    document.createElement('span');

                progresso.className =
                    'fitzone-achievement-progress';

                const valorAtual = Math.min(
                    conquista.progresso,
                    conquista.meta
                );

                progresso.textContent =
                    `${valorAtual} de ${conquista.meta}` +
                    (
                        conquista.tipo === 'dias-semana'
                            ? ' dias'
                            : ' treinos'
                    );

                const status =
                    document.createElement('span');

                status.className =
                    'fitzone-achievement-status';

                status.textContent =
                    conquista.desbloqueada
                        ? 'DESBLOQUEADA ✓'
                        : 'BLOQUEADA';

                card.append(
                    icone,
                    nome,
                    descricao,
                    progresso,
                    status
                );

                grade.appendChild(card);
            });
        }

        exibirConquistasSupabase();

        /* =========================================
           HISTORICO DE TREINOS - SUPABASE V6
           VISUALIZACAO SEM EXCLUSAO
        ========================================= */

        const listaHistoricoSupabase =
            document.getElementById('workoutHistoryList');

        const modalDetalhesSupabase =
            document.getElementById('historyDetailsModalOverlay');

        let botaoDetalhesAnterior = null;

        function obterStatusHistoricoSupabase(registro) {
            const dados = registro?.dados || {};

            const total = Number(dados.seriesTotal);
            const concluidas = Number(dados.seriesConcluidas);

            const detalhado =
                Array.isArray(dados.exercicios) &&
                dados.seriesTotal != null &&
                dados.seriesConcluidas != null &&
                Number.isFinite(total) &&
                Number.isFinite(concluidas) &&
                total > 0 &&
                concluidas >= 0;

            return {
                detalhado,
                total: detalhado ? total : 0,
                concluidas: detalhado
                    ? Math.min(concluidas, total)
                    : 0,
                completo: detalhado && concluidas >= total
            };
        }

        const registrosHistoricoSupabase = historico
            .filter(registro =>
                obterDataLocalTreino(registro) !== null
            );

        const completosHistoricoSupabase =
            registrosHistoricoSupabase.filter(registro =>
                obterStatusHistoricoSupabase(registro).completo
            ).length;

        const parciaisHistoricoSupabase =
            registrosHistoricoSupabase.filter(registro => {
                const status =
                    obterStatusHistoricoSupabase(registro);

                return status.detalhado && !status.completo;
            }).length;

        const detalhadosHistoricoSupabase =
            completosHistoricoSupabase +
            parciaisHistoricoSupabase;

        const taxaHistoricoSupabase =
            detalhadosHistoricoSupabase > 0
                ? Math.round(
                    completosHistoricoSupabase /
                    detalhadosHistoricoSupabase * 100
                )
                : 0;

        const indicadoresHistoricoSupabase = {
            historyTotal: registrosHistoricoSupabase.length,
            historyComplete: completosHistoricoSupabase,
            historyPartial: parciaisHistoricoSupabase,
            historyCompletionRate:
                `${taxaHistoricoSupabase}%`
        };

        Object.entries(
            indicadoresHistoricoSupabase
        ).forEach(([id, valor]) => {
            const elemento = document.getElementById(id);

            if (elemento) {
                elemento.textContent = String(valor);
            }
        });

        const barraConclusaoSupabase =
            document.getElementById('historyCompletionBar');

        if (barraConclusaoSupabase) {
            barraConclusaoSupabase.style.width =
                `${taxaHistoricoSupabase}%`;

            barraConclusaoSupabase.setAttribute(
                'role',
                'progressbar'
            );

            barraConclusaoSupabase.setAttribute(
                'aria-label',
                'Taxa de conclusão dos treinos'
            );

            barraConclusaoSupabase.setAttribute(
                'aria-valuemin',
                '0'
            );

            barraConclusaoSupabase.setAttribute(
                'aria-valuemax',
                '100'
            );

            barraConclusaoSupabase.setAttribute(
                'aria-valuenow',
                String(taxaHistoricoSupabase)
            );
        }

        /* =========================================
           MODAL DE DETALHES DO TREINO
        ========================================= */

        function abrirDetalhesHistoricoSupabase(
            registro,
            botao
        ) {
            if (!modalDetalhesSupabase) {
                return;
            }

            const dados = registro.dados || {};
            const status =
                obterStatusHistoricoSupabase(registro);

            if (!status.detalhado) {
                return;
            }

            botaoDetalhesAnterior = botao;

            const preencher = (id, valor) => {
                const elemento = document.getElementById(id);

                if (elemento) {
                    elemento.textContent = String(valor);
                }
            };

            const nome =
                dados.nome || dados.nomeTreino || 'Treino';

            const [ano, mes, dia] =
                registro.data_local.split('-');

            const percentual = Math.round(
                status.concluidas / status.total * 100
            );

            preencher('historyDetailsName', nome);
            preencher(
                'historyDetailsDate',
                `${dia}/${mes}/${ano}`
            );

            preencher(
                'historyDetailsStatusIcon',
                status.completo ? '✓' : '!'
            );

            preencher(
                'historyDetailsStatusTitle',
                status.completo
                    ? 'Treino completo!'
                    : 'Treino parcial'
            );

            preencher(
                'historyDetailsStatusMessage',
                status.completo
                    ? 'Todos os exercícios foram realizados.'
                    : `${status.concluidas} de ${status.total} séries concluídas.`
            );

            preencher(
                'historyDetailsSeries',
                `${status.concluidas} de ${status.total}`
            );

            preencher(
                'historyDetailsCompletion',
                `${percentual}%`
            );

            const exercicios = dados.exercicios;

            const totalInformado =
                Number(dados.totalExercicios);

            preencher(
                'historyDetailsExerciseCount',
                dados.totalExercicios != null &&
                Number.isFinite(totalInformado) &&
                totalInformado >= 0
                    ? totalInformado
                    : exercicios.length
            );

            const resumo =
                document.getElementById(
                    'historyDetailsStatus'
                );

            const cartaoConclusao =
                document.getElementById(
                    'historyDetailsCompletionCard'
                );

            [resumo, cartaoConclusao].forEach(elemento => {
                if (!elemento) {
                    return;
                }

                elemento.classList.toggle(
                    'complete',
                    status.completo
                );

                elemento.classList.toggle(
                    'incomplete',
                    !status.completo
                );
            });

            const iconeProgresso =
                document.getElementById(
                    'historyDetailsProgressIcon'
                );

            if (iconeProgresso) {
                iconeProgresso.style.setProperty(
                    '--progress',
                    `${percentual * 3.6}deg`
                );
            }

            const listaExercicios =
                document.getElementById(
                    'historyDetailsExercises'
                );

            if (listaExercicios) {
                listaExercicios.replaceChildren();

                if (exercicios.length === 0) {
                    const mensagem =
                        document.createElement('p');

                    mensagem.textContent =
                        'Nenhum detalhe de exercício disponível.';

                    listaExercicios.appendChild(mensagem);
                }

                exercicios.forEach((exercicio, indice) => {
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

                    const completo =
                        total > 0 && concluidas >= total;

                    const percentualExercicio = total > 0
                        ? Math.round(concluidas / total * 100)
                        : 0;

                    const item = document.createElement('div');

                    item.className =
                        'history-details-exercise ' +
                        (completo ? 'complete' : 'incomplete');

                    const icone = document.createElement('span');
                    icone.className =
                        'history-details-exercise-status';

                    icone.textContent =
                        completo ? '✓' : '✕';

                    const nome = document.createElement('strong');
                    nome.className =
                        'history-details-exercise-name';

                    nome.textContent =
                        `${indice + 1}. ` +
                        (exercicio.nome || 'Exercício');

                    const series = document.createElement('span');
                    series.className =
                        'history-details-exercise-series';

                    series.textContent =
                        `${concluidas} de ${total} séries ` +
                        `(${percentualExercicio}%)`;

                    item.append(icone, nome, series);
                    listaExercicios.appendChild(item);
                });
            }

            modalDetalhesSupabase.hidden = false;
            modalDetalhesSupabase.classList.add('show');

            document.getElementById(
                'historyDetailsCloseBtn'
            )?.focus();
        }

        function fecharDetalhesHistoricoSupabase() {
            if (!modalDetalhesSupabase) {
                return;
            }

            modalDetalhesSupabase.classList.remove('show');
            modalDetalhesSupabase.hidden = true;

            if (
                botaoDetalhesAnterior &&
                botaoDetalhesAnterior.isConnected
            ) {
                botaoDetalhesAnterior.focus();
            }

            botaoDetalhesAnterior = null;
        }

        document.getElementById(
            'historyDetailsCloseBtn'
        )?.addEventListener(
            'click',
            fecharDetalhesHistoricoSupabase
        );

        document.getElementById(
            'historyDetailsFooterBtn'
        )?.addEventListener(
            'click',
            fecharDetalhesHistoricoSupabase
        );

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                modalDetalhesSupabase &&
                !modalDetalhesSupabase.hidden
            ) {
                evento.preventDefault();
                fecharDetalhesHistoricoSupabase();
            }
        });

        /* =========================================
           EXCLUIR HISTORICO SUPABASE - V8
        ========================================= */

        const modalExcluirSupabase =
            document.getElementById('historyDeleteModal');

        const mensagemExcluirSupabase =
            document.getElementById('historyDeleteMessage');

        const cancelarExclusaoSupabase =
            document.getElementById('historyDeleteCancel');

        const confirmarExclusaoSupabase =
            document.getElementById('historyDeleteConfirm');

        let registroPendenteExclusao = null;
        let botaoQueAbriuExclusaoSupabase = null;
        let excluindoHistoricoSupabase = false;

        function fecharExclusaoSupabase() {
            if (excluindoHistoricoSupabase) {
                return;
            }

            modalExcluirSupabase?.classList.remove('show');

            if (
                botaoQueAbriuExclusaoSupabase?.isConnected
            ) {
                botaoQueAbriuExclusaoSupabase.focus();
            }

            registroPendenteExclusao = null;
            botaoQueAbriuExclusaoSupabase = null;
        }

        function abrirExclusaoSupabase(registro, botao) {
            if (
                !modalExcluirSupabase ||
                !mensagemExcluirSupabase ||
                registro?.id == null ||
                excluindoHistoricoSupabase
            ) {
                return;
            }

            registroPendenteExclusao = registro;
            botaoQueAbriuExclusaoSupabase = botao;

            const nome =
                registro.dados?.nome ||
                registro.dados?.nomeTreino ||
                'Treino';

            const [ano, mes, dia] =
                registro.data_local.split('-');

            mensagemExcluirSupabase.textContent =
                `Deseja excluir "${nome}" realizado em ` +
                `${dia}/${mes}/${ano}? ` +
                'Esta ação não poderá ser desfeita.';

            modalExcluirSupabase.classList.add('show');

            cancelarExclusaoSupabase?.focus();
        }

        cancelarExclusaoSupabase?.addEventListener(
            'click',
            fecharExclusaoSupabase
        );

        modalExcluirSupabase?.addEventListener(
            'click',
            evento => {
                if (
                    evento.target === modalExcluirSupabase
                ) {
                    fecharExclusaoSupabase();
                }
            }
        );

        document.addEventListener('keydown', evento => {
            if (
                evento.key === 'Escape' &&
                modalExcluirSupabase?.classList.contains('show')
            ) {
                evento.preventDefault();
                fecharExclusaoSupabase();
            }
        });

        confirmarExclusaoSupabase?.addEventListener(
            'click',
            async () => {
                if (
                    !registroPendenteExclusao ||
                    excluindoHistoricoSupabase
                ) {
                    return;
                }

                excluindoHistoricoSupabase = true;
                confirmarExclusaoSupabase.disabled = true;

                if (cancelarExclusaoSupabase) {
                    cancelarExclusaoSupabase.disabled = true;
                }

                const registro = registroPendenteExclusao;

                try {
                    const identidadeAtual =
                        await obterIdentidadeSupabaseFitZone();

                    if (
                        !identidadeAtual ||
                        identidadeAtual.id !== identidade.id
                    ) {
                        window.location.replace('login.html');
                        return;
                    }

                    const { data, error } = await cliente
                        .from('fitzone_historico_treinos')
                        .delete()
                        .eq('id', registro.id)
                        .eq('usuario_id', identidade.id)
                        .select('id');

                    if (error) {
                        throw error;
                    }

                    if (
                        !Array.isArray(data) ||
                        data.length !== 1
                    ) {
                        throw new Error(
                            'O registro não foi excluído. ' +
                            'Verifique as permissões do banco.'
                        );
                    }

                    modalExcluirSupabase?.classList.remove(
                        'show'
                    );

                    window.location.reload();

                } catch (erro) {
                    console.error(
                        'Erro ao excluir histórico Supabase:',
                        erro
                    );

                    alert(
                        'Não foi possível excluir o treino. ' +
                        'O histórico será mantido.'
                    );

                } finally {
                    excluindoHistoricoSupabase = false;
                    confirmarExclusaoSupabase.disabled = false;

                    if (cancelarExclusaoSupabase) {
                        cancelarExclusaoSupabase.disabled = false;
                    }
                }
            }
        );

        /* =========================================
           AGRUPAR HISTORICO POR MES
        ========================================= */

        const gruposHistoricoSupabase = {};

        registrosHistoricoSupabase.forEach(registro => {
            const chaveMes =
                registro.data_local.slice(0, 7);

            if (!gruposHistoricoSupabase[chaveMes]) {
                gruposHistoricoSupabase[chaveMes] = [];
            }

            gruposHistoricoSupabase[chaveMes].push(registro);
        });

        /* =========================================
           RENDERIZAR HISTORICO ORIGINAL
        ========================================= */

        if (listaHistoricoSupabase) {
            listaHistoricoSupabase.replaceChildren();

            const mesesOrdenados =
                Object.keys(gruposHistoricoSupabase)
                    .sort()
                    .reverse();

            if (mesesOrdenados.length === 0) {
                const vazio = document.createElement('div');
                vazio.className = 'history-empty';
                vazio.textContent =
                    'Nenhum treino concluído ainda.';

                listaHistoricoSupabase.appendChild(vazio);
            }

            mesesOrdenados.forEach((chaveMes, indiceMes) => {
                const [ano, mes] =
                    chaveMes.split('-').map(Number);

                const nomeMes = new Date(
                    ano,
                    mes - 1,
                    1
                ).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric'
                }).toUpperCase();

                const container =
                    document.createElement('div');

                container.className = 'history-month';

                const cabecalho =
                    document.createElement('button');

                cabecalho.type = 'button';
                cabecalho.className =
                    'history-month-header';

                const titulo = document.createElement('span');
                titulo.className = 'history-month-title';

                const seta = document.createElement('span');
                seta.className = 'history-month-arrow';
                seta.textContent =
                    indiceMes === 0 ? '▼' : '▶';

                titulo.append(seta, ` ${nomeMes}`);

                const quantidade =
                    document.createElement('span');

                quantidade.className =
                    'history-month-summary';

                const registros =
                    gruposHistoricoSupabase[chaveMes];

                quantidade.textContent =
                    `${registros.length} ` +
                    (registros.length === 1
                        ? 'treino'
                        : 'treinos');

                cabecalho.append(titulo, quantidade);

                const conteudo =
                    document.createElement('div');

                conteudo.className =
                    'history-month-content';

                conteudo.hidden = indiceMes !== 0;

                cabecalho.setAttribute(
                    'aria-expanded',
                    String(!conteudo.hidden)
                );

                cabecalho.addEventListener('click', () => {
                    conteudo.hidden = !conteudo.hidden;

                    seta.textContent =
                        conteudo.hidden ? '▶' : '▼';

                    cabecalho.setAttribute(
                        'aria-expanded',
                        String(!conteudo.hidden)
                    );
                });

                registros.forEach(registro => {
                    const dados = registro.dados || {};
                    const status =
                        obterStatusHistoricoSupabase(registro);

                    const nomeTreino =
                        dados.nome ||
                        dados.nomeTreino ||
                        'Treino';

                    const item =
                        document.createElement('div');

                    item.className = 'history-item';

                    const nome =
                        document.createElement('span');

                    nome.className =
                        'history-workout-name';

                    nome.textContent = nomeTreino;

                    const situacao =
                        document.createElement('div');

                    situacao.className =
                        'history-workout-status';

                    if (!status.detalhado) {
                        situacao.classList.add('legacy');
                        situacao.textContent =
                            'Registro anterior';
                    } else {
                        situacao.classList.add(
                            status.completo
                                ? 'complete'
                                : 'incomplete'
                        );

                        const icone =
                            document.createElement('span');

                        icone.className =
                            'history-status-icon';

                        icone.textContent =
                            status.completo ? '✓' : '●';

                        const texto =
                            document.createElement('span');

                        texto.className =
                            'history-status-content';

                        const tituloStatus =
                            document.createElement('span');

                        tituloStatus.className =
                            'history-status-title';

                        tituloStatus.textContent =
                            status.completo
                                ? 'Completo · '
                                : 'Parcial · ';

                        const series =
                            document.createElement('span');

                        series.className =
                            'history-status-series';

                        const percentual = Math.round(
                            status.concluidas /
                            status.total * 100
                        );

                        series.textContent =
                            `${status.concluidas} de ` +
                            `${status.total} séries ` +
                            `(${percentual}%)`;

                        texto.append(tituloStatus, series);
                        situacao.append(icone, texto);
                    }

                    const [anoTreino, mesTreino, diaTreino] =
                        registro.data_local.split('-');

                    const data = document.createElement('span');
                    data.className = 'history-date';

                    const iconeCalendario =
                        document.createElementNS(
                            'http://www.w3.org/2000/svg',
                            'svg'
                        );

                    iconeCalendario.setAttribute(
                        'viewBox',
                        '0 0 24 24'
                    );
                    iconeCalendario.setAttribute(
                        'aria-hidden',
                        'true'
                    );

                    iconeCalendario.innerHTML = `
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
                    `;

                    const textoData =
                        document.createElement('span');

                    textoData.textContent =
                        `${diaTreino}/${mesTreino}/${anoTreino}`;

                    data.append(
                        iconeCalendario,
                        textoData
                    );

                    const detalhes =
                        document.createElement('button');

                    detalhes.type = 'button';
                    detalhes.className =
                        'history-details-btn';

                    const iconeDetalhes =
                        document.createElementNS(
                            'http://www.w3.org/2000/svg',
                            'svg'
                        );

                    iconeDetalhes.setAttribute(
                        'viewBox',
                        '0 0 24 24'
                    );

                    iconeDetalhes.setAttribute(
                        'aria-hidden',
                        'true'
                    );

                    iconeDetalhes.innerHTML = `
                        <path
                            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                        />
                        <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                        />
                    `;

                    const textoDetalhes =
                        document.createElement('span');

                    textoDetalhes.textContent =
                        'Ver detalhes';

                    detalhes.append(
                        iconeDetalhes,
                        textoDetalhes
                    );

                    detalhes.setAttribute(
                        'aria-label',
                        `Ver detalhes do treino ${nomeTreino}`
                    );

                    detalhes.disabled = !status.detalhado;

                    if (!status.detalhado) {
                        detalhes.title =
                            'Detalhes não disponíveis para este registro';
                    }

                    detalhes.addEventListener('click', () => {
                        abrirDetalhesHistoricoSupabase(
                            registro,
                            detalhes
                        );
                    });


                    const botaoExcluir =
                        document.createElement('button');

                    botaoExcluir.type = 'button';
                    botaoExcluir.className =
                        'history-delete-btn';

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
                        `Excluir treino ${nomeTreino}`
                    );

                    botaoExcluir.title = 'Excluir treino';

                    botaoExcluir.disabled =
                        registro.id == null;

                    botaoExcluir.addEventListener(
                        'click',
                        () => {
                            abrirExclusaoSupabase(
                                registro,
                                botaoExcluir
                            );
                        }
                    );

                    const acoes =
                        document.createElement('div');

                    acoes.className =
                        'history-item-actions';

                    acoes.append(
                        data,
                        detalhes,
                        botaoExcluir
                    );

                    item.append(nome, situacao, acoes);
                    conteudo.appendChild(item);
                });

                container.append(cabecalho, conteudo);
                listaHistoricoSupabase.appendChild(container);
            });
        }

        /* =========================================
           ENCERRAR SESSAO SUPABASE
        ========================================= */

        const botaoSair =
            document.getElementById('btnEndSession');

        if (botaoSair) {
            botaoSair.addEventListener(
                'click',
                async () => {
                    if (!confirm('Deseja sair da sua conta?')) {
                        return;
                    }

                    botaoSair.disabled = true;

                    try {
                        const { error: erroSaida } =
                            await cliente.auth.signOut({
                                scope: 'local'
                            });

                        if (erroSaida) {
                            throw erroSaida;
                        }

                        window.location.replace('login.html');
                    } catch (erro) {
                        console.error(
                            'Erro ao encerrar sessão:',
                            erro
                        );

                        alert(
                            'Não foi possível encerrar a sessão.'
                        );

                        botaoSair.disabled = false;
                    }
                }
            );
        }

        /* =========================================
           SECOES RECOLHIVEIS - SUPABASE V9
        ========================================= */

        const chaveSecoesSupabase =
            `fitzoneSecoesDesempenho:supabase:${identidade.id}`;

        let preferenciasSecoesSupabase = {};

        try {
            const salvas = localStorage.getItem(
                chaveSecoesSupabase
            );

            const preferencias = salvas
                ? JSON.parse(salvas)
                : {};

            if (
                preferencias &&
                typeof preferencias === 'object' &&
                !Array.isArray(preferencias)
            ) {
                preferenciasSecoesSupabase = preferencias;
            }
        } catch (erro) {
            console.warn(
                'Erro ao carregar preferências das seções:',
                erro
            );
        }

        const configuracoesSecoesSupabase = [
            ['.training-summary', '.summary-header'],
            ['.training-streak', '.summary-header'],
            ['.monthly-goal', '.summary-header'],
            ['.monthly-comparison', '.summary-header'],
            ['.training-chart', '.summary-header'],
            [
                '.fitzone-achievements',
                '.fitzone-achievements-header'
            ],
            ['.workout-history', '.history-header']
        ];

        configuracoesSecoesSupabase.forEach(
            ([seletorSecao, seletorCabecalho]) => {
                const secao =
                    document.querySelector(seletorSecao);

                const cabecalho =
                    secao?.querySelector(seletorCabecalho);

                if (
                    !secao ||
                    !cabecalho ||
                    cabecalho.querySelector(
                        '.fitzone-section-toggle'
                    )
                ) {
                    return;
                }

                const conteudos = Array.from(
                    secao.children
                ).filter(
                    elemento => elemento !== cabecalho
                );

                if (!conteudos.length) {
                    return;
                }

                const botao =
                    document.createElement('button');

                const expandidoInicial =
                    preferenciasSecoesSupabase[seletorSecao]
                    !== false;

                botao.type = 'button';
                botao.className =
                    'fitzone-section-toggle';

                botao.textContent = expandidoInicial
                    ? 'Recolher ▲'
                    : 'Expandir ▼';

                botao.setAttribute(
                    'aria-expanded',
                    String(expandidoInicial)
                );

                const titulo =
                    cabecalho.querySelector('h2');

                (titulo || cabecalho).appendChild(botao);

                conteudos.forEach(elemento => {
                    elemento.classList.add(
                        'fitzone-section-content'
                    );

                    elemento.hidden = !expandidoInicial;
                });

                botao.addEventListener('click', () => {
                    const expandido =
                        botao.getAttribute(
                            'aria-expanded'
                        ) === 'true';

                    conteudos.forEach(elemento => {
                        elemento.hidden = expandido;
                    });

                    botao.setAttribute(
                        'aria-expanded',
                        String(!expandido)
                    );

                    botao.textContent = expandido
                        ? 'Expandir ▼'
                        : 'Recolher ▲';

                    preferenciasSecoesSupabase[
                        seletorSecao
                    ] = !expandido;

                    try {
                        localStorage.setItem(
                            chaveSecoesSupabase,
                            JSON.stringify(
                                preferenciasSecoesSupabase
                            )
                        );
                    } catch (erro) {
                        console.warn(
                            'Erro ao salvar preferência da seção:',
                            erro
                        );
                    }
                });
            }
        );

        /* INTERFACE SUPABASE PRONTA */

        finalizarCarregamentoDesempenho();

        /* =========================================
           VERIFICAR CONTINUIDADE DA SESSAO
        ========================================= */

        let verificando = false;

        async function verificarSessaoAtual() {
            if (verificando) {
                return;
            }

            verificando = true;

            try {
                const atual =
                    await obterIdentidadeSupabaseFitZone();

                if (!atual || atual.id !== identidade.id) {
                    window.location.replace('login.html');
                }
            } catch (erro) {
                console.warn(
                    'Erro ao verificar continuidade:',
                    erro
                );

                window.location.replace('login.html');
            } finally {
                verificando = false;
            }
        }

        window.addEventListener('pageshow', () => {
            void verificarSessaoAtual();
        });

        document.addEventListener(
            'visibilitychange',
            () => {
                if (document.visibilityState === 'visible') {
                    void verificarSessaoAtual();
                }
            }
        );

    } catch (erro) {
        console.error(
            'Erro ao carregar Desempenho Supabase:',
            erro
        );

        mostrarErroCarregamentoDesempenho();

        if (navigator.onLine === false) {
            mostrarAvisoOfflineDesempenho();
            return;
        }

        if (pagina) {
            pagina.replaceChildren();

            const mensagem = document.createElement('p');

            mensagem.textContent =
                'Não foi possível carregar o desempenho. ' +
                'Verifique sua conexão e atualize a página.';

            pagina.appendChild(mensagem);
        }
    }

})();
