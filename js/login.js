// ==================== VARIÁVEIS ====================

const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submitBtn');

const togglePassword =
    document.getElementById('togglePassword');

const rememberCheckbox =
    document.getElementById('remember');

const forgotPasswordBtn =
    document.getElementById('forgotPasswordBtn');

const passwordRecoveryOverlay =
    document.getElementById('passwordRecoveryOverlay');

const passwordRecoveryClose =
    document.getElementById('passwordRecoveryClose');

const recoveryEmail =
    document.getElementById('recoveryEmail');

const recoveryError =
    document.getElementById('recoveryError');

/* =========================================
   FITZONE - LOGIN COM SUPABASE AUTH
========================================= */

async function autenticarUsuarioSupabase(email, senha) {
    if (typeof inicializarSupabaseFitZone !== 'function') {
        throw new Error(
            'Configuração do Supabase indisponível.'
        );
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível inicializar o Supabase.'
        );
    }

    const { data, error } =
        await cliente.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: senha
        });

    if (error) {
        throw error;
    }

    return data;
}

/* =========================================
   FITZONE - RECUPERAR SENHA SUPABASE
========================================= */

async function solicitarRecuperacaoSenhaSupabase(email) {
    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível conectar ao Supabase.'
        );
    }

    const urlRedefinicao = new URL(
        'redefinir-senha.html',
        window.location.href
    ).href;

    const { error } = await cliente.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
            redirectTo: urlRedefinicao
        }
    );

    if (error) {
        throw error;
    }

    return true;
}

/* =========================================
   FITZONE - VERIFICAR SESSAO SUPABASE
========================================= */

async function verificarSessaoSupabaseFitZone() {
    if (typeof inicializarSupabaseFitZone !== 'function') {
        throw new Error(
            'Configuração do Supabase indisponível.'
        );
    }

    const cliente = inicializarSupabaseFitZone();

    if (!cliente) {
        throw new Error(
            'Não foi possível inicializar o Supabase.'
        );
    }

    const { data, error } = await cliente.auth.getUser();

    if (error) {
        if (
            error.name === 'AuthSessionMissingError' ||
            error.message === 'Auth session missing!'
        ) {
            return {
                autenticado: false,
                email: null,
                id: null
            };
        }

        throw error;
    }

    return {
        autenticado: Boolean(data.user),
        email: data.user?.email || null,
        id: data.user?.id || null
    };
}

/* =========================================
   FITZONE - IDENTIFICAR SESSAO HIBRIDA
========================================= */

async function identificarSessaoHibridaFitZone() {
    const sessaoLocal = carregarSessao();

    if (
        sessaoLocal &&
        sessaoLocal.autenticado === true &&
        typeof sessaoLocal.email === 'string' &&
        sessaoLocal.email.trim() &&
        carregarUsuarioSalvo(sessaoLocal.email)
    ) {
        return {
            origem: 'local',
            autenticado: true,
            email: sessaoLocal.email
        };
    }

    const sessaoSupabase =
        await verificarSessaoSupabaseFitZone();

    if (sessaoSupabase.autenticado) {
        return {
            origem: 'supabase',
            autenticado: true,
            email: sessaoSupabase.email,
            id: sessaoSupabase.id
        };
    }

    return {
        origem: 'nenhuma',
        autenticado: false,
        email: null
    };
}

/* =========================================
   FITZONE - IDENTIFICAR USUARIO LOCAL
========================================= */

function usuarioExisteLocalmente(email) {
    const usuario = carregarUsuarioSalvo(
        email.trim().toLowerCase()
    );

    return Boolean(usuario);
}

/* =========================================
   FITZONE - IDENTIFICAR TIPO DE CONTA
========================================= */

function identificarTipoContaFitZone(email) {
    if (
        typeof email !== 'string' ||
        !email.trim()
    ) {
        return 'invalido';
    }

    if (usuarioExisteLocalmente(email)) {
        return 'local';
    }

    return 'nao_encontrado_localmente';
}

/* =========================================
   FITZONE - VALIDAR LOGIN HIBRIDO
========================================= */

async function validarLoginHibridoFitZone(email, senha) {
    const emailNormalizado = email.trim().toLowerCase();

    if (!emailNormalizado || !senha) {
        throw new Error(
            'Informe o e-mail e a senha.'
        );
    }

    const usuarioLocal = carregarUsuarioSalvo(
        emailNormalizado
    );

    if (usuarioLocal) {
        return {
            origem: 'local',
            autenticado: validarCredenciais(
                usuarioLocal,
                emailNormalizado,
                senha
            )
        };
    }

    const dados = await autenticarUsuarioSupabase(
        emailNormalizado,
        senha
    );

    return {
        origem: 'supabase',
        autenticado: Boolean(dados.user),
        usuario: dados.user || null
    };
}

// ==================== FUNÇÕES AUXILIARES ====================

/* =========================================
   FITZONE - OBTER PAGINA INICIAL DO USUARIO
========================================= */

