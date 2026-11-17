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

function serieCpu(empresaId, maquinaId, dataInicial, dataFinal) {
    var filtros = "m.fkEmpresa = ? AND c.nome = 'CPU' AND cp.data_hora >= ? AND cp.data_hora < ?";
    var parametros = [empresaId, dataInicial, dataFinal];
    if (maquinaId) { filtros += " AND m.id = ?"; parametros.push(maquinaId); }
    return database.executar(`
        SELECT cp.id, cp.valor, cp.unidade_medida AS unidade, cp.data_hora, m.id AS maquina_id, m.hostname
        FROM captura cp
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        WHERE ${filtros}
        ORDER BY cp.data_hora ASC, cp.id ASC`, parametros);
}

function limitesCpu(empresaId, maquinaId) {
    var filtros = "m.fkEmpresa = ? AND c.nome = 'CPU'";
    var parametros = [empresaId];
    if (maquinaId) { filtros += " AND m.id = ?"; parametros.push(maquinaId); }
    return database.executar(`
        SELECT d.limite, d.nivel_alerta
        FROM discretizacao d
        JOIN configuracao_maquina cm ON cm.id = d.config_maquina_id
        JOIN maquina m ON m.id = cm.maquina_captura_id
        JOIN componentes c ON c.id = cm.componentes_id
        WHERE ${filtros}
        ORDER BY d.limite ASC, d.id ASC`, parametros);
}

function alertasCpu(empresaId, maquinaId, dataInicial, dataFinal) {
    var filtros = "m.fkEmpresa = ? AND c.nome = 'CPU' AND ha.data_hora >= ? AND ha.data_hora < ?";
    var parametros = [empresaId, dataInicial, dataFinal];
    if (maquinaId) { filtros += " AND m.id = ?"; parametros.push(maquinaId); }
    return database.executar(`
        SELECT DISTINCT ha.id, ha.data_hora, d.nivel_alerta, d.limite, cp.id AS captura_id,
            cp.valor, cp.unidade_medida AS unidade, m.hostname
        FROM historico_alerta ha
        JOIN captura cp ON cp.id = ha.maquina_captura_id
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        JOIN discretizacao d ON d.id = ha.discretizacao_id
        WHERE ${filtros}
        ORDER BY ha.data_hora DESC, ha.id DESC
        LIMIT 10`, parametros);
}

function empresaRede(empresaId) {
    return database.executar("SELECT id, razao_social AS nome FROM empresa WHERE id = ?", [empresaId]);
}

function possuiCapturaRede() {
    return database.executar(`SELECT 1 FROM information_schema.tables
        WHERE table_schema = DATABASE() AND table_name = 'captura_rede'`).then(linhas => linhas.length > 0);
}

function configuracoesRede(empresaId) {
    return database.executar(`
        SELECT maquina_id, disponibilidade FROM (
            SELECT cm.maquina_captura_id AS maquina_id, cm.disponibilidade,
                ROW_NUMBER() OVER (PARTITION BY cm.maquina_captura_id ORDER BY cm.data_hora DESC, cm.id DESC) AS posicao
            FROM configuracao_maquina cm
            JOIN maquina m ON m.id = cm.maquina_captura_id
            JOIN componentes c ON c.id = cm.componentes_id
            WHERE m.fkEmpresa = ? AND c.nome = 'Rede'
        ) configuracoes WHERE posicao = 1`, [empresaId]);
}

