const AD = require('./lib/AD.js');
const Webserver = require('./lib/Webserver.js');
const Config = require('./lib/Config.js');
const AuthenticationMiddleware = require('./lib/AuthenticationMiddleware.js');

var ad = new AD(
	'ldap://'+ Config.DC.IP +'/',
	Config.DC.Username,
	Config.DC.Password,
	Config.DC.BaseDN
);

var webserver = new Webserver(Config.Server.HTTPPort);

// Authentifizierungs-Middleware binden
webserver.registerMiddleware(AuthenticationMiddleware(ad));

// APIs binden
webserver.register('/computers/all', function(req, resp) {
	ad.getAllComputers()
	.then(function(list) { resp.send(JSON.stringify(list)); })
	.catch(function(err) { resp.send(JSON.stringify(err)); });
});

webserver.register('/me', function(req, resp) {
	if(typeof req.AuthenticatedUser == "undefined") return resp.send('{}');
	else return resp.send(JSON.stringify(req.AuthenticatedUser));
});

// Statischen Pfad setzen
webserver.setRoot(__dirname +"/public");

// Server starten
webserver.start().then(function() {
	console.log("OK!");
}).catch(function(err) {
	console.log(err);
});

/*
ad.filterComputer('*').then(function(Computer) {
	console.log(JSON.stringify(Computer, null, 2));
}).catch(function(err) {
	console.log("Error ", err);
});

ad.authenticateUser('muster@tino-ruge.de', 'MadMax77').then(function(User) {
	console.log("User: ", JSON.stringify(User));
});
*/