function obterPaginaInicialFitZone(email, idSupabase = null) {

    const paginaPadrao = 'calendario.html';

    if (typeof email !== 'string' || !email.trim()) {
        return paginaPadrao;
    }

    try {        
        const chave = idSupabase
            ? `fitzonePreferencias:supabase:${idSupabase}`
            : `fitzonePreferencias:${email.trim().toLowerCase()}`;

        const dados = localStorage.getItem(chave);

        if (!dados) {
            return paginaPadrao;
        }

        const preferencias = JSON.parse(dados);

        if (
            !preferencias ||
            typeof preferencias !== 'object' ||
            Array.isArray(preferencias)
        ) {
            return paginaPadrao;
        }

        const paginasPermitidas = [
            'calendario.html',
            'treinos.html',
            'desempenho.html'
        ];

        return paginasPermitidas.includes(preferencias.paginaInicial)
            ? preferencias.paginaInicial
            : paginaPadrao;

    } catch (erro) {
        console.warn(
            'Não foi possível carregar a página inicial:',
            erro
        );

        return paginaPadrao;
    }
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

function validarCredenciais(usuarioSalvo, email, password) {
    if (
        !usuarioSalvo ||
        typeof usuarioSalvo.email !== 'string' ||
        typeof usuarioSalvo.senha !== 'string'
    ) {
        return false;
    }

    return (
        usuarioSalvo.email.trim().toLowerCase() ===
            email.trim().toLowerCase() &&
        usuarioSalvo.senha === password
    );
}

// Adicione daqui para baixo
function carregarUsuarioSalvo(email) {

    try {

        const usuariosJSON =
            localStorage.getItem('usuarios');

        const usuarios =
            usuariosJSON
                ? JSON.parse(usuariosJSON)
                : [];

        if (!Array.isArray(usuarios)) {
            throw new Error(
                'Formato inválido da lista de usuários'
            );
        }

        return usuarios.find(
            usuario =>
                usuario &&
                typeof usuario.email === 'string' &&
                usuario.email.toLowerCase() ===
                email.toLowerCase()
        ) || null;

    } catch (error) {
        return null;
    }
}

// ==================== PREFERÊNCIA DE EMAIL ====================

function atualizarPreferenciaEmail(email) {
    try {
        if (rememberCheckbox.checked) {
            localStorage.setItem(
                'rememberedEmail',
                email.trim().toLowerCase()
            );
        } else {
            localStorage.removeItem(
                'rememberedEmail'
            );
        }

    } catch (erro) {
        console.warn(
            'Não foi possível atualizar a preferência de e-mail:',
            erro
        );
    }
}

function carregarEmailLembrado() {
    try {
        const rememberedEmail =
            localStorage.getItem('rememberedEmail');

        if (
            typeof rememberedEmail !== 'string' ||
            !rememberedEmail.trim()
        ) {
            return;
        }

        emailInput.value = rememberedEmail.trim();
        rememberCheckbox.checked = true;

    } catch (erro) {
        console.warn(
            'Não foi possível carregar o e-mail lembrado:',
            erro
        );

        rememberCheckbox.checked = false;
    }
}

function alternarVisibilidadeSenha() {

    const isHidden =
        passwordInput.type === 'password';

    passwordInput.type =
        isHidden ? 'text' : 'password';

    togglePassword
        .querySelector('.icon-eye')
        .classList.toggle('is-hidden', isHidden);

    togglePassword
        .querySelector('.icon-eye-off')
        .classList.toggle('is-hidden', !isHidden);

    togglePassword.setAttribute(
        'aria-label',
        isHidden ? 'Ocultar senha' : 'Mostrar senha'
    );

    togglePassword.setAttribute(
        'aria-pressed',
        isHidden
    );
}

// ==================== EVENT LISTENERS ====================

/* =========================================
   FITZONE - BOTAO RECUPERACAO SUPABASE
========================================= */

const recoveryEmailLinkBtn =
    document.getElementById('recoveryEmailLinkBtn');

if (recoveryEmailLinkBtn) {
    recoveryEmailLinkBtn.addEventListener(
        'click',
        async () => {
            const email =
                recoveryEmail.value.trim().toLowerCase();

            recoveryError.textContent = '';
            recoveryError.classList.remove('show');

            if (!email || !validateEmail(email)) {
                recoveryError.textContent =
                    'Informe um e-mail válido.';
                recoveryError.classList.add('show');
                recoveryEmail.focus();
                return;
            }

            recoveryEmailLinkBtn.disabled = true;
            recoveryEmailLinkBtn.textContent =
                'Enviando solicitação...';

            try {
                await solicitarRecuperacaoSenhaSupabase(email);

                passwordRecoveryOverlay.classList.remove(
                    'show'
                );

                passwordRecoveryOverlay.setAttribute(
                    'aria-hidden',
                    'true'
                );

                showSuccess(
                    'Se houver uma conta com recuperação ' +
                    'por e-mail para esse endereço, ' +
                    'você receberá um link. ' +
                    'Verifique também a pasta de spam.'
                );

            } catch (erro) {
                console.error(
                    'Erro ao solicitar recuperação por e-mail:',
                    erro
                );

                recoveryError.textContent =
                    'Não foi possível enviar a solicitação. ' +
                    'Verifique sua conexão e tente novamente.';

                recoveryError.classList.add('show');

            } finally {
                recoveryEmailLinkBtn.disabled = false;
                recoveryEmailLinkBtn.textContent =
                    'Receber link por e-mail';
            }
        }
    );
}

forgotPasswordBtn.addEventListener('click', () => {

    recoveryError.classList.remove('show');
recoveryError.textContent = '';

    passwordRecoveryOverlay.classList.add('show');

    passwordRecoveryOverlay.setAttribute(
        'aria-hidden',
        'false'
    );

    recoveryEmail.value =
        emailInput.value.trim();

    recoveryEmail.focus();
});

passwordRecoveryClose.addEventListener('click', () => {

    passwordRecoveryOverlay.classList.remove('show');

    passwordRecoveryOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    recoveryEmail.value = '';

    recoveryError.classList.remove('show');
    recoveryError.textContent = '';

});

/* =========================================
   RECUPERACAO TRADICIONAL DESATIVADA

   A recuperacao local por codigo de teste
   foi desativada por motivos de seguranca.

   Contas tradicionais existentes continuam
   podendo entrar com a senha atual.

   A recuperacao Supabase por e-mail
   permanece disponivel.
========================================= */

form.addEventListener('submit', handleLogin);
emailInput.addEventListener('input', clearError);
passwordInput.addEventListener('input', clearError);

togglePassword.addEventListener(
    'click',
    alternarVisibilidadeSenha
);

// ==================== FUNÇÕES ====================

function clearError() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}


