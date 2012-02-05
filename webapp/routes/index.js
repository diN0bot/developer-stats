
var settings = require('../settings');
var https = require('https');
var querystring = require('querystring');

exports.index = function(req, res){
	res.render('index', { title: 'Index' })
};

exports.oauth_getcode = function(req, res){
	res.redirect([settings.authorize_url,
	              "?client_id=",
	              settings.client_id].join(""));
}

exports.oauthcb = function(req, res){
	console.log("CODE: "+req.query.code);

	var post_data = querystring.stringify({
		client_id: settings.client_id,
		client_secret: settings.client_secret,
		code: req.query.code
	});
	console.log("POST DATA: "+post_data);

	var options = {
		host: settings.access_token_host,
		port: settings.access_token_port,
		path: settings.access_token_path,
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': post_data.length
		}
	};
	console.log("OPTIONS: "+options);

	var req = https.request(options, function(ghres) {
		console.log('STATUS: ' + ghres.statusCode);
		console.log('HEADERS: ' + JSON.stringify(ghres.headers));
		ghres.setEncoding('utf8');
		ghres.on('data', function (chunk) {
			console.log('BODY: ' + chunk);
			res.render('index', { access_token: chunk });
		});
	});

	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// post the data
	req.write(post_data);
	req.end();
}
