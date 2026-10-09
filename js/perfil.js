const PROFILE_STORAGE_KEY = 'fitzonePerfil';

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

function obterChavePerfil() {

    const sessao =
        carregarSessao();

    if (
        !sessao ||
        !sessao.email
    ) {
        return PROFILE_STORAGE_KEY;
    }

    return `${PROFILE_STORAGE_KEY}:${sessao.email.toLowerCase()}`;
}

function obterChaveHistoricoTreinos() {

    const sessao =
        carregarSessao();

    if (
        !sessao ||
        !sessao.email
    ) {
        return 'historicoTreinos';
    }

    return `historicoTreinos:${sessao.email.toLowerCase()}`;
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
        !idade ||
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
        !peso ||
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
        !altura ||
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

function initializeProfileActions() {
    const profileForm =
        document.getElementById('profileForm');

    const endSessionButton =
        document.getElementById('btnEndSession');

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

function initializeProfile() {
    const sessao =
        carregarSessao();

    if (
        !sessao ||
        sessao.autenticado !== true
    ) {
        window.location.href =
            'login.html';

        return;
    }

    fillForm();
    loadCharacter();
    initializeIMC();
    initializeProfileActions();
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
