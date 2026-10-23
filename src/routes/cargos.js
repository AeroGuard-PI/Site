var express = require("express");
var router = express.Router();

var cargoController = require("../controllers/cargoController");

router.get("/listar", function (req, res) {
    cargoController.listar(req, res);
});

module.exports = router;

