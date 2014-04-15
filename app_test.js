
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var docs = require('./model/collection_phonebook');
var mongoose = require('mongoose');
//var redis = require('redis');
var http = require('http');
var path = require('path');
var util = require('util');
var os = require('os');
var df = require('df')
var app = express();
//var client = redis.createClient(6379,'localhost',null);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('env','development');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.session({secret:"selim"}));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler({dumpExceptions: true, showStack: true}));
}
var io = require('socket.io').listen(http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
}));
//send minified client
io.enable('browser client minification');
// apply etag caching logic based on version number
io.enable('browser client etag');
// gzip the file
io.enable('browser client gzip');
// reduce logging
io.set('log level', 1);
// color the log
io.set('log colors', true);
// close timeout
io.set('close timeout', 60);
// heartbeat timeout
io.set('heartbeat timeout', 60);
// heartbeat interval
io.set('heartbeat interval', 30);
// enable all transports
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

var monitor = io
	.of('/monitor')
	.on('connection', function(socket) {
		socket.on('getMemoryUsage', function (callback) {
			
			callback(process.memoryUsage());
			/*console.log(util.inspect(process.memoryUsage()));*/
		});
		socket.on('getCpuUsage', function (callback) {
			callback(os.cpus());
			/*console.log(util.inspect(os.cpus()));*/
		});
		socket.on('getOsMemory', function (callback) {
			callback({ 
				free: os.freemem(), 
				total: os.totalmem()
			});
		});
		socket.on('getDiskSpace',function(callback){
			  df(function (err, table) {
				    if (err) {
				      console.error(err.stack);
				      return;
				    }
				    callback(table);
				   // console.log(JSON.stringify(table, null, '  '));
				  });
		});
	});

app.use("/index",function(req,res,next){
	res.render("./monitor",{data:'suc'});
});



