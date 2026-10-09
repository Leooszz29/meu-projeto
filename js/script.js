
const stations = document.querySelectorAll('.station');

window.addEventListener('pageshow', () => {
    stations.forEach((station) => {
        station.classList.remove('selected');
    });
});

stations.forEach((station) => {
    station.addEventListener('click', () => {
        stations.forEach((item) => {
            item.classList.remove('selected');
        });

        station.classList.add('selected');
    });
});

function escolherGenero(genero) {
    const generosPermitidos = ['masculino', 'feminino'];

    if (!generosPermitidos.includes(genero)) {
        console.error('Gênero selecionado inválido.');
        return;
    }

    try {
        localStorage.setItem('generoFitZone', genero);

        window.location.href = 'login.html';

    } catch (erro) {
        console.error(
            'Erro ao salvar o gênero selecionado:',
            erro
        );

        alert(
            'Não foi possível salvar sua seleção. ' +
            'Verifique as configurações do navegador e tente novamente.'
        );
    }
}
