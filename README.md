# MockReduce
A mock for mongodbs/mongoose's mapReduce in order to achieve testability

## Installation

```bash
npm install mock-reduce
```

## Usage
```javascript
var mockReduce = require('mock-reduce');
```

So far I have only tested implementations with [node for jasmine](http://jasmine.github.io/2.2/node.html). Generally it should work with any other testing framework.

## Using MockReduce with mongoose
```javascript
var mongoose = require('mongoose');
var mockReduce = require('mock-reduce');

describe('Mongoose Test', function() {
	it('runs a mock reduce and returns the expected data', function() {
		var testData = [
			{"someId": 42, "someString": "Chickens don't clap!", "value": 4},
			{"someId": 5, "someString": "I'm on the job.", "value": 5},
			{"someId": 42, "someString": "Annyong", "value": 8},
			{"someId": 5, "someString": "Come on, this is a Bluth family celebration.", "value": 5}
		];
		
		var reducedData = [
			{"_id": 5, value: 10},
			{"_id": 42, value: 12}
		];
		
		mockReduce.install(mongoose);
		mockReduce.setNextTestData(testData);
		var model = require('./models/myModel');
		var result = model.someMethodThatCallsMapReduce();
		expect(result).toEqual(reducedData);
		mockReduce.uninstall();
	});
});
```

## Using mockReduce with with node-mongodb-native
__Caution: This feature is still work in progress. Generally it should work, I haven't fully tested it yet__
```javascript
var mongodb = require('mongodb');
var mockReduce = require('mock-reduce');

describe('node-mongodb-native Test', function() {
	it('runs a mock reduce and returns the expected data', function() {
		var testData = [
			{"someId": 42, "someString": "Chickens don't clap!", "value": 4},
			{"someId": 5, "someString": "I'm on the job.", "value": 5},
			{"someId": 42, "someString": "Annyong", "value": 8},
			{"someId": 5, "someString": "Come on, this is a Bluth family celebration.", "value": 5}
		];
		
		var reducedData = [
			{"_id": 5, value: 10},
			{"_id": 42, value: 12}
		];
		
		mockReduce.install(mongodb);
		mockReduce.setNextTestData(testData);
		mongodb.connect('mongodb://localhost:27017/test', function(err, db) {
			var collection = db.collection('collection_name');
			var map = function() {...}
			var reduce = function() {...}
			var options = {
				scope: {
					additional: 'variable'
				}
			};
			var result = collection.mapReduce(map, reduce, options);
		});
		expect(result).toEqual(reducedData);
		mockReduce.uninstall();
	});
});
```

## Available methods
MockReduce stores almost every step of the map reduce step. Try one of the following methods:
```javascript
mockReduce.map.getEmits();
mockReduce.map.getMappedData();
mockReduce.reduce.getReducedData();
```

## Supported methods
So far the following methods are supported:
- map
- reduce
- finalize
- scope
- done callback

## Running the tests
MockReduce was completely developed test-drive. If you wish to run its own tests, clone the git repo and run
```bash
npm install
npm test
```
