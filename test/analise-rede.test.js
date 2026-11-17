const test = require("node:test");
const assert = require("node:assert/strict");
const { analisarRede, resumirSerie } = require("../src/models/analiseRede");
const base = Date.parse("2026-11-27T12:00:00Z");
const iso = s => new Date(base + s * 1000).toISOString();
function intervalo(inicio, fim, bytes, extras = {}) {
    return { inicio_em: iso(inicio), coletado_em: iso(fim), recebido_em: iso(fim),
        duracao_ns: (fim - inicio) * 1e9, delta_rx_bytes: bytes, delta_tx_bytes: 0,
        delta_rx_erros: 0, delta_tx_erros: 0, delta_rx_descartes: 0,
        estado_operacional: "UP", motivo_intervalo: null, ...extras };
}

test("pondera o tráfego pela duração e conserva zero observado", () => {
    const a = analisarRede([intervalo(0, 2, 2e6), intervalo(2, 10, 16e6)], "AMPLIADA", iso(0), iso(20));
    assert.equal(a.indicadores.mediaRx, 14.4);
    assert.equal(a.indicadores.picoRx, 16);
    assert.equal(a.indicadores.volumeRxBytes, 18e6);
    assert.equal(a.indicadores.mediaTx, 0);
    assert.equal(a.indicadores.coberturaPct, 50);
});

test("recorta cobertura e não estima bytes de intervalos na borda", () => {
    const a = analisarRede([intervalo(-5, 5, 10e6), intervalo(5, 10, 2e6)], "AMPLIADA", iso(0), iso(20));
    assert.equal(a.indicadores.volumeRxBytes, 2e6);
    assert.equal(a.indicadores.intervalosValidos, 1);
    assert.equal(a.indicadores.coberturaPct, 50);
    assert.equal(a.indicadores.inicioCoberto, iso(5));
});

test("lacunas, reinícios e sobreposição não viram tráfego nem cobertura extra", () => {
    const invalida = intervalo(10, 15, null, { inicio_em: null, duracao_ns: null, motivo_intervalo: "CONTADOR_REINICIADO" });
    const a = analisarRede([intervalo(0, 10, 1e6), intervalo(5, 12, 1e6), invalida,
        intervalo(18, 20, 1e6)], "AMPLIADA", iso(0), iso(25));
    assert.equal(a.indicadores.volumeRxBytes, 2e6);
    assert.equal(a.indicadores.intervalosInvalidos, 2);
    assert.equal(a.indicadores.coberturaPct, 48);
    assert.ok(a.serie.some(p => p.rx === null));
});

test("contadores sem suporte permanecem ausentes e totais parciais são identificados", () => {
    const a = analisarRede([intervalo(0, 5, 100, { delta_rx_erros: null, delta_tx_erros: null }),
        intervalo(5, 10, 100, { delta_tx_erros: null })], "AMPLIADA", iso(0), iso(20));
    assert.equal(a.indicadores.errosRx, 0);
    assert.equal(a.indicadores.errosTx, null);
    assert.equal(a.indicadores.contadoresParciais, true);
});

test("histórico básico separa direções e não fabrica duração ou volume", () => {
    const linhas = [
        { tipo: "Download - eth0", valor: 1.5, data_hora: iso(5) },
        { tipo: "Upload - eth0", valor: 0, data_hora: iso(5) },
        { tipo: "Download - eth0", valor: 2, data_hora: iso(30) }
    ];
    const a = analisarRede(linhas, "BASICA", iso(0), iso(40));
    assert.equal(a.indicadores.picoRx, 2);
    assert.equal(a.indicadores.picoTx, 0);
    assert.equal(a.indicadores.volumeRxBytes, null);
    assert.equal(a.indicadores.coberturaPct, null);
    assert.ok(a.serie.some(p => p.rx === null && p.tx === null));
});

test("redução visual conserva extremos e uma lacuna observada", () => {
    const pontos = Array.from({ length: 4000 }, (_, i) => ({ instante: i, rx: i === 1234 ? 9999 : 1, tx: i % 5 }));
    pontos[2001] = { instante: 2001, rx: null, tx: null };
    const reduzidos = resumirSerie(pontos);
    assert.ok(reduzidos.length <= 360);
    assert.equal(Math.max(...reduzidos.map(p => p.rx || 0)), 9999);
    assert.ok(reduzidos.some(p => p.rx === null));
});
