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
        isNaN(peso) ||
        isNaN(alturaCm) ||
        peso <= 0 ||
        alturaCm <= 0
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

    const saveButton =
        document.getElementById('btnSaveProfile');

    const endSessionButton =
        document.getElementById('btnEndSession');

    if (saveButton) {
        saveButton.addEventListener(
            'click',
            handleSaveProfile
        );
    }

    if (endSessionButton) {
        endSessionButton.addEventListener(
            'click',
            handleEndSession
        );
    }
}
// ========================================
// RESUMO DOS TREINOS
// ========================================

function loadTrainingSummary() {

    const totalElement =
        document.getElementById('totalWorkouts');

    const monthElement =
        document.getElementById('currentMonthWorkouts');

    const lastElement =
        document.getElementById('lastWorkout');

    // Se os cards não existirem, encerra
    if (!totalElement || !monthElement || !lastElement) {
        return;
    }

    // Busca o histórico salvo
    const historico =
        JSON.parse(
            localStorage.getItem('historicoTreinos')
        ) || [];

    // TOTAL DE TREINOS
    totalElement.textContent = historico.length;

    // DATA ATUAL
    const agora = new Date();

    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    // TREINOS CONCLUÍDOS NESTE MÊS
    const treinosDoMes = historico.filter((treino) => {

        const dataTreino =
            new Date(treino.data);

        return (
            dataTreino.getMonth() === mesAtual &&
            dataTreino.getFullYear() === anoAtual
        );
    });

    monthElement.textContent =
        treinosDoMes.length;

    // ÚLTIMO TREINO
    if (historico.length > 0) {

        const ultimoTreino =
            historico[historico.length - 1];

        const dataUltimoTreino =
            new Date(ultimoTreino.data);

        lastElement.textContent =
            dataUltimoTreino.toLocaleDateString(
                'pt-BR',
                {
                    day: '2-digit',
                    month: '2-digit'
                }
            );

    } else {

        lastElement.textContent = '—';
    }
}
function initializeProfile() {

    console.log('PERFIL.JS INICIADO');

    fillForm();

    loadCharacter();

    initializeIMC();

    initializeProfileActions();
    
    loadTrainingSummary();
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
