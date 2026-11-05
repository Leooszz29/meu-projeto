
/* =========================================
   FITZONE - REDEFINIR SENHA SUPABASE
========================================= */

const formularioRedefinicao =
    document.getElementById('formRedefinirSenha');

const novaSenhaSupabase =
    document.getElementById('novaSenhaSupabase');

const confirmarSenhaSupabase =
    document.getElementById('confirmarSenhaSupabase');

const botaoRedefinir =
    document.getElementById('btnRedefinirSenha');

const mensagemRedefinicao =
    document.getElementById('mensagemRedefinicao');

let recuperacaoAutorizada = false;
let linkRecuperacaoValidado = false;

const parametrosLink = new URLSearchParams(
    window.location.hash.substring(1)
);

const erroLink =
    parametrosLink.get('error_description') ||
    new URLSearchParams(window.location.search)
        .get('error_description');

const clienteRedefinicao =
    inicializarSupabaseFitZone();

if (!clienteRedefinicao) {
    mensagemRedefinicao.textContent =
        'Não foi possível conectar ao Supabase. ' +
        'Atualize a página com internet.';

} else if (erroLink) {
    mensagemRedefinicao.textContent =
        'O link de recuperação é inválido ou expirou. ' +
        'Solicite um novo link no login.';

} else {
    clienteRedefinicao.auth.onAuthStateChange(
        (evento) => {
            if (evento === 'PASSWORD_RECOVERY') {
                recuperacaoAutorizada = true;
                linkRecuperacaoValidado = true;

                formularioRedefinicao.hidden = false;

                mensagemRedefinicao.textContent =
                    'Link confirmado. Defina sua nova senha.';
            }
        }
    );

    setTimeout(() => {
        if (!linkRecuperacaoValidado) {
            mensagemRedefinicao.textContent =
                'Não foi possível validar o link de recuperação. ' +
                'Solicite um novo link no login.';
        }
    }, 8000);
}

formularioRedefinicao.addEventListener(
    'submit',
    async (evento) => {
        evento.preventDefault();

        if (!recuperacaoAutorizada || !clienteRedefinicao) {
            mensagemRedefinicao.textContent =
                'Link de recuperação não autorizado.';
            return;
        }

        const senha = novaSenhaSupabase.value;
        const confirmacao = confirmarSenhaSupabase.value;

        if (
            senha.length < 8 ||
            !/[A-Za-z]/.test(senha) ||
            !/[0-9]/.test(senha)
        ) {
            mensagemRedefinicao.textContent =
                'A senha deve ter no mínimo 8 caracteres, ' +
                'incluindo letras e números.';
            return;
        }

        if (senha !== confirmacao) {
            mensagemRedefinicao.textContent =
                'As senhas não coincidem.';
            return;
        }

        botaoRedefinir.disabled = true;
        mensagemRedefinicao.textContent =
            'Salvando sua nova senha...';

        try {
            const { data, error: erroUsuario } =
                await clienteRedefinicao.auth.getUser();

            if (erroUsuario || !data?.user) {
                throw new Error(
                    'Sessão de recuperação inválida ou expirada.'
                );
            }

            const { error } =
                await clienteRedefinicao.auth.updateUser({
                    password: senha
                });

            if (error) {
                throw error;
            }

            recuperacaoAutorizada = false;
            formularioRedefinicao.hidden = true;

            novaSenhaSupabase.value = '';
            confirmarSenhaSupabase.value = '';

            mensagemRedefinicao.textContent =
                'Senha alterada com sucesso! ' +
                'Volte ao login para entrar com a nova senha.';

            const { error: erroSaida } =
                await clienteRedefinicao.auth.signOut({
                    scope: 'local'
                });

            if (erroSaida) {
                console.warn(
                    'Não foi possível encerrar a sessão:',
                    erroSaida
                );
            }

        } catch (erro) {
            console.error(
                'Erro ao redefinir senha Supabase:',
                erro
            );

            mensagemRedefinicao.textContent =
                'Não foi possível redefinir a senha. ' +
                'Verifique o link e tente novamente.';

        } finally {
            botaoRedefinir.disabled = false;
        }
    }
);
