const Config = require('../lib/Config.js');
const AD = require('../lib/AD.js');

var ad = new AD(
	'ldap://'+ Config.DC.IP +'/',
	Config.DC.Username,
	Config.DC.Password,
	Config.DC.BaseDN
);

ad.filterComputer('*').then(function(Computer) {
	console.log(JSON.stringify(Computer, null, 2));
}).catch(function(err) {
	console.log("Error ", err);
});

ad.authenticateUser('muster@tino-ruge.de', 'MadMax77').then(function(User) {
	console.log("User: ", JSON.stringify(User));
}).catch(function(err) { console.log("Failed to authenticate"); });