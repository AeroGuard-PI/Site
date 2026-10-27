var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.empresa_id AS empresaId,
            u.cargo_id AS cargoId, e.cnpj AS empresaCnpj, e.razao_social AS empresaNome
        FROM usuario u JOIN empresa e ON e.id = u.empresa_id
        WHERE u.email = ? AND u.senha = ?;
    `;
    return database.executar(instrucaoSql, [email, senha]);
}

function cadastrar(nome, telefone, email, cpf, senha, empresaId, cargoId) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, telefone, email, cpf, senha, empresa_id, cargo_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?);
    `;
    return database.executar(instrucaoSql, [nome, telefone, email, cpf, senha, empresaId, cargoId]);
}

module.exports = {
    autenticar,
    cadastrar
};
