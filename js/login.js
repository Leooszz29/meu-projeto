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

const newPasswordError =
    document.getElementById('newPasswordError');

const saveNewPasswordBtn =
    document.getElementById('saveNewPasswordBtn');

let recoveryCodeGenerated = null;


// ==================== FUNÇÕES AUXILIARES ====================

function gerarCodigoRecuperacao() {
    return Math.floor(
        100000 + Math.random() * 900000
    ).toString();
}

function resetLoginButton() {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
}

function validarCredenciais(usuarioSalvo, email, password) {
    return (
        usuarioSalvo &&
        usuarioSalvo.email === email &&
        usuarioSalvo.senha === password
    );
}


// Adicione daqui para baixo
function carregarUsuarioSalvo() {

    try {

        const usuarioJSON =
            localStorage.getItem('usuario');

        return usuarioJSON
            ? JSON.parse(usuarioJSON)
            : null;

    } catch (error) {

        console.error(
            'Erro ao carregar usuário:',
            error
        );

        return null;
    }
}


// ==================== PREFERÊNCIA DE EMAIL ====================

function atualizarPreferenciaEmail(email) {

    if (rememberCheckbox.checked) {

        localStorage.setItem(
            'rememberedEmail',
            email
        );

    } else {

        localStorage.removeItem(
            'rememberedEmail'
        );
    }
}

function carregarEmailLembrado() {

    const rememberedEmail =
        localStorage.getItem('rememberedEmail');

    if (!rememberedEmail) {
        return;
    }

    emailInput.value = rememberedEmail;
    rememberCheckbox.checked = true;
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
});

recoveryCodeClose.addEventListener('click', () => {

    recoveryCodeOverlay.classList.remove('show');

    recoveryCodeOverlay.setAttribute(
        'aria-hidden',
        'true'
    );

    recoveryCode.value = '';
    recoveryCodeError.classList.remove('show');
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

    const usuarioSalvo =
        carregarUsuarioSalvo();

    if (
        !usuarioSalvo ||
        usuarioSalvo.email.toLowerCase() !== email
    ) {
        recoveryError.textContent =
            'E-mail não cadastrado.';

        recoveryError.classList.add('show');
        return;
    }

        recoveryCodeGenerated =
        gerarCodigoRecuperacao();

    console.log(
        'Código de recuperação (TESTE):',
        recoveryCodeGenerated
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

    console.log(
        'Código de recuperação confirmado.'
    );
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

        function handleLogin(e) {
    e.preventDefault();
    clearError();

    if (submitBtn.disabled) {
        return;
    }

    const email = emailInput.value.trim();
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
    carregarUsuarioSalvo();
            
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

    showSuccess(
        'Login realizado com sucesso! Seja bem-vindo! 💪'
    );

   // Armazenar ou remover preferência de lembrar
atualizarPreferenciaEmail(email);

    // Redirecionar para o perfil
    setTimeout(() => {
        window.location.href = 'perfil.html';
    }, 700);

}, 600);

}

        // ==================== INICIALIZAÇÃO ====================

function inicializarLogin() {

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
