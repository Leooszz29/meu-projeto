/* =========================================
   FITZONE - IDENTIFICAR CONTA SUPABASE
========================================= */

async function identificarAcessoSupabasePerfil() {
    const identidade =
        await obterIdentidadeSupabaseFitZone();

    if (!identidade) {
        return {
            autenticado: false,
            id: null,
            email: null
        };
    }

    return {
        autenticado: true,
        id: identidade.id,
        email: identidade.email
    };
}

// ========================================
// PROTEGER PERFIL CONTRA TROCA DE CONTA
// ========================================

async function verificarContinuidadeSessaoPerfil() {
    if (!idPreferenciasSupabasePerfil) {
        return true;
    }

    try {
        const identidadeAtual =
            await obterIdentidadeSupabaseFitZone();

        if (
            !identidadeAtual ||
            identidadeAtual.id !==
                idPreferenciasSupabasePerfil
        ) {
            window.location.replace('login.html');
            return false;
        }

        return true;

    } catch (erro) {
        console.warn(
            'Não foi possível verificar a sessão do perfil:',
            erro
        );

        return false;
    }
}

function monitorarSessaoSupabasePerfil() {
    const cliente =
        inicializarSupabaseFitZone();

    if (!cliente) {
        return;
    }

    cliente.auth.onAuthStateChange(
        (evento, sessaoAtual) => {
            const idUsuarioAtual =
                sessaoAtual?.user?.id;

            if (
                evento === 'SIGNED_OUT' ||
                (
                    evento === 'SIGNED_IN' &&
                    idUsuarioAtual !==
                        idPreferenciasSupabasePerfil
                )
            ) {
                window.location.replace('login.html');
            }
        }
    );
}

window.addEventListener('pageshow', () => {
    void verificarContinuidadeSessaoPerfil();
});

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        void verificarContinuidadeSessaoPerfil();
    }
});

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

/* =========================================
   FITZONE - PREENCHER PERFIL SUPABASE
========================================= */

