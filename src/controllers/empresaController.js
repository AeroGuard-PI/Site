var empresaModel = require("../models/empresaModel");

function buscarPorCnpj(req, res) {
  var cnpj = req.query.cnpj;

  empresaModel.buscarPorCnpj(cnpj).then((resultado) => {
    res.status(200).json(resultado);
  });
}

function listar(req, res) {
  empresaModel.listar().then((resultado) => {
    res.status(200).json(resultado);
  });
}

function buscarPorId(req, res) {
  var id = req.params.id;

  empresaModel.buscarPorId(id).then((resultado) => {
    res.status(200).json(resultado);
  });
}

function cadastrar(req, res) {
  var cnpj = req.body.cnpj;
  var razaoSocial = req.body.razaoSocial;

  empresaModel.buscarPorCnpj(cnpj).then((resultado) => {
    if (resultado.length > 0) {
      res
        .status(401)
        .json({ mensagem: `a empresa com o cnpj ${cnpj} já existe` });
    } else {
      empresaModel.cadastrar(razaoSocial, cnpj).then((resultado) => {
        res.status(201).json(resultado);
      });
    }
  });
}

function buscarConfigSlack(req, res) {
  empresaModel
    .buscarConfigSlack(req.params.id)
    .then((resultado) => {
      res.status(200).json(
        resultado[0] || {
          ativo: 1,
          canal: "#alertas-criticos",
          modo: "CONFIGURADO",
          nivel_minimo: "ALERTA",
          cooldown_min: 60,
        }
      );
    })
    .catch(() => res.status(500).json({ mensagem: "Erro ao buscar configuração do Slack." }));
}

function salvarConfigSlack(req, res) {
  var ativo = req.body.ativo ? 1 : 0;
  var canal = (req.body.canal || "#alertas-criticos").trim();
  var modo = req.body.modo == "TUDO" ? "TUDO" : "CONFIGURADO";
  var nivel = req.body.nivel_minimo == "CRITICO" ? "CRITICO" : "ALERTA";
  var cooldown = Number(req.body.cooldown_min);

  if (!canal) {
    return res.status(400).json({ mensagem: "Informe o canal do Slack." });
  }
  if (isNaN(cooldown) || cooldown < 0 || cooldown > 1440) {
    return res.status(400).json({ mensagem: "Cooldown deve estar entre 0 e 1440 minutos." });
  }

  empresaModel
    .salvarConfigSlack(req.params.id, ativo, canal, modo, nivel, cooldown)
    .then(() => res.status(200).json({ mensagem: "Configuração salva." }))
    .catch(() => res.status(500).json({ mensagem: "Erro ao salvar configuração do Slack." }));
}

module.exports = {
  buscarPorCnpj,
  buscarPorId,
  cadastrar,
  listar,
  buscarConfigSlack,
  salvarConfigSlack,
};
