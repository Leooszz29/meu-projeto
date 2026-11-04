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
const generoInput = document.getElementById('generoCadastro');

const tipoContaInput =
    document.getElementById('tipoContaCadastro');

const dicaSenhaCadastro =
    document.getElementById('dicaSenhaCadastro');

function atualizarDicaSenhaCadastro() {
    dicaSenhaCadastro.textContent =
        tipoContaInput.value === 'supabase'
            ? 'Mínimo de 8 caracteres, incluindo letras e números'
            : 'Mínimo de 6 caracteres — conta tradicional';
}

tipoContaInput.addEventListener(
    'change',
    () => {
        atualizarDicaSenhaCadastro();
        clearError();
    }
);

atualizarDicaSenhaCadastro();

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

async function cadastrarUsuarioSupabase(nome, email, senha, genero) {
    const cliente = obterSupabaseCadastro();

    if (!cliente) {
        throw new Error(
            'Não foi possível inicializar o Supabase.'
        );
    }

    const { data, error } = await cliente.auth.signUp({
        email: email,
        password: senha,
        options: {
            data: {
                nome: nome,
                genero: genero
            },

            emailRedirectTo:
                window.location.origin + '/meu-projeto/login.html'
        }
    });

    if (error) {
        throw error;
    }

    return data;
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

async function handleSignup(e) {
    e.preventDefault();
    clearError();

    const name = nameInput.value.trim();

    const email =
        emailInput.value.trim().toLowerCase();

    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    const genero = generoInput.value;    
    const tipoConta = tipoContaInput.value;

    // Validação

    if (
        genero !== 'masculino' &&
        genero !== 'feminino'
    ) {
        showError('Selecione seu gênero / tema visual.');
        generoInput.focus();
        return;
    }

    if (!name || !email || !password || !confirmPassword) {
        showError('Por favor, preencha todos os campos');
        return;
    }

    if (!validateEmail(email)) {
        showError('Por favor, digite um email válido');
        return;
    }

    if (tipoConta === 'supabase') {
        const senhaValida =
            password.length >= 8 &&
            /[A-Za-z]/.test(password) &&
            /[0-9]/.test(password);

        if (!senhaValida) {
            showError(
                'A senha Supabase deve ter no mínimo ' +
                '8 caracteres, incluindo letras e números.'
            );
            return;
        }

    } else if (tipoConta === 'tradicional') {
        if (password.length < 6) {
            showError(
                'A senha tradicional deve ter ' +
                'no mínimo 6 caracteres.'
            );
            return;
        }

    } else {
        showError('Selecione um tipo de conta válido.');
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

    /* =========================================
       CADASTRO SUPABASE PELO FORMULARIO
    ========================================= */

    if (tipoConta === 'supabase') {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Criando conta na nuvem...';

        try {
            const dados =
                await cadastrarUsuarioSupabase(
                    name,
                    email,
                    password,
                    genero
                );

            if (!dados?.user) {
                throw new Error(
                    'Não foi possível confirmar o cadastro.'
                );
            }

            showSuccess(
                'Cadastro enviado com sucesso! ' +
                'Verifique seu e-mail para confirmar ' +
                'a conta Supabase antes de entrar.'
            );

            form.reset();
            atualizarDicaSenhaCadastro();

        } catch (erro) {
            console.error(
                'Erro no cadastro Supabase:',
                erro
            );

            showError(
                'Não foi possível criar a conta Supabase. ' +
                'Verifique os dados, a conexão e tente novamente.'
            );

        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Criar conta';
        }

        return;
    }

    // Salvar dados do usuário no navegador
    let usuario;

    try {
        usuario = {
            nome: name,
            email: email,
            senha: password,
            genero: genero
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
