var csv = require('csv')
var fs = require('fs')

var cache = {}

var sorts = {
    contribution: function (l, r) {
        return l.contribution > r.contribution ? -1 : 1
    }
}
//symbols.sort(sorts[req.query.sort || 'contribution'])
var symbols = function (options, done) {
    options = options || {}
    options.sort = options.sort || 'contribution'
    if (cache.symbols) return done(null, cache.symbols.sort(sorts[options.sort]))

    fs.readFile('data/list-by-market-cap.csv', function (err, data) {
        if (err) return done(err)
        csv.parse(data, function (err, data) {
            if (err) return done(err)
            data = data.map(function (entry) {
                return {
                    name: entry[0],
                    symbol: entry[1],
                    price: Number(entry[2]),
                    quantity: Number(entry[3]),
                    capitalization: Number(entry[4]),
                    contribution: Number(entry[5])
                }
            })
            cache.symbols = data
            done(null, data.sort(sorts[options.sort]))
        })
    })
}

symbols({}, function (err, data) {
    if (err) throw err
})

exports.symbols = symbols