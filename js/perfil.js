const PROFILE_STORAGE_KEY = 'fitzonePerfil';

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

function carregarSessao() {

    try {

        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        return sessaoJSON
            ? JSON.parse(sessaoJSON)
            : null;

    } catch (error) {

        console.warn(
            'Não foi possível carregar a sessão:',
            error
        );

        return null;
    }
}

// ========================================
// PROTEGER PERFIL CONTRA TROCA DE CONTA
// ========================================

const sessaoInicialPerfil = carregarSessao();

const emailSessaoInicialPerfil =
    sessaoInicialPerfil?.autenticado === true &&
    typeof sessaoInicialPerfil.email === 'string'
        ? sessaoInicialPerfil.email.trim().toLowerCase()
        : null;

function verificarContinuidadeSessaoPerfil() {
    if (!emailSessaoInicialPerfil) {
        return true;
    }

    const sessaoAtual = carregarSessao();

    if (
        !emailSessaoInicialPerfil ||
        !sessaoAtual ||
        sessaoAtual.autenticado !== true ||
        typeof sessaoAtual.email !== 'string' ||
        sessaoAtual.email.trim().toLowerCase() !== emailSessaoInicialPerfil
    ) {
        window.location.replace('login.html');
        return false;
    }

    return true;
}

window.addEventListener('storage', (event) => {
    if (
        event.storageArea === localStorage &&
        (event.key === 'fitzoneSessao' || event.key === null)
    ) {
        verificarContinuidadeSessaoPerfil();
    }
});

window.addEventListener(
    'pageshow',
    verificarContinuidadeSessaoPerfil
);

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        verificarContinuidadeSessaoPerfil();
    }
});

function obterChavePerfil() {
    const sessao = carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        throw new Error(
            'Sessão inválida: não é possível acessar o perfil.'
        );
    }

    return `${PROFILE_STORAGE_KEY}:${sessao.email.trim().toLowerCase()}`;
}

// ========================================
// CARREGAR PERFIL SALVO
// ========================================

function loadProfile() {
    try {
        const saved = localStorage.getItem(obterChavePerfil());

        if (!saved) {
            return {};
        }

        const data = JSON.parse(saved);

        return data && typeof data === 'object' ? data : {};

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        return {};
    }
}

// ========================================
// SALVAR PERFIL
// ========================================

function saveProfile(data) {
    try {
        localStorage.setItem(
            obterChavePerfil(),
            JSON.stringify(data)
        );

        return true;

    } catch (error) {
        console.error('Erro ao salvar perfil:', error);
        return false;
    }
}

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

// ========================================
// PREENCHER FORMULÁRIO
// ========================================

