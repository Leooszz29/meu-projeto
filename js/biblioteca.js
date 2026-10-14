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
       CATALOGO DE EXERCICIOS
    ========================================= */

    const exercicios = [
        {
            id: 'supino-reto',
            nome: 'Supino reto',
            grupo: 'Peito',
            musculos: 'Peitoral, tríceps e ombros',
            instrucao: 'Deitado no banco, empurre a barra para cima e retorne de forma controlada.'
        },
        {
            id: 'crucifixo',
            nome: 'Crucifixo com halteres',
            grupo: 'Peito',
            musculos: 'Peitoral',
            instrucao: 'Deitado no banco, abra os braços com cotovelos levemente flexionados e retorne.'
        },
        {
            id: 'puxada-frontal',
            nome: 'Puxada frontal',
            grupo: 'Costas',
            musculos: 'Dorsais e bíceps',
            instrucao: 'Puxe a barra em direção à parte superior do peito, mantendo o tronco estável.'
        },
        {
            id: 'remada-baixa',
            nome: 'Remada baixa',
            grupo: 'Costas',
            musculos: 'Dorsais e bíceps',
            instrucao: 'Puxe o pegador em direção ao abdômen, aproximando as escápulas.'
        },
        {
            id: 'agachamento-livre',
            nome: 'Agachamento livre',
            grupo: 'Pernas',
            musculos: 'Quadríceps e glúteos',
            instrucao: 'Flexione quadril e joelhos de forma controlada e retorne à posição inicial.'
        },
        {
            id: 'leg-press',
            nome: 'Leg press',
            grupo: 'Pernas',
            musculos: 'Quadríceps e glúteos',
            instrucao: 'Empurre a plataforma de forma controlada, sem travar os joelhos.'
        },
        {
            id: 'rosca-direta',
            nome: 'Rosca direta',
            grupo: 'Braços',
            musculos: 'Bíceps',
            instrucao: 'Flexione os cotovelos para elevar a barra e retorne lentamente.'
        },
        {
            id: 'triceps-polia',
            nome: 'Tríceps na polia',
            grupo: 'Braços',
            musculos: 'Tríceps',
            instrucao: 'Estenda os cotovelos mantendo os braços próximos ao tronco.'
        },
        {
            id: 'desenvolvimento',
            nome: 'Desenvolvimento com halteres',
            grupo: 'Ombros',
            musculos: 'Deltoides e tríceps',
            instrucao: 'Empurre os halteres acima da cabeça e retorne de forma controlada.'
        },
        {
            id: 'elevacao-lateral',
            nome: 'Elevação lateral',
            grupo: 'Ombros',
            musculos: 'Deltoides',
            instrucao: 'Eleve os braços lateralmente até aproximadamente a altura dos ombros.'
        },
        {
            id: 'prancha',
            nome: 'Prancha abdominal',
            grupo: 'Abdômen',
            musculos: 'Abdômen e estabilizadores do tronco',
            instrucao: 'Mantenha o corpo alinhado, com o abdômen contraído e sem prender a respiração.'
        },
        {
            id: 'abdominal-crunch',
            nome: 'Abdominal crunch',
            grupo: 'Abdômen',
            musculos: 'Reto abdominal',
            instrucao: 'Eleve suavemente a parte superior do tronco, sem puxar o pescoço.'
        }
    ];

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