function preencherFormularioSupabase(perfil) {
    if (!perfil) {
        return;
    }

    const campoGenero =
        document.getElementById('generoPerfil');

    if (campoGenero) {
        const genero =
            perfil.genero === 'masculino' ||
            perfil.genero === 'feminino'
                ? perfil.genero
                : '';

        campoGenero.value = genero;

        aplicarGeneroVisualPerfil(genero);
    }

    const campos = {
        nome: perfil.nome,
        idade: perfil.idade,
        tipoSanguineo: perfil.tipo_sanguineo,
        peso: perfil.peso,
        altura: perfil.altura,
        treinador: perfil.treinador,
        infoPessoais: perfil.info_pessoais
    };

    Object.entries(campos).forEach(([id, valor]) => {
        const campo = document.getElementById(id);

        if (campo) {
            campo.value = valor ?? '';
        }
    });

    calcularIMC();
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

/* =========================================
   FITZONE - SALVAR FORMULARIO SUPABASE
========================================= */

async function handleSaveProfileSupabase() {
    const nome = getValue('nome');

    if (!nome) {
        alert('O campo Nome é obrigatório.');
        document.getElementById('nome')?.focus();
        return;
    }

    const idade = Number(getValue('idade'));
    const peso = Number(getValue('peso'));
    const altura = Number(getValue('altura'));

    if (
        !Number.isInteger(idade) ||
        idade < 10 || idade > 120 ||
        !Number.isFinite(peso) ||
        peso < 20 || peso > 400 ||
        !Number.isFinite(altura) ||
        altura < 100 || altura > 250
    ) {
        alert(
            'Verifique idade, peso e altura antes de salvar.'
        );
        return;
    }

    const perfil = {
        nome,
        idade,
        tipoSanguineo: getValue('tipoSanguineo'),
        peso,
        altura,
        treinador: getValue('treinador'),
        infoPessoais: getValue('infoPessoais')
    };

    const botao = document.getElementById('btnSaveProfile');

    if (botao) {
        botao.disabled = true;
    }

    try {
        await salvarPerfilSupabaseFitZone(
            perfil,
            idPreferenciasSupabasePerfil
        );
        showSuccess();

    } catch (erro) {
        console.error('Erro ao salvar perfil Supabase:', erro);
        alert(
            'Não foi possível salvar o perfil no Supabase.'
        );
    } finally {
        if (botao) {
            botao.disabled = false;
        }
    }
}

/* =========================================
   FITZONE - ALTERAR GENERO DO PERFIL
========================================= */

async function alterarGeneroPerfil() {
    const campo = document.getElementById('generoPerfil');

    if (!campo) {
        return;
    }

    const genero = campo.value;

    if (!['masculino', 'feminino'].includes(genero)) {
        return;
    }

    campo.disabled = true;

    try {
        const identidade =
            await obterIdentidadeSupabaseFitZone();

        if (
            !identidade ||
            identidade.id !== idPreferenciasSupabasePerfil
        ) {
            throw new Error('Sessão Supabase inválida.');
        }

        await atualizarGeneroSupabaseFitZone(
            genero,
            idPreferenciasSupabasePerfil
        );

        try {
            localStorage.setItem(
                `generoFitZone:${identidade.email}`,
                genero
            );
        } catch (erroLocal) {
            console.warn(
                'Tema salvo na conta, mas sem cache local:',
                erroLocal
            );
        }

        aplicarGeneroVisualPerfil(genero);

        alert(
            'Gênero atualizado com sucesso! ' +
            'O novo tema já está ativo.'
        );

    } catch (erro) {
        console.error(
            'Erro ao alterar gênero do perfil:',
            erro
        );

        alert(
            'Não foi possível alterar o gênero. ' +
            'Nenhum outro dado do perfil foi modificado.'
        );

        try {
            const perfil =
                await consultarPerfilSupabaseFitZone(
                    idPreferenciasSupabasePerfil
                );

            campo.value = perfil?.genero || '';
            aplicarGeneroVisualPerfil(perfil?.genero);

        } catch (erroConsulta) {
            console.warn(
                'Não foi possível restaurar o gênero:',
                erroConsulta
            );
        }

    } finally {
        campo.disabled = false;
    }
}

/* =========================================
   APLICAR GENERO E TEMA DO PERFIL
========================================= */

function aplicarGeneroVisualPerfil(genero) {
    if (
        genero !== 'masculino' &&
        genero !== 'feminino'
    ) {
        return;
    }

    document.body.classList.remove(
        'theme-masculino',
        'theme-feminino'
    );

    document.body.classList.add(
        `theme-${genero}`
    );
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
        !Number.isFinite(peso) ||
        !Number.isFinite(alturaCm) ||
        peso < 20 ||
        peso > 400 ||
        alturaCm < 100 ||
        alturaCm > 250
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

/* =========================================
   FITZONE - ACOES DO PERFIL SUPABASE
========================================= */

function initializeProfileActionsSupabase() {
    const formulario =
        document.getElementById('profileForm');

    if (!formulario) {
        return;
    }

    /* ALTERAR GENERO SUPABASE */

    const campoGeneroSupabase =
        document.getElementById('generoPerfil');

    if (campoGeneroSupabase) {
        campoGeneroSupabase.addEventListener(
            'change',
            async () => {
                await alterarGeneroPerfil();

            }
        );
    }

    const botaoSair =
        document.getElementById('btnEndSession');

    if (botaoSair) {
        botaoSair.addEventListener('click', async () => {
            const confirmar = confirm(
                'Deseja realmente sair da sua conta?'
            );

            if (!confirmar) {
                return;
            }

            botaoSair.disabled = true;

            try {
                const cliente =
                    inicializarSupabaseFitZone();

                if (!cliente) {
                    throw new Error(
                        'Supabase indisponível.'
                    );
                }

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
                    'Erro ao sair do perfil Supabase:',
                    erro
                );

                alert(
                    'Não foi possível encerrar a sessão.'
                );

                botaoSair.disabled = false;
            }
        });
    }

    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();

        const acesso =
            await identificarAcessoSupabasePerfil();

        if (!acesso.autenticado) {
            alert('Sua sessão expirou. Entre novamente.');
            window.location.replace('login.html');
            return;
        }

        await handleSaveProfileSupabase();
    });
}

/* =========================================
   FITZONE - FOTO DO PERFIL SUPABASE V1
========================================= */