async function handleLogin(e) {
    e.preventDefault();
    clearError();

    if (submitBtn.disabled) {
        return;
    }

    const email =
        emailInput.value.trim().toLowerCase();

    const password = passwordInput.value;

    if (!email || !password) {
        showError('Por favor, preencha todos os campos.');
        return;
    }

    if (!validateEmail(email)) {
        showError('Por favor, digite um e-mail válido.');
        return;
    }

    if (password.length < 6) {
        showError('Senha deve ter no mínimo 6 caracteres.');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    try {
        const dados =
            await autenticarUsuarioSupabase(
                email,
                password
            );

        if (!dados?.user) {
            showError('E-mail ou senha incorretos.');
            return;
        }

        localStorage.removeItem('fitzoneSessao');

        atualizarPreferenciaEmail(email);

        showSuccess(
            'Login realizado com sucesso! Seja bem-vindo! 💪'
        );

        window.location.href =
            obterPaginaInicialFitZone(
                dados.user.email,
                dados.user.id
            );

    } catch (erro) {
        console.error(
            'Erro na autenticação Supabase:',
            erro
        );

        const credenciaisInvalidas =
            erro.code === 'invalid_credentials' ||
            erro.code === 'email_not_confirmed' ||
            (
                erro.status === 400 &&
                erro.code === 'invalid_credentials'
            );

        if (credenciaisInvalidas) {
            showError(
                'Não foi possível autenticar. ' +
                'Verifique seu e-mail, senha e ' +
                'a confirmação da conta.'
            );
        } else {
            showError(
                'Não foi possível conectar ao Supabase. ' +
                'Verifique sua conexão e tente novamente.'
            );
        }

    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

// ==================== INICIALIZAÇÃO ====================

function inicializarLogin() {

    const sessao = carregarSessao();

    const sessaoValida =
        sessao &&
        sessao.autenticado === true &&
        typeof sessao.email === 'string' &&
        sessao.email.trim() !== '';

    if (sessaoValida) {
        const usuarioDaSessao =
            carregarUsuarioSalvo(sessao.email.trim());

        const trocarConta =
            new URLSearchParams(
                window.location.search
            ).get('trocar') === '1';

        if (usuarioDaSessao && !trocarConta) {
            window.location.href = obterPaginaInicialFitZone(
                sessao.email
            );
            return;
        }

        if (!usuarioDaSessao) {
            try {
                localStorage.removeItem('fitzoneSessao');
            } catch (erro) {
                console.warn(
                    'Não foi possível limpar a sessão inválida:',
                    erro
                );
            }
        }
    }

    carregarEmailLembrado();

    // Aplicar tema de acordo com o gênero escolhido no Duelo de Ferro
    const genero =
        localStorage.getItem('generoFitZone');

    const characterImg =
        document.getElementById('characterImg');

    const imagens = {
        masculino: 'img/atleta-masculino.png',
        feminino: 'img/atleta-feminino.png'
    };

    if (genero === 'masculino') {

        document.body.classList.add(
            'theme-masculino'
        );

        document.body.classList.remove(
            'theme-feminino'
        );

        characterImg.src =
            imagens.masculino;

        characterImg.style.display =
            'block';

    } else if (genero === 'feminino') {

        document.body.classList.add(
            'theme-feminino'
        );

        document.body.classList.remove(
            'theme-masculino'
        );

        characterImg.src =
            imagens.feminino;

        characterImg.style.display =
            'block';
    }
}

window.addEventListener(
    'DOMContentLoaded',
    inicializarLogin
);
