var database = require("../database/config");

function buscarPorNome(nomeCargo) {
    var instrucaoSql = `SELECT id, nome FROM cargo WHERE nome = ? LIMIT 1;`;
    return database.executar(instrucaoSql, [nomeCargo]);
}

function buscarPorIdOuNome(identificador) {
    var ehNumero = /^\d+$/.test(String(identificador).trim());
    var instrucaoSql = ehNumero
        ? `SELECT id, nome FROM cargo WHERE id = ? LIMIT 1;`
        : `SELECT id, nome FROM cargo WHERE nome = ? LIMIT 1;`;
    var valor = ehNumero ? Number(identificador) : identificador;
    return database.executar(instrucaoSql, [valor]);
}

function listar() {
    var instrucaoSql = `SELECT id, nome, is_admin FROM cargo;`;
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarPorNome,
    buscarPorIdOuNome,
    listar
};
