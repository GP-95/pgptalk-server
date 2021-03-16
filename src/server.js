"use strict";
exports.__esModule = true;
var express_1 = require("express");
var dotenv_1 = require("dotenv");
var path_1 = require("path");
dotenv_1["default"].config({ path: path_1["default"].resolve('.env') });
var app = express_1["default"]();
app.use(express_1["default"].urlencoded({ extended: true }));
app.use(express_1["default"].json());
app.get('/', function (req, res) {
    console.log(req.body);
    res.status(200).send('hello1');
});
app.listen(process.env.PORT, function () {
    console.log("Listening on port: " + process.env.PORT);
});
