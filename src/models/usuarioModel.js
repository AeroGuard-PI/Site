var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT id, nome, email, telefone, cpf, empresa_id AS empresaId, cargo_id AS cargoId 
        FROM usuario 
        WHERE email = '${email}' AND senha = '${senha}';
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

function cadastrar(nome, telefone, email, cpf, senha, empresaId, cargoId) {
    var instrucaoSql = `
        INSERT INTO usuario (nome, telefone, email, cpf, senha, empresa_id, cargo_id) 
        VALUES ('${nome}', '${telefone}', '${email}', '${cpf}', '${senha}', ${empresaId}, ${cargoId});
    `;
    console.log("Executando a instrução SQL: \n" + instrucaoSql);
    return database.executar(instrucaoSql);
}

module.exports = {
    autenticar,
    cadastrar
};
