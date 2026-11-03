
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
            secao.style.display = 'none';
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
