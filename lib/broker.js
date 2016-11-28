var nconf = require('nconf');
var request = require('request');

var token = nconf.get('TOKEN');

var userAgent = 'curl/7.49.1';

var login = function (done) {
    if (token) {
        return done(null, token);
    }
    var options = {
        url: 'https://dfn.ashaphillip.net/ria/au.p?method=setTradePriceAuthDetails',
        method: 'POST',
        headers: {
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: nconf.get('AUTH')
    }
    request(options, function (e, r, b) {
        if (e) {
            return done(e)
        }
        done(null, r.headers['set-cookie'])
    })
}

login(function (err, token) {
    console.log(token)
    request({
        url: 'https://dfn.ashaphillip.net/ria/au.p?method=getTradeAuthDetails',
        method: 'POST',
        headers: {
            'Cookie': token,
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {
        console.log(b)
    })
});

var marketDepath = function (symbol, done) {
    var url = 'https://dfn.ashaphillip.net/ria/price?RT=3&UID=90200&E=LKCSE&UE=LKCSE,SYS&PS=LKCSE~0~SFS.N0000`N&OS=LKCSE~0~SFS.N0000`N&PSS=LKCSE~0~SFS.N0000`N&IMDO=0&IMDP=0&IMDS=0&MDL=3&M=1&H=1&EC=0&L2BOOK=0&IFLD=&rnd=1479966015081';
    request({
        url: url,
        method: 'GET',
        headers: {
            'Cookie': token,
            'User-Agent': userAgent
        },
        json: true
    }, function (e, r, b) {

    });
};
