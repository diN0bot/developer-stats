
var settings = require('../settings');
var https = require('https');
var querystring = require('querystring');

exports.index = function(req, res){
	res.render('index', {
		title: 'Index',
		gh_org: settings.github_org,
		gh_repo: settings.github_repo,
		access_url: '/devstats/oauth_getcode'
	})
};

/*
 * OAuth step 1.: Redirect user to github.
 * If user permits app access, callback will be called with 'code' parameter
 */
exports.oauth_getcode = function(req, res){
	res.redirect([settings.authorize_url,
	              "?scope=repo&client_id=",
	              settings.client_id].join(""));
}

/*
 * OAuth step 2.: Retrieve 'code' parameter from callback.
 * Exchange code for access token and call stats_page to render stats.
 */
exports.oauth_code_callback = function(req, res){
	var post_data = querystring.stringify({
		client_id: settings.client_id,
		client_secret: settings.client_secret,
		code: req.query.code
	});

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

	var ghreq = https.request(options, function(ghres) {
		ghres.setEncoding('utf8');
		ghres.on('data', function (chunk) {
			stats_page(req, res, chunk.split('&')[0].split('=')[1]);
		});
	});

	ghreq.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		res.render('error', { error: e.message });
	});

	// post the data
	ghreq.write(post_data);
	ghreq.end();
}

exports.stats = function(req, res){
	stats_page(req, res, req.params.access_token);
}

/* renders stats page */
var stats_page = function(req, res, access_token){
	res.render('stats', { access_token: access_token });
}
