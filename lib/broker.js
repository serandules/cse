var nconf = require('nconf');
var vm = require('vm')
var util = require('util')
var request = require('request')
var async = require('async')
var Handlebars = require('handlebars')
var lodash = require('lodash')
var cse = require('./cse')

var userAgent = 'curl/7.49.1';

var cache = {}

var json = function (src) {
    return vm.runInThisContext('o = ' + src)
}

var getToken = function (done) {
    var options = {
        url: 'https://dfn.ashaphillip.net/ria/au.p?method=setTradePriceAuthDetails',
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: nconf.get('AUTH')
    };
    request(options, function (e, r, b) {
        if (e) return done(e)
        done(null, r.headers['set-cookie']);
    });
};

var getAuthDetails = function (token, done) {
    request({
        url: 'https://dfn.ashaphillip.net/ria/au.p?method=getTradeAuthDetails',
        method: 'POST',
        headers: {
            'Cookie': token,
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        done(e, json(b))
    });
};

var login = function (done) {
    if (!nconf.get('TOKEN')) {
        getToken(function (err, token) {
            if (err) return done(err)
            nconf.set('TOKEN', token)
            login(done)
        })
        return
    }
    getAuthDetails(nconf.get('TOKEN'), function (err, o) {
        if (err) return done(err)
        if (o.isAuth) return done(null, o)
        nconf.set('TOKEN', null)
        login(done)
    })
};

login(function (err, auth) {
    /*exports.marketDepth('JKH.N0000`N', function (err, depth) {
     if (err) return console.error(err)
     console.log(depth)
     })*/
    /*exports.topStocks(function (err, stocks) {
     if (err) return console.error(err)
     console.log(stocks)
     })*/
    /*exports.weeklyHistory('SFS.N0000`N', function (err, history) {
     if (err) return console.error(err)
     console.log(history)
     })*/
    /*exports.yearlyHistory('JKH.N0000`N', function (err, history) {
     if (err) return console.error(err)
     console.log(history)
     })*/
    var iterator = function (err) {
        if (err) return console.error(err)
        setTimeout(function () {
            greatFalls(iterator)
        }, 30000)
    }
    greatFalls(iterator)

});

var yearlyHigh = function (symbol, done) {
    var entry = cache[symbol] || (cache[symbol] = {})
    if (entry.yearlyHigh) return done(null, entry.yearlyHigh)
    exports.yearlyHistory(symbol, function (err, history) {
        if (err) return done(err)
        var max = lodash.maxBy(history, function (o) {
            return o.highest
        })
        entry.yearlyHigh = max.highest
        done(null, max.highest)
    })
}

var yearlyLow = function (symbol, done) {
    var entry = cache[symbol] || (cache[symbol] = {})
    if (entry.yearlyLow) return done(null, entry.yearlyLow)
    exports.yearlyHistory(symbol, function (err, history) {
        if (err) return done(err)
        var max = lodash.minBy(history, function (o) {
            return o.lowest
        })
        entry.yearlyLow = max.lowest
        done(null, max.lowest)
    })
}

var greatFalls = function (done) {
    cse.symbols({}, function (err, symbols) {
        if (err) return done(err)
        var top = symbols.slice(0, 50)
        async.each(top, function (o, iterated) {
            yearlyLow(o.symbol, function (err, lowest) {
                if (err) return iterated(err)
                exports.weeklyHistory(o.symbol, function (err, history) {
                    if (err) return iterated(err)
                    var latest = history[history.length - 1]
                    if (latest.lowest <= lowest) {
                        console.log('yearly lowest can be seen symbol: %s, value: %s', o.symbol, latest.lowest)
                        return iterated()
                    }
                    var change = (latest.lowest - lowest) / lowest
                    if (change <= 0.2) {
                        console.log('yearly lowest trending symbol: %s, value: %s', o.symbol, latest.lowest)
                        return iterated()
                    }
                    //console.log('no trend seen symbol: %s, value: %s, lowest: %s', o.symbol, latest.lowest, lowest)
                    iterated()
                })
            })
        }, done)
    })
}

exports.marketDepth = function (symbol, done) {
    var url = Handlebars.compile('https://dfn.ashaphillip.net/ria/price?RT=3&SID=BD584E3E-DB9B-9ECF-E040-007F01005D49&UID=90200&E=LKCSE&UE=LKCSE,SYS&PS=LKCSE~0~{{{symbol}}}`N&OS=LKCSE~0~{{{symbol}}}`N&PSS=LKCSE~0~{{{symbol}}}`N&IMDO=0&IMDP=0&IMDS=0&MDL=3&M=1&H=1&EC=0&L2BOOK=0&IFLD=&rnd=1481045870240')({
        symbol: symbol
    });
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': nconf.get('TOKEN'),
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        if (e) return done(e)
        var offers = (b.DAT.MD[0].MDPA || '').split(',').map(function (data) {
            data = data.split('|')
            return {
                value: Number(data[1]),
                count: Number(data[2]),
                splits: Number(data[3])
            }
        })
        var bids = (b.DAT.MD[0].MDPB || '').split(',').map(function (data) {
            data = data.split('|')
            return {
                value: Number(data[1]),
                count: Number(data[2]),
                splits: Number(data[3])
            }
        })
        done(null, {
            offers: offers,
            bids: bids
        })
    });
};

