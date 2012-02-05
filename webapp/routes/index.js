
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
			var access_token = chunk.split('&')[0].split('=')[1];
			//stats_page(req, res, access_token);
			res.redirect('/devstats/stats/'+access_token);
		});
	});

	ghreq.on('error', function(e) {
		console.error('Problem with request: ' + e.message);
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
	// get open pull requests
	var host = settings.github_api_host;
	var path = ["/repos/",
	            settings.github_org,
	            "/",
	            settings.github_repo,
	            "/pulls?per_page=100&access_token=",
	            access_token].join("");
	console.log("HOST: "+host);
	console.log("PATH: "+path)

	https.get({ host: host, path: path }, function(ghres){
		console.log("statusCode: ", ghres.statusCode);
		ghres.setEncoding('utf8');
		var open_data = '';
		ghres.on('data', function(d) {
			open_data += d;
		});
		ghres.on('end', function() {
			open_data = JSON.parse(open_data);

			// get last 100 cloased pull requests
			var host = settings.github_api_host;
			var path = ["/repos/",
			            settings.github_org,
			            "/",
			            settings.github_repo,
			            "/pulls?per_page=100&state=closed&access_token=",
			            access_token].join("");
			console.log("HOST: "+host);
			console.log("PATH: "+path)

			https.get({ host: host, path: path }, function(ghres){
				console.log("statusCode: ", ghres.statusCode);
				ghres.setEncoding('utf8');
				var closed_data = '';
				ghres.on('data', function(d) {
					closed_data += d;
				});
				ghres.on('end', function() {
					closed_data = JSON.parse(closed_data);
					context = pull_request_stats(open_data.concat(closed_data));
					res.render( 'stats', context );
				});
			}).on('error', function(e) {
				console.error('Problem with request: ' + e.message);
				res.render('error', { error: e.message });
			});
		});
	}).on('error', function(e) {
		console.error('Problem with request: ' + e.message);
		res.render('error', { error: e.message });
	});
}

var pull_request_stats = function(pull_requests) {
	/*
	 * { number: 1226,
    url: 'https://api.github.com/repos/racker/reach/pulls/1226',
    body: 'Very experimental... I still don\'t know completely what I\'m doing.\r\nBjorn, how does this look so far?\r\n',
    closed_at: null,
    _links:
     { html: [Object],
       review_comments: [Object],
       comments: [Object],
       self: [Object] },
    updated_at: '2012-02-03T04:29:07Z',
    state: 'open',
    issue_url: 'https://github.com/racker/reach/issues/1226',
    diff_url: 'https://github.com/racker/reach/pull/1226.diff',
    merged_at: null,
    user:
     { url: 'https://api.github.com/users/sym3tri',
       avatar_url: 'https://secure.gravatar.com/avatar/699a34f71fcb1a53e2b7300d23821960?d=https://a248.e.akamai.net/assets.github.com%2Fimages%2Fgravatars%2Fgravatar-140.png',
       gravatar_id: '699a34f71fcb1a53e2b7300d23821960',
       login: 'sym3tri',
       id: 224222 },
    title: 'Feature/1118/cloud files (ready)',
    patch_url: 'https://github.com/racker/reach/pull/1226.patch',
    html_url: 'https://github.com/racker/reach/pull/1226',
    id: 627975,
    created_at: '2011-12-23T19:45:34Z' }
	 */
	// maps user_name -> list of pull request dict
	var context = { number_pull_requests: pull_requests.length }

	var user_data = {};
	for(var i = 0; i < pull_requests.length; i++) {
		pull = pull_requests[i];
		var username = pull.user.login
		if (!(username in user_data)) {
			user_data[username] = [];
		}
		user_data[username].push(pull)
	}
	var per_user_stats = [];
	for (var username in user_data) {
		per_user_stats.push({
			'username': username,
			'stats': user_stats(user_data[username])
		});
	}
	per_user_stats.sort(function(a, b) {
		return a.stats.avg_total_life_span - b.stats.avg_total_life_span;
	});

	context.user_stats = per_user_stats;
	return context;
}

var user_stats = function(pulls) {
	// pull request counts
	var number_pull_requests = pulls.length;
	var number_merged = 0;
	var number_stale = 0;
	var number_tested = 0;
	// commit counts
	var number_commits = 0;
	// avg times
	var merged_life_span_time = 0; // against number_merged
	var total_life_span_time = 0; // against number_pull_requests
	var stale_time = 0; // against number_stale

	var now = Date.now();
	for(var i = 0; i < pulls.length; i++) {
		var pull = pulls[i];
		var created_at = Date.parse(pull.created_at);
		var updated_at = Date.parse(pull.updated_at);
		var merged_at = pull.merged_at;
		var closed_at = pull.closed_at;
		if (merged_at) { merged_at = Date.parse(merged_at); }
		if (closed_at) { closed_at = Date.parse(closed_at); }

		if (merged_at) {
			number_merged++;
			merged_life_span_time += (merged_at - created_at);
		}
		if (!merged_at && !closed_at) {
			number_stale++;
			stale_time += (now - updated_at);
		}
		if (closed_at) {
			total_life_span_time += (closed_at - created_at);
		} else {
			total_life_span_time += (now - created_at);
		}
	}
	return {
		number_pull_requests: number_pull_requests,
		number_merged: number_merged,
		number_stale: number_stale,
		number_tested: number_tested,
		number_commits: number_commits,
		avg_merged_life_span: avg_days(merged_life_span_time, number_merged),
		avg_total_life_span: avg_days(total_life_span_time, number_pull_requests),
		avg_stale_life_span: avg_days(stale_time, number_stale),
		}
}

var avg_days = function(total_seconds, number) {
	if (number) {
		avg_seconds = total_seconds / number;
		return (avg_seconds / 1000 / 60 / 60 / 24).toFixed(1);
	} else {
		return 0;
	}
}
