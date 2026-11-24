const test = require("node:test");
const assert = require("node:assert/strict");
const cpu = require("../public/js/cpu-analysis");
const limites = { alerta: 80, critico: 90 };
const serie = (valores, maquina = 1, passo = 5000, inicio = 1700000000000) => valores.map((valor, i) => ({ id: i + 1, maquina_id: maquina, valor, data_hora: new Date(inicio + i * passo).toISOString() }));
const analise = valores => cpu.intervalos(serie(valores), 1);

test("CPU normal e estável não cria episódios", () => {
  const dados = analise([30, 32, 31, 30, 33]), episodios = cpu.episodios(dados.amostras, limites, 1, { normalizada: true });
  assert.equal(episodios.lista.length, 0);
  assert.equal(cpu.diagnostico(dados, dados, episodios).comportamento, "Operação normal");
});

test("integração da distribuição consome o contrato atual dos intervalos", () => {
  const dados = analise([10, 30, 85, 95]), distribuicao = cpu.distribuicao(dados, limites);
  assert.equal(dados.valores[0].atual.valor, 10);
  assert.equal(distribuicao.total, 15000);
  assert.equal(distribuicao.bandas.reduce((soma, faixa) => soma + faixa.ms, 0), 15000);
});

test("integração do diagnóstico consome episódios com contrato analítico", () => {
  const dados = analise(Array.from({ length: 61 }, () => 85)), episodios = cpu.episodios(dados.amostras, limites, 1, { normalizada: true });
  assert.equal(cpu.diagnostico(dados, dados, episodios).comportamento, "Sobrecarga sustentada em atenção");
});

test("atenção sustentada com pico crítico isolado não vira criticidade sustentada", () => {
  const valores = Array.from({ length: 61 }, () => 85); valores[30] = 95;
  const episodio = cpu.episodios(serie(valores), limites, 1).lista[0];
  assert.equal(episodio.classificacao, "Atenção sustentada com pico crítico isolado");
  assert.equal(episodio.picoCriticoIsolado, true);
  assert.equal(episodio.duracaoAtencao, 295000);
  assert.equal(episodio.duracaoCriticidade, 5000);
  assert.equal(episodio.duracao, 300000);
});

test("pico crítico isolado registra somente sua duração observada", () => {
  const episodio = cpu.episodios(serie([95, 30, 30]), limites, 1).lista[0];
  assert.equal(episodio.classificacao, "Pico crítico isolado");
  assert.equal(episodio.duracao, 5000);
  assert.equal(episodio.inicio, serie([95])[0].data_hora);
  assert.equal(episodio.fim, serie([95, 30])[1].data_hora);
});

test("três capturas em cinco minutos não atendem a cobertura da janela sustentada", () => {
  assert.equal(cpu.sustentada(serie([80, 82, 84], 1, 150000), 1), null);
});

test("lacunas de coleta encerram episódios e não entram na distribuição", () => {
  const dados = serie([85, 85, 85]); dados[2].data_hora = new Date(1700000060000).toISOString();
  const intervalos = cpu.intervalos(dados, 1), episodios = cpu.episodios(dados, limites, 1);
  assert.equal(intervalos.valores.length, 1);
  assert.equal(intervalos.lacunas, 1);
  assert.equal(cpu.distribuicao(intervalos, limites).total, 5000);
  assert.equal(episodios.lista.length, 1);
});

test("oscilação breve abaixo do limite mantém o episódio sem contabilizar tempo normal", () => {
  const episodio = cpu.episodios(serie([85, 75, 85, 85]), limites, 1).lista[0];
  assert.equal(episodio.duracao, 10000);
  assert.equal(episodio.classificacao, "Pico de atenção");
});

test("diagnóstico atual permanece válido sem histórico anterior", () => {
  const atual = analise(Array.from({ length: 61 }, () => 85)), episodios = cpu.episodios(atual.amostras, limites, 1, { normalizada: true });
  const resultado = cpu.diagnostico(atual, cpu.intervalos([], 1), episodios);
  assert.equal(resultado.confiavel, true);
  assert.equal(resultado.comparacaoConfiavel, false);
  assert.equal(resultado.comportamento, "Sobrecarga sustentada em atenção");
});

test("uma captura anterior não torna a comparação confiável", () => {
  const atual = analise([50, 52, 54]), anterior = cpu.intervalos(serie([40]), 1);
  const resultado = cpu.diagnostico(atual, anterior, { lista: [] });
  assert.equal(resultado.confiavel, true);
  assert.equal(resultado.comparacaoConfiavel, false);
});

