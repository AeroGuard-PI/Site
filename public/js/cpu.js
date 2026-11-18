(() => {
  "use strict";

  const empresaId = sessionStorage.EMPRESA_ID;
  const select = document.querySelector("#machine-select");
  const feedback = document.querySelector("#feedback");
  const history = document.querySelector("#alert-history");
  const showMoreAlerts = document.querySelector("#show-more-alerts");
  let chart;
  let periodo = "6h";
  let mostrarTodasOcorrencias = false;

  const formatarData = valor => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor));
  const formatarDataExata = valor => new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(valor));
  const formatarLabelEixo = valor => periodo === "7d"
    ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(valor))
    : new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(valor));
  const formatarNumero = valor => Number(valor).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
  const percentual = valor => `${formatarNumero(valor)} %`;
  const media = itens => itens.length ? itens.reduce((soma, item) => soma + Number(item.valor), 0) / itens.length : null;
  const p95 = itens => {
    if (!itens.length) return null;
    const valores = itens.map(item => Number(item.valor)).sort((a, b) => a - b);
    return valores[Math.ceil(valores.length * .95) - 1];
  };

  function preencherMaquinas(maquinas) {
    const selecionada = select.value;
    select.replaceChildren();
    maquinas.forEach(maquina => select.add(new Option(maquina.hostname, maquina.id)));
    select.value = maquinas.some(maquina => String(maquina.id) === selecionada) ? selecionada : (maquinas[0] ? String(maquinas[0].id) : "");
    document.querySelector("[data-machine-title]").textContent = select.value ? select.selectedOptions[0].textContent : "Nenhum servidor disponível";
  }

  function limitesPorNivel(limites) {
    const alerta = limites.find(item => String(item.nivel_alerta).toUpperCase().includes("ALERTA"));
    const critico = limites.find(item => String(item.nivel_alerta).toUpperCase().includes("CR"));
    return { alerta: alerta && Number(alerta.limite), critico: critico && Number(critico.limite) };
  }

  function preencherKpis(serie) {
    const atual = serie.at(-1);
    const pico = serie.length ? serie.reduce((maior, item) => Number(item.valor) > Number(maior.valor) ? item : maior) : null;
    const valores = { current: atual && Number(atual.valor), average: media(serie), peak: pico && Number(pico.valor), p95: p95(serie) };
    Object.entries(valores).forEach(([nome, valor]) => {
      document.querySelector(`[data-kpi="${nome}"]`).textContent = valor == null ? "—" : percentual(valor);
    });
    document.querySelector('[data-kpi-info="current"]').textContent = atual ? `${atual.hostname} · ${formatarData(atual.data_hora)}` : "Sem dados";
    document.querySelector('[data-kpi-info="average"]').textContent = serie.length ? `${serie.length} captura${serie.length === 1 ? "" : "s"} no período` : "Sem dados";
    document.querySelector('[data-kpi-info="peak"]').textContent = pico ? formatarData(pico.data_hora) : "Sem dados";
    document.querySelector('[data-kpi-info="p95"]').textContent = serie.length ? "95% das amostras ficam neste valor ou abaixo" : "Sem dados";
    return { atual, media: valores.average, pico, p95: valores.p95 };
  }

  function renderizarGrafico(serie, limites) {
    if (chart) chart.destroy();
    if (!serie.length) { document.querySelector("#chart-meta").textContent = "Sem dados"; return; }
    const dadosLimite = (valor, rotulo, cor) => valor == null ? null : ({ label: rotulo, data: serie.map(() => valor), borderColor: cor, borderDash: [6, 5], borderWidth: 1.5, pointRadius: 0, tension: 0 });
    const datasets = [{ label: "Utilização da CPU", data: serie.map(item => Number(item.valor)), borderColor: "#00aeef", backgroundColor: "rgba(0,174,239,.16)", fill: true, tension: .2, borderWidth: 2, pointRadius: 0 }];
    const referencias = [dadosLimite(limites.alerta, "Limite de atenção", "#f2b84b"), dadosLimite(limites.critico, "Limite crítico", "#bc0707")].filter(Boolean);
    chart = new Chart(document.querySelector("#cpu-chart"), {
      type: "line", data: { labels: serie.map(item => formatarLabelEixo(item.data_hora)), datasets: datasets.concat(referencias) },
      options: { responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false }, plugins: { legend: { display: false }, tooltip: { callbacks: { title: contextos => formatarDataExata(serie[contextos[0].dataIndex].data_hora), label: contexto => `${contexto.dataset.label}: ${percentual(contexto.parsed.y)}` } } }, scales: { x: { grid: { display: false }, ticks: { color: "rgba(184,194,204,.65)", autoSkip: true, autoSkipPadding: 12, includeBounds: true, maxTicksLimit: 7, maxRotation: 0 } }, y: { min: 0, suggestedMax: 100, grid: { color: "rgba(184,194,204,.07)" }, ticks: { color: "rgba(184,194,204,.65)", callback: valor => `${valor} %` } } } }
    });
    document.querySelector("#chart-meta").textContent = `${serie.length} amostras · ${serie[0].unidade}`;
  }

  function intervaloTipico(serie) {
    const intervalos = serie.slice(1).map((item, indice) => new Date(item.data_hora) - new Date(serie[indice].data_hora)).filter(valor => valor > 0).sort((a, b) => a - b);
    return intervalos.length ? intervalos[Math.floor(intervalos.length / 2)] : null;
  }

  function calcularSobrecarga(serie, limite) {
    if (limite == null || !serie.length) return { episodios: 0, duracao: null, lacunas: false };
    const intervalo = intervaloTipico(serie);
    const maximoSeguro = intervalo && intervalo * 1.5;
    let episodios = 0, duracao = 0, anteriorEmAlerta = false, lacunas = false;
    serie.forEach((item, indice) => {
      const emAlerta = Number(item.valor) >= limite;
      const anterior = serie[indice - 1];
      const diferenca = anterior ? new Date(item.data_hora) - new Date(anterior.data_hora) : null;
      const continuo = emAlerta && anteriorEmAlerta && diferenca != null && maximoSeguro != null && diferenca <= maximoSeguro;
      if (emAlerta && !continuo) episodios += 1;
      if (continuo) duracao += diferenca;
      if (emAlerta && anteriorEmAlerta && (maximoSeguro == null || diferenca > maximoSeguro)) lacunas = true;
      anteriorEmAlerta = emAlerta;
    });
    return { episodios, duracao: intervalo == null ? null : duracao, lacunas };
  }

  function formatarDuracao(ms) {
    if (ms == null) return "Indisponível";
    const minutos = Math.round(ms / 60000);
    if (minutos < 60) return `${minutos} min`;
    return `${Math.floor(minutos / 60)}h ${minutos % 60}min`;
  }

  function renderizarSobrecarga(serie, limites, alertas) {
    const resultado = calcularSobrecarga(serie, limites.alerta);
    const criticos = alertas.filter(alerta => String(alerta.nivel_alerta).toUpperCase().includes("CR")).length;
    document.querySelector("#overload-duration").textContent = formatarDuracao(resultado.duracao);
    document.querySelector("#overload-episodes").textContent = resultado.episodios;
    document.querySelector("#critical-occurrences").textContent = criticos;
    document.querySelector("#overload-note").textContent = resultado.duracao == null
      ? "São necessárias ao menos duas capturas para estimar duração."
      : resultado.lacunas ? "A duração soma apenas intervalos consecutivos; lacunas entre capturas não são consideradas." : "Estimativa baseada em intervalos consecutivos entre capturas.";
    return resultado;
  }

  function renderizarInsights(serie, serieAnterior, limites, sobrecarga) {
    const atual = media(serie), anterior = media(serieAnterior);
    const itens = [];
    if (atual == null) itens.push("Não há capturas de CPU suficientes no período selecionado.");
    else {
      if (anterior != null) {
        const variacao = atual - anterior;
        if (Math.abs(variacao) < 2) itens.push("A utilização média permaneceu estável em comparação ao período anterior.");
        else itens.push(`A utilização média ${variacao > 0 ? "aumentou" : "reduziu"} ${formatarNumero(Math.abs(variacao))} p.p. em comparação ao período anterior.`);
      } else itens.push("Não há dados do período anterior para comparação.");
      if (sobrecarga.episodios > 1) itens.push("Foram identificados episódios recorrentes de sobrecarga.");
      if (limites.critico != null && serie.some(item => Number(item.valor) >= limites.critico)) itens.push("A utilização permaneceu acima do limite crítico em determinados períodos.");
      if (!sobrecarga.episodios && (limites.alerta == null || atual < limites.alerta)) itens.push("O comportamento da CPU permanece estável no intervalo analisado.");
    }
    const lista = document.querySelector("#insights");
    lista.replaceChildren();
    itens.forEach(texto => { const item = document.createElement("li"); item.className = "alert"; item.innerHTML = '<span class="alert__icon alert__icon--info" aria-hidden="true">i</span><div class="alert__text"></div>'; item.querySelector(".alert__text").textContent = texto; lista.append(item); });
  }

  function renderizarHistorico(alertas) {
    history.replaceChildren();
    const exibidos = mostrarTodasOcorrencias ? alertas : alertas.slice(0, 5);
    document.querySelector("#alert-count").textContent = `${exibidos.length} de ${alertas.length} ocorrência${alertas.length === 1 ? "" : "s"}`;
    showMoreAlerts.hidden = alertas.length <= 5;
    if (!showMoreAlerts.hidden) showMoreAlerts.textContent = mostrarTodasOcorrencias ? "Ver menos" : "Ver mais";
    if (!alertas.length) { history.innerHTML = '<tr><td colspan="4">Nenhuma ocorrência registrada no período.</td></tr>'; return; }
    exibidos.forEach(alerta => {
      const linha = document.createElement("tr");
      const critico = String(alerta.nivel_alerta).toUpperCase().includes("CR");
      linha.innerHTML = `<td></td><td></td><td><span class="cpu-level ${critico ? "cpu-level--critical" : "cpu-level--warning"}"></span></td><td></td>`;
      const celulas = linha.querySelectorAll("td");
      celulas[0].textContent = formatarData(alerta.data_hora);
      celulas[1].textContent = alerta.hostname;
      celulas[2].firstElementChild.textContent = alerta.nivel_alerta;
      celulas[3].textContent = percentual(alerta.valor);
      history.append(linha);
    });
  }

  async function carregar() {
    if (!empresaId) { feedback.textContent = "Faça login para consultar a análise de CPU."; return; }
    feedback.textContent = "Carregando dados...";
    try {
      const parametros = new URLSearchParams({ periodo });
      if (select.value) parametros.set("maquinaId", select.value);
      const resposta = await fetch(`/monitoramento/cpu/${encodeURIComponent(empresaId)}?${parametros}`);
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar a análise.");
      const maquinaAntesDaResposta = select.value;
      preencherMaquinas(dados.maquinas);
      if (!maquinaAntesDaResposta && select.value) { carregar(); return; }
      const limites = limitesPorNivel(dados.limites);
      preencherKpis(dados.serie);
      renderizarGrafico(dados.serie, limites);
      const sobrecarga = renderizarSobrecarga(dados.serie, limites, dados.alertas);
      renderizarInsights(dados.serie, dados.serieAnterior, limites, sobrecarga);
      renderizarHistorico(dados.alertas);
      feedback.textContent = dados.serie.length ? "Dados reais atualizados conforme os filtros." : "Não há capturas de CPU para os filtros selecionados.";
    } catch (erro) {
      feedback.textContent = erro.message;
      history.innerHTML = `<tr><td colspan="4">${erro.message}</td></tr>`;
    }
  }

  document.querySelectorAll("[data-user-name]").forEach(elemento => elemento.textContent = sessionStorage.NOME_USUARIO || "Usuário");
  select.addEventListener("change", () => {
    mostrarTodasOcorrencias = false;
    carregar();
  });
  document.querySelectorAll("[data-period]").forEach(botao => botao.addEventListener("click", () => {
    periodo = botao.dataset.period;
    mostrarTodasOcorrencias = false;
    document.querySelectorAll("[data-period]").forEach(item => { const ativo = item === botao; item.classList.toggle("is-active", ativo); item.setAttribute("aria-pressed", String(ativo)); });
    carregar();
  }));
  showMoreAlerts.addEventListener("click", () => {
    mostrarTodasOcorrencias = !mostrarTodasOcorrencias;
    carregar();
  });
  carregar();
})();
