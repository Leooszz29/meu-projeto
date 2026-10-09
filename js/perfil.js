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

// ========================================
// FOTO PERSONALIZADA DO PERFIL
// ========================================

function initializeProfilePhoto() {
    const botao = document.getElementById('editProfilePhoto');
    const campo = document.getElementById('profilePhotoInput');
    const imagem = document.getElementById('characterImg');
    const menu = document.getElementById('profilePhotoMenu');
    const alterarFoto = document.getElementById('changeProfilePhoto');
    const removerFoto = document.getElementById('removeProfilePhoto');

    const sessao = carregarSessao();

    if (!botao || !campo || !imagem || !sessao?.email) {
        return;
    }

    const chaveFoto =
        `fotoPerfilFitZone:${sessao.email.toLowerCase()}`;

    // Recuperar foto salva
    try {
        const fotoSalva = localStorage.getItem(chaveFoto);

        if (fotoSalva) {
            imagem.src = fotoSalva;
            imagem.style.display = 'block';
            imagem.style.objectFit = 'cover';
            imagem.style.borderRadius = '50%';
        }
    } catch (erro) {
        console.warn('Erro ao carregar foto:', erro);
    }

    // Abrir e fechar o menu de edição
    botao.addEventListener('click', () => {
        if (!menu) return;

        menu.hidden = !menu.hidden;
    });

    // Escolher uma nova foto
    alterarFoto?.addEventListener('click', () => {
        menu.hidden = true;
        campo.click();
    });

    // Remover foto personalizada e restaurar personagem
    removerFoto?.addEventListener('click', () => {
        const fotoSalva = localStorage.getItem(chaveFoto);

        if (!fotoSalva) {
            menu.hidden = true;
            return;
        }

        const confirmar = confirm(
            'Deseja remover sua foto e restaurar o personagem padrão?'
        );

        if (!confirmar) {
            return;
        }

        try {
            localStorage.removeItem(chaveFoto);

            imagem.style.objectFit = 'contain';
            imagem.style.borderRadius = '0';

            loadCharacter();

            menu.hidden = true;
            campo.value = '';

        } catch (erro) {
            console.error('Erro ao remover foto:', erro);
            alert('Não foi possível remover a foto.');
        }
    });

    // Fechar o menu ao clicar fora
    document.addEventListener('click', (evento) => {
        if (
            menu &&
            !menu.contains(evento.target) &&
            !botao.contains(evento.target)
        ) {
            menu.hidden = true;
        }
    });

    // Selecionar e salvar foto
    campo.addEventListener('change', () => {
        const arquivo = campo.files?.[0];

        if (!arquivo) return;

        const tiposPermitidos = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!tiposPermitidos.includes(arquivo.type)) {
            alert('Selecione uma imagem JPG, PNG ou WebP.');
            campo.value = '';
            return;
        }

        if (arquivo.size > 5 * 1024 * 1024) {
            alert('A imagem deve ter no máximo 5 MB.');
            campo.value = '';
            return;
        }

        const leitor = new FileReader();

        leitor.onload = () => {
            const fotoOriginal = new Image();

            fotoOriginal.onload = () => {
                const canvas = document.createElement('canvas');
                const tamanho = 300;

                canvas.width = tamanho;
                canvas.height = tamanho;

                const contexto = canvas.getContext('2d');

                if (!contexto) {
                    alert('Não foi possível processar a imagem.');
                    return;
                }

                const lado = Math.min(
                    fotoOriginal.width,
                    fotoOriginal.height
                );

                const origemX = (fotoOriginal.width - lado) / 2;
                const origemY = (fotoOriginal.height - lado) / 2;

                contexto.drawImage(
                    fotoOriginal,
                    origemX,
                    origemY,
                    lado,
                    lado,
                    0,
                    0,
                    tamanho,
                    tamanho
                );

                const fotoOtimizada =
                    canvas.toDataURL('image/jpeg', 0.8);

                try {
                    localStorage.setItem(
                        chaveFoto,
                        fotoOtimizada
                    );

                    imagem.src = fotoOtimizada;
                    imagem.style.display = 'block';
                    imagem.style.objectFit = 'cover';
                    imagem.style.borderRadius = '50%';

                } catch (erro) {
                    console.error('Erro ao salvar foto:', erro);
                    alert(
                        'Não foi possível salvar a foto. Verifique o espaço disponível no navegador.'
                    );
                }
            };

            fotoOriginal.onerror = () => {
                alert('Não foi possível abrir a imagem selecionada.');
            };

            fotoOriginal.src = leitor.result;
        };

        leitor.onerror = () => {
            alert('Erro ao ler a imagem.');
        };

        leitor.readAsDataURL(arquivo);
        campo.value = '';
    });
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
    initializeProfilePhoto();
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