test("cobertura insuficiente do período solicitado invalida o diagnóstico", () => {
  const dados = cpu.intervalos(serie([85, 85]), 1, { inicio: 1700000000000, fim: 1700000300000 });
  assert.equal(cpu.diagnostico(dados, dados, { lista: [] }).confiavel, false);
});

test("duração inferior a um minuto permanece mensurável em milissegundos", () => {
  const episodio = cpu.episodios(serie([85, 85, 30]), limites, 1).lista[0];
  assert.equal(episodio.duracao, 10000);
});

test("limites personalizados abaixo de 60% preservam faixas ordenadas", () => {
  const dados = analise([35, 45, 55]), resultado = cpu.distribuicao(dados, { alerta: 40, critico: 55 });
  assert.deepEqual(resultado.bandas.map(faixa => faixa.fim), [20, 40, 55, 60, 100]);
  assert.equal(cpu.episodios(dados.amostras, { alerta: 40, critico: 55 }, 1, { normalizada: true }).lista.length, 1);
});

test("normalização rejeita valores nulos, inválidos e fora da faixa", () => {
  const dados = serie([50, null, "x", -1, 101, 60]);
  assert.deepEqual(cpu.normalizar(dados, 1).map(item => Number(item.valor)), [50, 60]);
});

test("máquinas diferentes não se misturam e duplicatas são removidas", () => {
  const dados = serie([95], 1).concat(serie([95, 95], 2)); dados.push({ ...dados[0], id: 99 });
  assert.equal(cpu.normalizar(dados, 1).length, 1);
  assert.equal(cpu.episodios(dados, { alerta: 96, critico: 98 }, 1).lista.length, 0);
});

test("janelas sustentadas exigem ao menos 80% das capturas esperadas", () => {
  const valido = serie(Array.from({ length: 61 }, () => 82));
  assert.ok(cpu.sustentada(valido, 1));
  assert.equal(cpu.sustentada(valido.filter((_, i) => i % 2 === 0), 1), null);
});

test("crescimento e redução usam medianas de períodos com cobertura válida", () => {
  const atual = analise([70, 72, 74]), anterior = cpu.intervalos(serie([40, 42, 44], 1, 5000, 1699999900000), 1);
  assert.equal(cpu.diagnostico(atual, anterior, { lista: [] }).evolucao, "crescimento");
  assert.equal(cpu.diagnostico(anterior, atual, { lista: [] }).evolucao, "redução");
});

test("limites nulos, ausentes, inválidos ou fora de ordem não geram episódios", () => {
  const dados = serie([95, 95, 95]);
  [null, {}, { alerta: null, critico: 90 }, { alerta: "x", critico: 90 }, { alerta: 95, critico: 90 }].forEach(limitesInvalidos => {
    const episodios = cpu.episodios(dados, limitesInvalidos, 1);
    assert.equal(episodios.lista.length, 0);
    assert.equal(episodios.configuracaoSuficiente, false);
  });
});

test("episódios observados permanecem visíveis com cobertura global insuficiente", () => {
  const amostras = serie(Array.from({ length: 61 }, () => 85)), episodios = cpu.episodios(amostras, limites, 1);
  const atual = cpu.intervalos(amostras, 1, { inicio: 1700000000000, fim: 1700000600000 });
  const resultado = cpu.diagnostico(atual, cpu.intervalos([], 1), episodios);
  assert.equal(episodios.lista.length, 1);
  assert.equal(resultado.comportamento, "Sobrecarga sustentada em atenção");
  assert.equal(resultado.eventosConfiaveis, true);
  assert.equal(resultado.confiavel, false);
  assert.equal(resultado.comparacaoConfiavel, false);
});

test("janela sustentada exige extensão próxima de cinco minutos", () => {
  assert.equal(cpu.sustentada(serie(Array.from({ length: 49 }, () => 85)), 1), null);
  assert.ok(cpu.sustentada(serie(Array.from({ length: 60 }, () => 85)), 1));
});

test("mínimo, mediana e máximo usam a mesma série normalizada", () => {
  const dados = cpu.normalizar(serie([10, 40, 90]), 1), extremos = cpu.extremos(dados);
  assert.equal(cpu.median(dados.map(item => item.valor)), 40);
  assert.deepEqual(extremos, { minimo: 10, maximo: 90 });
});

test("extremos da maior carga sustentada pertencem somente à janela selecionada", () => {
  const valores = [5].concat(Array.from({ length: 60 }, (_, indice) => 70 + indice % 21));
  const carga = cpu.sustentada(serie(valores), 1);
  assert.equal(carga.minimo, 70);
  assert.equal(carga.maximo, 90);
});

test("ausência de dados válidos não inventa extremos", () => {
  assert.deepEqual(cpu.extremos([]), { minimo: null, maximo: null });
  assert.equal(cpu.sustentada([], 1), null);
});

