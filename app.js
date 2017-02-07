var express = require('express');
var session = require('express-session');
var router = require('./routers/router.js');

var app = express();

app.set('views', __dirname + '/views')
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use('/avatar', express.static(__dirname + '/avatar'));
app.use(session({
	secret: 'sone',
	resave: false,
	saveUninitialized: true,
	cookie: {secure: false}
}));

app.get('/', router.showIndex); // 首页

app.get('/regist', router.showReg); // 注册
app.post('/doReg', router.doReg);

app.get('/login', router.showLog); // 登录
app.post('/doLog', router.doLog);

app.get('/setAvatar', router.showSetAvatar); // 设置头像
app.post('/dosetavatar', router.doSetAvatar);
app.post('/getcopypath', router.getCopyPath);
app.get('/docrop', router.doCrop);

app.post('/publish', router.publish); //发表Talk

app.get('/page', router.page);
app.get('/gettalkamount', router.getTalkAmount); // 获取talk数量以分页

app.get('/user/:username', router.showUser); // 显示指定用户talk
app.get('/userpage', router.getUserPage);
app.get('/userlist', router.showUserList); // 显示用户列表
app.post('/comment', router.comment);
app.get('/exit', router.exit); // 退出登录

app.get('/deletetalk', router.deleteTalk); // 删除talk
app.get('/deletecomment', router.deleteComment); // 删除talk评论

app.listen(3000);