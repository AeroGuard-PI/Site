(function (root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  if (root) root.CpuAnalysis = api;
})(typeof window === "undefined" ? globalThis : window, function () {
  const PADRAO = { frequenciaEsperadaMs: 5000, toleranciaLacuna: 1.5, coberturaMinima: .8, janelaSustentadaMs: 300000 };
  const timestamp = item => new Date(item.data_hora).getTime();
  const numero = item => Number(item.valor);
  const median = values => { const ordered = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b); if (!ordered.length) return null; const middle = Math.floor(ordered.length / 2); return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2; };
  const options = value => ({ ...PADRAO, ...(value || {}) });
  const limitesValidos = limites => limites && ["alerta", "critico"].every(chave => limites[chave] !== null && limites[chave] !== undefined && limites[chave] !== "" && Number.isFinite(Number(limites[chave])) && Number(limites[chave]) >= 0 && Number(limites[chave]) <= 100) && Number(limites.alerta) < Number(limites.critico);

  function normalizar(serie = [], maquinaId) {
    const porHorario = new Map();
    serie.filter(item => { const valor = numero(item), horario = timestamp(item); return item.valor !== null && item.valor !== "" && Number.isFinite(valor) && valor >= 0 && valor <= 100 && Number.isFinite(horario) && (!maquinaId || String(item.maquina_id) === String(maquinaId)); }).sort((a, b) => timestamp(a) - timestamp(b) || Number(a.id) - Number(b.id)).forEach(item => {
      const chave = `${item.maquina_id || ""}:${timestamp(item)}`;
      if (!porHorario.has(chave) || Number(item.id) > Number(porHorario.get(chave).id)) porHorario.set(chave, item);
    });
    return [...porHorario.values()].sort((a, b) => timestamp(a) - timestamp(b));
  }

  function intervalos(serie, maquinaId, configuracao) {
    const config = options(configuracao), amostras = config.normalizada ? serie : normalizar(serie, maquinaId), limiteLacuna = config.frequenciaEsperadaMs * config.toleranciaLacuna;
    let lacunas = 0, observado = 0; const valores = [];
    for (let indice = 0; indice < amostras.length - 1; indice += 1) { const atual = amostras[indice], proxima = amostras[indice + 1], ms = timestamp(proxima) - timestamp(atual); if (ms > 0 && ms <= limiteLacuna) { valores.push({ atual, proxima, ms }); observado += ms; } else if (ms > limiteLacuna) lacunas += 1; }
    const inicio = configuracao && Number.isFinite(new Date(configuracao.inicio).getTime()) ? new Date(configuracao.inicio).getTime() : amostras.length ? timestamp(amostras[0]) : null;
    const fim = configuracao && Number.isFinite(new Date(configuracao.fim).getTime()) ? new Date(configuracao.fim).getTime() : amostras.length ? timestamp(amostras.at(-1)) : null;
    const periodo = inicio != null && fim != null && fim > inicio ? fim - inicio : 0, extensao = amostras.length > 1 ? timestamp(amostras.at(-1)) - timestamp(amostras[0]) : 0;
    return { amostras, valores, frequencia: config.frequenciaEsperadaMs, limiteLacuna, lacunas, observado, extensao, periodo, cobertura: extensao ? observado / extensao : 0, coberturaPeriodo: periodo ? Math.min(1, observado / periodo) : 0 };
  }

  function sustentada(serie, maquinaId, configuracao) {
    const config = options(configuracao), dados = intervalos(serie, maquinaId, configuracao), amostras = dados.amostras, janela = config.janelaSustentadaMs, esperado = Math.ceil(janela / config.frequenciaEsperadaMs) + 1;
    let fim = 0, melhor = null;
    for (let inicio = 0; inicio < amostras.length; inicio += 1) {
      if (fim < inicio) fim = inicio; while (fim < amostras.length && timestamp(amostras[fim]) - timestamp(amostras[inicio]) <= janela) fim += 1;
      const ultimo = fim - 1; if (ultimo <= inicio) continue;
      const extensao = timestamp(amostras[ultimo]) - timestamp(amostras[inicio]);
      if (extensao < janela - config.frequenciaEsperadaMs || ultimo - inicio + 1 < Math.ceil(esperado * config.coberturaMinima)) continue;
      let observado = 0, temLacuna = false;
      for (let indice = inicio; indice < ultimo; indice += 1) { const ms = timestamp(amostras[indice + 1]) - timestamp(amostras[indice]); if (ms > dados.limiteLacuna) { temLacuna = true; break; } observado += ms; }
      if (temLacuna || observado / janela < config.coberturaMinima) continue;
      const valor = median(amostras.slice(inicio, ultimo + 1).map(numero)); if (!melhor || valor > melhor.valor) melhor = { valor, inicio: amostras[inicio].data_hora, fim: amostras[ultimo].data_hora, quantidade: ultimo - inicio + 1, cobertura: observado / janela };
    }
    return melhor;
  }

  function episodios(serie, limites, maquinaId, configuracao) {
    const config = options(configuracao), dados = intervalos(serie, maquinaId, configuracao), { amostras } = dados, lista = []; let ativo = null, atencao = 0, criticidade = 0;
    const finalizar = () => { if (!ativo) return; ativo.duracao = ativo.duracaoAtencao + ativo.duracaoCriticidade; ativo.critica = ativo.duracaoCriticidade >= config.janelaSustentadaMs; ativo.picoCriticoIsolado = ativo.duracaoCriticidade > 0 && !ativo.critica; ativo.classificacao = ativo.critica ? "Criticidade sustentada" : ativo.duracao >= config.janelaSustentadaMs ? ativo.picoCriticoIsolado ? "Atenção sustentada com pico crítico isolado" : "Atenção sustentada" : ativo.duracaoCriticidade ? "Pico crítico isolado" : "Pico de atenção"; lista.push(ativo); ativo = null; };
    if (!limitesValidos(limites)) return { lista, atencao: null, criticidade: null, maior: null, configuracaoSuficiente: false, ...dados };
    for (let indice = 0; indice < amostras.length - 1; indice += 1) {
      const atual = amostras[indice], proxima = amostras[indice + 1], valor = numero(atual), ms = timestamp(proxima) - timestamp(atual), valido = ms > 0 && ms <= dados.limiteLacuna, acima = valor >= limites.alerta;
      if (!valido) { finalizar(); continue; }
      const proximoAcima = numero(proxima) >= limites.alerta, tolerado = !acima && ativo && proximoAcima && ms <= dados.limiteLacuna;
      if (!acima && !tolerado) { finalizar(); continue; }
      if (acima && !ativo) ativo = { inicio: atual.data_hora, fim: proxima.data_hora, pico: valor, amostras: 0, duracaoAtencao: 0, duracaoCriticidade: 0 };
      if (!ativo) continue;
      if (acima) { ativo.fim = proxima.data_hora; ativo.pico = Math.max(ativo.pico, valor); ativo.amostras += 1; if (valor >= limites.critico) { ativo.duracaoCriticidade += ms; criticidade += ms; } else { ativo.duracaoAtencao += ms; atencao += ms; } }
    }
    finalizar(); return { lista, atencao, criticidade, maior: lista.length ? Math.max(...lista.map(item => item.duracao)) : 0, configuracaoSuficiente: true, ...dados };
  }

  function distribuicao(dados, limites) {
    if (!dados.valores.length || !limitesValidos(limites)) return { ...dados, bandas: [], total: 0, configuracaoSuficiente: false };
    const finais = [...new Set([20, 40, 60, Number(limites.alerta), Number(limites.critico), 100].map(valor => Math.max(0, Math.min(100, valor))))].sort((a, b) => a - b);
    const bandas = finais.map((fim, indice) => ({ inicio: indice ? finais[indice - 1] : 0, fim, ms: 0 }));
    dados.valores.forEach(({ atual, ms }) => { const valor = numero(atual), indice = bandas.findIndex((banda, posicao) => valor < banda.fim || posicao === bandas.length - 1); bandas[indice].ms += ms; });
    return { ...dados, bandas, total: bandas.reduce((soma, banda) => soma + banda.ms, 0), configuracaoSuficiente: true };
  }

  function diagnostico(atual, anterior, episodios, configuracao) {
    const config = options(configuracao), dadosAtuais = Array.isArray(atual) ? intervalos(atual, null, configuracao) : atual, dadosAnteriores = Array.isArray(anterior) ? intervalos(anterior, null, configuracao) : anterior, amostras = dadosAtuais && dadosAtuais.amostras || [];
    if (episodios && episodios.configuracaoSuficiente === false) return { confiavel: false, eventosConfiaveis: false, configuracaoSuficiente: false, comportamento: "Configuração insuficiente", evolucao: null, diferenca: null, comparacaoConfiavel: false };
    const coberturaAtual = dadosAtuais.periodo ? dadosAtuais.coberturaPeriodo : dadosAtuais.cobertura;
    if (!amostras.length) return { confiavel: false, eventosConfiaveis: false, configuracaoSuficiente: true, comportamento: "Dados insuficientes", evolucao: null, diferenca: null, comparacaoConfiavel: false };
    const lista = episodios && episodios.lista || [], comportamento = !lista.length ? "Operação normal" : lista.some(item => item.classificacao === "Criticidade sustentada") ? "Sobrecarga sustentada crítica" : lista.some(item => item.classificacao.startsWith("Atenção sustentada")) ? "Sobrecarga sustentada em atenção" : lista.length >= 3 ? "Pressão recorrente" : lista.length >= 2 ? "Sobrecarga intermitente" : "Picos isolados", medianaAtual = median(amostras.map(numero));
    const coberturaAnterior = dadosAnteriores && (dadosAnteriores.periodo ? dadosAnteriores.coberturaPeriodo : dadosAnteriores.cobertura);
    const anteriorValido = dadosAnteriores && dadosAnteriores.amostras && dadosAnteriores.amostras.length >= 2 && coberturaAnterior >= config.coberturaMinima;
    if (coberturaAtual < config.coberturaMinima || !anteriorValido) return { confiavel: coberturaAtual >= config.coberturaMinima, eventosConfiaveis: true, configuracaoSuficiente: true, comportamento, medianaAtual, medianaAnterior: null, diferenca: null, evolucao: null, comparacaoConfiavel: false, limitacaoDados: coberturaAtual < config.coberturaMinima ? "Cobertura do período atual insuficiente para avaliação global." : "Histórico anterior insuficiente para uma comparação confiável." };
    const medianaAnterior = median(dadosAnteriores.amostras.map(numero)), diferenca = medianaAtual - medianaAnterior;
    return { confiavel: true, eventosConfiaveis: true, configuracaoSuficiente: true, comportamento, medianaAtual, medianaAnterior, diferenca, evolucao: Math.abs(diferenca) < 2 ? "estável" : diferenca > 0 ? "crescimento" : "redução", comparacaoConfiavel: true };
  }
  return { median, normalizar, intervalos, sustentada, episodios, distribuicao, diagnostico, PADRAO };
});