async function initializeProfilePhotoSupabase(acessoInicial) {
    const botao = document.getElementById('editProfilePhoto');
    const campo = document.getElementById('profilePhotoInput');
    const imagem = document.getElementById('characterImg');
    const menu = document.getElementById('profilePhotoMenu');
    const alterar = document.getElementById('changeProfilePhoto');
    const remover = document.getElementById('removeProfilePhoto');

    if (
        !botao || !campo || !imagem ||
        !menu || !alterar || !remover
    ) {
        return;
    }

    const cliente = inicializarSupabaseFitZone();
    const usuarioId = acessoInicial.id;
    const caminho = `${usuarioId}/avatar.webp`;
    const armazenamento = cliente?.storage.from('fitzone-fotos');

    if (!armazenamento || !usuarioId) {
        console.warn('Storage da foto indisponível.');
        return;
    }

    let fotoAtualUrl = null;
    let operacaoEmAndamento = false;

    function mostrarFoto(blob) {
        const novaUrl = URL.createObjectURL(blob);

        imagem.src = novaUrl;
        imagem.style.display = 'block';
        imagem.style.objectFit = 'cover';
        imagem.style.borderRadius = '50%';

        if (fotoAtualUrl) {
            URL.revokeObjectURL(fotoAtualUrl);
        }

        fotoAtualUrl = novaUrl;
    }

    function mostrarPersonagemPadrao() {
        if (fotoAtualUrl) {
            URL.revokeObjectURL(fotoAtualUrl);
            fotoAtualUrl = null;
        }

        const genero = document.getElementById(
            'generoPerfil'
        )?.value;

        const personagens = {
            masculino:
                'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',
            feminino:
                'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
        };

        imagem.style.objectFit = 'contain';
        imagem.style.borderRadius = '0';

        if (personagens[genero]) {
            imagem.src = personagens[genero];
            imagem.style.display = 'block';
        } else {
            imagem.removeAttribute('src');
            imagem.style.display = 'none';
        }
    }

    async function validarConta() {
        await obterUsuarioVinculadoSupabaseFitZone(usuarioId);
    }

    async function carregarFotoSupabase() {
        await validarConta();

        const { data: arquivos, error: erroLista } =
            await armazenamento.list(usuarioId, {
                limit: 100
            });

        if (erroLista) {
            throw erroLista;
        }

        const existeFoto = (arquivos || []).some(
            arquivo => arquivo.name === 'avatar.webp'
        );

        if (!existeFoto) {
            mostrarPersonagemPadrao();
            return;
        }

        await validarConta();

        const { data: foto, error } =
            await armazenamento.download(caminho);

        if (error) {
            throw error;
        }

        mostrarFoto(foto);
    }

    function processarImagem(arquivo) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(arquivo);
            const fotoOriginal = new Image();

            fotoOriginal.onload = () => {
                try {
                    const canvas =
                        document.createElement('canvas');

                    const tamanho = 300;
                    canvas.width = tamanho;
                    canvas.height = tamanho;

                    const contexto = canvas.getContext('2d');

                    if (!contexto) {
                        throw new Error(
                            'Não foi possível processar a imagem.'
                        );
                    }

                    const lado = Math.min(
                        fotoOriginal.width,
                        fotoOriginal.height
                    );

                    const origemX =
                        (fotoOriginal.width - lado) / 2;

                    const origemY =
                        (fotoOriginal.height - lado) / 2;

                    contexto.drawImage(
                        fotoOriginal,
                        origemX,
                        origemY,
                        lado,
                        lado,
                        0,
                        0,
                        tamanho,
                        tamanho
                    );

                    canvas.toBlob(
                        blob => {
                            URL.revokeObjectURL(url);

                            if (!blob) {
                                reject(new Error(
                                    'Falha ao converter a imagem.'
                                ));
                                return;
                            }

                            resolve(blob);
                        },
                        'image/webp',
                        0.82
                    );

                } catch (erro) {
                    URL.revokeObjectURL(url);
                    reject(erro);
                }
            };

            fotoOriginal.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error(
                    'Não foi possível abrir a imagem.'
                ));
            };

            fotoOriginal.src = url;
        });
    }

    function bloquearControles(bloquear) {
        operacaoEmAndamento = bloquear;
        botao.disabled = bloquear;
        alterar.disabled = bloquear;
        remover.disabled = bloquear;
        campo.disabled = bloquear;
    }

    botao.addEventListener('click', () => {
        if (operacaoEmAndamento) {
            return;
        }

        menu.hidden = !menu.hidden;
    });

    alterar.addEventListener('click', () => {
        menu.hidden = true;
        campo.click();
    });

    document.addEventListener('click', evento => {
        if (
            !menu.contains(evento.target) &&
            !botao.contains(evento.target)
        ) {
            menu.hidden = true;
        }
    });

    campo.addEventListener('change', async () => {
        const arquivo = campo.files?.[0];

        if (!arquivo) {
            return;
        }

        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(arquivo.type)) {
            alert('Selecione uma imagem JPG, PNG ou WebP.');
            campo.value = '';
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            alert('A imagem original deve ter no máximo 5 MB.');
            campo.value = '';
            return;
        }

        bloquearControles(true);

        try {
            await validarConta();

            const fotoOtimizada =
                await processarImagem(arquivo);

            if (fotoOtimizada.size > 1024 * 1024) {
                throw new Error(
                    'A imagem processada ultrapassou 1 MB.'
                );
            }

            await validarConta();

            const { error } = await armazenamento.upload(
                caminho,
                fotoOtimizada,

                {
                    contentType: 'image/webp',
                    upsert: true,
                    cacheControl: '0'
                }
            );

            if (error) {
                throw error;
            }

            await carregarFotoSupabase();

            alert('Foto salva no Supabase com sucesso!');

        } catch (erro) {
            console.error(
                'Erro ao salvar foto Supabase:',
                erro
            );

            alert(
                'Não foi possível salvar a foto. ' +
                'Confira a conexão e tente novamente.'
            );

        } finally {
            campo.value = '';
            bloquearControles(false);
        }
    });

    remover.addEventListener('click', async () => {
        menu.hidden = true;

        const confirmar = confirm(
            'Deseja remover sua foto de perfil?'
        );

        if (!confirmar) {
            return;
        }

        bloquearControles(true);

        try {
            await validarConta();

            const { error } = await armazenamento.remove([
                caminho
            ]);

            if (error) {
                throw error;
            }

            mostrarPersonagemPadrao();

            alert('Foto removida com sucesso!');

        } catch (erro) {
            console.error(
                'Erro ao remover foto Supabase:',
                erro
            );

            alert(
                'Não foi possível remover a foto.'
            );

        } finally {
            bloquearControles(false);
        }
    });

    const campoGenero =
        document.getElementById('generoPerfil');

    campoGenero?.addEventListener('change', () => {
        if (!fotoAtualUrl) {
            mostrarPersonagemPadrao();
        }
    });

    bloquearControles(true);

    try {
        await carregarFotoSupabase();

    } catch (erro) {
        console.error(
            'Erro ao carregar foto Supabase:',
            erro
        );

        mostrarPersonagemPadrao();

    } finally {
        bloquearControles(false);
    }
}

