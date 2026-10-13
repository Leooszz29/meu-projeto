/* =========================================
   FITZONE - BIBLIOTECA DE EXERCICIOS
========================================= */

document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       VERIFICAR SESSAO
    ========================================= */

    let sessao = null;

    try {
        const dadosSessao =
            localStorage.getItem('fitzoneSessao');

        sessao = dadosSessao
            ? JSON.parse(dadosSessao)
            : null;

    } catch (error) {
        console.warn(
            'Erro ao carregar sessão:',
            error
        );
    }

    if (
        !sessao ||
        sessao.autenticado !== true ||
        typeof sessao.email !== 'string' ||
        !sessao.email.trim()
    ) {
        window.location.replace('login.html');
        return;
    }

    /* =========================================
       TEMA POR GENERO
    ========================================= */

    const email = sessao.email.trim().toLowerCase();

    const genero = localStorage.getItem(
        `generoFitZone:${email}`
    );

    document.body.classList.remove(
        'theme-masculino',
        'theme-feminino'
    );

    if (genero === 'masculino') {
        document.body.classList.add(
            'theme-masculino'
        );
    } else if (genero === 'feminino') {
        document.body.classList.add(
            'theme-feminino'
        );
    }

    /* =========================================
       ENCERRAR SESSAO
    ========================================= */

    const btnEndSession =
        document.getElementById('btnEndSession');

    if (btnEndSession) {
        btnEndSession.addEventListener(
            'click',
            () => {
                localStorage.removeItem(
                    'fitzoneSessao'
                );

                window.location.href =
                    'login.html';
            }
        );
    }

});
