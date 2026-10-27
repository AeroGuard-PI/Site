require("dotenv").config({ path: process.env.AEROGUARD_ENV || ".env" });

var express = require("express");
var cors = require("cors");
var path = require("path");
var PORTA_APP = Number(process.env.APP_PORT || 3333);
var HOST_APP = process.env.APP_HOST || "0.0.0.0";

var app = express();

var indexRouter = require("./src/routes/index");
var usuarioRouter = require("./src/routes/usuarios");
var avisosRouter = require("./src/routes/avisos");
var medidasRouter = require("./src/routes/medidas");
var aquariosRouter = require("./src/routes/aquarios");
var empresasRouter = require("./src/routes/empresas");
var cargosRouter = require("./src/routes/cargos");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());

app.use("/", indexRouter);
app.use("/usuarios", usuarioRouter);
app.use("/avisos", avisosRouter);
app.use("/medidas", medidasRouter);
app.use("/aquarios", aquariosRouter);
app.use("/empresas", empresasRouter);
app.use("/cargos", cargosRouter);

app.get("/saude", function (req, res) {
    require("./src/database/config").executar("SELECT 1").then(function () {
        res.json({ status: "ok" });
    }).catch(function () {
        res.status(503).json({ status: "banco indisponível" });
    });
});

app.listen(PORTA_APP, HOST_APP, function () {
    console.log(`AeroGuard iniciado na porta ${PORTA_APP}.`);
});
