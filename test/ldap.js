var ldap = require('ldapjs');
const Config = require('../lib/Config.js');

var client = ldap.createClient({
	url: 'ldap://'+ Config.DC.IP +'/',
	timeout: 5000,
	connectTimeout: 10000
});

var opts = {
  filter: '(&(cn=*)(objectClass=computer))',
  scope: 'sub',
  // This attribute list is what broke your solution
  attributes:['cn','dn','ms-Mcs-AdmPwd','ms-Mcs-AdmPwdExpirationTime']
};
console.log('--- going to try to connect user ---');
try {
	client.bind(Config.DC.Username, Config.DC.Password, function (error) { //first need to bind
		if(error){
			console.log("1 "+ error.message);
			client.unbind(function(error) {if(error){console.log  ("2 "+ error.message);} else{console.log('client disconnected');}});
		} else {
			console.log('connected');
			client.search(Config.DC.BaseDN, opts, function(error, search) {
				console.log('Searching.....');
				if(error) console.log("3 "+ error.message);

				search.on('searchEntry', function(entry) {
					if(entry.object){
						if(entry.object['ms-Mcs-AdmPwdExpirationTime']) {
							console.log((new Date(entry.object['ms-Mcs-AdmPwdExpirationTime'])).toString());
						}
						console.log('entry: %j ' + JSON.stringify(entry.object));
					}
					client.unbind(function(error) {if(error){console.log("4 "+ error.message);} else{console.log('client disconnected');}});
				});

				search.on('error', function(error) {
					console.error('error: ' + error.message);
					client.unbind(function(error) {if(error){console.log("5 "+ error.message);} else{console.log('client disconnected');}});
				});
			});
		}
	});
} catch(error){
   console.log("6 ", error);
   client.unbind(function(error) {if(error){console.log("7 "+ error.message);}       else{console.log('client disconnected');}});
}
