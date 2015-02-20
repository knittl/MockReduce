MockReduce.Map = function() {
	this._resetState();
};

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
	var me = this;

	this._resetState();

	// Expose emit functionality for all map operations
	window.emit = function(key, value) {
		me.emit(key, value);
	};

	for (var i in testData) {
		if (!testData.hasOwnProperty(i)) {
			continue;
		}

		// Make sure that the current element from the data set is available as this in
		// the provided map function
		mapFunction.apply(testData[i]);
	}

	// Conceal emit
	delete window.emit;

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
	if (this._mappedData[mappedData._id] == undefined) {
		this._mappedData[mappedData._id] = {
			"_id": mappedData._id,
			"value": []
		};
	}
	this._mappedData[mappedData._id].value.push(mappedData.value);
};