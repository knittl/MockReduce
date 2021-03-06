/**
 * @constructor
 */
MockReduce.Installer = function() {};

/**
 * The original connector
 *
 * @type {MongoClient|Mongoose}
 * @private
 */
MockReduce.Installer.prototype._connector = null;

/**
 * The original connect() function of the connector
 *
 * @type {function}
 * @private
 */
MockReduce.Installer.prototype._originalConnect = null;

/**
 * The original createConnection() function of the connector
 *
 * @type {function}
 * @private
 */
MockReduce.Installer.prototype._originalCreateConnection = null;

/**
 * The original model() function of the connector
 *
 * @type {function}
 * @private
 */
MockReduce.Installer.prototype._originalModel = null;

/**
 * Is MockReduce currently installed?
 *
 * @type {boolean}
 * @private
 */
MockReduce.Installer.prototype._isInstalled = false;

/**
 * Available connector types
 *
 * @type {{NATIVE: string, MONGOOSE: string}}
 */
MockReduce.Installer.prototype.CONNECTOR_TYPE = {
	NATIVE: 'native',
	MONGOOSE: 'mongoose'
};

/**
 * Install MockReduce for a MongoClient or Mongoose connector
 *
 * @param connector
 * @param mockReduce
 */
MockReduce.Installer.prototype.install = function(connector, mockReduce) {
	if (!this._isInstalled) {
		this._connector = connector;
		this._installConnect(mockReduce);
		this._installCreateConnection();
		this._installModel(mockReduce);
		this._isInstalled = true;
	}
};

/**
 * Determines the connector type
 *
 * @returns {string}
 * @private
 */
MockReduce.Installer.prototype._determineConnectorType = function () {
	if (this._connectorHasCreateConnection()) {
		return this.CONNECTOR_TYPE.MONGOOSE;
	}
	return this.CONNECTOR_TYPE.NATIVE;
};

/**
 * Check if connector has a .createConnection method
 *
 * @returns {boolean}
 * @private
 */
MockReduce.Installer.prototype._connectorHasCreateConnection = function () {
	return (this._connector.createConnection != undefined);
};

/**
 * Install the .connect method
 *
 * @private
 */
MockReduce.Installer.prototype._installConnect = function (mockReduce) {
	this._originalConnect = this._connector.connect;
	this._connector.connect = function(url, callback) {
		callback = callback || function() {};
		var returnMockReduce = function (callback) {
			if (typeof callback === 'function') {
				callback(null, mockReduce);
				return mockReduce;
			}

			return Promise.resolve(mockReduce);
		};

		callback(null, {
			collection: function(name, options, callback) {
				// never returns a promise, therefor cannot use returnMockReduce function
				if(typeof options == 'function') callback = options, options = {};
				options = options || {};

				if(options == null || !options.strict) {
					try {
						var collection = mockReduce;
						if(callback) callback(null, collection);
						return collection;
					} catch(err) {
						if(callback) return callback(err);
						throw err;
					}
				}

				return callback(null, mockReduce);
			},
			close: function(force, callback) {
				return returnMockReduce(callback);
			}
		});
	};
};

/**
 * Install the .createConnection method
 *
 * @private
 */
MockReduce.Installer.prototype._installCreateConnection = function () {
	if (this._connectorHasCreateConnection()) {
		this._originalCreateConnection = this._connector.createConnection;
		this._connector.createConnection = function() {};
	}
};

/**
 * Install the .model method
 *
 * @param mockReduce
 * @private
 */
MockReduce.Installer.prototype._installModel = function (mockReduce) {
	if (this._connector.model != undefined) {
		this._originalModel = this._connector.model;

		var me = this;
		this._connector.model = function (name, schema, collection, skipInit) {
			var model = me._originalModel.call(me._connector, name, schema, collection, skipInit);
			model.mapReduce = function () {
				return mockReduce.mapReduce.apply(mockReduce, arguments);
			};
			return model;
		}
	}
};

/**
 * Uninstall MockReduce and restore the original connector
 * 
 */
MockReduce.Installer.prototype.uninstall = function () {
	this._connector.connect = this._originalConnect;
	if(this._originalCreateConnection != null) {
		this._connector.createConnection = this._originalCreateConnection;
	}
	if(this._originalModel != null) {
		this._connector.model = this._originalModel;
	}
	this._isInstalled = false;
};