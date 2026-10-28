// ==================== VARIÁVEIS ====================
const form = document.getElementById('signupForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsInput = document.getElementById('terms');
const submitBtn = document.getElementById('submitBtn');

// ==================== SUPABASE ====================
function obterSupabaseCadastro() {
    if (typeof inicializarSupabaseFitZone !== 'function') {
        console.warn(
            'Configuração do Supabase indisponível no cadastro.'
        );
        return null;
    }

    return inicializarSupabaseFitZone();
}

// ==================== EVENT LISTENERS ====================
form.addEventListener('submit', handleSignup);
[nameInput, emailInput, passwordInput, confirmPasswordInput].forEach(el => {
    el.addEventListener('input', clearError);
});
termsInput.addEventListener('change', clearError);

document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
        const target = document.getElementById(this.dataset.target);
        const iconEye = this.querySelector('.icon-eye');
        const iconEyeOff = this.querySelector('.icon-eye-off');

        // Se o tipo atual for password, mudamos para text (mostrar senha)
        // Caso contrário, voltamos para password (ocultar senha)
        if (target.type === 'password') {
            target.type = 'text';

            // Gerencia os elementos visuais garantindo consistência técnica
            if (iconEye) iconEye.style.setProperty('display', 'none', 'important');
            if (iconEyeOff) iconEyeOff.style.setProperty('display', 'block', 'important');

            this.setAttribute('aria-label', 'Ocultar senha');
        } else {
            target.type = 'password';

            // Restaura o olho padrão e oculta a versão riscada
            if (iconEye) iconEye.style.setProperty('display', 'block', 'important');
            if (iconEyeOff) iconEyeOff.style.setProperty('display', 'none', 'important');

            this.setAttribute('aria-label', 'Mostrar senha');
        }
    });
});
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

function handleSignup(e) {
    e.preventDefault();
    clearError();

    const name = nameInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validação
    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor, preencha todos os campos');
        return;
    }

    if (!validateEmail(email)) {
        showError('Por favor, digite um email válido');
        return;
    }

    if (password.length < 6) {
        showError('A senha deve ter no mínimo 6 caracteres');
        return;
    }

    if (password !== confirmPassword) {
        showError('As senhas não coincidem');
        return;
    }

    if (!termsInput.checked) {
        showError('Você precisa aceitar os Termos de Uso');
        return;
    }
    // Salvar dados do usuário no navegador
    let usuario;

    try {
        usuario = {
            nome: name,
            email: email,
            senha: password,
            genero: localStorage.getItem('generoFitZone')
        };
    } catch (error) {
        console.error(
            'Erro ao carregar o gênero do cadastro:',
            error
        );

        showError(
            'Não foi possível acessar o armazenamento do navegador. ' +
            'Tente novamente.'
        );

        return;
    }

    // Busca as contas já cadastradas
    let usuarios = [];

    try {
        const dadosSalvos =
            localStorage.getItem('usuarios');

        const dadosConvertidos =
            dadosSalvos
                ? JSON.parse(dadosSalvos)
                : [];

        if (!Array.isArray(dadosConvertidos)) {
            throw new Error(
                'Formato inválido dos usuários'
            );
        }

        usuarios = dadosConvertidos;

    } catch (error) {
        console.error(
            'Erro ao carregar usuários:',
            error
        );

        showError(
            'Não foi possível carregar os cadastros. ' +
            'Os dados existentes foram preservados.'
        );

        return;
    }

    const emailJaCadastrado =
        usuarios.some(
            usuarioCadastrado =>
                usuarioCadastrado !== null &&
                typeof usuarioCadastrado === 'object' &&
                !Array.isArray(usuarioCadastrado) &&
                typeof usuarioCadastrado.email === 'string' &&
                usuarioCadastrado.email.trim().toLowerCase() ===
                email
        );

    if (emailJaCadastrado) {
        showError(
            'Este e-mail já está cadastrado.'
        );
        return;
    }

    // Adiciona a nova conta sem apagar as anteriores
    usuarios.push(usuario);

    // Salva novamente a lista completa
    try {
        localStorage.setItem(
            'usuarios',
            JSON.stringify(usuarios)
        );
    } catch (error) {
        console.error(
            'Erro ao salvar o cadastro:',
            error
        );

        showError(
            'Não foi possível salvar sua conta. ' +
            'Verifique o armazenamento do navegador e tente novamente.'
        );

        return;
    }

    // Desabilitar botão durante envio
    submitBtn.disabled = true;
    submitBtn.textContent = 'Criando conta...';

    // Simular envio (remova isso quando conectar a um backend)
    setTimeout(() => {
        showSuccess('Conta criada com sucesso! Redirecionando para o login... 💪');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1800);
    }, 1200);
}

// ==================== INICIALIZAÇÃO ====================
window.addEventListener('DOMContentLoaded', () => {
    // Aplicar tema de acordo com o gênero escolhido no Duelo de Ferro
    const genero = localStorage.getItem('generoFitZone');
    const characterImg = document.getElementById('characterImg');
    const imagens = {
        masculino: 'img/atleta-masculino.webp',
        feminino: 'img/atleta-feminino.webp'
    };

    if (genero === 'masculino') {
        document.body.classList.add('theme-masculino');
        characterImg.src = imagens.masculino;
        characterImg.style.display = 'block';
    } else if (genero === 'feminino') {
        document.body.classList.add('theme-feminino');
        characterImg.src = imagens.feminino;
        characterImg.style.display = 'block';
    }
});