test("arquivamento persiste e restauração remove somente o registro escolhido", () => {
  const dados = new Map(), storage = { getItem: chave => dados.get(chave) || null, setItem: (chave, valor) => dados.set(chave, valor) }, chave = cpu.chaveArquivamento({ empresaId: 1, usuarioId: 2, maquinaId: 3 });
  const registro = { id: "10,11", capturas: [10, 11] };
  assert.equal(cpu.gravarArquivados(storage, chave, [registro]), true);
  assert.deepEqual(cpu.lerArquivados(storage, chave), [registro]);
  assert.equal(cpu.gravarArquivados(storage, chave, []), true);
  assert.deepEqual(cpu.lerArquivados(storage, chave), []);
});

test("identificação do episódio permanece reconhecível entre filtros sobrepostos", () => {
  const arquivado = [{ id: "10,11,12", capturas: [10, 11, 12] }];
  assert.equal(cpu.episodioArquivado({ capturas: [11, 12] }, arquivado), true);
  assert.equal(cpu.episodioArquivado({ capturas: [20, 21] }, arquivado), false);
});

test("arquivamento é isolado por empresa, usuário e máquina", () => {
  const a = cpu.chaveArquivamento({ empresaId: 1, usuarioId: 2, maquinaId: 3 }), outroUsuario = cpu.chaveArquivamento({ empresaId: 1, usuarioId: 4, maquinaId: 3 }), outraMaquina = cpu.chaveArquivamento({ empresaId: 1, usuarioId: 2, maquinaId: 5 });
  assert.notEqual(a, outroUsuario);
  assert.notEqual(a, outraMaquina);
});

test("arquivamento não altera os resultados analíticos do episódio", () => {
  const dados = serie(Array.from({ length: 61 }, () => 85)), antes = cpu.episodios(dados, limites, 1), registros = [{ id: antes.lista[0].idArquivamento, capturas: antes.lista[0].capturas }], depois = cpu.episodios(dados, limites, 1);
  assert.equal(cpu.episodioArquivado(depois.lista[0], registros), true);
  assert.equal(depois.atencao, antes.atencao);
  assert.equal(depois.lista.length, antes.lista.length);
});

test("restauração encontra o registro original de um episódio recortado por outro filtro", () => {
  const original = { id: "10,11,12", capturas: [10, 11, 12] }, distinto = { id: "20,21", capturas: [20, 21] }, recortado = { capturas: [11, 12] };
  const registro = cpu.registroArquivado(recortado, [original, distinto]);
  assert.equal(registro, original);
  assert.deepEqual([original, distinto].filter(item => item !== registro), [distinto]);
});

test("extremos de séries extensas são calculados sem expansão de argumentos", () => {
  const amostras = Array.from({ length: 200000 }, (_, indice) => ({ valor: indice === 777 ? -10 : indice === 199999 ? 120 : 50 }));
  assert.deepEqual(cpu.extremos(amostras), { minimo: -10, maximo: 120 });
});

test("diagnóstico de evolução inclui extremos atual e anterior", () => {
  const atual = analise([60, 70, 80]), anterior = cpu.intervalos(serie([20, 30, 40], 1, 5000, 1699999900000), 1), resultado = cpu.diagnostico(atual, anterior, { lista: [] });
  assert.deepEqual(resultado.extremosAtuais, { minimo: 60, maximo: 80 });
  assert.deepEqual(resultado.extremosAnteriores, { minimo: 20, maximo: 40 });
});

test("episódio pontual de atenção não é classificado como pico isolado", () => {
  const dados = serie(Array.from({ length: 37 }, () => 85).concat(30)), episodios = cpu.episodios(dados, limites, 1), intervalos = cpu.intervalos(dados, 1);
  assert.equal(cpu.diagnostico(intervalos, intervalos, episodios).comportamento, "Episódio pontual de sobrecarga em atenção");
});

test("episódio pontual crítico é distinguido de sobrecarga sustentada", () => {
  const dados = serie(Array.from({ length: 37 }, () => 95).concat(30)), episodios = cpu.episodios(dados, limites, 1), intervalos = cpu.intervalos(dados, 1);
  assert.equal(cpu.diagnostico(intervalos, intervalos, episodios).comportamento, "Episódio pontual de sobrecarga crítica");
});

test("uma única captura de sobrecarga permanece pico isolado", () => {
  const dados = serie([85, 30, 30]), episodios = cpu.episodios(dados, limites, 1), intervalos = cpu.intervalos(dados, 1);
  assert.equal(cpu.diagnostico(intervalos, intervalos, episodios).comportamento, "Pico isolado");
});
