var database = require("../database/config");

function listarComponentes() {
    return database.executar("SELECT id, nome FROM componentes ORDER BY nome", []);
}

function listarPorEmpresa(empresaId) {
    var instrucaoSql = `
        SELECT m.id, m.hostname, m.so, m.macAddress,
            GROUP_CONCAT(DISTINCT c.nome ORDER BY c.nome SEPARATOR ', ') AS componentes,
            MIN(cm.disponibilidade) AS disponibilidade
        FROM maquina m
        LEFT JOIN configuracao_maquina cm ON cm.maquina_captura_id = m.id
        LEFT JOIN componentes c ON c.id = cm.componentes_id
        WHERE m.fkEmpresa = ?
        GROUP BY m.id, m.hostname, m.so, m.macAddress
        ORDER BY m.hostname, m.id`;
    return database.executar(instrucaoSql, [empresaId]);
}

function buscarPorId(idMaquina, empresaId) {
    var instrucaoSql = `
        SELECT m.id, m.hostname, m.so, m.macAddress, cm.id AS configuracaoId,
            cm.componentes_id AS componenteId, cm.disponibilidade, c.nome AS componente
        FROM maquina m
        LEFT JOIN configuracao_maquina cm ON cm.maquina_captura_id = m.id
        LEFT JOIN componentes c ON c.id = cm.componentes_id
        WHERE m.id = ? AND m.fkEmpresa = ?
        ORDER BY c.nome`;
    return database.executar(instrucaoSql, [idMaquina, empresaId]);
}

function cadastrar(hostname, so, macAddress, empresaId, componentesIds) {
    return database.executarTransacao(async function (executar) {
        var componentes = await executar("SELECT id FROM componentes WHERE id IN (?)", [componentesIds]);
        if (componentes.length !== componentesIds.length) throw { codigo: "COMPONENTE_INVALIDO" };
        var duplicada = await executar(
            "SELECT id FROM maquina WHERE fkEmpresa = ? AND macAddress = ? LIMIT 1",
            [empresaId, macAddress]
        );
        if (duplicada.length) throw { codigo: "MAC_DUPLICADO" };

        var maquina = await executar(
            "INSERT INTO maquina (hostname, so, macAddress, fkEmpresa) VALUES (?, ?, ?, ?)",
            [hostname, so, macAddress, empresaId]
        );
        for (var i = 0; i < componentesIds.length; i++) {
            await executar(
                "INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id) VALUES (?, ?, ?)",
                [1, maquina.insertId, componentesIds[i]]
            );
        }
        return { id: maquina.insertId };
    });
}

function editar(idMaquina, hostname, so, macAddress, empresaId, componentesIds) {
    return database.executarTransacao(async function (executar) {
        var componentes = await executar("SELECT id FROM componentes WHERE id IN (?)", [componentesIds]);
        if (componentes.length !== componentesIds.length) throw { codigo: "COMPONENTE_INVALIDO" };
        var maquinas = await executar(
            "SELECT id FROM maquina WHERE id = ? AND fkEmpresa = ? FOR UPDATE",
            [idMaquina, empresaId]
        );
        if (!maquinas.length) throw { codigo: "NAO_ENCONTRADA" };

        var duplicada = await executar(
            "SELECT id FROM maquina WHERE fkEmpresa = ? AND macAddress = ? AND id <> ? LIMIT 1",
            [empresaId, macAddress, idMaquina]
        );
        if (duplicada.length) throw { codigo: "MAC_DUPLICADO" };

        var configuracoes = await executar(
            "SELECT id, componentes_id FROM configuracao_maquina WHERE maquina_captura_id = ? FOR UPDATE",
            [idMaquina]
        );
        var idsSelecionados = new Set(componentesIds.map(Number));

        for (var i = 0; i < configuracoes.length; i++) {
            var configuracao = configuracoes[i];
            if (!idsSelecionados.has(configuracao.componentes_id)) {
                var capturas = await executar(
                    `SELECT id FROM captura
                     WHERE configuracao_maquina_maquina_id = ?
                        OR configuracao_maquina_componentes_id = ? LIMIT 1`,
                    [configuracao.id, configuracao.id]
                );
                if (capturas.length) throw { codigo: "CONFIGURACAO_COM_HISTORICO" };
                await executar("DELETE FROM configuracao_maquina WHERE id = ?", [configuracao.id]);
            }
        }

        var existentes = new Set(configuracoes.map(function (configuracao) {
            return configuracao.componentes_id;
        }));
        for (var j = 0; j < componentesIds.length; j++) {
            if (!existentes.has(componentesIds[j])) {
                await executar(
                    "INSERT INTO configuracao_maquina (disponibilidade, maquina_captura_id, componentes_id) VALUES (?, ?, ?)",
                    [1, idMaquina, componentesIds[j]]
                );
            }
        }
        await executar(
            "UPDATE maquina SET hostname = ?, so = ?, macAddress = ? WHERE id = ? AND fkEmpresa = ?",
            [hostname, so, macAddress, idMaquina, empresaId]
        );
    });
}

function deletar(idMaquina, empresaId) {
    return database.executarTransacao(async function (executar) {
        var maquinas = await executar(
            "SELECT id FROM maquina WHERE id = ? AND fkEmpresa = ? FOR UPDATE",
            [idMaquina, empresaId]
        );
        if (!maquinas.length) throw { codigo: "NAO_ENCONTRADA" };

        var historico = await executar(
            `SELECT id FROM captura WHERE maquina_id = ?
             UNION
             SELECT cp.id FROM captura cp
             JOIN configuracao_maquina cm ON cm.id = cp.configuracao_maquina_maquina_id
                OR cm.id = cp.configuracao_maquina_componentes_id
             WHERE cm.maquina_captura_id = ? LIMIT 1`,
            [idMaquina, idMaquina]
        );
        if (historico.length) throw { codigo: "MAQUINA_COM_HISTORICO" };

        await executar("DELETE FROM configuracao_maquina WHERE maquina_captura_id = ?", [idMaquina]);
        await executar("DELETE FROM maquina WHERE id = ? AND fkEmpresa = ?", [idMaquina, empresaId]);
    });
}

module.exports = { listarComponentes, listarPorEmpresa, buscarPorId, cadastrar, editar, deletar };
