/**
 * Wrapper um den Webserver
 * Beinhaltet keine Logik in Bezug auf dieses spezifische Projekt, sondern einfach nur einen Webserver
 */
const express = require('express');
const Logger = require('bunyan').createLogger({name: 'Lib.HTTP'});

class Webserver {
	/**
	 * Handle
	 */
	Handle = null;
	
	/**
	 * Port, auf dem dieser Dienst läuft
	 */
	Port = 80;
	
	/**
	 * Auflistung von API-Methoden
	 * Array mit jeweils
	 *  U = URL
	 *  C = Funktion
	 */
	APIMethods = [];
	
	/**
	 * Genutzte Middlewares
	 */
	Middlewares = [];
	
	/**
	 * Basisverzeichnis für statische Dateien
	 */
	StaticPath = null;
	
	/**
	 * Konstruktor
	 * @param integer Port der Port, auf dem der Server später laufen soll
	 */
	constructor(Port) {
		this.Port = Port;
	}
	
	/**
	 * Registriert eine API-Funktion
	 * @param string APIPath der Pfad der API-Methode
	 * @param callable Function Die Funktion, die abgerufen werden soll
	 * @return void
	 */
	register(APIPath, Function) {
		Logger.trace("Registered URL ", APIPath);
		this.APIMethods[this.APIMethods.length] = {
			"U": APIPath,
			"C": Function
		};
	}
	
	/**
	 * Registriert eine Middleware
	 * @param callable Middleware
	 * @return void
	 */
	registerMiddleware(Middleware) {
		Logger.trace("Registered Middleware");
		this.Middlewares[this.Middlewares.length] = Middleware;
	}
	
	/**
	 * Setzt das Basisverzeichnis für statische Dateien
	 * @param string Path
	 * @return void
	 */
	setRoot(Path) {
		Logger.trace("Base path: ", Path);
		this.StaticPath = Path;
	}
	
	/**
	 * Startet den Webserver
	 * @param void
	 * @return Promise
	 */
	start() {
		var that = this;
		return new Promise(function(resolve, reject) {
			Logger.trace("Setting up express");
			that.Handle = express();
			Logger.trace("Setting up middleware");
			for(var i = 0; i < that.Middlewares.length; i++) {
				that.Handle.use(that.Middlewares[i]);
			}
			Logger.trace("Setting up URLs");
			for(var i = 0; i < that.APIMethods.length; i++) {
				that.Handle.get(that.APIMethods[i].U, that.APIMethods[i].C);
			}
			Logger.trace("Setting up base dir");
			that.Handle.get('/', function(req, res) { res.sendFile(require('path').join(that.StaticPath, 'index.html')); });
			that.Handle.use(express.static(that.StaticPath));
			Logger.info("Launching server on port "+ that.Port);
			that.Handle.listen(that.Port, function() { Logger.debug("Launched"); return resolve(); })
			.once('error', function(err) { Logger.error("Error: ", err); return reject(err); }); 
		});
	}
}

module.exports = Webserver;