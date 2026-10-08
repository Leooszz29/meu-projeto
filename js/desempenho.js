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

// ========================================
// CARREGAR RESUMO DO DESEMPENHO
// ========================================

function carregarResumoDesempenho() {
    const totalElement = document.getElementById('totalWorkouts');
    const monthElement = document.getElementById('currentMonthWorkouts');
    const lastElement = document.getElementById('lastWorkout');
    const lastNameElement = document.getElementById('lastWorkoutName');

    if (!totalElement || !monthElement || !lastElement || !lastNameElement) {
        return;
    }

    const chave = obterChaveHistoricoDesempenho();

    if (!chave) {
        return;
    }

    let historico = [];

    try {
        const dados = JSON.parse(localStorage.getItem(chave));
        historico = Array.isArray(dados) ? dados : [];
    } catch (error) {
        console.warn('Não foi possível carregar o histórico:', error);
    }

    const treinosValidos = historico.filter((treino) => {
        return treino &&
            treino.data &&
            !Number.isNaN(new Date(treino.data).getTime());
    });

    totalElement.textContent = treinosValidos.length;

    const agora = new Date();

    const treinosMes = treinosValidos.filter((treino) => {
        const data = new Date(treino.data);

        return data.getMonth() === agora.getMonth() &&
            data.getFullYear() === agora.getFullYear();
    });

    monthElement.textContent = treinosMes.length;

    if (treinosValidos.length > 0) {
        const ultimoTreino = [...treinosValidos].sort(
            (a, b) => new Date(b.data) - new Date(a.data)
        )[0];

        const data = new Date(ultimoTreino.data);

        lastElement.textContent = data.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });

        lastNameElement.textContent = ultimoTreino.nome || 'Treino';
    } else {
        lastElement.textContent = '—';
        lastNameElement.textContent = '—';
    }
}

carregarResumoDesempenho();

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
