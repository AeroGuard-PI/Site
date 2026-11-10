var database = require("../database/config");

function listarMaquinas(empresaId) {
    return database.executar(
        "SELECT id, hostname FROM maquina WHERE fkEmpresa = ? ORDER BY hostname, id",
        [empresaId]
    );
}

function ultimasMetricas(empresaId, maquinaId) {
    var filtros = "m.fkEmpresa = ?";
    var parametros = [empresaId];
    if (maquinaId) { filtros += " AND m.id = ?"; parametros.push(maquinaId); }
    var instrucaoSql = `
        SELECT nome, valor, unidade_medida AS unidade, data_hora, hostname
        FROM (
            SELECT c.nome, cp.valor, cp.unidade_medida, cp.data_hora, m.hostname,
                ROW_NUMBER() OVER (PARTITION BY cp.componentes_id, cp.unidade_medida ORDER BY cp.data_hora DESC, cp.id DESC) AS posicao
            FROM captura cp
            JOIN maquina m ON m.id = cp.maquina_id
            JOIN componentes c ON c.id = cp.componentes_id
            WHERE ${filtros} AND c.nome IN ('CPU', 'Memória', 'Disco', 'Rede')
        ) ultimas
        WHERE posicao = 1
        ORDER BY nome, unidade`;
    return database.executar(instrucaoSql, parametros);
}

function seriePorComponente(empresaId, maquinaId, componente, dataInicial, limite) {
    var filtros = "m.fkEmpresa = ? AND c.nome = ? AND cp.data_hora >= ?";
    var parametros = [empresaId, componente, dataInicial];
    if (maquinaId) { filtros += " AND m.id = ?"; parametros.push(maquinaId); }
    var instrucaoSql = `
        SELECT cp.valor, cp.unidade_medida AS unidade, cp.data_hora, m.hostname
        FROM captura cp
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        WHERE ${filtros}
        ORDER BY cp.data_hora DESC, cp.id DESC`;
    if (limite) {
        instrucaoSql += " LIMIT ?";
        parametros.push(limite);
    }
    return database.executar(instrucaoSql, parametros);
}

function disponibilidadePorEmpresa(empresaId) {
    var instrucaoSql = `
        SELECT m.id, m.hostname, MIN(cm.disponibilidade) AS disponibilidade
        FROM maquina m
        LEFT JOIN configuracao_maquina cm ON cm.maquina_captura_id = m.id
        WHERE m.fkEmpresa = ?
        GROUP BY m.id, m.hostname
        ORDER BY m.hostname, m.id`;
    return database.executar(instrucaoSql, [empresaId]);
}

function alertasRecentes(empresaId) {
    var instrucaoSql = `
        SELECT ha.id, ha.data_hora, d.nivel_alerta, m.hostname, c.nome AS componente,
            cp.valor, cp.unidade_medida AS unidade
        FROM historico_alerta ha
        JOIN captura cp ON cp.id = ha.maquina_captura_id
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        JOIN discretizacao d ON d.id = ha.discretizacao_id
        WHERE m.fkEmpresa = ?
        ORDER BY ha.data_hora DESC, ha.id DESC
        LIMIT 5`;
    return database.executar(instrucaoSql, [empresaId]);
}

function maximosHistoricos(empresaId) {
    var instrucaoSql = `
        SELECT nome, valor, unidade, data_hora, hostname
        FROM (
            SELECT c.nome, cp.valor, cp.unidade_medida AS unidade, cp.data_hora, m.hostname,
                ROW_NUMBER() OVER (
                    PARTITION BY cp.componentes_id, cp.unidade_medida
                    ORDER BY cp.valor DESC, cp.data_hora DESC, cp.id DESC
                ) AS posicao
            FROM captura cp
            JOIN maquina m ON m.id = cp.maquina_id
            JOIN componentes c ON c.id = cp.componentes_id
            WHERE m.fkEmpresa = ?
                AND c.nome IN ('CPU', 'Memória', 'Disco', 'Rede')
        ) classificadas
        WHERE posicao = 1
        ORDER BY nome, unidade`;
    return database.executar(instrucaoSql, [empresaId]);
}

module.exports = { listarMaquinas, ultimasMetricas, seriePorComponente, disponibilidadePorEmpresa, alertasRecentes, maximosHistoricos };