function interfacesRede(empresaId, ampliada) {
    const basica = `
        SELECT m.id AS maquinaId, m.hostname,
            CASE WHEN cp.tipo LIKE 'Download - %' THEN SUBSTRING(cp.tipo, 12)
                ELSE SUBSTRING(cp.tipo, 10) END COLLATE utf8mb4_0900_as_cs AS interface,
            MAX(cp.data_hora) AS coletadoEm, NULL AS recebidoEm,
            NULL AS estado, 'BASICA' AS fonte
        FROM captura cp
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        WHERE m.fkEmpresa = ? AND c.nome = 'Rede' AND cp.unidade_medida = 'Mbps'
            AND (cp.tipo LIKE 'Download - %' OR cp.tipo LIKE 'Upload - %')
        GROUP BY m.id, m.hostname, interface`;
    const parametros = [empresaId];
    let observacoes = basica;
    if (ampliada) {
        observacoes += ` UNION ALL
            SELECT maquinaId, hostname, interface, coletadoEm, recebidoEm, estado, 'AMPLIADA' AS fonte FROM (
                SELECT m.id AS maquinaId, m.hostname, cr.interface_nome AS interface,
                    cr.coletado_em AS coletadoEm, cr.recebido_em AS recebidoEm, cr.estado_operacional AS estado,
                    ROW_NUMBER() OVER (PARTITION BY cr.maquina_id, cr.interface_nome ORDER BY cr.coletado_em DESC) AS p
                FROM captura_rede cr
                JOIN maquina m ON m.id = cr.maquina_id
                JOIN configuracao_maquina cm ON cm.id = cr.config_maquina_id AND cm.maquina_captura_id = m.id
                JOIN componentes c ON c.id = cm.componentes_id AND c.nome = 'Rede'
                WHERE m.fkEmpresa = ?
            ) atuais WHERE p = 1`;
        parametros.push(empresaId);
    }
    return database.executar(`SELECT maquinaId, hostname, interface, coletadoEm, recebidoEm, estado, fonte FROM (
        SELECT observacoes.*, ROW_NUMBER() OVER (
            PARTITION BY maquinaId, interface ORDER BY ROUND(UNIX_TIMESTAMP(coletadoEm)) DESC, fonte ASC
        ) AS posicao FROM (${observacoes}) observacoes
        ) interfaces WHERE posicao = 1 ORDER BY hostname, maquinaId, interface`, parametros);
}

function serieRede(empresaId, maquinaId, interfaceNome, inicio, fim, ampliada) {
    if (ampliada) {
        return database.executar(`
            SELECT cr.inicio_em, cr.coletado_em, cr.recebido_em, cr.duracao_ns, cr.delta_rx_bytes,
                cr.delta_tx_bytes, cr.delta_rx_erros, cr.delta_tx_erros, cr.delta_rx_descartes,
                cr.estado_operacional, cr.motivo_intervalo
            FROM captura_rede cr
            JOIN maquina m ON m.id = cr.maquina_id
            JOIN configuracao_maquina cm ON cm.id = cr.config_maquina_id AND cm.maquina_captura_id = m.id
            JOIN componentes c ON c.id = cm.componentes_id AND c.nome = 'Rede'
            WHERE m.fkEmpresa = ? AND m.id = ? AND cr.interface_nome = ?
                AND cr.coletado_em >= ? AND cr.coletado_em < ?
            ORDER BY cr.coletado_em, cr.id LIMIT 200001`, [empresaId, maquinaId, interfaceNome, inicio, fim]);
    }
    return database.executar(`
        SELECT cp.tipo, cp.valor, cp.data_hora
        FROM captura cp
        JOIN maquina m ON m.id = cp.maquina_id
        JOIN componentes c ON c.id = cp.componentes_id
        WHERE m.fkEmpresa = ? AND m.id = ? AND c.nome = 'Rede' AND cp.unidade_medida = 'Mbps'
            AND cp.tipo COLLATE utf8mb4_0900_as_cs IN (?, ?) AND cp.data_hora >= ? AND cp.data_hora < ?
        ORDER BY cp.data_hora, cp.id LIMIT 400001`,
    [empresaId, maquinaId, 'Download - ' + interfaceNome, 'Upload - ' + interfaceNome, inicio, fim]);
}

function configuracaoSlackRede(empresaId) {
    return database.executar("SELECT ativo, canal FROM configuracao_slack WHERE empresa_id = ?", [empresaId]);
}

module.exports = { listarMaquinas, ultimasMetricas, seriePorComponente, disponibilidadePorEmpresa, alertasRecentes,
    maximosHistoricos, serieCpu, limitesCpu, alertasCpu, empresaRede, possuiCapturaRede, configuracoesRede,
    interfacesRede, serieRede, configuracaoSlackRede };
