/* AeroGuard — gráfico da visão geral.
   As séries abaixo são as mesmas do SVG do trecho original enviado.
   Quando a API estiver pronta, substitua os arrays pelos valores retornados pelo backend. */
(() => {
  const canvas = document.querySelector('#cpu-memory-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  const labels = Array.from({ length: 24 }, (_, index) => ({
    0: '09:00', 6: '10:30', 12: '12:00', 18: '13:30', 23: '15:00'
  }[index] || ''));

  const series = {
    cpu: [34, 38, 36, 41, 45, 43, 40, 44, 48, 46, 42, 39, 43, 47, 52, 49, 45, 42, 44, 41, 43, 46, 44, 42],
    memory: [58, 59, 61, 60, 62, 63, 62, 64, 65, 64, 66, 65, 66, 67, 69, 68, 67, 68, 69, 70, 68, 67, 68, 68]
  };

  const chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'CPU', data: series.cpu, borderColor: '#00AEEF', backgroundColor: 'rgba(0,174,239,.16)', fill: true, tension: .2, borderWidth: 2, pointRadius: 0, pointHoverRadius: 3 },
        { label: 'Memória', data: series.memory, borderColor: '#5B8DEF', backgroundColor: 'transparent', fill: false, tension: .2, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 3 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y}%` } }
      },
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: 'rgba(184,194,204,.65)', maxTicksLimit: 5, maxRotation: 0, font: { family: 'Kanit', size: 10 }, callback: (_value, index) => labels[index] || '' } },
        y: { min: 0, max: 100, ticks: { stepSize: 50, color: 'rgba(184,194,204,.65)', font: { family: 'Kanit', size: 10 } }, grid: { color: 'rgba(184,194,204,.07)' }, border: { display: false } }
      }
    }
  });

  const periodLabel = document.querySelector('#period-label');
  document.querySelectorAll('[data-period]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-period]').forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      if (periodLabel) periodLabel.textContent = button.dataset.period;
      /* O filtro visual fica pronto; o recorte real depende dos dados da API para cada período. */
    });
  });
})();
