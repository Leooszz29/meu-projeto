
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

    async function inicializarCalendarioSupabase() {

        try {
            const acessoSupabase =
                await identificarAcessoSupabaseCalendario();


            if (acessoSupabase.autenticado) {

                /* =========================================
                   MONITORAR SESSAO SUPABASE
                ========================================= */

                const clienteSessaoCalendario =
                    inicializarSupabaseFitZone();

                if (clienteSessaoCalendario) {
                    clienteSessaoCalendario.auth.onAuthStateChange(
                        (evento, sessaoAtual) => {
                            const idUsuarioAtual =
                                sessaoAtual?.user?.id;

                            if (
                                evento === 'SIGNED_OUT' ||
                                (
                                    evento === 'SIGNED_IN' &&
                                    idUsuarioAtual !== acessoSupabase.id
                                )
                            ) {
                                window.location.replace(
                                    'login.html'
                                );
                            }
                        }
                    );
                }

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
                    const checkins =
                        await carregarCheckinsSupabase(
                            acessoSupabase.id
                        );

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
                                    await carregarCheckinsSupabase(
                                        acessoSupabase.id
                                    );

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

                                await salvarCheckinsSupabase(
                                    dadosAtuais,
                                    acessoSupabase.id
                                );

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

    /* =========================================
       FITZONE - CHECK-INS VINCULADOS A CONTA
    ========================================= */

    async function obterChaveCheckinsCalendarioSupabase(
        usuarioIdEsperado
    ) {
        await obterUsuarioVinculadoSupabaseFitZone(
            usuarioIdEsperado
        );

        return `fitzone:checkins:supabase:${usuarioIdEsperado}`;
    }

    function lerCheckinsCalendarioSupabase(chave) {
        const dadosSalvos = localStorage.getItem(chave);

        if (dadosSalvos === null) {
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

    async function carregarCheckinsSupabase(
        usuarioIdEsperado
    ) {
        const chave =
            await obterChaveCheckinsCalendarioSupabase(
                usuarioIdEsperado
            );

        return lerCheckinsCalendarioSupabase(chave);
    }

    async function salvarCheckinsSupabase(
        dados,
        usuarioIdEsperado
    ) {
        if (
            !dados ||
            typeof dados !== 'object' ||
            Array.isArray(dados)
        ) {
            throw new Error(
                'Formato inválido dos check-ins.'
            );
        }

        const chave =
            await obterChaveCheckinsCalendarioSupabase(
                usuarioIdEsperado
            );

        // Validar os dados atuais da mesma conta.
        lerCheckinsCalendarioSupabase(chave);

        localStorage.setItem(
            chave,
            JSON.stringify(dados)
        );

        return true;
    }

    /* =========================================
       INICIALIZAR CALENDARIO SUPABASE
    ========================================= */

    await inicializarCalendarioSupabase();

});
