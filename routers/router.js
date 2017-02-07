var fs = require('fs');
var path = require('path');
var formidable = require('formidable');
var gm = require('gm');
var ObjectId = require('mongodb').ObjectId;
var db = require('../models/db');
var md5 = require('../models/md5');

exports.showIndex = showIndex; //首页
exports.showReg = showReg; // 注册
exports.doReg = doReg;
exports.showLog = showLog; // 登录
exports.doLog = doLog;
exports.showSetAvatar = showSetAvatar; // 修改头像
exports.doSetAvatar = doSetAvatar;
exports.getCopyPath = getCopyPath;
exports.doCrop = doCrop;
exports.publish = publish; // 发表Talk
exports.page = page; // Talk分页
exports.getTalkAmount = getTalkAmount;
exports.showUser = showUser; // 显示用户主页
exports.getUserPage = getUserPage;
exports.showUserList = showUserList; // 显示成员列表
exports.comment = comment; //显示评论
exports.exit = exit; // 退出登录
exports.deleteTalk = deleteTalk; // 删除talk
exports.deleteComment = deleteComment; // 删除talk评论

//首页
function showIndex(req, res, next) {
	db.count('talk', function(count) {
		if(req.session.login) {
			db.find('users', {
				username: req.session.username
			}, function(err, result) {
				res.render('index', {
					login: req.session.login,
					username: req.session.username,
					avatar: result[0].avatar,
					talkAmount: count
				});
			});
		} else {
			res.render('index', {
				login: req.session.login,
				talkAmount: count
			});
		}
	});
}

// 注册
function showReg(req, res, next){
	if(req.session.login) {
		res.redirect('/');
	} else {
		res.render('reg');
	}
}

function doReg(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var username = fields.username,
			password = fields.password;

		password = md5(md5(password) + 'sone');

		db.find('users', {
			'username': username
		}, function(err, result) {
			if(err) {
				res.send('-3');
			}

			var dir = path.normalize(__dirname + '/../avatar/');
				oldPath = path.join(dir, '/default.jpg'),
				extname = path.extname(oldPath);
				newPath = path.join(dir, username) + extname,
				avatar = username + extname;

			fs.readFile(oldPath, function(err, data) {
				if(err) {
					res.send('-3');
				}

				fs.writeFile(newPath, data, function(err) {
					if(err) {
						res.send('-3');
					}

					db.insertOne('users', {
						'username': username,
						'password': password,
						'avatar': avatar
					}, function(err, result) {
						if(err) {
							res.send('-3');
						}
						req.session.login = true;
						req.session.username = username;
						req.session.avatar = avatar;
						res.send('1');
					});
				});
			});

		});
	});
}

// 登录
function showLog(req, res, next) {
	if(req.session.login) {
		res.redirect('/');
	} else {
		res.render('login');
	}
}

function doLog(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var username = fields.username,
			password = fields.password;

		password = md5(md5(password) + 'sone');

		db.find('users', {
			'username': username
		}, function(err, result) {
			if(err) {
				res.send('-3');
			}
			if(result.length) {
				if(result[0].password === password) {
					req.session.login = true;
					req.session.username = username;
					req.session.avatar = result[0].avatar;
					res.send('1');
				} else {
					res.send('-2');
				}
			} else {
				res.send('-1');
			}
		});
	});
}

// 修改头像
function showSetAvatar(req, res, next) {
	if (!req.session.login) {
		res.send('非法闯入!请<a href="/login">登录</a>!!!');
	}
	res.render('setAvatar', {
		login: true,
		username: req.session.username,
		avatar: req.session.avatar
	});
}
function doSetAvatar(req, res, next) {
	var form = new formidable.IncomingForm(),
		username = req.session.username;

	form.uploadDir = path.normalize(__dirname + '/../avatar');

	form.parse(req, function(err, fields, files) {

		var img = files.img;
		if(img.name === '') {
			res.send('-1');
		} else {
			var oldPath = img.path,
				extname = path.extname(img.name),
				time = new Date().getTime(),
				newPath = path.join(form.uploadDir, 'copy'+ time + '.' + username) + extname,
				avatar = 'copy'+ time + '.' + username + extname;

			fs.rename(oldPath, newPath, function(err) {
				if(err) {
					res.send('-3');
				}

				res.send(avatar);
			});
		}
	});
}
function getCopyPath(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var copypath = fields.copypath;

		if(err) {
			res.send('-3');
		}

		fs.unlink(path.normalize(__dirname + '/../' + copypath), function(err) {
			if(err) {
				console.log(err);
			}
		});
	});
} 
function doCrop(req, res, next) {
	var query = req.query;

	var file = query.file,
		{w, h, x, y, rw, rh} = query;

	if(file) {
		var oldPath = path.normalize(__dirname + '/../avatar/' + file),
			newPath = path.normalize(__dirname + '/../avatar/' + req.session.username + '.jpg');

		gm(oldPath)
			.resize(rw, rh)
			.crop(w, h, x, y)
			.resize(100, 100, '!')
			.write(newPath, function(err) {
				if(err) {
					res.send('-1');
					return;
				}

				fs.unlink(oldPath, function(err) {
					if(err) {
						res.send('-1');
						return;
					}
				});
				res.send('1');
			});
	} else {
		res.send('-2');
	}
}

