var uuid = require('uuid');
var mysql = require('./mysql');
var crypto = require ('crypto');
var utils = require('./utils');
var express = require('express');
var mail = require('./email');
var config = require('./config');
var tk = require('./token');
var errcode = require('./errcode');
var log = require('./mylog');
var router = express.Router();

const UUIDKEY = '76692820-404b-11eb-8525-cfa1c2d3aaad';

mysql.init();

function changeTimeZone(data) {
    for (var i = 0; i < data.length; i++) {
        data[i].orderPlacedDate = utils.convertDateToCST(data[i].orderPlacedDate);
        data[i].createTime = utils.convertTimeToCST(data[i].createTime);
        data[i].updateTime = utils.convertTimeToCST(data[i].updateTime);
        data[i].confirmTime = utils.convertDateToCST(data[i].confirmTime);
        data[i].shipTime = utils.convertDateToCST(data[i].shipTime);
    }
    return data;
}

function changeAuthCodeTimeZone(data) {
    for(var i = 0; i < data.length; i++){
        data[i].createTime = utils.convertTimeToCST(data[i].createTime);
        data[i].updateTime = utils.convertTimeToCST(data[i].updateTime);
    }
    return data;
}

function loginHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    if (body.userName==""||body.userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to login:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    if (body.password==""||body.password==undefined) {
        var ret = errNoPassword;
        var msg = errcode.errNoPassword;
        log.error('fail to login:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    var userName = body.userName;
    var password = body.password;
    log.debug('userName:', userName);
    mysql.queryUserInfoByUserName(userName).then(function(data){
        if (data.length==0) {
            var ret = errLogin;
            var msg = errcode.errLogin;
            log.error('fail to login:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
        } else {
            const hash = crypto.createHash('sha1');
            var hashPassword = hash.update(password+data[0].salt).digest('hex');
            if (data[0].password==hashPassword) {
                token = tk.createToken({'userName': data[0].userName})
                var ret = success;
                var msg = errcode.success;
                log.debug('login success')
                res.send({'ret':ret, 'msg':msg, 'token':token});
            } else {
                var ret = errLogin;
                var msg = errcode.errLogin;
                log.error('fail to login:', {'ret':ret, 'msg':msg});
                res.send({'ret':ret, 'msg':msg});
            }
        }
    }).catch(function(err){
        var ret = errInner;
        var msg = errcode.errInner;
        log.error('fail to login:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function signupHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    if (body.userName==""||body.userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    if (body.password==""||body.password==undefined) {
        var ret = errNoPassword;
        var msg = errcode.errNoPassword;
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    if (body.email==""||body.email==undefined) {
        var ret = errNoEmail;
        var msg = errcode.errNoEmail;
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    var userName = body.userName;
    var password = body.password;
    var email = body.email;
    var userId = uuid.v5(userName, UUIDKEY).replace(/-/g, '');
    log.debug('userName:', userName);
    log.debug('userId:', userId);
    log.debug('email:', email);
    var salt = utils.createSalt();
    const hash = crypto.createHash('sha1');
    var hashPassword = hash.update(password+salt).digest('hex');
    mysql.queryUserInfoByUserName(userName).then((data)=>{
        if (data.length!=0) {
            var ret = errUserExist;
            var msg = errcode.errUserExist;
            log.error('fail to signup:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
    }).then(()=>{
        return mysql.insertUserInfo(userName, userId, hashPassword, email, salt);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('signup success')
        res.send({'ret':ret, 'msg':msg});
    }).catch((err)=>{
        var ret = errInner;
        var msg = errcode.errInner;
        log.error('fail to signup:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryAllUsersHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryAllUsers();
    }).then(function(data){
        var ret = success;
        var msg = errcode.success;
        log.debug('query all users success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query all users:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryUserPermissionHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var userName = body.userName;
    var queriedUserName = body.queriedUserName;
    if (userName==""||userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to query permission:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    if (queriedUserName==""||queriedUserName==undefined) {
        var ret = errNoQueriedUserName;
        var msg = errcode.errNoQueriedUserName;
        log.error('fail to query permission:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryUserPermissionByUserName(queriedUserName);
    }).then(function(data){
        var ret = success;
        var msg = errcode.success;
        log.debug('query permission by userName success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query permission by userName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateUserPermissionHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var userName = body.userName;
    var updatedUserName = body.updatedUserName;
    if (userName==""||userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to update permission:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    if (updatedUserName==""||updatedUserName==undefined) {
        var ret = errNoUpdatedUserName;
        var msg = errcode.errNoUpdatedUserName;
        log.error('fail to query permission:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateUserPermission(updatedUserName, body.data);
    }).then(function(data){
        var ret = success;
        var msg = errcode.success;
        log.debug('update permission success')
        res.send({'ret':ret, 'msg':msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update permission:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function generateVerifyCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var userName = body.userName;
    if (userName==""||userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to generate verifyCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    var email = '';
    mysql.queryUserInfoByUserName(userName).then((data)=>{
        if (data.length==0) {
            var ret = errUserNotExist;
            var msg = errcode.errUserNotExist;
            log.error('fail to generate verifyCode:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        } else {
            email = data[0].email;
            var verifyCode = utils.generateVerifyCode();
            var createTime = Date.now();
            return mysql.updateVerifyCode(userName, verifyCode, createTime);
        }
    }).then((data)=>{
        log.debug('email:', email);
        log.debug('verifyCode:', data);
        var html = '<p>验证码: ' + data + '</p>' +
                   '<p>请在10分钟内进行验证</p>';
        return mail.sendMail(email, config.email.subject, html);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('generate verifyCode success')
        res.send({'ret':ret, 'msg':msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to generate verifyCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function resetPasswordHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    // log.debug('req body:', body);
    var userName = body.userName;
    if (userName==""||userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to reset password:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    var verifyCode = body.verifyCode;
    var newPassword = body.newPassword;
    mysql.queryVerifyCode(userName).then((data)=>{
        if (data.length==0) {
            var ret = errNoVerifyCode;
            var msg = errcode.errNoVerifyCode;
            log.error('fail to reset password:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        var createTime = data[0].createTime;
        var dt = (Date.now() - createTime)/1000;
        if (dt > config.pwdUpdate.timeout) {
            var ret = errVerifyCodeTimeout;
            var msg = errcode.errVerifyCodeTimeout;
            log.error('fail to reset password:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        if (verifyCode != data[0].verifyCode) {
            var ret = errVerifyCodeNotRight;
            var msg = errcode.errVerifyCodeNotRight;
            log.error('fail to reset password:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        var salt = utils.createSalt();
        const hash = crypto.createHash('sha1');
        var hashPassword = hash.update(newPassword+salt).digest('hex');
        return mysql.updateUserPassword(userName, salt, hashPassword);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('reset password success')
        res.send({'ret':ret, 'msg':msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to reset password:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updatePasswordHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    // log.debug('req body:', body);
    var userName = body.userName;
    if (userName==""||userName==undefined) {
        var ret = errNoUserName;
        var msg = errcode.errNoUserName;
        log.error('fail to update password:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
        return;
    }
    var oldPassword = body.oldPassword;
    var newPassword = body.newPassword;
    mysql.querySaltAndPwd(userName).then((data)=>{
        if (data.length==0) {
            var ret = errUserNotExist;
            var msg = errcode.errUserNotExist;
            log.error('fail to update password:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        var salt = data[0].salt;
        var originalHashPassword = data[0].password;
        const hash = crypto.createHash('sha1');
        var hashPassword = hash.update(oldPassword+salt).digest('hex');
        if (originalHashPassword != hashPassword) {
            var ret = errPasswordNotRight;
            var msg = errcode.errPasswordNotRight;
            log.error('fail to update password:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        salt = utils.createSalt();
        const hash2 = crypto.createHash('sha1');
        hashPassword = hash2.update(newPassword+salt).digest('hex');
        return mysql.updateUserPassword(userName, salt, hashPassword);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update password success')
        res.send({'ret':ret, 'msg':msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update password:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addOrderHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var year = body.orderPlacedDate.split('-')[0];
    var month = body.orderPlacedDate.split('-')[1];
    var orderId = body.orderId;
    var subOrderNum = body.subOrderNum;
    if (subOrderNum == undefined) {
    	subOrderNum = 1;
    }
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderByOrderId(orderId)
    }).then((data)=>{
    	if (data.length!=0&&orderId!="无") {
            var ret = errOrderIdExist;
            var msg = errcode.errOrderIdExist;
            log.error('fail to add order:', {'ret':ret, 'msg':msg, 'creator':data[0].creator});
            res.send({'ret':ret, 'msg':msg, 'creator':data[0].creator});
            return new Promise(()=>{});
        }
    	return mysql.queryPrevNumber(year, month);
    }).then((data)=>{
        log.debug('previous number:', data);
        yearNumber = data[0].yearNumber+subOrderNum;
        monthNumber = data[0].monthNumber+subOrderNum;
        return [yearNumber, monthNumber];
    }).then((data)=>{
        return mysql.addOrder(body, data[0], data[1]);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add order success')
        res.send({'ret':ret, 'msg':msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add order:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deleteOrderHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var id = body.id;
    log.debug("id:", id);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderById(id);
    }).then(function(data){
        if (data.length==0) {
            var ret = errNoOrder;
            var msg = errcode.errNoOrder;
            log.error('fail to delete order:', {'ret':ret, 'msg':msg});
            res.send({'ret': ret, 'msg': msg});
            return new Promise(()=>{});
        }
    }).then(()=>{
        return mysql.deleteOrder(id);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete order success')
        res.send({'ret': ret, 'msg': msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete order:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateOrderHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var id = body.id;
    log.debug("id:", id);
    var orderPlacedDate = body.orderPlacedDate;
    var year = orderPlacedDate.split('-')[0];
    var month = orderPlacedDate.split('-')[1];
    var originalYear = '';
    var originalMonth = '';
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderById(id);
    }).then(function(data){
        data = changeTimeZone(data);
        if (data.length==0) {
            var ret = errNoOrder;
            var msg = errcode.errNoOrder;
            log.error('fail to update order:', {'ret':ret, 'msg':msg});
            res.send({'ret': ret, 'msg': msg});
            return new Promise(()=>{});
        }
        originalYear = data[0].orderPlacedDate.split('-')[0];
        originalMonth = data[0].orderPlacedDate.split('-')[1];
        body.yearNumber = data[0].yearNumber;
        body.monthNumber = data[0].monthNumber;
        return mysql.queryPrevNumber(year, month)
    }).then((data)=>{
        if (month!=originalMonth&&year==originalYear) {
            log.debug('month changed:', {'originalMonth':originalMonth, 'newMonth':month});
            body.yearNumber = data[0].yearNumber + 1;
            if (data[0].monthNumber==null) {
                body.monthNumber = 1;
            } else {
                body.monthNumber = data[0].monthNumber + 1;
            }
        } else if (month!=originalMonth&&year!=originalYear) {
            log.debug('month changed:', {'originalMonth':originalMonth, 'newMonth':month});
            log.debug('year changed:', {'originalYear':originalYear, 'newYear':year});
            if (data[0].yearNumber==null) {
                body.yearNumber = 1;
            } else {
                body.yearNumber = data[0].yearNumber + 1;
            }
            if (data[0].monthNumber==null) {
                body.monthNumber = 1;
            } else {
                body.monthNumber = data[0].monthNumber + 1;
            }
        }
        return mysql.updateOrder(body);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update order success')
        res.send({'ret': ret, 'msg': msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update order:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateCheckStatusHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var id = body.id;
    var userName = body.userName;
    var checkStatus = body.checkStatus;
    log.debug("checkStatus:", checkStatus);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderById(id);
    }).then(function(data){
        if (data.length==0) {
            var ret = errNoOrder;
            var msg = errcode.errNoOrder;
            log.error('fail to update checkStatus:', {'ret':ret, 'msg':msg});
            res.send({'ret': ret, 'msg': msg});
            return new Promise(()=>{});
        }
    }).then(()=>{
        return mysql.updateCheckStatus(userName, id, checkStatus);
    }).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update checkStatus success')
        res.send({'ret': ret, 'msg': msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update checkStatus:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateOrderFlagHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var id = body.id;
    var userName = body.userName;
    var orderFlag = body.orderFlag;
    log.debug("orderFlag:", orderFlag);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderById(id);
    }).then(function(data){
        if (data.length==0) {
            var ret = errNoOrder;
            var msg = errcode.errNoOrder;
            log.error('fail to update orderFlag:', {'ret':ret, 'msg':msg});
            res.send({'ret': ret, 'msg': msg});
            return new Promise(()=>{});
        }
    }).then(()=>{
        return mysql.updateOrderFlag(userName, id, orderFlag);
    }).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update orderFlag success')
        res.send({'ret': ret, 'msg': msg});
    }).catch((err)=>{
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update orderFlag:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryOrderByMonthHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var month = body.month;
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderByMonth(month);
    }).then(function(data){
        data = changeTimeZone(data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query order by month success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query order by month:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryOrderByDateHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var startDate = body.startDate;
    var endDate = body.endDate;
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderByDate(startDate, endDate);
    }).then(function(data){
        data = changeTimeZone(data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query order by date success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryOrderByOrderIdHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var orderId = body.orderId;
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderByOrderId(orderId);
    }).then(function(data){
        data = changeTimeZone(data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query order by orderId success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query order by orderId:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryOrderByBrandNameHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var brandName = body.brandName;
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderByBrandName(brandName);
    }).then(function(data){
        data = changeTimeZone(data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query order by brandName success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query order by brandName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryOrderBySalesRepHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var salesRep = body.salesRep;
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryOrderBySalesRep(salesRep);
    }).then(function(data){
        data = changeTimeZone(data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query order by salesRep success')
        res.send({'ret':ret, 'msg':msg, 'data':data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query order by salesRep:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryNumbersHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var orderPlacedDate = body.orderPlacedDate;
    var year = orderPlacedDate.split('-')[0];
    var month = orderPlacedDate.split('-')[1];
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryPrevNumber(year, month);
    }).then((data)=>{
        log.debug('previous number:', data);
        yearNumber = data[0].yearNumber+1;
        monthNumber = data[0].monthNumber+1;
        var ret = success;
        var msg = errcode.success;
        log.debug('query numbers success')
        res.send({'ret':ret, 'msg':msg, 'yearNumber':yearNumber, 'monthNumber':monthNumber});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query numbers:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function querySignupCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    mysql.querySignupCode().then((data)=>{
        var signupCode = data[0].signupCode;
        var ret = success;
        var msg = errcode.success;
        log.debug('query signupCode success')
        res.send({'ret': ret, 'msg': msg, 'signupCode': signupCode});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query signupCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateSignupCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var signupCode = body.signupCode;
    log.debug("signupCode:", signupCode);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query order by date:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateSignupCode(signupCode);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update signupCode success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update signupCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addShippingAgentHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var shippingAgent = body.shippingAgent;
    log.debug("shippingAgent:", shippingAgent);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add shippingAgent:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addShippingAgent(shippingAgent);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add shippingAgent success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add shippingAgent:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deleteShippingAgentHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var shippingAgent = body.shippingAgent;
    log.debug("shippingAgent:", shippingAgent);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to delete shippingAgent:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.deleteShippingAgent(shippingAgent);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete shippingAgent success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete shippingAgent:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateShippingAgentHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var oldShippingAgent = body.oldShippingAgent;
    var newShippingAgent = body.newShippingAgent;
    log.debug("oldShippingAgent:", oldShippingAgent);
    log.debug("newShippingAgent:", newShippingAgent);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update shippingAgent:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateShippingAgent(oldShippingAgent, newShippingAgent);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update shippingAgent success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update shippingAgent:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryShippingAgentHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query shippingAgent:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryShippingAgent();
    }).then((data)=>{
        log.debug('shippingAgent:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query shippingAgent success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query shippingAgent:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addBrandNameHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var brandName = body.brandName;
    log.debug("brandName:", brandName);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add brandName:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addbrandName(brandName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add brandName success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add brandName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deleteBrandNameHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var brandName = body.brandName;
    log.debug("brandName:", brandName);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to delete brandName:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.deletebrandName(brandName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete brandName success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete brandName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateBrandNameHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var oldbrandName = body.oldbrandName;
    var newbrandName = body.newbrandName;
    log.debug("oldbrandName:", oldbrandName);
    log.debug("newbrandName:", newbrandName);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update brandName:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updatebrandName(oldbrandName, newbrandName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update brandName success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update brandName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryBrandNameHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query brandName:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.querybrandName();
    }).then((data)=>{
        log.debug('brandName:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query brandName success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query brandName:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addHeadHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var head = body.head;
    log.debug("head:", head);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add head:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addHead(head);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add head success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add head:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deleteHeadHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var head = body.head;
    log.debug("head:", head);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to delete head:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.deleteHead(head);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete head success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete head:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateHeadHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var oldHead = body.oldHead;
    var newHead = body.newHead;
    log.debug("oldHead:", oldHead);
    log.debug("newHead:", newHead);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update head:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateHead(oldHead, newHead);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update head success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update head:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryHeadHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query head:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryHead();
    }).then((data)=>{
        log.debug('head:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query head success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query head:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addPaymentMethodHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var paymentMethod = body.paymentMethod;
    log.debug("paymentMethod:", paymentMethod);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add paymentMethod:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addPaymentMethod(paymentMethod);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add paymentMethod success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add paymentMethod:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deletePaymentMethodHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var paymentMethod = body.paymentMethod;
    log.debug("paymentMethod:", paymentMethod);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to delete paymentMethod:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.deletePaymentMethod(paymentMethod);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete paymentMethod success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete paymentMethod:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updatePaymentMethodHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var oldPaymentMethod = body.oldPaymentMethod;
    var newPaymentMethod = body.newPaymentMethod;
    log.debug("oldPaymentMethod:", oldPaymentMethod);
    log.debug("newPaymentMethod:", newPaymentMethod);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update paymentMethod:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updatePaymentMethod(oldPaymentMethod, newPaymentMethod);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update paymentMethod success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update paymentMethod:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryPaymentMethodHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query paymentMethod:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryPaymentMethod();
    }).then((data)=>{
        log.debug('paymentMethod:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query paymentMethod success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query paymentMethod:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addAuthCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    log.debug("authenticCode:", authenticCode);
    var productInfo = body.productInfo;
    log.debug("productInfo:", productInfo);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add authenticCode:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addAuthCode(authenticCode, productInfo, body.userName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add authenticCode success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add authenticCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function addBatchAuthCodesHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to add batchAuthCodes:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.addBatchAuthCodes(body.data, body.userName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('add batchAuthCodes success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to add batchAuthCodes:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function deleteAuthCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    log.debug("authenticCode:", authenticCode);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to delete authenticCode:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.deleteAuthCode(authenticCode);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('delete authenticCode success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to delete authenticCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateAuthCodeProdInfoHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    var productInfo = body.productInfo;
    log.debug("authenticCode:", authenticCode);
    log.debug("productInfo:", productInfo);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update authCodeProdInfo:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateAuthCodeProdInfo(authenticCode, productInfo, body.userName);
    }).then(()=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update authCodeProdInfo success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update authCodeProdInfo:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateAuthCodeStatusHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    var status = body.status;
    log.debug("authenticCode:", authenticCode);
    log.debug("status:", status);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update authCodeStatus:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateAuthCodeStatus(authenticCode, status, body.userName);
    }).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update authCodeStatus success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update authCodeStatus:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateAuthCodeStatusNoAuthHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    var status = body.status;
    log.debug("authenticCode:", authenticCode);
    log.debug("status:", status);
    mysql.updateAuthCodeStatusNoAuth(authenticCode, status).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update authCodeStatus success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update authCodeStatus:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryAuthCodeNoAuthHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode
    log.debug("authenticCode:", authenticCode);
    mysql.queryAuthCode(authenticCode).then((data)=>{
        changeAuthCodeTimeZone(data);
        log.debug('authenticCode:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query authenticCode success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query authenticCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryAuthCodeHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode
    log.debug("authenticCode:", authenticCode);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query authenticCode:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryAuthCode(authenticCode);
    }).then((data)=>{
        changeAuthCodeTimeZone(data);
        log.debug('authenticCode:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query authenticCode success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query authenticCode:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryAuthCodesByNumHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var number = body.number
    log.debug("number:", number);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query authenticCodes by number:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryAuthCodeByNum(number);
    }).then((data)=>{
        changeAuthCodeTimeZone(data);
        log.debug('authenticCodes:', data);
        var ret = success;
        var msg = errcode.success;
        log.debug('query authenticCodes by number success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query authenticCodes by number:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function queryAllAuthCodesHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to query all authenticCodes:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.queryAllAuthCodes();
    }).then((data)=>{
        changeAuthCodeTimeZone(data);
        log.debug('length of authenticCodes:', data.length);
        var ret = success;
        var msg = errcode.success;
        log.debug('query all authenticCodes success')
        res.send({'ret': ret, 'msg': msg, 'data': data});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to query all authenticCodes:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateAuthCodeAvailabilityHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authenticCode = body.authenticCode;
    var availability = body.availability;
    log.debug("authenticCode:", authenticCode);
    log.debug("availability:", availability);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update authCodeAvailability:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateAuthCodeAvailability(authenticCode, availability, body.userName);
    }).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update authCodeAvailability success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update authCodeAvailability:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

function updateBatchAuthCodesAvailabilityHandler(req, res, next) {
    log.debug('req headers:', req.headers);
    var body = req.body;
    log.debug('req body:', body);
    var authCodes = body.authCodes;
    var availability = body.availability;
    log.debug("authCodes:", authCodes);
    log.debug("availability:", availability);
    tk.verifyToken(req.headers.authorization).catch(e => {
        log.error('fail to verify token:', e);
        res.send({'ret':errToken, 'msg':errcode.errToken});
        return new Promise(()=>{});
    }).then((data)=>{
        if (body.userName != data.userName) {
            log.debug('req userName:', body.userName);
            log.debug('parsed userName:', data.userName)
            ret = errUserNotMatch;
            msg = errcode.errUserNotMatch;
            log.error('fail to update batchAuthCodesAvailability:', {'ret':ret, 'msg':msg});
            res.send({'ret':ret, 'msg':msg});
            return new Promise(()=>{});
        }
        return mysql.updateBatchAuthCodesAvailability(authCodes, availability, body.userName);
    }).then((data)=>{
        var ret = success;
        var msg = errcode.success;
        log.debug('update batchAuthCodesAvailability success')
        res.send({'ret': ret, 'msg': msg});
    }).catch(function(err){
        var ret = errMysql;
        var msg = err.message;
        log.error('fail to update batchAuthCodesAvailability:', {'ret':ret, 'msg':msg});
        res.send({'ret':ret, 'msg':msg});
    });
}

router.post('/ordermanage/login', (req, res, next) => {
    loginHandler(req, res, next);
});

router.post('/ordermanage/signup', (req, res, next) => {
    signupHandler(req, res, next);
})

router.post('/ordermanage/user/query/all', (req, res, next) => {
    queryAllUsersHandler(req, res, next);
})

router.post('/ordermanage/user/query/permission', (req, res, next) => {
    queryUserPermissionHandler(req, res, next);
})

router.post('/ordermanage/user/update/permission', (req, res, next) => {
    updateUserPermissionHandler(req, res, next);
})

router.post('/ordermanage/user/generate/verifyCode', (req, res, next) => {
    generateVerifyCodeHandler(req, res, next);
})

router.post('/ordermanage/user/reset/password', (req, res, next) => {
    resetPasswordHandler(req, res, next);
})

router.post('/ordermanage/user/update/password', (req, res, next) => {
    updatePasswordHandler(req, res, next);
})

router.post('/ordermanage/order/add', (req, res, next) => {
    addOrderHandler(req, res, next);
})

router.post('/ordermanage/order/delete', (req, res, next) => {
    deleteOrderHandler(req, res, next);
})

router.post('/ordermanage/order/update', (req, res, next) => {
    updateOrderHandler(req, res, next);
})

router.post('/ordermanage/order/update/checkStatus', (req, res, next) => {
    updateCheckStatusHandler(req, res, next);
})

router.post('/ordermanage/order/update/orderFlag', (req, res, next) => {
    updateOrderFlagHandler(req, res, next);
})

router.post('/ordermanage/order/query/month', (req, res, next) => {
    queryOrderByMonthHandler(req, res, next);
})

router.post('/ordermanage/order/query/date', (req, res, next) => {
    queryOrderByDateHandler(req, res, next);
})

router.post('/ordermanage/order/query/orderId', (req, res, next) => {
    queryOrderByOrderIdHandler(req, res, next);
})

router.post('/ordermanage/order/query/brandName', (req, res, next) => {
    queryOrderByBrandNameHandler(req, res, next);
})

router.post('/ordermanage/order/query/salesRep', (req, res, next) => {
    queryOrderBySalesRepHandler(req, res, next);
})

router.post('/ordermanage/order/query/numbers', (req, res, next) => {
    queryNumbersHandler(req, res, next);
})

router.post('/ordermanage/signupCode/query', (req, res, next) => {
    querySignupCodeHandler(req, res, next);
})

router.post('/ordermanage/signupCode/update', (req, res, next) => {
    updateSignupCodeHandler(req, res, next);
})

router.post('/ordermanage/shippingAgent/add', (req, res, next) => {
    addShippingAgentHandler(req, res, next);
})

router.post('/ordermanage/shippingAgent/delete', (req, res, next) => {
    deleteShippingAgentHandler(req, res, next);
})

router.post('/ordermanage/shippingAgent/update', (req, res, next) => {
    updateShippingAgentHandler(req, res, next);
})

router.post('/ordermanage/shippingAgent/query', (req, res, next) => {
    queryShippingAgentHandler(req, res, next);
})

router.post('/ordermanage/brandName/add', (req, res, next) => {
    addBrandNameHandler(req, res, next);
})

router.post('/ordermanage/brandName/delete', (req, res, next) => {
    deleteBrandNameHandler(req, res, next);
})

router.post('/ordermanage/brandName/update', (req, res, next) => {
    updateBrandNameHandler(req, res, next);
})

router.post('/ordermanage/brandName/query', (req, res, next) => {
    queryBrandNameHandler(req, res, next);
})

router.post('/ordermanage/head/add', (req, res, next) => {
    addHeadHandler(req, res, next);
})

router.post('/ordermanage/head/delete', (req, res, next) => {
    deleteHeadHandler(req, res, next);
})

router.post('/ordermanage/head/update', (req, res, next) => {
    updateHeadHandler(req, res, next);
})

router.post('/ordermanage/head/query', (req, res, next) => {
    queryHeadHandler(req, res, next);
})

router.post('/ordermanage/paymentMethod/add', (req, res, next) => {
    addPaymentMethodHandler(req, res, next);
})

router.post('/ordermanage/paymentMethod/delete', (req, res, next) => {
    deletePaymentMethodHandler(req, res, next);
})

router.post('/ordermanage/paymentMethod/update', (req, res, next) => {
    updatePaymentMethodHandler(req, res, next);
})

router.post('/ordermanage/paymentMethod/query', (req, res, next) => {
    queryPaymentMethodHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/add', (req, res, next) => {
    addAuthCodeHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/add/batch', (req, res, next) => {
    addBatchAuthCodesHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/delete', (req, res, next) => {
    deleteAuthCodeHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/productInfo/update', (req, res, next) => {
    updateAuthCodeProdInfoHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/status/update', (req, res, next) => {
    updateAuthCodeStatusHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/status/noauth/update', (req, res, next) => {
    updateAuthCodeStatusNoAuthHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/noauth/query', (req, res, next) => {
    queryAuthCodeNoAuthHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/query', (req, res, next) => {
    queryAuthCodeHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/query/number', (req, res, next) => {
    queryAuthCodesByNumHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/query/all', (req, res, next) => {
    queryAllAuthCodesHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/availability/update', (req, res, next) => {
    updateAuthCodeAvailabilityHandler(req, res, next);
})

router.post('/ordermanage/authenticCode/availability/update/batch', (req, res, next) => {
    updateBatchAuthCodesAvailabilityHandler(req, res, next);
})

module.exports = router;