function fillForm() {

    const perfil = loadProfile();

    let usuario = {};

    try {
        const sessao =
            carregarSessao();

        const usuarios =
            JSON.parse(
                localStorage.getItem('usuarios')
            ) || [];

        if (sessao && sessao.email) {
            usuario =
                usuarios.find(
                    usuarioCadastrado =>
                        usuarioCadastrado.email.toLowerCase() ===
                        sessao.email.toLowerCase()
                ) || {};
        }
    } catch (error) {
        console.warn(
            'Não foi possível carregar o usuário:',
            error
        );
    }

    // Nome:
    // primeiro tenta o perfil salvo.
    // Se não existir, usa o nome do cadastro.

    const nome = document.getElementById('nome');

    if (nome) {
        nome.value =
            perfil.nome ||
            usuario.nome ||
            '';
    }

    const idade = document.getElementById('idade');

    if (idade) {
        idade.value = perfil.idade || '';
    }

    const tipoSanguineo =
        document.getElementById('tipoSanguineo');

    if (tipoSanguineo) {
        tipoSanguineo.value =
            perfil.tipoSanguineo || '';
    }

    const peso = document.getElementById('peso');

    if (peso) {
        peso.value = perfil.peso || '';
    }

    const altura = document.getElementById('altura');

    if (altura) {
        altura.value = perfil.altura || '';
    }

    const treinador =
        document.getElementById('treinador');

    if (treinador) {
        treinador.value =
            perfil.treinador || '';
    }

    const infoPessoais =
        document.getElementById('infoPessoais');

    if (infoPessoais) {
        infoPessoais.value =
            perfil.infoPessoais || '';
    }

    /* CARREGAR GENERO DA CONTA TRADICIONAL */

    const campoGenero =
        document.getElementById('generoPerfil');

    if (campoGenero) {
        const sessao = carregarSessao();

        const email =
            sessao?.email?.trim().toLowerCase();

        const generoLocal = email
            ? localStorage.getItem(
                `generoFitZone:${email}`
            )
            : null;

        const genero =
            generoLocal ||
            usuario.genero ||
            '';

        campoGenero.value =
            ['masculino', 'feminino'].includes(genero)
                ? genero
                : '';

        aplicarGeneroVisualPerfil(campoGenero.value);
    }
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

// ========================================
// SALVAR PERFIL PELO CLIQUE
// ========================================

function handleSaveProfile() {
    const nome =
        getValue('nome');

    if (!nome) {
        alert(
            'Não foi possível salvar o perfil.\n\n' +
            'O campo Nome é obrigatório.\n' +
            'Preencha seu nome e tente novamente.'
        );

        document
            .getElementById('nome')
            ?.focus();

        return;
    }

    const idade =
        Number(getValue('idade'));

    if (
        !Number.isInteger(idade) ||
        idade < 10 ||
        idade > 120
    ) {

        alert(
            'Não foi possível salvar o perfil.\n\n' +
            'O campo Idade deve conter um valor ' +
            'entre 10 e 120 anos.\n' +
            'Corrija a idade e tente novamente.'
        );

        document
            .getElementById('idade')
            ?.focus();

        return;
    }

    const peso =
        Number(getValue('peso'));

    if (
        !Number.isFinite(peso) ||
        peso < 20 ||
        peso > 400
    ) {

        alert(
            'Não foi possível salvar o perfil.\n\n' +
            'O campo Peso deve conter um valor ' +
            'entre 20 e 400 kg.\n' +
            'Corrija o peso e tente novamente.'
        );

        document
            .getElementById('peso')
            ?.focus();

        return;
    }

    const altura =
        Number(getValue('altura'));

    if (
        !Number.isFinite(altura) ||
        altura < 100 ||
        altura > 250
    ) {

        alert(
            'Não foi possível salvar o perfil.\n\n' +
            'O campo Altura deve conter um valor ' +
            'entre 100 e 250 cm.\n' +
            'Corrija a altura e tente novamente.'
        );

        document
            .getElementById('altura')
            ?.focus();

        return;
    }

    const data = {
        nome: getValue('nome'),
        idade: getValue('idade'),

        tipoSanguineo:
            getValue('tipoSanguineo'),

        peso:
            getValue('peso'),

        altura:
            getValue('altura'),

        treinador:
            getValue('treinador'),

        infoPessoais:
            getValue('infoPessoais')
    };

    const sucesso =
        saveProfile(data);

    if (!sucesso) {
        alert(
            'Não foi possível salvar o perfil. Tente novamente.'
        );

        return;
    }

    showSuccess();
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
        await salvarPerfilSupabaseFitZone(perfil);
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

// ========================================
// FINALIZAR SESSÃO
// ========================================

function handleEndSession() {
    try {
        localStorage.removeItem(
            'fitzoneSessao'
        );
    } catch (error) {
        console.warn(
            'Não foi possível encerrar a sessão:',
            error
        );
    }

    window.location.href = 'login.html';
}

/* =========================================
   FITZONE - ALTERAR GENERO DO PERFIL
========================================= */

async function alterarGeneroPerfil(origem) {
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
        let email = null;

        if (origem === 'supabase') {
            const identidade =
                await obterIdentidadeSupabaseFitZone();

            if (!identidade) {
                throw new Error('Sessão Supabase inválida.');
            }

            await atualizarGeneroSupabaseFitZone(genero);

            email = identidade.email;
        } else {
            const sessao = carregarSessao();

            if (!sessao?.email) {
                throw new Error('Sessão tradicional inválida.');
            }

            email = sessao.email.trim().toLowerCase();

            const usuarios = JSON.parse(
                localStorage.getItem('usuarios') || '[]'
            );

            if (!Array.isArray(usuarios)) {
                throw new Error('Lista de usuários inválida.');
            }

            const usuario = usuarios.find(item =>
                typeof item?.email === 'string' &&
                item.email.trim().toLowerCase() === email
            );

            if (!usuario) {
                throw new Error('Usuário não encontrado.');
            }

            usuario.genero = genero;

            localStorage.setItem(
                'usuarios',
                JSON.stringify(usuarios)
            );
        }

        if (email) {
            try {
                localStorage.setItem(
                    `generoFitZone:${email.trim().toLowerCase()}`,
                    genero
                );
            } catch (erroLocal) {
                console.warn(
                    'Tema salvo na conta, mas sem cache local:',
                    erroLocal
                );
            }
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

        if (origem === 'supabase') {
            try {
                const perfil =
                    await consultarPerfilSupabaseFitZone();

                campo.value = perfil?.genero || '';
                aplicarGeneroVisualPerfil(perfil?.genero);
            } catch (erroConsulta) {
                console.warn(
                    'Não foi possível restaurar o gênero:',
                    erroConsulta
                );
            }
        } else {
            try {
                const sessao = carregarSessao();
                const email = sessao.email.trim().toLowerCase();
                const usuarios = JSON.parse(
                    localStorage.getItem('usuarios') || '[]'
                );

                const usuario = usuarios.find(item =>
                    item?.email?.trim().toLowerCase() === email
                );

                campo.value = usuario?.genero || '';
                aplicarGeneroVisualPerfil(campo.value);
            } catch (erroConsulta) {
                console.warn(
                    'Não foi possível restaurar a seleção:',
                    erroConsulta
                );
            }
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
// PERSONAGEM / GÊNERO
// ========================================

function loadCharacter() {
    const characterImg =
        document.getElementById('characterImg');

    if (!characterImg) {
        return;
    }

    let genero = null;

    try {
        const sessao =
            carregarSessao();

        if (
            sessao &&
            sessao.email
        ) {
            genero =
                localStorage.getItem(
                    `generoFitZone:${sessao.email.toLowerCase()}`
                );
        }
    } catch (error) {
        console.warn(
            'Não foi possível carregar o gênero:',
            error
        );
    }

    // APLICA O TEMA DE ACORDO COM O GÊNERO

    if (genero === 'masculino') {
        document.body.classList.add('theme-masculino');
    } else if (genero === 'feminino') {
        document.body.classList.add('theme-feminino');
    }

    const imagens = {
        masculino:
            'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',

        feminino:
            'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
    };

    if (genero && imagens[genero]) {
        characterImg.src =
            imagens[genero];

        characterImg.style.display =
            'block';
    } else {
        characterImg.style.display =
            'none';
    }
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
                await alterarGeneroPerfil('supabase');
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

function initializeProfileActions() {
    const profileForm =
        document.getElementById('profileForm');

    const endSessionButton =
        document.getElementById('btnEndSession');

    /* ALTERAR GENERO TRADICIONAL */

    const campoGeneroTradicional =
        document.getElementById('generoPerfil');

    if (campoGeneroTradicional) {
        campoGeneroTradicional.addEventListener(
            'change',
            async () => {
                await alterarGeneroPerfil('local');
            }
        );
    }

    if (profileForm) {
        profileForm.addEventListener(
            'submit',
            (event) => {
                event.preventDefault();
                handleSaveProfile();
            }
        );
    }

    if (endSessionButton) {
        endSessionButton.addEventListener(
            'click',
            handleEndSession
        );
    }
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
        const identidade =
            await obterIdentidadeSupabaseFitZone();

        if (!identidade || identidade.id !== usuarioId) {
            throw new Error(
                'A conta Supabase foi alterada ou desconectada.'
            );
        }
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

// ========================================
// FOTO PERSONALIZADA DO PERFIL
// ========================================

function initializeProfilePhoto() {
    const botao = document.getElementById('editProfilePhoto');
    const campo = document.getElementById('profilePhotoInput');
    const imagem = document.getElementById('characterImg');
    const menu = document.getElementById('profilePhotoMenu');
    const alterarFoto = document.getElementById('changeProfilePhoto');
    const removerFoto = document.getElementById('removeProfilePhoto');

    const sessao = carregarSessao();

    if (!botao || !campo || !imagem || !sessao?.email) {
        return;
    }

    const chaveFoto =
        `fotoPerfilFitZone:${sessao.email.toLowerCase()}`;

    // Recuperar foto salva
    try {
        const fotoSalva = localStorage.getItem(chaveFoto);

        if (fotoSalva) {
            imagem.src = fotoSalva;
            imagem.style.display = 'block';
            imagem.style.objectFit = 'cover';
            imagem.style.borderRadius = '50%';
        }
    } catch (erro) {
        console.warn('Erro ao carregar foto:', erro);
    }

    // Abrir e fechar o menu de edição
    botao.addEventListener('click', () => {
        if (!menu) return;

        menu.hidden = !menu.hidden;
    });

    // Escolher uma nova foto
    alterarFoto?.addEventListener('click', () => {
        menu.hidden = true;
        campo.click();
    });

    // Remover foto personalizada e restaurar personagem
    removerFoto?.addEventListener('click', () => {
        const fotoSalva = localStorage.getItem(chaveFoto);

        if (!fotoSalva) {
            menu.hidden = true;
            return;
        }

        const confirmar = confirm(
            'Deseja remover sua foto e restaurar o personagem padrão?'
        );

        if (!confirmar) {
            return;
        }

        try {
            localStorage.removeItem(chaveFoto);

            imagem.style.objectFit = 'contain';
            imagem.style.borderRadius = '0';

            loadCharacter();

            menu.hidden = true;
            campo.value = '';

        } catch (erro) {
            console.error('Erro ao remover foto:', erro);
            alert('Não foi possível remover a foto.');
        }
    });

    // Fechar o menu ao clicar fora
    document.addEventListener('click', (evento) => {
        if (
            menu &&
            !menu.contains(evento.target) &&
            !botao.contains(evento.target)
        ) {
            menu.hidden = true;
        }
    });

    // Selecionar e salvar foto
    campo.addEventListener('change', () => {
        const arquivo = campo.files?.[0];

        if (!arquivo) return;

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
            alert('A imagem deve ter no máximo 5 MB.');
            campo.value = '';
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            const fotoOriginal = new Image();

            fotoOriginal.onload = () => {
                const canvas = document.createElement('canvas');
                const tamanho = 300;

                canvas.width = tamanho;
                canvas.height = tamanho;

                const contexto = canvas.getContext('2d');

                if (!contexto) {
                    alert('Não foi possível processar a imagem.');
                    return;
                }

                const lado = Math.min(
                    fotoOriginal.width,
                    fotoOriginal.height
                );

                const origemX = (fotoOriginal.width - lado) / 2;
                const origemY = (fotoOriginal.height - lado) / 2;

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

                const fotoOtimizada =
                    canvas.toDataURL('image/jpeg', 0.8);

                try {
                    localStorage.setItem(
                        chaveFoto,
                        fotoOtimizada
                    );

                    imagem.src = fotoOtimizada;
                    imagem.style.display = 'block';
                    imagem.style.objectFit = 'cover';
                    imagem.style.borderRadius = '50%';

                } catch (erro) {
                    console.error('Erro ao salvar foto:', erro);
                    alert(
                        'Não foi possível salvar a foto. Verifique o espaço disponível no navegador.'
                    );
                }
            };

            fotoOriginal.onerror = () => {
                alert('Não foi possível abrir a imagem selecionada.');
            };

            fotoOriginal.src = leitor.result;
        };

        leitor.onerror = () => {
            alert('Erro ao ler a imagem.');
        };

        leitor.readAsDataURL(arquivo);
        campo.value = '';
    });
}

async function initializeProfile() {
    const sessao =
        carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true
    ) {

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

            if (acessoSupabase.autenticado) {
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
                    'Conta Supabase reconhecida com sucesso!';

                /* Consultar nome salvo no perfil Supabase */
                try {
                    const perfilSupabase =
                        await consultarPerfilSupabaseFitZone();

                    preencherFormularioSupabase(perfilSupabase);

                    if (perfilSupabase?.nome) {
                        mensagem.textContent =
                            'Bem-vindo(a), ' +
                            perfilSupabase.nome + '!';
                    } else {
                        mensagem.textContent =
                            'Conta Supabase reconhecida. ' +
                            'Perfil ainda não cadastrado.';
                    }

                } catch (erro) {
                    console.error(
                        'Erro ao consultar perfil Supabase:',
                        erro
                    );

                    mensagem.textContent =
                        'Conta reconhecida, mas não foi possível ' +
                        'consultar o perfil.';

                    aviso.append(titulo, mensagem);

                    document.body.replaceChildren(aviso);
                    return;
                }

                const voltar = document.createElement('a');
                voltar.href = 'calendario.html';
                voltar.textContent = 'Voltar ao calendário';

                /* =========================================
                   PREPARAR PERFIL SUPABASE
                ========================================= */

                initializeIMC();
                initializeProfileActionsSupabase();

                /* =========================================
                   FOTO DE PERFIL SUPABASE - STORAGE
                ========================================= */

                await initializeProfilePhotoSupabase(
                    acessoSupabase
                );

                /* Habilitar salvamento do perfil Supabase */
                const botaoSalvar =
                    document.getElementById('btnSaveProfile');

                if (botaoSalvar) {
                    botaoSalvar.disabled = false;
                    botaoSalvar.removeAttribute('title');
                }

                aviso.style.cssText =
                    'padding:16px;' +
                    'text-align:center;' +
                    'margin-bottom:16px;';

                aviso.append(mensagem, voltar);

                const pagina =
                    document.querySelector('.page');

                if (pagina) {
                    pagina.prepend(aviso);
                }

                document.getElementById(
                    'fitzonePerfilLoader'
                )?.remove();

                return;
            }

        } catch (erro) {
            console.error(
                'Erro ao identificar conta Supabase no perfil:',
                erro
            );
        }

        window.location.replace('login.html');
        return;
    }

    fillForm();
    loadCharacter();
    initializeProfilePhoto();
    initializeIMC();
    initializeProfileActions();

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
   FITZONE - CHAVE DAS PREFERENCIAS DO USUARIO
========================================= */

function obterChavePreferenciasFitZone() {
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
            return null;
        }

        const email = sessao.email.trim().toLowerCase();

        return `fitzonePreferencias:${email}`;

    } catch (erro) {
        console.warn(
            'Não foi possível identificar as preferências:',
            erro
        );

        return null;
    }
}

/* =========================================
   FITZONE - CARREGAR PREFERENCIAS DO USUARIO
========================================= */

function carregarPreferenciasFitZone() {
    const chave = obterChavePreferenciasFitZone();

    const preferenciasPadrao = {
        mensagensMotivacionais: true,
        paginaInicial: 'calendario.html'
    };

    if (!chave) {
        return preferenciasPadrao;
    }

    try {
        const dados = localStorage.getItem(chave);

        if (!dados) {
            return preferenciasPadrao;
        }

        const preferencias = JSON.parse(dados);

        if (
            !preferencias ||
            typeof preferencias !== 'object' ||
            Array.isArray(preferencias)
        ) {
            return preferenciasPadrao;
        }

        const paginasPermitidas = [
            'calendario.html',
            'treinos.html',
            'desempenho.html'
        ];

        return {
            mensagensMotivacionais:
                typeof preferencias.mensagensMotivacionais === 'boolean'
                    ? preferencias.mensagensMotivacionais
                    : true,

            paginaInicial:
                paginasPermitidas.includes(preferencias.paginaInicial)
                    ? preferencias.paginaInicial
                    : 'calendario.html'
        };

    } catch (erro) {
        console.warn(
            'Não foi possível carregar as preferências:',
            erro
        );

        return preferenciasPadrao;
    }
}

/* =========================================
   FITZONE - SALVAR PREFERENCIAS DO USUARIO
========================================= */

function salvarPreferenciasFitZone(preferencias) {
    const chave = obterChavePreferenciasFitZone();

    if (!chave) {
        console.warn(
            'Não foi possível salvar: sessão inválida.'
        );

        return false;
    }

    try {
        const dadosAtuais = localStorage.getItem(chave);

        let preferenciasAtuais = {};

        if (dadosAtuais !== null) {
            preferenciasAtuais = JSON.parse(dadosAtuais);

            if (
                !preferenciasAtuais ||
                typeof preferenciasAtuais !== 'object' ||
                Array.isArray(preferenciasAtuais)
            ) {
                throw new Error(
                    'Preferências existentes inválidas.'
                );
            }
        }

        const dadosAtualizados = {
            ...preferenciasAtuais
        };

        if (typeof preferencias.mensagensMotivacionais === 'boolean') {
            dadosAtualizados.mensagensMotivacionais =
                preferencias.mensagensMotivacionais;
        }

        if (typeof preferencias.paginaInicial === 'string') {
            const paginasPermitidas = [
                'calendario.html',
                'treinos.html',
                'desempenho.html'
            ];

            if (!paginasPermitidas.includes(preferencias.paginaInicial)) {
                throw new Error('Página inicial inválida.');
            }

            dadosAtualizados.paginaInicial =
                preferencias.paginaInicial;
        }

        localStorage.setItem(
            chave,
            JSON.stringify(dadosAtualizados)
        );

        return true;

    } catch (erro) {
        console.error(
            'Erro ao salvar preferências:',
            erro
        );

        return false;
    }
}

/* =========================================
   FITZONE - CONTROLE DAS MENSAGENS MOTIVACIONAIS
========================================= */

function iniciarConfiguracoesFitZone() {
    const checkbox = document.getElementById(
        'fitzoneMotivacaoAtiva'
    );

    if (!checkbox) {
        return;
    }

    const preferencias = carregarPreferenciasFitZone();

    checkbox.checked = preferencias.mensagensMotivacionais;

    checkbox.addEventListener('change', () => {
        const valorAnterior =
            !checkbox.checked;

        const salvou = salvarPreferenciasFitZone({
            mensagensMotivacionais: checkbox.checked
        });

        if (!salvou) {
            checkbox.checked = valorAnterior;

            alert(
                'Não foi possível salvar a preferência. Tente novamente.'
            );
        }
    });

    /* =========================================
       PAGINA INICIAL PREFERIDA
    ========================================= */

    const seletorPagina = document.getElementById(
        'fitzonePaginaInicial'
    );

    if (seletorPagina) {
        seletorPagina.value = preferencias.paginaInicial;

        seletorPagina.addEventListener('change', () => {
            const novaPagina = seletorPagina.value;

            const salvou = salvarPreferenciasFitZone({
                paginaInicial: novaPagina
            });

            if (!salvou) {
                const preferenciasAtuais =
                    carregarPreferenciasFitZone();

                seletorPagina.value =
                    preferenciasAtuais.paginaInicial;

                alert(
                    'Não foi possível salvar a página inicial. Tente novamente.'
                );
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener(
        'DOMContentLoaded',
        iniciarConfiguracoesFitZone
    );
} else {
    iniciarConfiguracoesFitZone();
}
