/* =========================================
   FITZONE - BIBLIOTECA DE EXERCICIOS
========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       VERIFICAR SESSAO
    ========================================= */

    let sessao = null;

    try {
        const dadosSessao =
            localStorage.getItem('fitzoneSessao');

        sessao = dadosSessao
            ? JSON.parse(dadosSessao)
            : null;

    } catch (error) {
        console.warn(
            'Erro ao carregar sessão:',
            error
        );
    }

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        window.location.replace('login.html');
        return;
    }

    /* =========================================
       TEMA POR GENERO
    ========================================= */

    const email = sessao.email.trim().toLowerCase();

    const genero = localStorage.getItem(
        `generoFitZone:${email}`
    );

    document.body.classList.remove(
        'theme-masculino',
        'theme-feminino'
    );

    if (genero === 'masculino') {
        document.body.classList.add(
            'theme-masculino'
        );
    } else if (genero === 'feminino') {
        document.body.classList.add(
            'theme-feminino'
        );
    }
   
    /* =========================================
       CATALOGO DE EXERCICIOS
    ========================================= */

    const exercicios = [
        {
            id: 'supino-reto',
            nome: 'Supino reto',
            grupo: 'Peito',
            musculos: 'Peitoral, tríceps e ombros',
            instrucao: 'Deitado no banco, empurre a barra para cima e retorne de forma controlada.'
        },
        {
            id: 'crucifixo',
            nome: 'Crucifixo com halteres',
            grupo: 'Peito',
            musculos: 'Peitoral',
            instrucao: 'Deitado no banco, abra os braços com cotovelos levemente flexionados e retorne.'
        },
        {
            id: 'puxada-frontal',
            nome: 'Puxada frontal',
            grupo: 'Costas',
            musculos: 'Dorsais e bíceps',
            instrucao: 'Puxe a barra em direção à parte superior do peito, mantendo o tronco estável.'
        },
        {
            id: 'remada-baixa',
            nome: 'Remada baixa',
            grupo: 'Costas',
            musculos: 'Dorsais e bíceps',
            instrucao: 'Puxe o pegador em direção ao abdômen, aproximando as escápulas.'
        },
        {
            id: 'agachamento-livre',
            nome: 'Agachamento livre',
            grupo: 'Pernas',
            musculos: 'Quadríceps e glúteos',
            instrucao: 'Flexione quadril e joelhos de forma controlada e retorne à posição inicial.'
        },
        {
            id: 'leg-press',
            nome: 'Leg press',
            grupo: 'Pernas',
            musculos: 'Quadríceps e glúteos',
            instrucao: 'Empurre a plataforma de forma controlada, sem travar os joelhos.'
        },
        {
            id: 'rosca-direta',
            nome: 'Rosca direta',
            grupo: 'Braços',
            musculos: 'Bíceps',
            instrucao: 'Flexione os cotovelos para elevar a barra e retorne lentamente.'
        },
        {
            id: 'triceps-polia',
            nome: 'Tríceps na polia',
            grupo: 'Braços',
            musculos: 'Tríceps',
            instrucao: 'Estenda os cotovelos mantendo os braços próximos ao tronco.'
        },
        {
            id: 'desenvolvimento',
            nome: 'Desenvolvimento com halteres',
            grupo: 'Ombros',
            musculos: 'Deltoides e tríceps',
            instrucao: 'Empurre os halteres acima da cabeça e retorne de forma controlada.'
        },
        {
            id: 'elevacao-lateral',
            nome: 'Elevação lateral',
            grupo: 'Ombros',
            musculos: 'Deltoides',
            instrucao: 'Eleve os braços lateralmente até aproximadamente a altura dos ombros.'
        },
        {
            id: 'prancha',
            nome: 'Prancha abdominal',
            grupo: 'Abdômen',
            musculos: 'Abdômen e estabilizadores do tronco',
            instrucao: 'Mantenha o corpo alinhado, com o abdômen contraído e sem prender a respiração.'
        },

        {
            id: 'abdominal-crunch',
            nome: 'Abdominal crunch',
            grupo: 'Abdômen',
            musculos: 'Reto abdominal',
            instrucao: 'Eleve suavemente a parte superior do tronco, sem puxar o pescoço.'
        },
        {
            id: 'supino-inclinado',
            nome: 'Supino inclinado com halteres',
            grupo: 'Peito',
            musculos: 'Peitoral superior, ombros e tríceps',
            instrucao: 'Em um banco inclinado, empurre os halteres para cima e retorne de forma controlada.'
        },
        {
            id: 'remada-unilateral',
            nome: 'Remada unilateral com halter',
            grupo: 'Costas',
            musculos: 'Dorsais e bíceps',
            instrucao: 'Com o tronco estável, puxe o halter em direção ao quadril e abaixe lentamente.'
        },
        {
            id: 'mesa-flexora',
            nome: 'Mesa flexora',
            grupo: 'Pernas',
            musculos: 'Posteriores da coxa',
            instrucao: 'Flexione os joelhos contra a resistência da máquina e retorne lentamente.'
        },
        {
            id: 'rosca-martelo',
            nome: 'Rosca martelo',
            grupo: 'Braços',
            musculos: 'Bíceps, braquial e braquiorradial',
            instrucao: 'Com as palmas voltadas para dentro, flexione os cotovelos e retorne de forma controlada.'
        },
        {
            id: 'elevacao-frontal',
            nome: 'Elevação frontal',
            grupo: 'Ombros',
            musculos: 'Deltoide anterior',
            instrucao: 'Eleve os halteres à frente do corpo até aproximadamente a altura dos ombros.'
        },
        {
            id: 'abdominal-infra',
            nome: 'Elevação de joelhos',
            grupo: 'Abdômen',
            musculos: 'Reto abdominal e flexores do quadril',
            instrucao: 'Eleve os joelhos em direção ao tronco, evitando balançar o corpo.'
        }
    ];
   
    /* =========================================
       EXIBIR EXERCICIOS NA BIBLIOTECA
    ========================================= */

    const libraryGrid = document.getElementById(
        'exerciseLibraryGrid'
    );

    const resultsCount = document.getElementById(
        'exerciseResultsCount'
    );

    function renderizarExercicios(lista) {
        if (!libraryGrid || !resultsCount) {
            return;
        }

        libraryGrid.replaceChildren();
       
        if (lista.length === 0) {
            const mensagem = document.createElement('p');

            mensagem.className = 'library-empty-message';

            mensagem.textContent =
                'Nenhum exercício encontrado. Tente outro nome ou grupo muscular.';

            mensagem.style.gridColumn = '1 / -1';
            mensagem.style.textAlign = 'center';
            mensagem.style.padding = '30px 15px';
            mensagem.style.color = 'var(--chalk-dim)';
            mensagem.style.lineHeight = '1.6';

            libraryGrid.appendChild(mensagem);

            resultsCount.textContent =
                '0 exercícios encontrados';

            return;
        }

        lista.forEach((exercicio) => {
            const card = document.createElement('article');
            card.className = 'library-card';

            const grupo = document.createElement('span');
            grupo.className = 'library-card-group';
            grupo.textContent = exercicio.grupo;

            const titulo = document.createElement('h3');
            titulo.textContent = exercicio.nome;

            const musculos = document.createElement('p');
            musculos.className = 'library-card-muscles';
            musculos.textContent = exercicio.musculos;


            const detalhes = document.createElement('details');
            detalhes.className = 'library-card-details';

            const resumo = document.createElement('summary');
            resumo.textContent = 'Ver execução';
           
            detalhes.addEventListener('toggle', () => {
                resumo.textContent = detalhes.open
                    ? 'Ocultar execução'
                    : 'Ver execução';
            });

            const instrucao = document.createElement('p');
            instrucao.className = 'library-card-instruction';
            instrucao.textContent = exercicio.instrucao;

            detalhes.append(resumo, instrucao);

            card.append(
                grupo,
                titulo,
                musculos,
                detalhes
            );

            const linkTreino = document.createElement('a');

            linkTreino.className = 'btn-add-exercise';
            linkTreino.textContent = '+ Escolher treino';

            linkTreino.href =
                `treinos.html?biblioteca=${encodeURIComponent(exercicio.id)}`;

            card.appendChild(linkTreino);

            libraryGrid.appendChild(card);

        });

        resultsCount.textContent =
            `${lista.length} exercícios encontrados`;
    }
 
    /* =========================================
       PESQUISA E FILTROS DA BIBLIOTECA
    ========================================= */

    const campoPesquisa = document.getElementById(
        'exerciseSearch'
    );

    const botoesFiltro = document.querySelectorAll(
        '.library-filter'
    );

    let grupoAtual = 'Todos';

    function normalizarTexto(texto) {
        return texto
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function atualizarBiblioteca() {

        const pesquisa = campoPesquisa
            ? normalizarTexto(campoPesquisa.value)
            : '';

        const exerciciosFiltrados = exercicios.filter(
            (exercicio) => {

                const correspondeGrupo =
                    grupoAtual === 'Todos' ||
                    exercicio.grupo === grupoAtual;

                const textoPesquisa = normalizarTexto(
                    `${exercicio.nome} ${exercicio.musculos} ${exercicio.grupo}`
                );

                const correspondePesquisa =
                    textoPesquisa.includes(pesquisa);

                return correspondeGrupo &&
                    correspondePesquisa;
            }
        );

        renderizarExercicios(exerciciosFiltrados);
    }

    /* FILTROS POR GRUPO MUSCULAR */

    botoesFiltro.forEach((botao) => {

        botao.addEventListener('click', () => {

            grupoAtual = botao.dataset.group;

            botoesFiltro.forEach((item) => {

                const estaAtivo = item === botao;

                item.classList.toggle(
                    'active',
                    estaAtivo
                );

                item.setAttribute(
                    'aria-pressed',
                    String(estaAtivo)
                );
            });

            atualizarBiblioteca();
        });
    });

    /* PESQUISA POR NOME */

    if (campoPesquisa) {
        campoPesquisa.addEventListener(
            'input',
            atualizarBiblioteca
        );
    }

    /* EXIBICAO INICIAL */

    atualizarBiblioteca();

    /* =========================================
       ENCERRAR SESSAO
    ========================================= */

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

});
