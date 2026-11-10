(() => {
  const biblioteca = document.querySelector(".icon-library");
  if (biblioteca) biblioteca.innerHTML = `
    <symbol id="i-layout-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></symbol>
    <symbol id="i-server" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01M11 6.5h6M11 17.5h6"/></symbol>
    `;
  const empresaId = sessionStorage.EMPRESA_ID;
  const feedback = document.querySelector("#feedback");
  const nomeUsuario = document.querySelector(".sidebar-user__name");
  if (nomeUsuario) nomeUsuario.textContent = sessionStorage.NOME_USUARIO || "Usuário";
  const data = valor => new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(new Date(valor));
  function grafico(id, serie, nome) {
    const unidades = new Set(serie.map(item => item.unidade));
    if (!serie.length || unidades.size !== 1) return unidades.size <= 1;
    new Chart(document.querySelector(id), { type:"line", data:{ labels:serie.map(item => data(item.data_hora)), datasets:[{ label:nome, data:serie.map(item => item.valor), borderColor:"#00AEEF", tension:.2 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{ticks:{callback:valor => `${valor} ${[...unidades][0]}`}}} } });
    return true;
  }
  async function carregar() {
    if (!empresaId) { feedback.textContent = "Faça login para consultar o histórico."; return; }
    try {
      const resposta = await fetch(`/monitoramento/visao-geral/${empresaId}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw Error(dados.mensagem);
      const area = document.querySelector("#maximos");
      area.replaceChildren();
      ["CPU", "Memória", "Disco", "Rede"].forEach(nome => {
        const item = dados.maximos.find(maximo => maximo.nome === nome);
        const card = document.createElement("div"); card.className = "kpi";
        card.innerHTML = '<dt class="kpi__label"></dt><dd class="kpi__value"></dd><dd class="kpi__delta"></dd>';
        card.querySelector("dt").textContent = nome;
        card.querySelector(".kpi__value").textContent = item ? `${item.valor} ${item.unidade}` : "—";
        card.querySelector(".kpi__delta").textContent = item ? `${item.hostname} · ${data(item.data_hora)}` : "Sem dados";
        area.append(card);
      });
      const ok = [grafico("#chart-cpu", dados.cpu, "CPU"), grafico("#chart-memoria", dados.memoria, "Memória"), grafico("#chart-disco", dados.disco, "Disco")];
      feedback.textContent = ok.every(Boolean) ? "Máximos separados por componente e unidade." : "Há unidades diferentes na mesma série; o gráfico correspondente não foi comparado.";
    } catch (erro) { feedback.textContent = erro.message; }
  }
  carregar();
})();
