/**
 * Beschreibt einen Computer, der durch LAPS gemanaged ist
 */

class Computer {
	/**
	 * Common Name des Computers
	 * In der Regel der hostname
	 */
	CN = null;
	
	/**
	 * DN
	 */
	DN = null;
	
	/**
	 * Benutzername des lokalen Administrators
	 * Wird aus dem Hostname und dem in der Config angegebenen Benutzernamen gebildet
	 */
	Username = null;
	
	/**
	 * Passwort.
	 */
	Password = null;
	
	/**
	 * Ablaufdatum als Date-Object
	 */
	Expire = null;
	
	/**
	 * Betriebssystem
	 */
	OS = null;
	
	/**
	 * FQN
	 */
	DNS = null;
}

module.exports = Computer;