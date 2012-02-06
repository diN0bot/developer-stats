
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/static'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);
app.get('/idx/:access_token/', routes.index__accesss_token);
app.get('/idx/:org/:repo/', routes.index__org_repo);
app.get('/idx/:org/:repo/:access_token/', routes.index__org_repo_access_token);

app.get('/oauth_getcode/', routes.oauth_getcode);
app.get('/oauth_getcode/:org/:repo/', routes.oauth_getcode);

app.get('/oauth_code_callback/', routes.oauth_code_callback);
app.get('/oauth_code_callback/:org/:repo/', routes.oauth_code_callback);

app.get('/stats/:org/:repo/:access_token/', routes.stats);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
