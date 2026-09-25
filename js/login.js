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


// ==================== FUNÇÕES AUXILIARES ====================

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
    return (
        usuarioSalvo &&
        usuarioSalvo.email.toLowerCase() === email &&
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

        return usuarios.find(
            usuario =>
                usuario.email.toLowerCase() ===
                email.toLowerCase()
        ) || null;

    } catch (error) {
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

        function handleLogin(e) {
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

    localStorage.setItem(
    'fitzoneSessao',
    JSON.stringify({
        autenticado: true,
        email: email
    })
);

    // Redirecionar para o perfil
    setTimeout(() => {
        window.location.href = 'perfil.html';
    }, 700);

}, 600);

}

        // ==================== INICIALIZAÇÃO ====================

function inicializarLogin() {

   const sessao =
    carregarSessao();

if (sessao && sessao.autenticado === true) {
    window.location.href = 'perfil.html';
    return;
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
