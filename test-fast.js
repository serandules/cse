/*jslint node: true */
'use strict';

var https = require('https');
var count = 0;

var options = {
	hostname: 'google.com'
};

function next() {
	if (count > 10000) return setTimeout(iterate, 1000000)
	setTimeout(iterate, 0);
}

function onError(error) {
	console.log(error);
}

function noop() {
}

function onResponse(res) {
	console.log('statusCode: ', res.statusCode);
	//console.log('headers: ', res.headers);
	res.on('data', noop);
	res.on('end', next);
}

function iterate() {
	console.log(JSON.stringify(process.memoryUsage()));
	console.log('iterating... ' + ' num: ' + (++count));
	https.request(options, onResponse).
		on('error', onError).
		end();
};

for (var i = 0; i < 20; i++) {
	iterate();
}
