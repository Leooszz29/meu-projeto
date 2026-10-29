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

const recoveryContinueBtn =
    document.getElementById('recoveryContinueBtn');

const recoveryError =
    document.getElementById('recoveryError');

const recoveryCodeOverlay =
    document.getElementById('recoveryCodeOverlay');

const recoveryCodeClose =
    document.getElementById('recoveryCodeClose');

const recoveryCode =
    document.getElementById('recoveryCode');

const recoveryCodeError =
    document.getElementById('recoveryCodeError');

const verifyRecoveryCodeBtn =
    document.getElementById('verifyRecoveryCodeBtn');

const newPasswordOverlay =
    document.getElementById('newPasswordOverlay');

const newPasswordClose =
    document.getElementById('newPasswordClose');

const newPassword =
    document.getElementById('newPassword');

const confirmNewPassword =
    document.getElementById('confirmNewPassword');

const toggleNewPassword =
    document.getElementById('toggleNewPassword');

const toggleConfirmNewPassword =
    document.getElementById('toggleConfirmNewPassword');

const newPasswordError =
    document.getElementById('newPasswordError');

const saveNewPasswordBtn =
    document.getElementById('saveNewPasswordBtn');

let recoveryCodeGenerated = null;

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

function obterPaginaInicialFitZone(email) {
    const paginaPadrao = 'calendario.html';

    if (typeof email !== 'string' || !email.trim()) {
        return paginaPadrao;
    }

    try {
        const chave = `fitzonePreferencias:${email.trim().toLowerCase()}`;

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

function gerarCodigoRecuperacao() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}

function resetarCamposNovaSenha() {

    newPassword.value = '';
    confirmNewPassword.value = '';

    newPassword.type = 'password';
    confirmNewPassword.type = 'password';

    toggleNewPassword
        .querySelector('.icon-eye')
        .classList.remove('is-hidden');

    toggleNewPassword
        .querySelector('.icon-eye-off')
        .classList.add('is-hidden');

    toggleConfirmNewPassword
        .querySelector('.icon-eye')
        .classList.remove('is-hidden');

    toggleConfirmNewPassword
        .querySelector('.icon-eye-off')
        .classList.add('is-hidden');

    toggleNewPassword.setAttribute(
        'aria-pressed',
        'false'
    );

    toggleConfirmNewPassword.setAttribute(
        'aria-pressed',
        'false'
    );

    toggleNewPassword.setAttribute(
        'aria-label',
        'Mostrar nova senha'
    );

    toggleConfirmNewPassword.setAttribute(
        'aria-label',
        'Mostrar confirmação da senha'
    );
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

recoveryCode.addEventListener('input', () => {

    recoveryCode.value =
        recoveryCode.value
            .replace(/\D/g, '')
            .slice(0, 6);

    recoveryCodeError.classList.remove('show');
});

recoveryCodeClose.addEventListener('click', () => {

    recoveryCodeOverlay.classList.remove('show');

    recoveryCodeOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    recoveryCode.value = '';

    recoveryCodeGenerated = null;

    recoveryCodeError.classList.remove('show');
});

toggleNewPassword.addEventListener('click', () => {

    const isHidden =
        newPassword.type === 'password';

    newPassword.type =
        isHidden ? 'text' : 'password';

    toggleNewPassword.setAttribute(
        'aria-pressed',
        String(isHidden)
    );

    toggleNewPassword.setAttribute(
        'aria-label',
        isHidden
            ? 'Ocultar nova senha'
            : 'Mostrar nova senha'
    );

    toggleNewPassword
        .querySelector('.icon-eye')
        .classList.toggle('is-hidden', isHidden);

    toggleNewPassword
        .querySelector('.icon-eye-off')
        .classList.toggle('is-hidden', !isHidden);
});

toggleConfirmNewPassword.addEventListener('click', () => {

    const isHidden =
        confirmNewPassword.type === 'password';

    confirmNewPassword.type =
        isHidden ? 'text' : 'password';

    toggleConfirmNewPassword.setAttribute(
        'aria-pressed',
        String(isHidden)
    );

    toggleConfirmNewPassword.setAttribute(
        'aria-label',
        isHidden
            ? 'Ocultar confirmação da senha'
            : 'Mostrar confirmação da senha'
    );

    toggleConfirmNewPassword
        .querySelector('.icon-eye')
        .classList.toggle('is-hidden', isHidden);

    toggleConfirmNewPassword
        .querySelector('.icon-eye-off')
        .classList.toggle('is-hidden', !isHidden);
});

newPasswordClose.addEventListener('click', () => {

    newPasswordOverlay.classList.remove('show');

    newPasswordOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    resetarCamposNovaSenha();

    newPasswordError.classList.remove('show');
});

recoveryContinueBtn.addEventListener('click', () => {

    const email =
        recoveryEmail.value.trim().toLowerCase();

    recoveryError.classList.remove('show');

    if (!email) {
        recoveryError.textContent =
            'Informe o seu e-mail.';

        recoveryError.classList.add('show');
        return;
    }

    if (!validateEmail(email)) {
        recoveryError.textContent =
            'Digite um e-mail válido.';

        recoveryError.classList.add('show');
        return;
    }

    const usuarioSalvo =
        carregarUsuarioSalvo(email);

    if (
        !usuarioSalvo ||
        usuarioSalvo.email.toLowerCase() !== email
    ) {
        recoveryError.textContent =
            'E-mail não cadastrado.';

        recoveryError.classList.add('show');
        return;
    }

    localStorage.setItem(
        'emailRecuperacao',
        email
    );

    recoveryCodeGenerated =
        gerarCodigoRecuperacao();

    console.log(
        'Código de recuperação (TESTE):',
        recoveryCodeGenerated
    );

    alert(
        'MODO DE ESTUDOS: este código não foi ' +
        'enviado por e-mail. Abra o console do ' +
        'navegador (F12) para consultar o código ' +
        'de recuperação. Esta função não é ' +
        'segura para contas reais.'
    );

    passwordRecoveryOverlay.classList.remove('show');

    passwordRecoveryOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    recoveryCodeOverlay.classList.add('show');

    recoveryCodeOverlay.setAttribute(
        'aria-hidden',
        'false'
    );

    recoveryCode.value = '';
    recoveryCodeError.classList.remove('show');

    recoveryCode.focus();
});

verifyRecoveryCodeBtn.addEventListener('click', () => {

    const codigoDigitado =
        recoveryCode.value.trim();

    recoveryCodeError.classList.remove('show');

    if (!codigoDigitado) {
        recoveryCodeError.textContent =
            'Informe o código de recuperação.';

        recoveryCodeError.classList.add('show');
        return;
    }

    if (codigoDigitado.length !== 6) {
        recoveryCodeError.textContent =
            'O código deve ter 6 dígitos.';

        recoveryCodeError.classList.add('show');
        return;
    }

    if (codigoDigitado !== recoveryCodeGenerated) {
        recoveryCodeError.textContent =
            'Código de recuperação inválido.';

        recoveryCodeError.classList.add('show');
        return;
    }

    recoveryCodeOverlay.classList.remove('show');

    recoveryCodeOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    newPasswordOverlay.classList.add('show');

    newPasswordOverlay.setAttribute(
        'aria-hidden',
        'false'
    );

    resetarCamposNovaSenha();

    newPasswordError.classList.remove('show');

    newPassword.focus();
});

saveNewPasswordBtn.addEventListener('click', () => {

    const novaSenha =
        newPassword.value;

    const confirmarSenha =
        confirmNewPassword.value;

    newPasswordError.classList.remove('show');

    if (!novaSenha || !confirmarSenha) {
        newPasswordError.textContent =
            'Preencha os dois campos de senha.';

        newPasswordError.classList.add('show');
        return;
    }

    if (novaSenha.length < 6) {
        newPasswordError.textContent =
            'A senha deve ter no mínimo 6 caracteres.';

        newPasswordError.classList.add('show');
        return;
    }

    if (novaSenha !== confirmarSenha) {
        newPasswordError.textContent =
            'As senhas não coincidem.';

        newPasswordError.classList.add('show');
        return;
    }

    const emailRecuperacao =
        localStorage.getItem(
            'emailRecuperacao'
        );

    const usuarioSalvo =
        carregarUsuarioSalvo(
            emailRecuperacao
        );

    if (!usuarioSalvo) {
        newPasswordError.textContent =
            'Não foi possível localizar o usuário.';

        newPasswordError.classList.add('show');
        return;
    }

    usuarioSalvo.senha = novaSenha;

    const usuarios =
        JSON.parse(
            localStorage.getItem('usuarios')
        ) || [];

    const indiceUsuario =
        usuarios.findIndex(
            usuario =>
                usuario.email.toLowerCase() ===
                emailRecuperacao.toLowerCase()
        );

    if (indiceUsuario !== -1) {
        usuarios[indiceUsuario] =
            usuarioSalvo;

        localStorage.setItem(
            'usuarios',
            JSON.stringify(usuarios)
        );
    }

    newPasswordOverlay.classList.remove('show');

    newPasswordOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    recoveryCodeGenerated = null;

    localStorage.removeItem(
        'emailRecuperacao'
    );

    resetarCamposNovaSenha();

    recoveryCode.value = '';

    passwordInput.value = '';

    showSuccess(
        'Senha alterada com sucesso! Faça login com sua nova senha.'
    );

    passwordInput.focus();
});

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

    // Validação
    if (!email || !password) {
        showError('Por favor, preencha todos os campos');
        return;
    }

    if (!validateEmail(email)) {
        showError('Por favor, digite um email válido');
        return;
    }

    if (password.length < 6) {
        showError('Senha deve ter no mínimo 6 caracteres');
        return;
    }

    // Buscar usuário cadastrado
    const usuarioSalvo =
        carregarUsuarioSalvo(email);

    /* =========================================
       LOGIN PRINCIPAL - CONTA SUPABASE
    ========================================= */

    if (!usuarioSalvo) {
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        try {
            const resultado =
                await validarLoginHibridoFitZone(
                    email,
                    password
                );

            if (!resultado.autenticado ||
                resultado.origem !== 'supabase') {
                showError('E-mail ou senha incorretos.');
                return;
            }

            /* Evitar conflito com uma sessão local anterior */
            try {
                localStorage.removeItem('fitzoneSessao');
            } catch (erro) {
                console.error(
                    'Não foi possível limpar a sessão local:',
                    erro
                );

                showError(
                    'Não foi possível alternar de conta. Tente novamente.'
                );

                return;
            }

            atualizarPreferenciaEmail(email);

            showSuccess(
                'Login realizado com sucesso! Seja bem-vindo! 💪'
            );

            window.location.href = 'calendario.html';
            return;

        } catch (erro) {
            console.error(
                'Erro na autenticação Supabase:',
                erro
            );

            const credenciaisInvalidas =
                erro.code === 'invalid_credentials' ||
                erro.status === 400;

            if (credenciaisInvalidas) {
                showError('E-mail ou senha incorretos.');
            } else {
                showError(
                    'Não foi possível conectar ao Supabase. Tente novamente.'
                );
            }

        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }

        return;
    }

    // Validar credenciais
    if (
        !validarCredenciais(
            usuarioSalvo,
            email,
            password
        )
    ) {
        showError(
            'E-mail ou senha incorretos'
        );

        return;
    }

    // Desabilitar botão durante envio
    submitBtn.disabled = true;

    submitBtn.classList.add('loading');

    // Simular envio (remova isso quando conectar a um backend)
    setTimeout(() => {

        // Armazenar ou remover preferência de lembrar
        atualizarPreferenciaEmail(email);

        try {
            localStorage.setItem(
                'fitzoneSessao',
                JSON.stringify({
                    autenticado: true,
                    email: email
                })
            );
        } catch (erro) {
            console.error(
                'Erro ao salvar a sessão:',
                erro
            );

            showError(
                'Não foi possível iniciar sua sessão. Tente novamente.'
            );

            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
            return;
        }

        try {
            const generoSelecionado =
                usuarioSalvo.genero ||
                localStorage.getItem(
                    `generoFitZone:${email.toLowerCase()}`
                ) ||
                localStorage.getItem('generoFitZone');

            if (generoSelecionado) {
                localStorage.setItem(
                    `generoFitZone:${email.toLowerCase()}`,
                    generoSelecionado
                );
            }

        } catch (erro) {
            console.warn(
                'Não foi possível atualizar o gênero do usuário:',
                erro
            );
        }

        showSuccess(
            'Login realizado com sucesso! Seja bem-vindo! 💪'
        );

        // Redirecionar para a pagina inicial preferida
        setTimeout(() => {
            window.location.href = obterPaginaInicialFitZone(email);
        }, 700);
    }, 600);

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
