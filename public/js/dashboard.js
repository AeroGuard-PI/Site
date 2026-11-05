(() => {
  "use strict";
  const empresaId = sessionStorage.EMPRESA_ID;
  const select = document.querySelector("#machine-select");
  const feedback = document.querySelector("[data-chart-feedback]");
  let chart;
  let periodo = "6h";

  const formatarData = data => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data));
  const formatarValor = metrica => metrica ? `${Number(metrica.valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} ${metrica.unidade}` : "—";

  function renderizarKpi(metricas, nome) {
    const metrica = metricas.find(item => item.nome === nome);
    document.querySelector(`[data-kpi="${nome}"]`).textContent = formatarValor(metrica);
    document.querySelector(`[data-kpi-info="${nome}"]`).textContent = metrica ? `${metrica.hostname} · ${formatarData(metrica.data_hora)}` : "Sem dados";
    document.querySelector(`[data-kpi-bar="${nome}"]`).style.width = `${metrica && metrica.unidade === "%" ? Math.max(0, Math.min(100, Number(metrica.valor))) : 0}%`;
  }

  function renderizarLista(seletor, itens, vazio, criarItem) {
    const lista = document.querySelector(seletor);
    lista.replaceChildren();
    if (!itens.length) { lista.textContent = vazio; lista.classList.add("text-muted"); return; }
    lista.classList.remove("text-muted");
    itens.forEach(item => lista.append(criarItem(item)));
  }

  function renderizarServidores(maquinas, disponibilidade) {
    document.querySelector("[data-machine-count]").textContent = `${maquinas.length} nó${maquinas.length === 1 ? "" : "s"}`;
    renderizarLista(".servers", maquinas, "Nenhuma máquina cadastrada.", maquina => {
      const estado = disponibilidade.find(item => Number(item.id) === Number(maquina.id));
      const item = document.createElement("li");
      item.innerHTML = `<span class="dot ${estado && Number(estado.disponibilidade) ? "dot--success" : "dot--warning"}" aria-hidden="true"></span><span class="mono-xs"></span><span class="servers__role"></span>`;
      item.querySelector(".mono-xs").textContent = maquina.hostname;
      item.querySelector(".servers__role").textContent = estado ? (Number(estado.disponibilidade) ? "Disponível" : "Indisponível") : "Sem configuração";
      return item;
    });
  }

  function renderizarAlertas(alertas) {
    renderizarLista(".alerts", alertas, "Nenhum alerta registrado.", alerta => {
      const item = document.createElement("li");
      item.className = "alert";
      item.innerHTML = `<span class="alert__icon alert__icon--warning" aria-hidden="true">!</span><div class="alert__text"><p class="truncate"></p><p class="mono-xs text-muted"></p></div><time class="alert__time"></time>`;
      item.querySelector(".truncate").textContent = `${alerta.componente}: ${formatarValor(alerta)}`;
      item.querySelector(".mono-xs").textContent = alerta.hostname;
      item.querySelector("time").textContent = formatarData(alerta.data_hora);
      return item;
    });
  }

  function renderizarDisco(discos) {
    renderizarLista(".disks", discos, "Sem dados de disco.", disco => {
      const item = document.createElement("li");
      const percentual = disco.unidade === "%" ? Math.max(0, Math.min(100, Number(disco.valor))) : 0;
      item.innerHTML = `<div class="disks__row"><span></span><span class="text-muted"></span></div><div class="disks__bar"><span></span></div>`;
      item.querySelector(".disks__row span").textContent = disco.hostname;
      item.querySelector(".text-muted").textContent = formatarValor(disco);
      item.querySelector(".disks__bar span").style.width = `${percentual}%`;
      return item;
    });
  }

  function renderizarGrafico(cpu, memoria) {
    if (chart) chart.destroy();
    if (!cpu.length && !memoria.length) { feedback.textContent = "Sem capturas no período selecionado."; return; }
    const unidades = new Set([...cpu, ...memoria].map(item => item.unidade));
    if (unidades.size !== 1) { feedback.textContent = "As séries possuem unidades distintas e não podem ser comparadas no mesmo gráfico."; return; }
    const unidade = [...unidades][0];
    const pontos = [...new Set([...cpu, ...memoria].map(item => item.data_hora))].sort();
    const valores = serie => pontos.map(ponto => { const item = serie.find(valor => valor.data_hora === ponto); return item ? Number(item.valor) : null; });
    chart = new Chart(document.querySelector("#cpu-memory-chart"), {
      type: "line",
      data: { labels: pontos.map(formatarData), datasets: [
        { label: "CPU", data: valores(cpu), borderColor: "#00AEEF", backgroundColor: "rgba(0,174,239,.16)", fill: true, tension: .2, borderWidth: 2, pointRadius: 0 },
        { label: "Memória", data: valores(memoria), borderColor: "#5B8DEF", fill: false, tension: .2, borderWidth: 1.5, pointRadius: 0 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.parsed.y} ${unidade}` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", maxTicksLimit: 5 } }, y: { grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: value => `${value} ${unidade}` } } } }
    });
    feedback.textContent = `Dados reais · unidade: ${unidade}`;
  }

  function preencherMaquinas(maquinas) {
    const selecionado = select.value;
    select.replaceChildren(new Option("Todas as máquinas", ""));
    maquinas.forEach(maquina => select.add(new Option(maquina.hostname, maquina.id)));
    select.value = maquinas.some(maquina => String(maquina.id) === selecionado) ? selecionado : "";
  }

  async function carregar() {
    if (!empresaId) { feedback.textContent = "Faça login para consultar o monitoramento."; return; }
    feedback.textContent = "Carregando dados...";
    try {
      const parametros = new URLSearchParams({ periodo });
      if (select.value) parametros.set("maquinaId", select.value);
      const resposta = await fetch(`/monitoramento/dashboard/${encodeURIComponent(empresaId)}?${parametros}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar os dados.");
      preencherMaquinas(dados.maquinas);
      document.querySelector("[data-machine-title]").textContent = select.value ? select.selectedOptions[0].textContent : "Todas as máquinas";
      ["CPU", "Memória", "Disco", "Rede"].forEach(nome => renderizarKpi(dados.metricas, nome));
      renderizarServidores(dados.maquinas, dados.disponibilidade);
      renderizarAlertas(dados.alertas);
      renderizarDisco(dados.disco);
      renderizarGrafico(dados.cpu, dados.memoria);
    } catch (erro) { feedback.textContent = erro.message; }
  }

  document.querySelectorAll("[data-user-name]").forEach(elemento => elemento.textContent = sessionStorage.NOME_USUARIO || "Usuário");
  select.addEventListener("change", carregar);
  document.querySelectorAll("[data-period]").forEach(botao => botao.addEventListener("click", () => {
    periodo = botao.dataset.period;
    document.querySelectorAll("[data-period]").forEach(item => { const ativo = item === botao; item.classList.toggle("is-active", ativo); item.setAttribute("aria-pressed", String(ativo)); });
    carregar();
  }));
  carregar();
})();
