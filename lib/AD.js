/**
 * Wrapper um die Anbindung zum AD
 */

const ldap = require('ldapjs');
const activedirectory = require('activedirectory');

const Computer = require('./Entity/Computer.js');
const User = require('./Entity/User.js');

const Config = require('./Config.js');

const Logger = require('bunyan').createLogger({name: 'Lib.AD'});

class AD {
	/**
	 * LDAP Handle
	 */
	Handle = null;
	
	/**
	 * Active Directory Handle
	 */
	ADHandle = null;
	
	/**
	 * LDAP-Verbindungsstring
	 */
	LDAP = null;
	
	/**
	 * Authentifizierungsdaten
	 */
	Authentication = {"User": null, "Pass": null};
	
	/**
	 * Basis-DN
	 */
	BaseDN = null;
	
	/**
	 * Konstruktor
	 * @param string LDAP Der LDAP-String
	 * @param string Username Benutzername zur Authentifizierung
	 * @param string Password Ein Kennwort
	 * @param string BaseDN Die Basis-DN, in der gesucht wird
	 */
	constructor(LDAP, Username, Password, BaseDN) {
		this.LDAP = LDAP;
		this.Authentication.User = Username;
		this.Authentication.Pass = Password;
		this.BaseDN = BaseDN;
	}
	
	/**
	 * Baut die Verbindung auf
	 * @param void
	 * @return Promise
	 */
	connect() {
		var that = this;
		return new Promise(function(resolve, reject) {
			if(that.Handle != null) return resolve();
			Logger.info("Connecting to ldap server "+ that.LDAP);
			
			that.Handle = ldap.createClient({
				url: that.LDAP,
				timeout: 5000,
				connectTimeout: 10000,
				reconnect: {
					initialDelay: 100,
					maxDelay: 1000,
					failAfter: 10
				}
			});
			
			that.Handle.on("error", function(err) {
				if(err.message.indexOf("ECONNRESET") >= 1) Logger.info("Connection reset; will reconnect soon");
				else Logger.error("Error in LDAP connection: "+ err.message);
			});
			
			Logger.info("Logging in as "+ that.Authentication.User);
			try {
				that.Handle.bind(that.Authentication.User, that.Authentication.Pass, function(err) {
					if(err) {
						Logger.error("Error: ", err);
						that.Handle.unbind();
						that.Handle = null;
						return reject(err);
					}
					Logger.debug("Connected");
					that.__setupBindOnReconnect();
					return resolve();
				});
			} catch(e) {
				Logger.error("Exception: ", e);
				return reject(e);
			}
		});
	}
	
	/**
	 * Liest sämtliche Rechner sowie deren Status in Blick auf das lokale Admin-PW aus
	 * @param void
	 * @return void
	 */
	getAllComputers() {
		Logger.trace("getAllComputers()");
		return this.filterComputer('*');
	}
	
	/**
	 * Filtert nach einem CommonName und gibt ein Array an Results zurück
	 * @param string Filter Filter für den CommonName - kann "*" sein
	 * @param optional string UseDN Wenn die DN von der BaseDN abweicht
	 * @return Promise
	 */
	filterComputer(Filter, UseDN = null) {
		var that = this;
		if(UseDN == null) UseDN = that.BaseDN;
		Logger.trace("filterComputer("+ Filter +", "+ UseDN +")");
		
		return new Promise(function(resolve, reject) {
			that.connect().then(function() {
				var opts = {
					filter: '(&(cn='+ Filter +')(objectClass=computer)(ms-Mcs-AdmPwd=*))',
					scope: 'sub',
					attributes:['cn','dn','ms-Mcs-AdmPwd','ms-Mcs-AdmPwdExpirationTime','operatingSystem','dNSHostName']
				};
				
				
				that.Handle.search(UseDN, opts, function(err, search) {
					if(err) return reject(error);
					
					var ret = [];
					
					search.on('searchEntry', function(entry) {
						if(!entry.object) return;
						var x = new Computer();
						x.CN = entry.object.cn;
						x.DN = entry.object.dn;
						x.Username = x.CN +"\\"+ Config.LAPS.Username;
						x.Password = entry.object['ms-Mcs-AdmPwd'] || null;
						x.Expire = new Date((entry.object['ms-Mcs-AdmPwdExpirationTime'] / 10000) - 11644473600000) || null;
						x.OS = entry.object['operatingSystem'];
						x.DNS = entry.object['dNSHostName'];
						ret[ret.length] = x;
					});

					search.on('error', function(err) {
						return reject(err);
					});
					
					search.on('end', function() {
						return resolve(ret);
					});
				});
			});
		});
	}
	
	/**
	 * Interne Helferfunktion: initialisiert activedirectory-Modul
	 * @param void
	 * @return void
	 */
	__maybeInitActiveDirectory() {
		if(this.ADHandle != null) return;
		this.ADHandle = new activedirectory({
			url: this.LDAP,
			baseDN: this.BaseDN,
			username: this.Authentication.User,
			password: this.Authentication.Pass
		});
	}
	
	/**
	 * Interne Helferfunktion: prüft AD-Logindaten gegen und gibt Benutzergruppen (oder NULL bei falschem Login) zurück
	 * Da ich zu bequem bin, das selber zu schreiben, ist das ein Wrapper um das Modul activedirectory
	 * @param string Username
	 * @param string Password
	 * @return Promise
	 */
	authenticateUser(Username, Password) {
		var that = this;
		return new Promise(function(resolve, reject) {
			that.__maybeInitActiveDirectory();
			Logger.debug("Attempting to authenticate "+ Username);
			that.ADHandle.authenticate(Username, Password, function(err, auth) {
				if(err) return reject(err);
				if(!auth) return resolve(null);
				that.ADHandle.getGroupMembershipForUser(Username, function(err, groups) {
					if(err) return reject(err);
					if(!groups) return reject('User authenticated, but not found afterwards?');
					for(var i = 0; i < groups.length; i++)
						groups[i] = groups[i].cn;
					var ret = new User();
					ret.Name = Username;
					ret.Groups = groups;
					return resolve(ret);
				});
			});
		});
	}
	
	/**
	 * Interne Helferfunktion: bindet bei jedem reconnect neu
	 * @param void
	 * @return void
	 */
	__setupBindOnReconnect() {
		var that = this;
		that.Handle.on('connect', function() {
			Logger.info("Reconnected");
			that.Handle.bind(that.Authentication.User, that.Authentication.Pass, function(err) {
				if(err) {
					that.Handle.unbind();
					that.Handle = null;
					return reject(err);
				}
			});
		});
	}
}

module.exports = AD;