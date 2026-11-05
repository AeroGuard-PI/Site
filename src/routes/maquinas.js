var express = require("express");
var router = express.Router();
var maquinaController = require("../controllers/maquinaController");

router.get("/componentes", maquinaController.listarComponentes);
router.get("/listar/:empresaId", maquinaController.listarPorEmpresa);
router.get("/buscar/:idMaquina/:empresaId", maquinaController.buscarPorId);
router.post("/cadastrar", maquinaController.cadastrar);
router.put("/editar/:idMaquina", maquinaController.editar);
router.delete("/deletar/:idMaquina/:empresaId", maquinaController.deletar);

module.exports = router;
