var express = require("express");
var router = express.Router();
var controller = require("../controllers/discretizacaoController");
router.get("/maquina/:idMaquina/:empresaId", controller.listarPorMaquina);
router.post("/", controller.cadastrar);
router.put("/:configMaquinaId", controller.editar);
router.post("/:configMaquinaId/reset", controller.resetar);
module.exports = router;