exports.topStocks = function (done) {
    var url = Handlebars.compile('https://dfn.ashaphillip.net/ria/pricecentral?RT=5&SID=BD584E3E-DB9B-9ECF-E040-007F01005D49&UID=90200&E=&UE=LKCSE,SYS&TE=LKCSE&TT=TGC,TLC,MAV&TOPC=10&TPGC=5&TPLC=5&MVC=5&MPC=&MTC=&MAVC=&M=1&H=1&EC=0&IFLD=VOL,CUR,TOVR&INS=0&rnd=1481046825519')()
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': nconf.get('TOKEN'),
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        if (e) return done(e)
        var stocks = {}
        var normalize = function (data) {
            data = data.split('|')
            return {
                symbol: data[1],
                last: Number(data[3]),
                change: Number(data[4]),
                trades: Number(data[5]),
                value: Number(data[6]),
                volume: Number(data[9]),
                turnover: Number(data[11])
            }
        }
        b.DAT.TOP.forEach(function (cat) {
            if (cat.TGC) {
                stocks.gainers = cat.TGC.map(normalize)
                return
            }
            if (cat.TLC) {
                stocks.loosers = cat.TLC.map(normalize)
                return
            }
            if (cat.MAV) {
                stocks.active = cat.MAV.map(function (data) {
                    data = data.split('|')
                    return {
                        symbol: data[1],
                        last: Number(data[3]),
                        change: Number(data[4]),
                        trades: Number(data[5]),
                        value: Number(data[6]),
                        volume: Number(data[7]),
                        turnover: Number(data[11])
                    }
                })
            }
        })
        done(null, stocks)
    })
}

exports.weeklyHistory = function (symbol, done) {
    var url = Handlebars.compile('https://dfn.ashaphillip.net/jschart?SID=BD584E3E-DB9B-9ECF-E040-007F01005D49&UID=90200&RT=37&E=LKCSE&S={{{symbol}}}`N&INS=0&CT=3&CM=1&NOD=5&AE=0&UE=LKCSE,SYS')({
        symbol: symbol
    })
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': nconf.get('TOKEN'),
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        if (e) return done(e)
        var history = b.DAT.HIS.map(function (data) {
            return {
                at: new Date(data[0] * 1000),
                opened: data[1],
                highest: data[2],
                lowest: data[3],
                closed: data[4],
                volume: data[5],
                turnover: data[6]
            }
        })
        /*history.sort(function (l, r) {
         return l.at > r.at ? -1 : 1
         })*/
        done(null, history)
    })
}

exports.yearlyHistory = function (symbol, done) {
    var url = Handlebars.compile('https://dfn.ashaphillip.net/jschart?SID=BD584E3E-DB9B-9ECF-E040-007F01005D49&UID=90200&RT=37&E=LKCSE&S={{{symbol}}}`N&INS=0&CT=3&CM=3&AE=0&SD=20091207000000&UE=LKCSE,SYS')({
        symbol: symbol
    })
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': nconf.get('TOKEN'),
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        if (e) return done(e)
        var history = b.DAT.HIS.map(function (data) {
            return {
                at: new Date(data[0] * 1000),
                opened: data[1],
                highest: data[2],
                lowest: data[3],
                closed: data[4],
                volume: data[5],
                turnover: data[6]
            }
        })
        done(null, history)
    })
}

exports.portfolio = function (symbol, done) {
    var url = 'https://dfn.ashaphillip.net/ria/tradeSupport?_=1481168497583&type=1&mixrequest={"HED": {"1": "MIX_1.0", "2": 3, "3": 1, "7": "8EB80EC1BA69461C51D7FEB333562504", "9": "20", "13": "20", "16": "20"}, "DAT": {"1": "P000096665", "13": "20", "116": "96918"}}'
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': nconf.get('TOKEN'),
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        if (e) return done(e)
        var portfolio = b.DAT.map(function (data) {
            return {
                symbol: data['3'],
                quantity: data['7'],
                cost: data['84']
            }
        })
        done(null, portfolio)
    })
}