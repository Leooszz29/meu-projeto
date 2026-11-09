
"use strict";

/* =========================================
   FITZONE - CALENDARIO
   Exibicao e navegacao entre meses
========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    /* =========================================
       FITZONE - IDENTIFICAR ACESSO SUPABASE
    ========================================= */

    async function identificarAcessoSupabaseCalendario() {
        const identidade =
            await obterIdentidadeSupabaseFitZone();

        if (!identidade) {
            return {
                autenticado: false,
                identificador: null
            };
        }

        return {
            autenticado: true,
            identificador: 'supabase:' + identidade.id,
            id: identidade.id,
            email: identidade.email
        };
    }

    /* =========================================
       PROTECAO DE ACESSO AO CALENDARIO
    ========================================= */

    let sessaoValida = false;

    try {
        const sessaoJSON =
            localStorage.getItem("fitzoneSessao");

        const sessao = sessaoJSON
            ? JSON.parse(sessaoJSON)
            : null;

        sessaoValida = Boolean(
            sessao &&
            sessao.autenticado === true &&
            typeof sessao.email === "string" &&
            sessao.email.trim()
        );

    } catch (error) {
        console.warn(
            "Não foi possível validar a sessão:",
            error
        );
    }

    if (!sessaoValida) {
        try {
            const acessoSupabase =
                await identificarAcessoSupabaseCalendario();

            if (acessoSupabase.autenticado) {

                /* =========================================
                   TEMA CALENDARIO SUPABASE - NUVEM
                ========================================= */

                await sincronizarTemaSupabaseFitZone({
                    id: acessoSupabase.id,
                    email: acessoSupabase.email
                });

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
                titulo.textContent = 'FitZone';

                const mensagem = document.createElement('p');
                mensagem.textContent =
                    'Conta Supabase autenticada. ' +
                    'O calendário está sendo integrado.';

                const voltar = document.createElement('button');

                voltar.type = 'button';
                voltar.textContent = 'Sair da conta Supabase';

                voltar.addEventListener('click', async () => {
                    const confirmar = confirm(
                        'Deseja realmente sair da sua conta?'
                    );

                    if (!confirmar) {
                        return;
                    }

                    voltar.disabled = true;
                    voltar.textContent = 'Saindo...';

                    try {
                        const cliente =
                            inicializarSupabaseFitZone();

                        const { error } =
                            await cliente.auth.signOut({
                                scope: 'local'
                            });

                        if (error) {
                            throw error;
                        }

                        window.location.replace('login.html');

                    } catch (erro) {
                        console.error(
                            'Erro ao sair da conta Supabase:',
                            erro
                        );

                        alert(
                            'Não foi possível encerrar a sessão.'
                        );

                        voltar.disabled = false;
                        voltar.textContent =
                            'Sair da conta Supabase';
                    }
                });

                const informacaoCheckins =
                    document.createElement('p');

                informacaoCheckins.textContent =
                    'Consultando seus check-ins...';

                aviso.append(
                    titulo,
                    mensagem,
                    informacaoCheckins,
                    voltar
                );

                /* =========================================
                   HISTORICO DE TREINOS NO CALENDARIO
                   SUPABASE - PRIMEIRA INTEGRACAO
                ========================================= */

                const resumoHistoricoSupabase =
                    document.createElement('p');

                resumoHistoricoSupabase.setAttribute(
                    'role',
                    'status'
                );

                resumoHistoricoSupabase.textContent =
                    'Consultando treinos finalizados...';

                aviso.insertBefore(
                    resumoHistoricoSupabase,
                    voltar
                );

                let historicoTreinosSupabase = [];

                try {
                    const cliente =
                        inicializarSupabaseFitZone();

                    if (!cliente) {
                        throw new Error(
                            'Supabase indisponível.'
                        );
                    }

                    const { data, error } =
                        await cliente
                            .from('fitzone_historico_treinos')
                            .select('id, data_local, dados')
                            .eq('usuario_id', acessoSupabase.id)
                            .order('concluido_em', {
                                ascending: false
                            });

                    if (error) {
                        throw error;
                    }

                    historicoTreinosSupabase =
                        Array.isArray(data) ? data : [];

                    const historico =
                        historicoTreinosSupabase;

                    resumoHistoricoSupabase.textContent =
                        'Treinos finalizados no Supabase: ' +
                        historico.length;

                } catch (erro) {
                    console.error(
                        'Erro ao consultar histórico no calendário:',
                        erro
                    );

                    resumoHistoricoSupabase.textContent =
                        'Não foi possível consultar ' +
                        'o histórico de treinos.';
                }

                try {
                    const chave =
                        await obterChaveArmazenamentoSupabaseFitZone(
                            'checkins'
                        );

                    const dadosSalvos = localStorage.getItem(chave);

                    const checkins = dadosSalvos
                        ? JSON.parse(dadosSalvos)
                        : {};

                    if (
                        !checkins ||
                        typeof checkins !== 'object' ||
                        Array.isArray(checkins)
                    ) {
                        throw new Error('Dados de check-in inválidos.');
                    }

                    informacaoCheckins.textContent =
                        'Seus dias com check-in: ' +
                        Object.keys(checkins).filter(data => (
                            /^\d{4}-\d{2}-\d{2}$/.test(data) &&
                            checkins[data]?.checked === true
                        )).length;

                    const datasCheckins = Object.keys(checkins)
                        .filter(data => (
                            /^\d{4}-\d{2}-\d{2}$/.test(data) &&
                            checkins[data]?.checked === true
                        ))
                        .sort()
                        .reverse();

                    /* Calendário mensal com navegação */

                    const calendarioSupabase =
                        document.createElement('section');

                    calendarioSupabase.className =
                        'calendar-card';

                    const cabecalhoMes =
                        document.createElement('div');

                    cabecalhoMes.className =
                        'month-nav';

                    const botaoAnterior =
                        document.createElement('button');

                    botaoAnterior.type = 'button';
                    botaoAnterior.textContent = '‹';
                    botaoAnterior.setAttribute(
                        'aria-label',
                        'Mês anterior'
                    );

                    const tituloMes =
                        document.createElement('h2');

                    tituloMes.className =
                        'month-label';

                    const botaoProximo =
                        document.createElement('button');

                    botaoProximo.type = 'button';
                    botaoProximo.textContent = '›';
                    botaoProximo.setAttribute(
                        'aria-label',
                        'Próximo mês'
                    );

                    cabecalhoMes.append(
                        botaoAnterior,
                        tituloMes,
                        botaoProximo
                    );

                    const grade =
                        document.createElement('div');

                    grade.className = 'days-grid';

                    const agora = new Date();

                    let anoAtual = agora.getFullYear();
                    let mesAtual = agora.getMonth();

                    function atualizarVisualizacaoCheckinsSupabase() {
                        const datasAtualizadas = Object.keys(checkins)
                            .filter(data => (
                                /^\d{4}-\d{2}-\d{2}$/.test(data) &&
                                checkins[data]?.checked === true
                            ))
                            .sort()
                            .reverse();

                        datasCheckins.length = 0;
                        datasCheckins.push(...datasAtualizadas);

                        renderizarMesSupabase();
                    }

                    /* =========================================
                       INDICADORES DE TREINOS NO CALENDARIO
                    ========================================= */

                    const treinosPorDataSupabase = {};

                    historicoTreinosSupabase.forEach(registro => {
                        const data = registro.data_local;

                        if (
                            typeof data !== 'string' ||
                            !/^\d{4}-\d{2}-\d{2}$/.test(data)
                        ) {
                            return;
                        }

                        const dados = registro.dados || {};

                        if (!treinosPorDataSupabase[data]) {
                            treinosPorDataSupabase[data] = {
                                completos: 0,
                                parciais: 0,
                                anteriores: 0
                            };
                        }

                        const total = Number(dados.seriesTotal);
                        const concluidas = Number(dados.seriesConcluidas);

                        const possuiDetalhes =
                            dados.seriesTotal != null &&
                            dados.seriesConcluidas != null &&
                            Number.isFinite(total) &&
                            Number.isFinite(concluidas) &&
                            total > 0 &&
                            concluidas >= 0;

                        if (!possuiDetalhes) {
                            treinosPorDataSupabase[data].anteriores++;
                        } else if (concluidas >= total) {
                            treinosPorDataSupabase[data].completos++;
                        } else {
                            treinosPorDataSupabase[data].parciais++;
                        }
                    });

                    /* =========================================
                       MODAL ORIGINAL - CHECK-IN SUPABASE
                    ========================================= */

                    const modalSupabase = document.getElementById(
                        'checkinModalOverlay'
                    );

                    const modalDataSupabase = document.getElementById(
                        'checkinModalDate'
                    );

                    const modalToggleSupabase = document.getElementById(
                        'checkinToggle'
                    );

                    const modalTreinoSupabase = document.getElementById(
                        'checkinTreinoInput'
                    );

                    const modalCancelarSupabase = document.getElementById(
                        'checkinCancelBtn'
                    );

                    const modalSalvarSupabase = document.getElementById(
                        'checkinSaveBtn'
                    );

                    const historicoSecaoSupabase = document.getElementById(
                        'historicoDiaCalendario'
                    );

                    const historicoListaSupabase = document.getElementById(
                        'historicoDiaLista'
                    );

                    let dataSelecionadaSupabase = null;
                    let botaoOrigemSupabase = null;

                    function fecharModalSupabase() {
                        modalSupabase.classList.remove('show');

                        dataSelecionadaSupabase = null;

                        if (botaoOrigemSupabase?.isConnected) {
                            botaoOrigemSupabase.focus();
                        }

                        botaoOrigemSupabase = null;
                    }

                    function abrirModalSupabase(data, botao) {
                        dataSelecionadaSupabase = data;
                        botaoOrigemSupabase = botao;

                        const [ano, mes, dia] = data.split('-');

                        const dataFormatada = new Date(
                            Number(ano),
                            Number(mes) - 1,
                            Number(dia)
                        ).toLocaleDateString('pt-BR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });

                        modalDataSupabase.textContent = dataFormatada;

                        const registro = checkins[data] || {};
                        const marcado = registro.checked === true;

                        modalToggleSupabase.classList.toggle(
                            'active',
                            marcado
                        );

                        modalToggleSupabase.setAttribute(
                            'aria-checked',
                            String(marcado)
                        );

                        modalTreinoSupabase.value =
                            registro.treino || '';

                        historicoListaSupabase.replaceChildren();

                        const treinosDia = historicoTreinosSupabase.filter(
                            item => item.data_local === data
                        );

                        historicoSecaoSupabase.hidden =
                            treinosDia.length === 0;

                        treinosDia.forEach(item => {
                            const dados = item.dados || {};

                            const elemento = document.createElement('div');
                            elemento.className = 'historico-dia-item';

                            const nome = document.createElement('strong');
                            nome.className = 'historico-dia-nome';
                            nome.textContent =
                                dados.nome || dados.nomeTreino || 'Treino';

                            const status = document.createElement('span');
                            status.className = 'historico-dia-status';

                            const total = Number(dados.seriesTotal);
                            const feitas = Number(dados.seriesConcluidas);

                            if (
                                Number.isFinite(total) &&
                                total > 0 &&
                                Number.isFinite(feitas)
                            ) {
                                const completo = feitas >= total;

                                elemento.classList.add(
                                    completo
                                        ? 'treino-completo'
                                        : 'treino-parcial'
                                );

                                status.textContent =
                                    `${completo ? 'Completo' : 'Parcial'} · ` +
                                    `${feitas} de ${total} séries`;
                            } else {
                                elemento.classList.add('registro-anterior');
                                status.textContent = 'Registro anterior';
                            }

                            elemento.append(nome, status);
                            historicoListaSupabase.appendChild(elemento);
                        });

                        modalSupabase.classList.add('show');
                        modalCancelarSupabase.focus();
                    }

                    modalToggleSupabase.addEventListener('click', () => {
                        const ativo =
                            modalToggleSupabase.getAttribute(
                                'aria-checked'
                            ) !== 'true';

                        modalToggleSupabase.classList.toggle(
                            'active',
                            ativo
                        );

                        modalToggleSupabase.setAttribute(
                            'aria-checked',
                            String(ativo)
                        );
                    });

                    modalCancelarSupabase.addEventListener(
                        'click',
                        fecharModalSupabase
                    );

                    modalSupabase.addEventListener('click', evento => {
                        if (evento.target === modalSupabase) {
                            fecharModalSupabase();
                        }
                    });

                    document.addEventListener('keydown', evento => {
                        if (
                            evento.key === 'Escape' &&
                            modalSupabase.classList.contains('show')
                        ) {
                            fecharModalSupabase();
                        }
                    });

                    modalSalvarSupabase.addEventListener(
                        'click',
                        async () => {
                            if (!dataSelecionadaSupabase) {
                                return;
                            }

                            modalSalvarSupabase.disabled = true;

                            try {
                                const acessoAtual =
                                    await identificarAcessoSupabaseCalendario();

                                if (
                                    !acessoAtual.autenticado ||
                                    acessoAtual.identificador !==
                                        acessoSupabase.identificador
                                ) {
                                    window.location.replace('login.html');
                                    return;
                                }

                                const dadosAtuais =
                                    await carregarCheckinsSupabase();

                                const marcado =
                                    modalToggleSupabase.getAttribute(
                                        'aria-checked'
                                    ) === 'true';

                                const treino =
                                    modalTreinoSupabase.value.trim();

                                if (!marcado && !treino) {
                                    delete dadosAtuais[dataSelecionadaSupabase];
                                } else {
                                    dadosAtuais[dataSelecionadaSupabase] = {
                                        ...dadosAtuais[dataSelecionadaSupabase],
                                        checked: marcado,
                                        treino
                                    };
                                }

                                await salvarCheckinsSupabase(dadosAtuais);

                                Object.keys(checkins).forEach(chave => {
                                    delete checkins[chave];
                                });

                                Object.assign(checkins, dadosAtuais);

                                fecharModalSupabase();
                                atualizarVisualizacaoCheckinsSupabase();

                            } catch (erro) {
                                console.error(
                                    'Erro ao salvar check-in Supabase:',
                                    erro
                                );

                                alert(
                                    'Não foi possível salvar o check-in.'
                                );
                            } finally {
                                modalSalvarSupabase.disabled = false;
                            }
                        }
                    );

                    function renderizarMesSupabase() {
                        const dataMes =
                            new Date(anoAtual, mesAtual, 1);

                        anoAtual = dataMes.getFullYear();
                        mesAtual = dataMes.getMonth();

                        tituloMes.textContent =
                            dataMes.toLocaleDateString('pt-BR', {
                                month: 'long',
                                year: 'numeric'
                            });

                        grade.replaceChildren();

                        const primeiroDia =
                            dataMes.getDay();

                        const totalDias =
                            new Date(
                                anoAtual,
                                mesAtual + 1,
                                0
                            ).getDate();

                        for (let i = 0; i < primeiroDia; i++) {
                            const vazio =
                                document.createElement('div');

                            vazio.className = 'day-cell empty';
                            vazio.setAttribute('aria-hidden', 'true');

                            grade.appendChild(vazio);
                        }

                        for (let dia = 1; dia <= totalDias; dia++) {

                            const celula =
                                document.createElement('button');

                            celula.type = 'button';
                            celula.className = 'day-cell';

                            const data =
                                anoAtual + '-' +
                                String(mesAtual + 1).padStart(2, '0') + '-' +
                                String(dia).padStart(2, '0');

                            const marcado =
                                datasCheckins.includes(data);

                            const treinosDia =
                                treinosPorDataSupabase[data];

                            const possuiCompleto =
                                (treinosDia?.completos || 0) > 0;

                            const possuiParcial =
                                (treinosDia?.parciais || 0) > 0;

                            const numeroDia =
                                document.createElement('span');

                            numeroDia.className = 'num';
                            numeroDia.textContent = String(dia);

                            celula.appendChild(numeroDia);
                            const hoje = new Date();

                            const ehHoje =
                                dia === hoje.getDate() &&
                                mesAtual === hoje.getMonth() &&
                                anoAtual === hoje.getFullYear();

                            if (ehHoje) {
                                celula.classList.add('today');

                                celula.setAttribute(
                                    'aria-current',
                                    'date'
                                );
                            }

                            const possuiAnterior =
                                (treinosDia?.anteriores || 0) > 0;

                            if (
                                possuiCompleto ||
                                possuiParcial ||
                                possuiAnterior
                            ) {
                                celula.classList.add(
                                    'has-workout-history'
                                );

                                if (possuiParcial) {
                                    celula.classList.add(
                                        'workout-partial'
                                    );
                                } else if (possuiCompleto) {
                                    celula.classList.add(
                                        'workout-complete'
                                    );
                                }
                            }

                            if (marcado) {
                                celula.classList.add('checked');

                                const indicadorCheckin =
                                    document.createElement('span');

                                indicadorCheckin.className =
                                    'check-badge';

                                indicadorCheckin.textContent = '✓';

                                indicadorCheckin.setAttribute(
                                    'aria-hidden',
                                    'true'
                                );

                                celula.appendChild(
                                    indicadorCheckin
                                );
                            }

                            const descricaoTreinos = treinosDia
                                ? `; ${treinosDia.completos} completo(s), ` +
                                  `${treinosDia.parciais} parcial(is), ` +
                                  `${treinosDia.anteriores} anterior(es)`
                                : '';

                            celula.setAttribute(
                                'aria-label',
                                `${dia}/${String(mesAtual + 1).padStart(2, '0')}/${anoAtual}` +
                                descricaoTreinos
                            );

                            celula.title =
                                descricaoTreinos
                                    ? 'Treinos' + descricaoTreinos
                                    : '';

                            celula.addEventListener('click', () => {
                                abrirModalSupabase(data, celula);
                            });

                            grade.appendChild(celula);
                        }
                        const totalCelulas =
                            primeiroDia + totalDias;

                        const diasRestantes =
                            (7 - (totalCelulas % 7)) % 7;

                        for (let i = 0; i < diasRestantes; i++) {
                            const vazio =
                                document.createElement('div');

                            vazio.className = 'day-cell empty';
                            vazio.setAttribute('aria-hidden', 'true');

                            grade.appendChild(vazio);
                        }

                        /* =========================================
                           ESTATISTICAS ORIGINAIS SUPABASE
                        ========================================= */

                        const prefixoMes =
                            `${anoAtual}-` +
                            `${String(mesAtual + 1).padStart(2, '0')}-`;

                        const totalCheckinsMes =
                            Object.keys(checkins).filter(data =>
                                data.startsWith(prefixoMes) &&
                                checkins[data]?.checked === true
                            ).length;

                        const campoMes =
                            aviso.querySelector('#statMes');

                        if (campoMes) {
                            campoMes.textContent =
                                String(totalCheckinsMes);
                        }

                        let sequencia = 0;

                        const diaSequencia = new Date();
                        diaSequencia.setHours(12, 0, 0, 0);

                        while (true) {
                            const chave =
                                diaSequencia.getFullYear() + '-' +
                                String(
                                    diaSequencia.getMonth() + 1
                                ).padStart(2, '0') + '-' +
                                String(
                                    diaSequencia.getDate()
                                ).padStart(2, '0');

                            if (checkins[chave]?.checked !== true) {
                                break;
                            }

                            sequencia++;

                            diaSequencia.setDate(
                                diaSequencia.getDate() - 1
                            );
                        }

                        const campoSequencia =
                            aviso.querySelector('#statSequencia');

                        if (campoSequencia) {
                            campoSequencia.textContent =
                                String(sequencia);
                        }
                    }

                    botaoAnterior.addEventListener('click', () => {
                        mesAtual--;
                        renderizarMesSupabase();
                    });

                    botaoProximo.addEventListener('click', () => {
                        mesAtual++;
                        renderizarMesSupabase();
                    });

                    const diasSemana =
                        document.createElement('div');

                    diasSemana.className = 'weekdays';

                    [
                        'Dom', 'Seg', 'Ter', 'Qua',
                        'Qui', 'Sex', 'Sáb'
                    ].forEach(dia => {
                        const elemento =
                            document.createElement('span');

                        elemento.textContent = dia;
                        diasSemana.appendChild(elemento);
                    });

                    calendarioSupabase.append(
                        cabecalhoMes,
                        diasSemana,
                        grade
                    );

                    /* =========================================
                       COMPONENTES ORIGINAIS DO CALENDARIO
                       SUPABASE
                    ========================================= */
                    aviso.insertBefore(
                        calendarioSupabase,
                        voltar
                    );

                    const paginaFonte =
                        document.querySelector('.page');

                    const introducaoOriginal =
                        paginaFonte?.querySelector(
                            '.calendar-intro'
                        );

                    if (introducaoOriginal) {
                        aviso.insertBefore(
                            introducaoOriginal.cloneNode(true),
                            calendarioSupabase
                        );
                    }

                    const estatisticasOriginais =
                        paginaFonte?.querySelector('.stats-row');

                    if (estatisticasOriginais) {
                        aviso.insertBefore(
                            estatisticasOriginais.cloneNode(true),
                            calendarioSupabase
                        );
                    }

                    const legendaOriginal =
                        paginaFonte?.querySelector('.legend');

                    if (legendaOriginal) {
                        calendarioSupabase.appendChild(
                            legendaOriginal.cloneNode(true)
                        );
                    }

                    /* Remover elementos visuais provisórios.
                       Os dados e eventos continuam existentes. */

                    informacaoCheckins.remove();
                    resumoHistoricoSupabase.remove();

                    renderizarMesSupabase();

                } catch (erro) {
                    console.error(
                        'Erro ao consultar check-ins Supabase:',
                        erro
                    );

                    informacaoCheckins.textContent =
                        'Não foi possível consultar seus check-ins.';
                }

                /* =========================================
                   RECUPERAR ESTRUTURA ORIGINAL CALENDARIO
                   SUPABASE
                ========================================= */

                const paginaOriginal =
                    document.querySelector('.page');

                const navegacaoOriginal =
                    paginaOriginal?.querySelector('.app-nav');

                const cabecalhoOriginal =
                    paginaOriginal?.querySelector('.page-heading');

                const paginaSupabase =
                    document.createElement('div');

                paginaSupabase.className = 'page';

                if (navegacaoOriginal) {
                    const navegacaoSupabase =
                        navegacaoOriginal.cloneNode(true);

                    const botaoSairOriginal =
                        navegacaoSupabase.querySelector(
                            '#btnEndSession'
                        );

                    if (botaoSairOriginal) {
                        botaoSairOriginal.replaceWith(voltar);

                        voltar.id = 'btnEndSessionSupabase';
                        voltar.className = 'btn-end-session';
                        voltar.textContent = 'Sair';
                    }

                    paginaSupabase.appendChild(
                        navegacaoSupabase
                    );
                }

                aviso.removeAttribute('style');

                titulo.remove();
                mensagem.remove();

                if (cabecalhoOriginal) {
                    const cabecalhoSupabase =
                        cabecalhoOriginal.cloneNode(true);

                    aviso.insertBefore(
                        cabecalhoSupabase,
                        aviso.firstChild
                    );
                }

                paginaSupabase.appendChild(aviso);

                /* =========================================
                   PRESERVAR MODAIS ORIGINAIS DO CALENDARIO
                   SUPABASE
                ========================================= */

                const modalCheckinSupabase =
                    document.getElementById(
                        'checkinModalOverlay'
                    );

                const modalMotivacaoSupabase =
                    document.getElementById(
                        'motivacaoModalOverlay'
                    );

                document.body.replaceChildren(
                    paginaSupabase
                );

                if (modalCheckinSupabase) {
                    document.body.appendChild(
                        modalCheckinSupabase
                    );
                }

                if (modalMotivacaoSupabase) {
                    document.body.appendChild(
                        modalMotivacaoSupabase
                    );
                }

                /* =========================================
                   MOTIVACAO DIARIA - SUPABASE
                ========================================= */

                if (modalMotivacaoSupabase) {
                    try {
                        const chavePreferencias =
                            `fitzonePreferencias:supabase:${acessoSupabase.id}`;

                        const preferenciasJSON =
                            localStorage.getItem(chavePreferencias);

                        const preferencias = preferenciasJSON
                            ? JSON.parse(preferenciasJSON)
                            : {};

                        if (preferencias.mensagensMotivacionais !== false) {
                            const agora = new Date();

                            const hoje = [
                                agora.getFullYear(),
                                String(agora.getMonth() + 1).padStart(2, '0'),
                                String(agora.getDate()).padStart(2, '0')
                            ].join('-');

                            const chaveMotivacao =
                                `fitzoneMotivacao:supabase:${acessoSupabase.id}`;

                            if (localStorage.getItem(chaveMotivacao) !== hoje) {
                                const frases = [
                                    "Cada passo conta na construção de uma versão melhor de você.",
                                    "A disciplina transforma pequenos esforços em grandes conquistas.",
                                    "O progresso começa quando você decide não desistir.",
                                    "Seu maior desafio é superar quem você foi ontem.",
                                    "A constância faz a diferença, mesmo nos dias difíceis.",
                                    "Você não precisa ser perfeito. Precisa continuar.",
                                    "Cada treino é uma oportunidade de evoluir."
                                ];

                                const indice = Math.floor(
                                    new Date(hoje + 'T12:00:00').getTime() /
                                    86400000
                                ) % frases.length;

                                const texto = document.getElementById(
                                    'motivacaoModalTexto'
                                );

                                const autor = document.getElementById(
                                    'motivacaoModalAutor'
                                );

                                const botao = document.getElementById(
                                    'motivacaoModalBtn'
                                );

                                if (texto && autor && botao) {
                                    texto.textContent = frases[indice];
                                    autor.textContent = 'FitZone';

                                    modalMotivacaoSupabase.classList.add('show');
                                    modalMotivacaoSupabase.setAttribute(
                                        'aria-hidden',
                                        'false'
                                    );

                                    botao.addEventListener('click', () => {
                                        try {
                                            localStorage.setItem(
                                                chaveMotivacao,
                                                hoje
                                            );
                                        } catch (erro) {
                                            console.warn(
                                                'Erro ao registrar motivação:',
                                                erro
                                            );
                                        }

                                        modalMotivacaoSupabase.classList.remove(
                                            'show'
                                        );

                                        modalMotivacaoSupabase.setAttribute(
                                            'aria-hidden',
                                            'true'
                                        );
                                    }, { once: true });
                                }
                            }
                        }
                    } catch (erro) {
                        console.warn(
                            'Erro ao iniciar motivação Supabase:',
                            erro
                        );
                    }
                }

                const identificadorInicial =
                    acessoSupabase.identificador;

                let verificandoSessaoSupabase = false;

                async function verificarSessaoSupabaseCalendario() {
                    if (verificandoSessaoSupabase) {
                        return;
                    }

                    verificandoSessaoSupabase = true;

                    try {
                        const acessoAtual =
                            await identificarAcessoSupabaseCalendario();

                        if (
                            !acessoAtual.autenticado ||
                            acessoAtual.identificador !== identificadorInicial
                        ) {
                            window.location.replace('login.html');
                        }
                    } catch (erro) {
                        console.warn(
                            'Falha ao verificar sessão Supabase:',
                            erro
                        );

                        window.location.replace('login.html');
                    } finally {
                        verificandoSessaoSupabase = false;
                    }
                }

                window.addEventListener('pageshow', () => {
                    void verificarSessaoSupabaseCalendario();
                });

                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'visible') {
                        void verificarSessaoSupabaseCalendario();
                    }
                });

                return;
            }

        } catch (erro) {
            console.warn(
                'Não foi possível verificar a sessão Supabase:',
                erro
            );
        }

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

    // Monitorar troca ou encerramento de sessão
    const sessaoInicial = JSON.parse(
        localStorage.getItem("fitzoneSessao")
    );

    const emailSessaoInicial = sessaoInicial.email
        .trim()
        .toLowerCase();

    function verificarContinuidadeSessaoCalendario() {
        try {
            const dados = localStorage.getItem("fitzoneSessao");
            const sessaoAtual = dados ? JSON.parse(dados) : null;

            if (
                !sessaoAtual ||
                sessaoAtual.autenticado !== true ||
                typeof sessaoAtual.email !== "string" ||
                sessaoAtual.email.trim().toLowerCase() !== emailSessaoInicial
            ) {
                window.location.replace("calendario.html");
            }
        } catch (erro) {
            console.warn("Sessão do calendário inválida:", erro);
            window.location.replace("login.html");
        }
    }

    window.addEventListener("storage", (event) => {
        if (
            event.storageArea === localStorage &&
            (event.key === "fitzoneSessao" || event.key === null)
        ) {
            verificarContinuidadeSessaoCalendario();
        }
    });

    window.addEventListener(
        "pageshow",
        verificarContinuidadeSessaoCalendario
    );

    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
            verificarContinuidadeSessaoCalendario();
        }
    });

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

    /* =========================================
       TEMA DO CALENDARIO POR GENERO
    ========================================= */

    try {
        const sessao = JSON.parse(
            localStorage.getItem("fitzoneSessao")
        );

        const email = sessao.email.trim().toLowerCase();

        const genero = localStorage.getItem(
            `generoFitZone:${email}`
        );

        document.body.classList.remove(
            "theme-masculino",
            "theme-feminino"
        );

        if (genero === "masculino") {
            document.body.classList.add(
                "theme-masculino"
            );
        } else if (genero === "feminino") {
            document.body.classList.add(
                "theme-feminino"
            );
        }

    } catch (error) {
        console.warn(
            "Não foi possível aplicar o tema do calendário:",
            error
        );
    }

    /* =========================================
       MOTIVACAO DIARIA DO FITZONE
    ========================================= */

    const motivacaoModal =
        document.getElementById("motivacaoModalOverlay");

    const motivacaoTexto =
        document.getElementById("motivacaoModalTexto");

    const motivacaoAutor =
        document.getElementById("motivacaoModalAutor");

    const motivacaoBtn =
        document.getElementById("motivacaoModalBtn");

    const frasesMotivacionais = [
        {
            texto: "Cada passo conta na construção de uma versão melhor de você.",
            autor: "FitZone"
        },
        {
            texto: "A disciplina transforma pequenos esforços em grandes conquistas.",
            autor: "FitZone"
        },
        {
            texto: "O progresso começa quando você decide não desistir.",
            autor: "FitZone"
        },
        {
            texto: "Seu maior desafio é superar quem você foi ontem.",
            autor: "FitZone"
        },
        {
            texto: "A constância faz a diferença, mesmo nos dias difíceis.",
            autor: "FitZone"
        },
        {
            texto: "Você não precisa ser perfeito. Precisa continuar.",
            autor: "FitZone"
        },
        {
            texto: "Cada treino é uma oportunidade de evoluir.",
            autor: "FitZone"
        }
    ];

    function obterDataLocal() {
        const agora = new Date();

        const ano = agora.getFullYear();

        const mes = String(
            agora.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            agora.getDate()
        ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;
    }

    function iniciarMotivacaoDiaria() {
        if (
            !motivacaoModal ||
            !motivacaoTexto ||
            !motivacaoAutor ||
            !motivacaoBtn
        ) {
            return;
        }

        try {
            const sessao = JSON.parse(
                localStorage.getItem("fitzoneSessao")
            );

            const email = sessao.email.trim().toLowerCase();
            const hoje = obterDataLocal();

            /* Verificar preferencia de motivacao do usuario */
            const chavePreferencias = `fitzonePreferencias:${email}`;
            const preferenciasJSON = localStorage.getItem(
                chavePreferencias
            );

            if (preferenciasJSON) {
                const preferencias = JSON.parse(preferenciasJSON);

                if (
                    preferencias &&
                    !Array.isArray(preferencias) &&
                    preferencias.mensagensMotivacionais === false
                ) {
                    return;
                }
            }

            const chave = `fitzoneMotivacao:${email}`;

            if (localStorage.getItem(chave) === hoje) {
                return;
            }

            const indice = Math.floor(
                new Date(
                    hoje + "T12:00:00"
                ).getTime() / 86400000
            ) % frasesMotivacionais.length;

            const frase = frasesMotivacionais[indice];

            motivacaoTexto.textContent = frase.texto;
            motivacaoAutor.textContent = frase.autor;

            motivacaoModal.classList.add("show");
            motivacaoModal.setAttribute(
                "aria-hidden",
                "false"
            );

            motivacaoBtn.focus();

            motivacaoBtn.addEventListener(
                "click",
                () => {
                    try {
                        localStorage.setItem(chave, hoje);
                    } catch (error) {
                        console.warn(
                            "Não foi possível registrar a motivação diária:",
                            error
                        );
                    }

                    motivacaoModal.classList.remove("show");
                    motivacaoModal.setAttribute(
                        "aria-hidden",
                        "true"
                    );
                },
                { once: true }
            );

        } catch (error) {
            console.error(
                "Erro ao iniciar a motivação diária:",
                error
            );
        }
    }

    iniciarMotivacaoDiaria();

    /* =========================================
       ENCERRAR SESSAO
    ========================================= */

    const btnEndSession =
        document.getElementById("btnEndSession");

    if (btnEndSession) {
        btnEndSession.addEventListener("click", () => {
            localStorage.removeItem("fitzoneSessao");

            window.location.href = "login.html";
        });
    }

    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    const today = new Date();

    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();

   /* =========================================
   FITZONE - HISTORICO VISUAL DO CALENDARIO
========================================= */

function carregarHistoricoCalendario() {
    try {
        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        const sessao = sessaoJSON
            ? JSON.parse(sessaoJSON)
            : null;

        if (
            !sessao ||
            sessao.autenticado !== true ||
            typeof sessao.email !== 'string' ||
            !sessao.email.trim()
        ) {
            return [];
        }

        const email = sessao.email.trim().toLowerCase();

        const chave = `historicoTreinos:${email}`;
        const dados = localStorage.getItem(chave);

        if (!dados) {
            return [];
        }

        const historico = JSON.parse(dados);

        return Array.isArray(historico)
            ? historico
            : [];

    } catch (erro) {
        console.warn(
            'Não foi possível consultar o histórico do calendário:',
            erro
        );

        return [];
    }
}

/* =========================================
   FITZONE - AGRUPAR HISTORICO POR DIA
========================================= */

function agruparHistoricoCalendarioPorDia() {
    const historico = carregarHistoricoCalendario();
    const registrosPorDia = {};

    historico.forEach(registro => {
        if (
            !registro ||
            typeof registro !== 'object' ||
            typeof registro.data !== 'string'
        ) {
            return;
        }

        const data = new Date(registro.data);

        if (Number.isNaN(data.getTime())) {
            return;
        }

        const ano = data.getFullYear();
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const dia = String(data.getDate()).padStart(2, '0');

        const chaveData = `${ano}-${mes}-${dia}`;

        if (!registrosPorDia[chaveData]) {
            registrosPorDia[chaveData] = [];
        }

        registrosPorDia[chaveData].push(registro);
    });

    return registrosPorDia;
}

    /* =========================================
       FITZONE - CHAVES DO CALENDARIO SUPABASE
    ========================================= */

    async function obterChavesCalendarioSupabase() {
        const chaveCheckins =
            await obterChaveArmazenamentoSupabaseFitZone(
                'checkins'
            );

        const chaveHistorico =
            await obterChaveArmazenamentoSupabaseFitZone(
                'historico'
            );

        return {
            checkins: chaveCheckins,
            historico: chaveHistorico
        };
    }

    /* =========================================
       FITZONE - LER CHECK-INS SUPABASE
    ========================================= */

    async function carregarCheckinsSupabase() {
        const chaves =
            await obterChavesCalendarioSupabase();

        const dadosSalvos = localStorage.getItem(
            chaves.checkins
        );

        if (!dadosSalvos) {
            return {};
        }

        const checkins = JSON.parse(dadosSalvos);

        if (
            !checkins ||
            typeof checkins !== 'object' ||
            Array.isArray(checkins)
        ) {
            throw new Error(
                'Formato inválido dos check-ins Supabase.'
            );
        }

        return checkins;
    }

    /* =========================================
       FITZONE - SALVAR CHECK-INS SUPABASE
    ========================================= */

    async function salvarCheckinsSupabase(dados) {
        if (
            !dados ||
            typeof dados !== 'object' ||
            Array.isArray(dados)
        ) {
            throw new Error(
                'Formato inválido dos check-ins.'
            );
        }

        const chaves =
            await obterChavesCalendarioSupabase();

        // Verificar os dados existentes antes de salvar.
        await carregarCheckinsSupabase();

        localStorage.setItem(
            chaves.checkins,
            JSON.stringify(dados)
        );

        return true;
    }

    /* =========================================
       LEITURA SEGURA DOS CHECK-INS
    ========================================= */

    function loadCheckins() {
        try {
            const sessaoJSON =
                localStorage.getItem("fitzoneSessao");

            const sessao = sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

            if (
                !sessao ||
                sessao.autenticado !== true ||
                typeof sessao.email !== "string" ||
                !sessao.email.trim()
            ) {
                return {};
            }

            const email = sessao.email.trim().toLowerCase();

            const storageKey = `fitzoneCheckins:${email}`;

            const savedData = localStorage.getItem(storageKey);

            if (!savedData) {
                return {};
            }

            const checkins = JSON.parse(savedData);

            if (
                !checkins ||
                typeof checkins !== "object" ||
                Array.isArray(checkins)
            ) {
                return {};
            }

            return checkins;

        } catch (error) {
            console.error(
                "Erro ao carregar os check-ins:",
                error
            );

            return {};
        }
    }

    /* =========================================
       SALVAMENTO SEGURO DOS CHECK-INS
    ========================================= */

    function saveCheckins(data) {
        try {
            const sessaoJSON =
                localStorage.getItem("fitzoneSessao");

            const sessao = sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

            if (
                !sessao ||
                sessao.autenticado !== true ||
                typeof sessao.email !== "string" ||
                !sessao.email.trim()
            ) {
                throw new Error("Sessão inválida.");
            }

            const email = sessao.email.trim().toLowerCase();
            const storageKey = `fitzoneCheckins:${email}`;

            const dadosAtuais = localStorage.getItem(storageKey);

            if (dadosAtuais !== null) {
                const dadosVerificados =
                    JSON.parse(dadosAtuais);

                if (
                    !dadosVerificados ||
                    typeof dadosVerificados !== "object" ||
                    Array.isArray(dadosVerificados)
                ) {
                    throw new Error(
                        "Dados de check-in existentes inválidos."
                    );
                }
            }

            localStorage.setItem(
                storageKey,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {
            console.error(
                "Erro ao salvar check-ins:",
                error
            );

            alert(
                "Não foi possível salvar o check-in. Tente novamente."
            );

            return false;
        }
    }

    /* =========================================
       SEQUENCIA DE CHECK-INS
    ========================================= */

    function calcularSequencia(checkins) {
        let sequencia = 0;

        const data = new Date();
        data.setHours(12, 0, 0, 0);

        while (true) {
            const ano = data.getFullYear();

            const mes = String(
                data.getMonth() + 1
            ).padStart(2, "0");

            const dia = String(
                data.getDate()
            ).padStart(2, "0");

            const chave = `${ano}-${mes}-${dia}`;

            if (
                checkins[chave] &&
                checkins[chave].checked === true
            ) {
                sequencia++;

                data.setDate(data.getDate() - 1);
            } else {
                break;
            }
        }

        return sequencia;
    }

    const monthLabel = document.getElementById("monthLabel");
    const daysGrid = document.getElementById("daysGrid");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

    /* =========================================
       JANELA DE CHECK-IN
    ========================================= */

    const checkinModal =
        document.getElementById("checkinModalOverlay");

    const checkinModalDate =
        document.getElementById("checkinModalDate");

    const checkinCancelBtn =
        document.getElementById("checkinCancelBtn");

    const checkinToggle =
        document.getElementById("checkinToggle");

    const checkinTreinoInput =
        document.getElementById("checkinTreinoInput");

    let checkinModalTrigger = null;
    let selectedCheckinDateKey = null;

    /* =========================================
       FITZONE - HISTORICO DO DIA SELECIONADO
    ========================================= */

    function atualizarHistoricoDiaCalendario(dateKey) {
        const secao = document.getElementById(
            'historicoDiaCalendario'
        );

        const lista = document.getElementById(
            'historicoDiaLista'
        );

        if (!secao || !lista) {
            return;
        }

        lista.replaceChildren();

        const historicoPorDia =
            agruparHistoricoCalendarioPorDia();

        const treinosDoDia = historicoPorDia[dateKey] || [];

        if (treinosDoDia.length === 0) {
            secao.hidden = true;
            return;
        }

        treinosDoDia.forEach(registro => {
            const item = document.createElement('div');
            item.className = 'historico-dia-item';

            const nome = document.createElement('strong');
            nome.className = 'historico-dia-nome';
            nome.textContent = registro.nome || 'Treino';

            const detalhes = document.createElement('span');
            detalhes.className = 'historico-dia-status';

            const total = Number(registro.seriesTotal);
            const concluidas = Number(registro.seriesConcluidas);

            const possuiDetalhes =
                registro.seriesTotal != null &&
                registro.seriesConcluidas != null &&
                Number.isFinite(total) &&
                Number.isFinite(concluidas) &&
                total > 0 &&
                concluidas >= 0;

            if (!possuiDetalhes) {
                item.classList.add('registro-anterior');

                detalhes.textContent = 'Registro anterior';
            } else if (concluidas >= total) {
                item.classList.add('treino-completo');

                detalhes.textContent =
                    `Completo · ${concluidas} de ${total} séries`;
            } else {
                item.classList.add('treino-parcial');

                detalhes.textContent =
                    `Parcial · ${concluidas} de ${total} séries`;
            }

            item.append(nome, detalhes);
            lista.appendChild(item);
        });

        secao.hidden = false;
    }

    function openCheckinModal(dateKey, day) {
        const checkins = loadCheckins();
        const checkin = checkins[dateKey] || {};

        selectedCheckinDateKey = dateKey;

        checkinModalTrigger = document.activeElement;

        checkinModalDate.textContent =
            `${day} de ${monthNames[currentMonth]} de ${currentYear}`;

        const isChecked = checkin.checked === true;

        checkinToggle.classList.toggle("active", isChecked);

        checkinToggle.setAttribute(
            "aria-checked",
            String(isChecked)
        );

        checkinTreinoInput.value = checkin.treino || "";

        // Exibe o historico de treinos do dia selecionado
        atualizarHistoricoDiaCalendario(dateKey);

        checkinModal.classList.add("show");
        checkinCancelBtn.focus();
    }

    function closeCheckinModal() {
        checkinModal.classList.remove("show");

        if (
            checkinModalTrigger &&
            checkinModalTrigger.isConnected
        ) {
            checkinModalTrigger.focus();
        }

        checkinModalTrigger = null;
        selectedCheckinDateKey = null;
    }

    /* =========================================
       CONTROLE VISUAL DO CHECK-IN
    ========================================= */

    checkinToggle.addEventListener("click", () => {
        const isActive =
            checkinToggle.classList.toggle("active");

        checkinToggle.setAttribute(
            "aria-checked",
            String(isActive)
        );
    });

    /* =========================================
       SALVAR CHECK-IN DO DIA SELECIONADO
    ========================================= */

    const checkinSaveBtn =
        document.getElementById("checkinSaveBtn");

    checkinSaveBtn.addEventListener("click", () => {
        if (!selectedCheckinDateKey) {
            return;
        }

        const checkins = loadCheckins();

        const checked =
            checkinToggle.getAttribute("aria-checked") === "true";

        const treino =
            checkinTreinoInput.value.trim();

        if (!checked && !treino) {
            delete checkins[selectedCheckinDateKey];
        } else {
            checkins[selectedCheckinDateKey] = {
                checked,
                treino
            };
        }

        const salvou = saveCheckins(checkins);

        if (!salvou) {
            return;
        }

        closeCheckinModal();
        selectedCheckinDateKey = null;

        renderCalendar();
    });

    checkinCancelBtn.addEventListener(
        "click",
        closeCheckinModal
    );

    checkinModal.addEventListener("click", (event) => {
        if (event.target === checkinModal) {
            closeCheckinModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            checkinModal.classList.contains("show")
        ) {
            closeCheckinModal();
        }
    });

    function renderCalendar() {

        const checkins = loadCheckins();
        const historicoPorDia = agruparHistoricoCalendarioPorDia();

        let checkinsNoMes = 0;

        monthLabel.textContent =
            `${monthNames[currentMonth]} ${currentYear}`;

        daysGrid.innerHTML = "";

        const firstDay = new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();

        const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();

        for (let i = 0; i < firstDay; i++) {

            const empty = document.createElement("div");

            empty.className = "day-cell empty";
            empty.setAttribute("aria-hidden", "true");

            daysGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {

            const cell = document.createElement("div");

            cell.className = "day-cell";

            const month = String(currentMonth + 1).padStart(2, "0");
            const date = String(day).padStart(2, "0");

            const dateKey = `${currentYear}-${month}-${date}`;

            const checkin = checkins[dateKey];

            const treinosDoDia = historicoPorDia[dateKey] || [];

            if (treinosDoDia.length > 0) {
                cell.classList.add('has-workout-history');

                const treinosComDetalhes = treinosDoDia.filter(registro => {
                    const total = Number(registro.seriesTotal);
                    const concluidas = Number(registro.seriesConcluidas);

                    return (
                        registro.seriesTotal != null &&
                        registro.seriesConcluidas != null &&
                        Number.isFinite(total) &&
                        Number.isFinite(concluidas) &&
                        total > 0 &&
                        concluidas >= 0
                    );
                });

                if (treinosComDetalhes.length > 0) {
                    const todosCompletos = treinosComDetalhes.every(registro => {
                        return Number(registro.seriesConcluidas) >=
                            Number(registro.seriesTotal);
                    });

                    cell.classList.add(
                        todosCompletos
                            ? 'workout-complete'
                            : 'workout-partial'
                    );
                }
            }

            if (checkin && checkin.checked === true) {
                cell.classList.add("checked");
                checkinsNoMes++;
            }

            const number = document.createElement("span");

            number.className = "num";
            number.textContent = day;

            const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

            if (isToday) {
                cell.classList.add("today");
                cell.setAttribute("aria-current", "date");
            }

            cell.appendChild(number);

            if (checkin && checkin.checked === true) {
                const badge = document.createElement("span");

                badge.className = "check-badge";
                badge.textContent = "✓";

                cell.appendChild(badge);
            }

            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");

            cell.setAttribute(
                "aria-label",
                `Consultar check-in de ${day} de ${monthNames[currentMonth]}`
            );

            cell.addEventListener("click", () => {
                openCheckinModal(dateKey, day);
            });

            cell.addEventListener("keydown", (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openCheckinModal(dateKey, day);
                }
            });

            daysGrid.appendChild(cell);
        }

        document.getElementById("statMes").textContent =
            checkinsNoMes;

        document.getElementById("statSequencia").textContent =
            calcularSequencia(checkins);
    }

    prevMonth.addEventListener("click", () => {

        const previous = new Date(
            currentYear,
            currentMonth - 1,
            1
        );

        currentYear = previous.getFullYear();
        currentMonth = previous.getMonth();

        renderCalendar();
    });

    nextMonth.addEventListener("click", () => {

        const next = new Date(
            currentYear,
            currentMonth + 1,
            1
        );

        currentYear = next.getFullYear();
        currentMonth = next.getMonth();

        renderCalendar();
    });

    renderCalendar();

    /* Calendario tradicional pronto */
    document.getElementById(
        'fitzoneCalendarLoader'
    )?.remove();

});
