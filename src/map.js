/**
 * @param scope
 * @constructor
 */
MockReduce.Map = function(scope) {
	this._scope = scope;
	this._resetState();
};

/**
 * MockReduce.Scope instance
 *
 * @type {MockReduce.Scope}
 * @private
 */
MockReduce.Map.prototype._scope = null;

/**
 * Storage for all emits for the last map operation
 *
 * @type {Array}
 * @private
 */
MockReduce.Map.prototype._emits = null;

/**
 * Storage for all mapped data for the last map operation
 *
 * @type {Array}
 * @private
 */
MockReduce.Map.prototype._mappedData = null;

/**
 * Reset state. Clears all emits and mapped data
 *
 * @private
 */
MockReduce.Map.prototype._resetState = function () {
	this._resetEmits();
	this._resetMappedData();
};

/**
 * Resets all saved emits
 *
 * @private
 */
MockReduce.Map.prototype._resetEmits = function () {
	this._emits = [];
};

/**
 * Resets als saved mapped data
 *
 * @private
 */
MockReduce.Map.prototype._resetMappedData = function () {
	this._mappedData = {};
};

/**
 * Map a provided data set with a provided map function
 *
 * @param testData
 * @param mapFunction
 * @returns {Array}
 */
MockReduce.Map.prototype.run = function (testData, mapFunction) {
	this._resetState();
	this._exposeEmit();

	for (var i in testData) {
		if (!testData.hasOwnProperty(i)) {
			continue;
		}

		// Make sure that the current element from the data set is available as this in
		// the provided map function
		mapFunction.apply(testData[i]);
	}
	this._scope.concealAll();
	return this.getMappedData();
};

/**
 * Mock for MongoDBs emit functionality
 * Stores all emits and groups the data
 *
 * @param key
 * @param value
 * @returns {{_id: *, value: *}}
 */
MockReduce.Map.prototype.emit = function (key, value) {
	var mappedData = {
		"_id": key,
		"value": value
	};
	this._emits.push(mappedData);
	this._addMappedDataToItsIdGroup(mappedData);

	return mappedData;
};

/**
 * Expose emit functionality for all map operations
 *
 * @private
 */
MockReduce.Map.prototype._exposeEmit = function () {
	var me = this;

	this._scope.expose({
		emit: function(key, value) {
			me.emit(key, value);
		}
	});
};

/**
 * Return all stored emits from the last map operation
 *
 * @returns {Array}
 */
MockReduce.Map.prototype.getEmits = function () {
	return this._emits;
};

/**
 * Return all stored mapped data from the last map operation
 *
 * @returns {Array}
 */
MockReduce.Map.prototype.getMappedData = function () {
	var mappedData = this._mappedData;
	return Object.keys(mappedData).map(function (key) {return mappedData[key]});
};

/**
 * Add a provided element from a data set to its id group
 * Create this group if it does not exist yet
 *
 * @param mappedData
 * @private
 */
MockReduce.Map.prototype._addMappedDataToItsIdGroup = function (mappedData) {
	var key = this._getKey(mappedData._id);

	if (this._mappedData[key] == undefined) {
		this._mappedData[key] = {
			"_id": mappedData._id,
			"value": []
		};
	}
	this._mappedData[key].value.push(mappedData.value);
};

/**
 * Calculates a string to be used as a key for the mapped data.
 *
 * - For objects a JSON representation with all properties sorted is returned.
 * - For primitives the primitive is returned as a JSON string.
 *
 * @param id id to create key for
 * @returns JSON string to be used as map key
 * @private
 */
MockReduce.Map.prototype._getKey = function (id) {
	return JSON.stringify(this._sortKey(id));
};

/**
 * Sorts the properties of the object to be used as key for the mapped data:
 *
 * - If it is a primitive type, it is returned unaltered.
 * - If it is an object, a new object with all properties in sorted order is returned.
 *
 * The algorithm is applied recursively to nested objects.
 *
 * @param id id to calculate key for, can be either object or primitive
 * @returns the sorted object or unaltered primitive
 * @private
 */
MockReduce.Map.prototype._sortKey = function (id) {
	if (id !== Object(id)) return id;

	var keys = Object.keys(id).sort();
	var sortedObject = keys.map(key => {
		var value = id[key];

		var o = {};
		o[key] = this._sortKey(value);
		return o;
	}).reduce((o, a) => Object.assign(o, a), {});

	return sortedObject;
};
