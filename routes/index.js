var express = require('express');
var router = express.Router();
var broker = require('../lib/broker');
var cse = require('../lib/cse')

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Express'});
});

module.exports = router;
