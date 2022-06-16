/**
 * Middleware zur Authentifizierung
 */
const Logger = require('bunyan').createLogger({name: 'Lib.Auth'});

module.exports = function(ActiveDirectoryLink) {
	return function(req, resp, next) {
		if(!req.headers.authorization) { return next(); }
		if((req.headers.authorization || '').split(' ').length != 2) {
			Logger.trace("Authentication != 2; skipping");
			return next();
		}
		var [Username, Password] = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString().split(':');
		Username = Buffer.from(Username, 'base64').toString();
		Password = Buffer.from(Password, 'base64').toString();
		
		Logger.trace("Validating credentials...");
		ActiveDirectoryLink.authenticateUser(Username, Password).then(function(User) {
			if(User == null) {
				Logger.info("Invalid credentials committed. Ignoring.");
				return next();
			}
			Logger.trace("User was authenticated");
			req.AuthenticatedUser = User;
			next();
		}).catch(function(err) {
			Logger.error("Error when authenticating: ", err);
			next();
		});
	};
}