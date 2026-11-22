var database = require("../database/config");

function autenticar(email, senha) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.empresa_id AS empresaId,
            u.cargo_id AS cargoId, c.nome AS cargoNome, c.is_admin AS isAdmin,
            e.cnpj AS empresaCnpj, e.razao_social AS empresaNome
        FROM usuario u
        JOIN empresa e ON e.id = u.empresa_id
        JOIN cargo c ON c.id = u.cargo_id
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

function listarPorEmpresa(empresaId) {
    var instrucaoSql = `
        SELECT u.id, u.nome, u.email, u.telefone, u.cpf,
            u.cargo_id AS cargoId, c.nome AS cargo, c.is_admin AS isAdmin
        FROM usuario u
        JOIN cargo c ON c.id = u.cargo_id
        WHERE u.empresa_id = ?
        ORDER BY u.id;
    `;
    return database.executar(instrucaoSql, [empresaId]);
}

function editar(id, nome, telefone, email, cpf, senha, empresaId, cargoId) {
    var instrucaoSql;

    if (senha) {
        instrucaoSql = `
            UPDATE usuario
            SET nome = ?, telefone = ?, email = ?, cpf = ?, senha = ?, cargo_id = ?
            WHERE id = ? AND empresa_id = ?;
        `;
        return database.executar(instrucaoSql, [nome, telefone, email, cpf, senha, cargoId, id, empresaId]);
    } else {
        instrucaoSql = `
            UPDATE usuario
            SET nome = ?, telefone = ?, email = ?, cpf = ?, cargo_id = ?
            WHERE id = ? AND empresa_id = ?;
        `;
        return database.executar(instrucaoSql, [nome, telefone, email, cpf, cargoId, id, empresaId]);
    }
}

function deletar(id, empresaId) {
    var instrucaoSql = `
        DELETE FROM usuario
        WHERE id = ? AND empresa_id = ?;
    `;
    return database.executar(instrucaoSql, [id, empresaId]);
}

module.exports = {
    autenticar,
    cadastrar,
    listarPorEmpresa,
    editar,
    deletar
};
