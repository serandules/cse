var express = require('express');
var router = express.Router();
//var broker = require('../lib/broker');
var cse = require('../lib/cse')

/* GET home page. */
router.get('/', function (req, res, next) {
    cse.symbols({sort: req.query.sort}, function (err, symbols) {
        if (err) return next(err)
        res.json(symbols)
    })
});

module.exports = router;
