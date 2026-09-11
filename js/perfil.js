const PROFILE_STORAGE_KEY = 'fitzonePerfil';


// ========================================
// CARREGAR PERFIL SALVO
// ========================================

function loadProfile() {
    try {
        const saved = localStorage.getItem(PROFILE_STORAGE_KEY);

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
            PROFILE_STORAGE_KEY,
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
        usuario =
            JSON.parse(localStorage.getItem('usuario')) || {};
    } catch (error) {
        console.warn('Não foi possível carregar o usuário:', error);
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

    console.log('Salvar perfil acionado');


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


    console.log('Dados do perfil:', data);


    const sucesso =
        saveProfile(data);


    if (!sucesso) {

        alert(
            'Não foi possível salvar o perfil. Tente novamente.'
        );

        return;
    }


    showSuccess();

    console.log(
        'Perfil salvo com sucesso no localStorage.'
    );
}


// ========================================
// FINALIZAR SESSÃO
// ========================================

function handleEndSession() {

    // IMPORTANTE:
    // Não apagamos fitzonePerfil.
    //
    // Assim, quando o usuário entrar novamente,
    // o perfil continuará salvo.

    try {

        localStorage.removeItem(
            'generoFitZone'
        );

        localStorage.removeItem(
            'rememberedEmail'
        );

    } catch (error) {

        console.warn(
            'Não foi possível limpar os dados da sessão:',
            error
        );
    }


    window.location.href = 'index.html';
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

        genero =
            localStorage.getItem('generoFitZone');

    } catch (error) {

        console.warn(
            'Não foi possível carregar o gênero:',
            error
        );
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
// INICIALIZAÇÃO
// ========================================

function initializeProfile() {

    console.log('PERFIL.JS INICIADO');


    // Carrega os dados existentes
    fillForm();


    // Carrega personagem
    loadCharacter();


    // Botão salvar
    const saveButton =
        document.getElementById('btnSaveProfile');


    if (saveButton) {

        saveButton.addEventListener(
            'click',
            handleSaveProfile
        );

    } else {

        console.error(
            'Botão btnSaveProfile não encontrado.'
        );
    }


    // Botão finalizar sessão
    const endSessionButton =
        document.getElementById('btnEndSession');


    if (endSessionButton) {

        endSessionButton.addEventListener(
            'click',
            handleEndSession
        );

    } else {

        console.error(
            'Botão btnEndSession não encontrado.'
        );
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
