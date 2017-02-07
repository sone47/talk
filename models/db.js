var MongoClient = require('mongodb').MongoClient;
var setting = require('../setting');

function _connectDB(callback) {
	var url = setting.dburl;

	MongoClient.connect(url, function(err, db) {
		callback(err, db);
	});
}

init();

function init() {
	_connectDB(function(err, db) {
		if(err) {
			console.log(err);
			return;
		}
		db.collection('users').createIndex({
			'username': 1
		}, null, function(err, result) {
			if(err) {
				console.log(err);
				return;
			}
			console.log('索引建立成功');
		});
	});
}

// 插入数据
exports.insertOne = function(collection, json, callback) {
	_connectDB(function(err, db) {
		db.collection(collection).insertOne(json, function(err, result) {
			callback(err, result);
			db.close();
		});
	});
};

exports.insertMany = function(collection, arr, callback) {
	_connectDB(function(err, db) {
		db.collection(collection).insertMany(arr, function(err, result) {
			callback(err, result);
			db.close();
		});
	});
};

// 查找数据
exports.find = function(collection, json, args, callback) {
	json = json || {};
	if(callback === undefined) {
		callback = args;
		args = {
			"pageamount": 0,
			"page": 0,
			"sort": {}
		}
	}

	var result = [];

	var limitNum = args.pageamount || 0,
		skipNum = args.pageamount * args.page || 0,
		sort = args.sort || {};

	if(skipNum < 0) {
		skipNum = 0;
		limitNum = 0;
	}

	_connectDB(function(err, db) {
		if(err) {
			console.log(err);
			db.close();
		}
		var cursor = db.collection(collection).find(json).limit(limitNum).skip(skipNum).sort(sort);
		// 游标遍历
		cursor.each(function(err, doc) {
			if(doc !== null) {
				result.push(doc);
			} else {
				callback(null, result);
				db.close();
			}
		});
	});
};

// 也有deleteMany和deleteOne
exports.delete = function(collection, json, callback) {
	_connectDB(function(err, db) {
		db.collection(collection).deleteMany(json, function(err, result) {
			callback(err, result);
			db.close();
		});
	});
};

// 花式修改,这里选了其中一种
exports.updateMany = function(collection, json1, json2, callback) {
	_connectDB(function(err, db) {
		db.collection(collection).updateMany(json1, json2, function(err, result) {
			callback(err, result);
			db.close();
		});
	});
};

exports.count = function(collection, json, callback) {
	if(callback === undefined) {
		callback = json;
	}
	_connectDB(function(err, db) {
		db.collection(collection).count(json, function(err, count) {
			callback(count);
			db.close();
		});
	});
};