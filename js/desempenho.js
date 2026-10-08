// ========================================
// DESEMPENHO — CONTROLE DE SESSÃO
// ========================================

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
