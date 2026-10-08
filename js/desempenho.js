// ========================================
// DESEMPENHO — CONTROLE DE SESSÃO
// ========================================

// ========================================
// VERIFICAR SESSÃO ATIVA
// ========================================

function verificarSessaoDesempenho() {
    try {
        const sessaoJSON =
            localStorage.getItem('fitzoneSessao');

        const sessao =
            sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

        if (
            !sessao ||
            typeof sessao.email !== 'string' ||
            !sessao.email.trim()
        ) {
            window.location.replace('login.html');
        }
    } catch (error) {
        console.warn(
            'Não foi possível verificar a sessão:',
            error
        );

        window.location.replace('login.html');
    }
}

verificarSessaoDesempenho();

const btnEndSession =
    document.getElementById('btnEndSession');

if (btnEndSession) {
    btnEndSession.addEventListener(
        'click',
        () => {
            try {
                localStorage.removeItem('fitzoneSessao');
            } catch (error) {
                console.warn(
                    'Não foi possível encerrar a sessão:',
                    error
                );
            }

            window.location.href = 'login.html';
        }
    );
}
