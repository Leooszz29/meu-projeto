```js
const PROFILE_STORAGE_KEY = 'fitzonePerfil';

let profileCache = null;


// ==============================
// CARREGAR PERFIL
// ==============================

function loadProfile() {
    try {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);

        if (stored !== null) {
            profileCache = JSON.parse(stored);
        }
    } catch (e) {
        console.warn('Não foi possível ler o localStorage:', e);
        profileCache = {};
    }

    if (profileCache === null) {
        profileCache = {};
    }

    return profileCache;
}


// ==============================
// SALVAR PERFIL
// ==============================

function saveProfile(data) {
    profileCache = data;

    try {
        localStorage.setItem(
            PROFILE_STORAGE_KEY,
            JSON.stringify(data)
        );

        return true;

    } catch (e) {
        console.warn('Não foi possível salvar no localStorage:', e);
        return false;
    }
}


// ==============================
// PREENCHER FORMULÁRIO
// ==============================

function fillForm() {
    const data = loadProfile();

    // Recupera o usuário criado no cadastro
    let usuario = {};

    try {
        usuario = JSON.parse(
            localStorage.getItem('usuario')
        ) || {};
    } catch (e) {
        console.warn('Não foi possível carregar o usuário:', e);
    }

    // Se já existe nome salvo no perfil,
    // ele tem prioridade.
    // Caso contrário, usa o nome do cadastro.
    document.getElementById('nome').value =
        data.nome || usuario.nome || '';

    document.getElementById('idade').value =
        data.idade || '';

    document.getElementById('tipoSanguineo').value =
        data.tipoSanguineo || '';

    document.getElementById('peso').value =
        data.peso || '';

    document.getElementById('altura').value =
        data.altura || '';

    document.getElementById('treinador').value =
        data.treinador || '';

    document.getElementById('infoPessoais').value =
        data.infoPessoais || '';
}


// ==============================
// SALVAR PERFIL
// ==============================

document.getElementById('profileForm').addEventListener('submit', (e) => {

    e.preventDefault();

    const data = {
        nome: document.getElementById('nome').value.trim(),

        idade: document.getElementById('idade').value,

        tipoSanguineo:
            document.getElementById('tipoSanguineo').value,

        peso:
            document.getElementById('peso').value,

        altura:
            document.getElementById('altura').value,

        treinador:
            document.getElementById('treinador').value.trim(),

        infoPessoais:
            document.getElementById('infoPessoais').value.trim()
    };


    // Salva os dados
    const salvo = saveProfile(data);


    // Se ocorreu algum erro no localStorage
    if (!salvo) {
        alert('Não foi possível salvar o perfil.');
        return;
    }


    // ==============================
    // FEEDBACK NO BOTÃO
    // ==============================

    const btn = document.getElementById('btnSaveProfile');

    if (btn) {

        const label = btn.querySelector('.btn-label');

        // Desabilita temporariamente
        btn.disabled = true;

        // Adiciona classe visual
        btn.classList.add('saved');

        // Altera o texto
        if (label) {
            label.innerHTML =
                '<span class="check-icon">✓</span> Salvo com sucesso!';
        } else {
            btn.textContent = '✓ Salvo com sucesso!';
        }


        // Volta ao estado normal depois de 2,2 segundos
        setTimeout(() => {

            btn.classList.remove('saved');

            btn.disabled = false;

            if (label) {
                label.textContent = 'Salvar perfil';
            } else {
                btn.textContent = 'Salvar perfil';
            }

        }, 2200);
    }


    // ==============================
    // MENSAGEM DE SUCESSO
    // ==============================

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

});


// ==============================
// FINALIZAR SESSÃO
// ==============================

document.getElementById('btnEndSession').addEventListener('click', () => {

    try {
        localStorage.removeItem('generoFitZone');
        localStorage.removeItem('rememberedEmail');
    } catch (e) {
        console.warn(
            'Não foi possível limpar o localStorage:',
            e
        );
    }

    window.location.href = 'index.html';
});


// ==============================
// CARREGAR PÁGINA
// ==============================

window.addEventListener('DOMContentLoaded', () => {

    // Preenche os dados salvos
    fillForm();


    // ==============================
    // PERSONAGEM / GÊNERO
    // ==============================

    let genero = null;

    try {
        genero = localStorage.getItem('generoFitZone');
    } catch (e) {
        console.warn(
            'Não foi possível ler o gênero:',
            e
        );
    }


    const characterImg =
        document.getElementById('characterImg');


    if (characterImg) {

        const imagens = {

            masculino:
                'https://cdn-icons-png.flaticon.com/512/4140/4140048.png',

            feminino:
                'https://cdn-icons-png.flaticon.com/512/4140/4140047.png'
        };


        if (genero && imagens[genero]) {

            characterImg.src = imagens[genero];

            characterImg.style.display = 'block';

        } else {

            characterImg.style.display = 'none';
        }
    }

});
```
