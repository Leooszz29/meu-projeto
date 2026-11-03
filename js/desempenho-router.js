
"use strict";

/* =========================================
   FITZONE - DESEMPENHO HIBRIDO
   Roteamento tradicional / Supabase
========================================= */

(async function iniciarDesempenhoFitZone() {

    function obterSessaoTradicional() {
        try {
            const dados = localStorage.getItem(
                'fitzoneSessao'
            );

            const sessao = dados
                ? JSON.parse(dados)
                : null;

            return Boolean(
                sessao &&
                sessao.autenticado === true &&
                typeof sessao.email === 'string' &&
                sessao.email.trim()
            );
        } catch (erro) {
            console.warn(
                'Erro ao verificar sessão tradicional:',
                erro
            );

            return false;
        }
    }

    function carregarDesempenhoTradicional() {
        const script = document.createElement('script');

        script.src = 'js/desempenho.js';
        script.async = false;

        document.body.appendChild(script);
    }

    /* Conta tradicional: preservar funcionamento original */

    if (obterSessaoTradicional()) {
        carregarDesempenhoTradicional();
        return;
    }

    const pagina = document.querySelector('.page');

    try {
        const identidade =
            await obterIdentidadeSupabaseFitZone();

        if (!identidade?.id) {
            window.location.replace('login.html');
            return;
        }

        const cliente = inicializarSupabaseFitZone();

        if (!cliente) {
            throw new Error('Supabase indisponível.');
        }

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
           EXIBIR APENAS RESUMO INTEGRADO
        ========================================= */

        pagina.querySelectorAll(
            ':scope > section:not(.training-summary)'
        ).forEach(secao => {
            const habilitada =
                secao.classList.contains('training-streak') ||
                secao.classList.contains('monthly-goal') ||
                secao.classList.contains('monthly-comparison');

            secao.style.display = habilitada ? '' : 'none';
        });

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

        const chaveMetaSupabase =
            `metaMensalFitZone:supabase:${identidade.id}`;

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
           CARREGAR META SALVA
        ========================================= */

        if (campoMeta) {
            let valorSalvo = null;

            try {
                valorSalvo = localStorage.getItem(
                    chaveMetaSupabase
                );
            } catch (erro) {
                console.warn(
                    'Não foi possível consultar a meta:',
                    erro
                );
            }

            campoMeta.value =
                valorSalvo !== null &&
                validarValorMeta(valorSalvo)
                    ? String(Number(valorSalvo))
                    : '12';

            atualizarMetaSupabase();
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

                    atualizarMetaSupabase();
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

                    atualizarMetaSupabase();
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
                    const meta = Number(campoMeta.value);

                    if (!validarValorMeta(meta)) {
                        alert(
                            'Informe uma meta entre 1 e 100 treinos.'
                        );
                        return;
                    }

                    botaoSalvarMeta.disabled = true;

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

                        localStorage.setItem(
                            chaveMetaSupabase,
                            String(meta)
                        );

                        atualizarMetaSupabase();

                        alert(
                            'Meta mensal salva com sucesso!'
                        );

                    } catch (erro) {
                        console.error(
                            'Erro ao salvar meta Supabase:',
                            erro
                        );

                        alert(
                            'Não foi possível salvar sua meta.'
                        );
                    } finally {
                        botaoSalvarMeta.disabled = false;
                    }
                }
            );
        }

        if (campoMeta) {
            campoMeta.addEventListener(
                'change',
                () => {
                    if (validarValorMeta(campoMeta.value)) {
                        atualizarMetaSupabase();
                    }
                }
            );
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