// 发表Talk
function publish(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {
		var talk = fields.talk,
			username = req.session.username;
			obj = {
				'username': username,
				'content': talk,
				'time': getTime(),
				'avatar': req.session.avatar,
				'sortTime': new Date().getTime()
			};

		db.insertOne('talk', obj, function(err, result) {
			if(err) {
				res.send('-3');
			}
			res.send(obj);
		});
	});
}

// Talk分页
function page(req, res, next) {
	var page = req.query.page - 1;
	if(page < 0) {
		page = 0;
	}
	db.find('talk', {}, {
		'pageamount': 9,
		'page': page,
		'sort': {
			'sortTime': -1
		}
	}, function(err, result) {
		res.json({'result': result});
	});
}

function getTalkAmount(req, res, next) {
	
	db.count('talk', function(count) {
		res.send(count.toString());
	});
}

// 显示用户主页
function showUser(req, res, next) {
	var username = req.params['username'];
	db.count('talk', {
		'username': username
	}, function(count) {
		db.find('users', {
			'username': username
		}, function(err, result) {
			if(result.length) {
				if(req.session.username === username) {
					res.render('myTalk', {
						login: req.session.login,
						mytalk: req.session.username,
						avatar: result[0].avatar,
						talkAmount: count
					});
				} else {
					res.render('user', {
						login: req.session.login,
						mytalk: req.session.username,
						username: username,
						avatar: result[0].avatar,
						talkAmount: count
					});
				}
			}
		});
	});
}

function getUserPage(req, res, next) {
	var page = req.query.page - 1,
		username = req.query.user;
	if(page < 0) {
		page = 0;
	}
	db.find('talk', {
		'username': username
	}, {
		'pageamount': 9,
		'page': page,
		'sort': {
			'sortTime': 1
		}
	}, function(err, result) {
		res.json({'result': result});
	});
}

// 显示成员列表
function showUserList(req, res, next) {
	db.find('users', {}, function(err, result) {
		res.render('userlist', {
			'login': req.session.login,
			'username': req.session.username,
			'users': result
		});
	});
}

// 显示评论
function comment(req, res, next) {
	var form = new formidable.IncomingForm();

	form.parse(req, function(err, fields, files) {

		db.find('talk', {
			_id: ObjectId(fields._id)
		}, function(err, result) {
			var comment = {
				'content': fields.comment,
				'name': req.session.username,
				'time': getTime(),
				'id': new Date().getTime()
			}
			
			db.updateMany('talk', result[0], {
				$push: {'comment': comment}
			}, function(err) {
				if(err) {
					res.send('-3');
				}
				res.send([comment]);
			});
		});
	});
}

function exit(req, res, next) {
	req.session.login = false;
	res.send('1');
}

// 获取当前标准格式时间
function getTime() {
	var	date = new Date(),
		nowDate = date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate()+' '+(date.getHours() < 10?'0'+date.getHours():date.getHours())+':'+(date.getMinutes()<10?'0'+date.getMinutes():date.getMinutes())+':'+(date.getSeconds()<10?'0'+date.getSeconds():date.getSeconds());
	return nowDate;
}

// 删除talk
function deleteTalk(req, res, next) {

	db.delete('talk', {
		'_id': ObjectId(req.query.id)
	}, function(err, result) {
		if(err) {
			res.send('-3');
		} else {
			res.send('1');
		}
	});

}

// 删除talk评论
function deleteComment(req, res, next) {
	
	var _id = ObjectId(req.query.id);

	db.find('talk', {
		'_id': _id
	}, function(err, result) {
		if(result.length === 0 && err) {
			res.send('-3');
		}else {
			var comment = result[0].comment,
				id = parseInt(req.query.comment.id);
			for(var i = 0, len = comment.length; i < len; i++) {
				if(comment[i].id === id) {
					comment.splice(i, 1);
					break;
				}
			}

			db.updateMany('talk', {
				'_id': _id
			}, {
				$set: {comment: comment}
			}, function() {
				if(err) {
					res.send('-3');
				} else {
					res.send('1');
				}
			});

		}
	});
}