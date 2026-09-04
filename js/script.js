const stations = document.querySelectorAll('.station');

stations.forEach(st => {
  st.addEventListener('click', () => {
    stations.forEach(s => s.classList.remove('selected'));
    st.classList.add('selected');
  });
});

function escolherGenero(genero) {
  localStorage.setItem('generoFitZone', genero);
  window.location.href = 'login.html';
}