async function initializeProfile() {
    if (navigator.onLine === false) {
        await new Promise(resolve => {
            setTimeout(resolve, 1000);
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
            window.location.replace('perfil.html');
        });

        aviso.append(
            titulo,
            mensagem,
            orientacao,
            botao
        );

        document.body.replaceChildren(aviso);
        return;
    }

    try {
        const acessoSupabase =
            await identificarAcessoSupabasePerfil();

        if (!acessoSupabase.autenticado) {
            window.location.replace('login.html');
            return;
        }

        idPreferenciasSupabasePerfil =
            acessoSupabase.id;

        monitorarSessaoSupabasePerfil();

        try {
            const perfilSupabase =
                await consultarPerfilSupabaseFitZone(
                    idPreferenciasSupabasePerfil
                );

            preencherFormularioSupabase(perfilSupabase);

        } catch (erro) {
            console.error(
                'Erro ao consultar perfil Supabase:',
                erro
            );

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
                'Conta reconhecida, mas não foi possível ' +
                'consultar o perfil.';

            const botao = document.createElement('button');
            botao.type = 'button';
            botao.textContent = 'Tentar novamente';

            botao.addEventListener('click', () => {
                window.location.replace('perfil.html');
            });

            aviso.append(
                titulo,
                mensagem,
                botao
            );

            document.body.replaceChildren(aviso);
            return;
        }

        initializeIMC();
        initializeProfileActionsSupabase();
        await iniciarConfiguracoesFitZone();

        await initializeProfilePhotoSupabase(
            acessoSupabase
        );

        const botaoSalvar =
            document.getElementById('btnSaveProfile');

        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.removeAttribute('title');
        }

        /* MOSTRAR PAGINA ATIVA NO MENU MOBILE */

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

        document.getElementById(
            'fitzonePerfilLoader'
        )?.remove();

    } catch (erro) {
        console.error(
            'Erro ao inicializar perfil Supabase:',
            erro
        );

        window.location.replace('login.html');
    }
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


