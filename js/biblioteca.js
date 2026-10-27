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
       PROTEGER BIBLIOTECA CONTRA TROCA DE CONTA
    ========================================= */

    const emailSessaoInicialBiblioteca =
        sessao.email.trim().toLowerCase();

    function verificarContinuidadeSessaoBiblioteca() {
        try {
            const dadosSessao =
                localStorage.getItem('fitzoneSessao');

            const sessaoAtual = dadosSessao
                ? JSON.parse(dadosSessao)
                : null;

            if (
                !sessaoAtual ||
                sessaoAtual.autenticado !== true ||
                typeof sessaoAtual.email !== 'string' ||
                sessaoAtual.email.trim().toLowerCase() !==
                    emailSessaoInicialBiblioteca
            ) {
                window.location.replace('login.html');
                return false;
            }

            return true;

        } catch (erro) {
            console.warn(
                'Não foi possível verificar a sessão da biblioteca:',
                erro
            );

            window.location.replace('login.html');
            return false;
        }
    }

    window.addEventListener('storage', (event) => {
        if (
            event.storageArea === localStorage &&
            (event.key === 'fitzoneSessao' || event.key === null)
        ) {
            verificarContinuidadeSessaoBiblioteca();
        }
    });

    window.addEventListener(
        'pageshow',
        verificarContinuidadeSessaoBiblioteca
    );

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            verificarContinuidadeSessaoBiblioteca();
        }
    });

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
       FAVORITOS POR USUARIO
    ========================================= */

    const chaveFavoritos = `fitzoneFavoritos:${email}`;

    let favoritosSalvos = [];

    try {
        const dados = JSON.parse(
            localStorage.getItem(chaveFavoritos) || '[]'
        );

        if (Array.isArray(dados)) {
            favoritosSalvos = dados;
        }
    } catch (error) {
        console.warn('Erro ao carregar favoritos:', error);
    }

    const favoritos = new Set(favoritosSalvos);

    /* =========================================
       CATALOGO DE EXERCICIOS
    ========================================= */

    /* =========================================
       IMAGENS DOS EXERCICIOS
    ========================================= */

    const imagensExercicios = {
        'supino-reto': 'supino-reto.webp',
        'crucifixo': 'crucifixo-halteres.webp',
        'supino-inclinado': 'supino-inclinado-halteres.webp',
        'peck-deck': 'peck-deck.webp',
        'flexao-bracos': 'flexao-bracos.webp',
        'rosca-direta': 'rosca-direta.webp',
        'rosca-martelo': 'rosca-martelo.webp',
        'rosca-barra-w': 'rosca-barra-w.webp',
        'rosca-scott': 'rosca-scott.webp',
        'triceps-polia': 'triceps-polia.webp',
        'triceps-corda': 'triceps-corda.webp',
        'triceps-frances': 'triceps-frances.webp',
        'agachamento-livre': 'agachamento-livre.webp',
        'leg-press': 'leg-press.webp',
        'mesa-flexora': 'mesa-flexora.webp',
        'cadeira-extensora': 'cadeira-extensora.webp',
        'elevacao-pelvica': 'elevacao-pelvica.webp',
        'gemeos-em-pe': 'gemeos-em-pe.webp',
        'puxada-frontal': 'puxada-frontal.webp',
        'remada-baixa': 'remada-baixa.webp',
        'remada-unilateral': 'remada-unilateral.webp',
        'remada-curvada': 'remada-curvada.webp',
        'barra-fixa': 'barra-fixa.webp',
        'desenvolvimento': 'desenvolvimento.webp',
        'elevacao-lateral': 'elevacao-lateral.webp',
        'elevacao-frontal': 'elevacao-frontal.webp',
        'crucifixo-inverso': 'crucifixo-inverso.webp',
        'face-pull': 'face-pull.webp',
        'prancha': 'prancha.webp',
        'abdominal-crunch': 'abdominal-crunch.webp',
        'abdominal-infra': 'abdominal-infra.webp',
        'abdominal-bicicleta': 'abdominal-bicicleta.webp',
        'prancha-lateral': 'prancha-lateral.webp'
    };

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
        },
        {
            id: 'cadeira-extensora',
            nome: 'Cadeira extensora',
            grupo: 'Pernas',
            musculos: 'Quadríceps',
            instrucao: 'Sentado na máquina, estenda os joelhos de forma controlada e retorne lentamente.'
        },
        {
            id: 'elevacao-pelvica',
            nome: 'Elevação pélvica',
            grupo: 'Pernas',
            musculos: 'Glúteos e posteriores da coxa',
            instrucao: 'Com a parte superior das costas apoiada, eleve o quadril contraindo os glúteos e retorne de forma controlada.'
        },
        {
            id: 'gemeos-em-pe',
            nome: 'Gêmeos em pé (panturrilha)',
            grupo: 'Pernas',
            musculos: 'Gastrocnêmio e sóleo',
            instrucao: 'Eleve os calcanhares de forma controlada, mantenha o equilíbrio e retorne lentamente.'
        },
        {
            id: 'peck-deck',
            nome: 'Crucifixo na máquina (Peck Deck)',
            grupo: 'Peito',
            musculos: 'Peitoral e deltoide anterior',
            instrucao: 'Ajuste o banco, mantenha as costas apoiadas e aproxime os braços à frente do peito de forma controlada.'
        },
        {
            id: 'rosca-barra-w',
            nome: 'Rosca com barra W',
            grupo: 'Braços',
            musculos: 'Bíceps, braquial e braquiorradial',
            instrucao: 'Segure a barra W com as palmas voltadas para cima, flexione os cotovelos mantendo os braços próximos ao corpo e retorne lentamente.'
        },
        {
            id: 'triceps-corda',
            nome: 'Tríceps corda',
            grupo: 'Braços',
            musculos: 'Tríceps braquial',
            instrucao: 'Na polia alta, mantenha os cotovelos próximos ao tronco, estenda os braços puxando a corda para baixo e retorne de forma controlada.'
        },
        {
            id: 'flexao-bracos',
            nome: 'Flexão de braços',
            grupo: 'Peito',
            musculos: 'Peitoral, tríceps e deltoide anterior',
            instrucao: 'Com as mãos apoiadas no chão, mantenha o tronco alinhado, flexione os cotovelos e empurre o corpo de volta à posição inicial.'
        },
        {
            id: 'remada-curvada',
            nome: 'Remada curvada com barra',
            grupo: 'Costas',
            musculos: 'Dorsais, romboides, trapézio e bíceps',
            instrucao: 'Incline o tronco mantendo a coluna neutra e puxe a barra em direção ao abdômen, retornando de forma controlada.'
        },
        {
            id: 'barra-fixa',
            nome: 'Barra fixa',
            grupo: 'Costas',
            musculos: 'Dorsais, bíceps e músculos das escápulas',
            instrucao: 'Segure a barra com as mãos afastadas, mantenha o tronco firme e puxe o corpo até aproximar o queixo da barra. Retorne de forma controlada, sem balançar.'
        },
        {
            id: 'rosca-scott',
            nome: 'Rosca Scott',
            grupo: 'Braços',
            musculos: 'Bíceps e braquial',
            instrucao: 'Apoie os braços no banco Scott, flexione os cotovelos para elevar a barra e retorne lentamente, sem retirar os braços do apoio.'
        },
        {
            id: 'triceps-frances',
            nome: 'Tríceps francês com halter',
            grupo: 'Braços',
            musculos: 'Tríceps braquial',
            instrucao: 'Segure um halter acima da cabeça, flexione os cotovelos para baixar o peso atrás da cabeça e estenda os braços de forma controlada.'
        },
        {
            id: 'crucifixo-inverso',
            nome: 'Crucifixo inverso na máquina',
            grupo: 'Ombros',
            musculos: 'Deltoide posterior, romboides e trapézio',
            instrucao: 'Ajuste o banco e os pegadores da máquina. Abra os braços para trás de forma controlada, sem elevar os ombros, e retorne lentamente.'
        },
        {
            id: 'face-pull',
            nome: 'Face pull na polia',
            grupo: 'Ombros',
            musculos: 'Deltoide posterior, trapézio e rotadores externos do ombro',
            instrucao: 'Com a corda na polia alta, puxe em direção ao rosto, afastando as mãos e mantendo o tronco estável. Retorne lentamente.'
        },
        {
            id: 'abdominal-bicicleta',
            nome: 'Abdominal bicicleta',
            grupo: 'Abdômen',
            musculos: 'Reto abdominal e oblíquos',
            instrucao: 'Deitado de costas, eleve os ombros e aproxime alternadamente o cotovelo do joelho oposto, mantendo o movimento controlado e sem puxar o pescoço.'
        },
        {
            id: 'prancha-lateral',
            nome: 'Prancha lateral',
            grupo: 'Abdômen',
            musculos: 'Oblíquos, glúteo médio e estabilizadores do tronco',
            instrucao: 'Apoie o antebraço e a lateral do pé no chão, eleve o quadril e mantenha o corpo alinhado. Repita dos dois lados, respirando normalmente.'
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

            /* IMAGEM DO EXERCICIO */

            const nomeImagem = imagensExercicios[exercicio.id];

            if (nomeImagem) {
                const botaoImagem = document.createElement('button');
                botaoImagem.type = 'button';
                botaoImagem.className = 'library-image-button';

                botaoImagem.setAttribute(
                    'aria-label',
                    `Ampliar imagem de ${exercicio.nome}`
                );

                botaoImagem.title = 'Clique para ampliar';

                const imagem = document.createElement('img');
                imagem.className = 'library-card-image';
                imagem.src = `img/exercicios/${nomeImagem}`;
                imagem.alt = `Ilustração do exercício ${exercicio.nome}`;
                imagem.loading = 'lazy';
                imagem.decoding = 'async';

                botaoImagem.appendChild(imagem);

                botaoImagem.addEventListener('click', () => {
                    const modal = document.getElementById('exerciseImageModal');
                    const imagemAmpliada = document.getElementById('exerciseImageExpanded');

                    if (!modal || !imagemAmpliada) {
                        return;
                    }

                    imagemAmpliada.src = imagem.src;
                    imagemAmpliada.alt = imagem.alt;

                    if (!modal.open) {
                        modal.showModal();
                    }
                });

                card.appendChild(botaoImagem);
            }

            const grupo = document.createElement('span');
            grupo.className = 'library-card-group';
            grupo.textContent = exercicio.grupo;

            const titulo = document.createElement('h3');
            titulo.textContent = exercicio.nome;

            if (exercicio.nome.length > 24) {
                titulo.classList.add('library-title-long');
            }

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

            const botaoFavorito =
                document.createElement('button');

            botaoFavorito.type = 'button';
            botaoFavorito.className =
                'library-card-favorite';

            function atualizarBotaoFavorito() {
                const favorito = favoritos.has(exercicio.id);

                botaoFavorito.textContent = favorito
                    ? '★ Favoritado'
                    : '☆ Favoritar';

                botaoFavorito.setAttribute(
                    'aria-pressed',
                    String(favorito)
                );

                botaoFavorito.setAttribute(
                    'aria-label',
                    favorito
                        ? `Remover ${exercicio.nome} dos favoritos`
                        : `Favoritar ${exercicio.nome}`
                );
            }

            atualizarBotaoFavorito();

            botaoFavorito.addEventListener('click', () => {
                if (favoritos.has(exercicio.id)) {
                    favoritos.delete(exercicio.id);
                } else {
                    favoritos.add(exercicio.id);
                }

                try {
                    localStorage.setItem(
                        chaveFavoritos,
                        JSON.stringify([...favoritos])
                    );
                } catch (error) {
                    console.warn(
                        'Erro ao salvar favoritos:',
                        error
                    );
                }

                atualizarBotaoFavorito();

                if (grupoAtual === 'Favoritos') {
                    atualizarBiblioteca();
                }
            });

            card.appendChild(botaoFavorito);

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
                    (
                        grupoAtual === 'Favoritos' &&
                        favoritos.has(exercicio.id)
                    ) ||
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

    /* LIMPAR PESQUISA */

    const btnClearExerciseSearch =
        document.getElementById('btnClearExerciseSearch');

    if (btnClearExerciseSearch && campoPesquisa) {
        btnClearExerciseSearch.addEventListener(
            'click',
            () => {
                campoPesquisa.value = '';
                atualizarBiblioteca();
                campoPesquisa.focus();
            }
        );
    }

    /* EXIBICAO INICIAL */

    atualizarBiblioteca();

    /* =========================================
       FECHAR IMAGEM AMPLIADA
    ========================================= */

    const modalImagem = document.getElementById('exerciseImageModal');
    const botaoFecharImagem = document.getElementById('closeExerciseImageModal');

    if (modalImagem && botaoFecharImagem) {
        botaoFecharImagem.addEventListener('click', () => {
            modalImagem.close();
        });

        modalImagem.addEventListener('click', (event) => {
            if (event.target === modalImagem) {
                modalImagem.close();
            }
        });
    }

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

});
