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

// ========================================
// CHAVE DO HISTÓRICO POR USUÁRIO
// ========================================

function obterChaveHistoricoDesempenho() {
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
            return null;
        }

        return `historicoTreinos:${sessao.email.toLowerCase()}`;

    } catch (error) {
        console.warn(
            'Não foi possível identificar o histórico:',
            error
        );

        return null;
    }
}

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