/* =========================================
   FITZONE - PREFERENCIAS DO PERFIL SUPABASE
========================================= */

let idPreferenciasSupabasePerfil = null;

/* =========================================
   FITZONE - INICIAR CONFIGURACOES DO PERFIL
========================================= */

async function iniciarConfiguracoesFitZone() {
    const checkbox = document.getElementById(
        'fitzoneMotivacaoAtiva'
    );

    const seletorPagina = document.getElementById(
        'fitzonePaginaInicial'
    );

    if (!checkbox || !seletorPagina) {
        return;
    }

    const usuarioId =
        idPreferenciasSupabasePerfil;

    let preferencias;

    let salvando = false;

    function bloquearConfiguracoes(bloquear) {
        checkbox.disabled = bloquear;
        seletorPagina.disabled = bloquear;
    }

    function aplicarPreferencias(dados) {
        checkbox.checked =
            dados.mensagensMotivacionais;

        seletorPagina.value =
            dados.paginaInicial;
    }

    bloquearConfiguracoes(true);

    try {
        preferencias =
            await carregarPreferenciasSupabaseFitZone(
                usuarioId
            );

        aplicarPreferencias(preferencias);

    } catch (erro) {
        console.error(
            'Erro ao carregar preferências do perfil:',
            erro
        );

        preferencias =
            obterPreferenciasContingenciaFitZone(
                usuarioId
            );

        aplicarPreferencias(preferencias);

        const mensagem =
            'Não foi possível sincronizar as preferências. ' +
            'Atualize a página para tentar novamente.';

        checkbox.title = mensagem;
        seletorPagina.title = mensagem;

        alert(mensagem);

        return;
    }

    bloquearConfiguracoes(false);

    /* =========================================
       SALVAR UMA PREFERENCIA POR VEZ
    ========================================= */

    async function salvarAlteracao(alteracao) {
        if (salvando) {
            return;
        }

        salvando = true;

        bloquearConfiguracoes(true);

        try {
            preferencias =
                await salvarPreferenciasSupabaseFitZone(
                    usuarioId,
                    alteracao
                );

            aplicarPreferencias(preferencias);

        } catch (erro) {
            console.error(
                'Erro ao salvar preferência Supabase:',
                erro
            );

            aplicarPreferencias(preferencias);

            alert(
                'Não foi possível confirmar o salvamento. ' +
                'Atualize a página e confira as configurações.'
            );

        } finally {
            salvando = false;

            bloquearConfiguracoes(false);
        }
    }

    /* =========================================
       MENSAGENS MOTIVACIONAIS
    ========================================= */

    checkbox.addEventListener(
        'change',
        async () => {
            const valor = checkbox.checked;

            await salvarAlteracao({
                mensagensMotivacionais: valor
            });
        }
    );

    /* =========================================
       PAGINA INICIAL PREFERIDA
    ========================================= */

    seletorPagina.addEventListener(
        'change',
        async () => {
            const novaPagina = seletorPagina.value;

            if (
                !validarPaginaInicialFitZone(
                    novaPagina
                )
            ) {
                aplicarPreferencias(preferencias);
                return;
            }

            await salvarAlteracao({
                paginaInicial: novaPagina
            });
        }
    );
}
