var path = require('path');
var express = require('express');
var passport = require('passport');
var router = express.Router();

//const classModel = require('../modules/my_class');
var nodemailer = require('nodemailer');
var loginEmailUser = 'wonder3@qq.com'
var mailTransport = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secureConnection: true, // use SSL
    auth: {
        user: loginEmailUser,
        pass: 'wengdezhao041321'
    },
});
/* GET index page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' }); // 到达此路径则渲染index文件，并传出title值供 index.html使用
});
/* GET login page. */
router.route("/login").get(function(req, res) { // 到达此路径则渲染login文件，并传出title值供 login.html使用
    res.render("login", { title: 'User Login' });
}).post(function(req, res) { // 从此路径检测到post方式则进行post数据的处理操作
    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
    var uname = req.body.uname; //获取post上来的 data数据中 uname的值
    User.findOne({ name: uname }, function(err, doc) { //通过此model以用户名的条件 查询数据库中的匹配信息
        if (err) { //错误就返回给原post处（login.html) 状态码为500的错误
            res.send(500);
            console.log(err);
        } else if (!doc) { //查询不到用户名匹配信息，则用户名不存在
            req.session.error = '用户名不存在';
            res.send(404); //	状态码返回404
            //	res.redirect("/login");
        } else {
            if (req.body.upwd != doc.password) { //查询到匹配用户名的信息，但相应的password属性不匹配
                req.session.error = "密码错误";
                res.send(404);
                //	res.redirect("/login");
            } else { //信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
                req.session.user = doc;
                res.send(200);
                //	res.redirect("/home");
            }
        }
    });
});
// third part login
router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/home',
  failureRedirect: '/',
}));

router.get('/auth/twitter', passport.authenticate('twitter'));

router.get('/auth/twitter/callback', passport.authenticate('twitter', {
  successRedirect: '/home',
  failureRedirect: '/',
}));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/auth/google/callback', passport.authenticate('google', {
  successRedirect: '/home',
  failureRedirect: '/',
}));


/* GET register page. */
router.route("/register").get(function(req, res) { // 到达此路径则渲染register文件，并传出title值供 register.html使用
    let { uname, upwd, uemail, registerMd5 } = req.query
    console.log(req.query, '----')
    if (uname && upwd && uemail && registerMd5) {
        console.log('inFind')
        let User = global.dbHandel.getModel('user');
        User.findOne({ name: uname, password: upwd, email: uemail }, (err, doc) => {
            if (doc) {
                // req.session.error = '您已经登录，正在跳转';
                req.session.user = doc;
                res.redirect('/home')
            } else if (registerMd5 === 'register') {
                console.log('indexCreate')
                User.create({ // 创建一组user对象置入model
                    name: uname,
                    password: upwd,
                    email: uemail,
                }, function(err, doc) {
                    console.log(err, doc)
                    if (err) {
                        res.send(500);
                        console.log(err);
                    } else {
                        // req.session.error = '激活成功。。正在跳转';
                        req.session.user = doc;
                        res.redirect('/home')
                    }
                });
            } else {
                res.render("register", { title: 'User register' });
            }
        })
    } else {
        res.render("register", { title: 'User register' });
    }
}).post(function(req, res) {
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var User = global.dbHandel.getModel('user');
    let { uname, upwd, uemail } = req.body
    if (!uname || !upwd || !uemail) {
        res.send(403)
        req.session.error = '信息缺失';
        return
    }
    User.findOne({ name: uname }, function(err, doc) { // 同理 /login 路径的处理方式
        if (err) {
            res.send(500);
            req.session.error = '网络异常错误！';
            console.log(err);
        } else if (doc) {
            req.session.error = '用户名已存在！';
            res.send(500);
        } else {
            var options = {
                from: loginEmailUser,
                to: `<${uemail}>`,
                subject: '一封来自sbbbb的邮件',
                text: '一封来自sbbbb的邮件',
                html: `
								<h1>你好，这是一封来自NodeMailer的邮件！</h1>
								<a href="http://localhost:3000/register?uname=${uname}&upwd=${upwd}&uemail=${uemail}&registerMd5=register">验证您的邮件</a>
								` //registerMd5我随便设置的，一般需要用加密字符串,密码等信息也不应该放url上
            };
            console.log(options)
            mailTransport.sendMail(options);
            req.session.error = '用户名创建成功！,请登录到您的邮箱验证。。';
            res.send(200)
        }
    });
});

/* GET home page. */
router.get("/home", function(req, res) {
    if (!req.session.user) { //到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login"); //未登录则重定向到 /login 路径
    }
    res.render("home", { title: '1' }); //已登录则渲染home页面
});

/* GET logout page. */
router.get("/logout", function(req, res) { // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
    res.redirect("/");
});

module.exports = router;