var database = require("../database/config");

function buscarPorNome(nomeCargo) {
    var instrucaoSql = `SELECT id, nome FROM cargo WHERE nome = '${nomeCargo}' LIMIT 1;`;
    return database.executar(instrucaoSql);
}

function buscarPorIdOuNome(identificador) {
    var instrucaoSql = !isNaN(identificador)
        ? `SELECT id, nome FROM cargo WHERE id = ${identificador} LIMIT 1;`
        : `SELECT id, nome FROM cargo WHERE nome = '${identificador}' LIMIT 1;`;
    return database.executar(instrucaoSql);
}

function listar() {
    var instrucaoSql = `SELECT id, nome FROM cargo;`;
    return database.executar(instrucaoSql);
}

module.exports = {
    buscarPorNome,
    buscarPorIdOuNome,
    listar
};
